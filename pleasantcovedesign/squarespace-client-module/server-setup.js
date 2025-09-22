#!/usr/bin/env node

/**
 * Server setup for Squarespace Client Module
 * This adds the necessary routes to your Express server
 */

console.log('🚀 Setting up Squarespace Client Module server routes...\n');

const setupCode = `
// ===== ADD TO YOUR SERVER INDEX.TS =====

// Import at top
import { Server as SocketIOServer } from 'socket.io';

// After creating Express app
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:*',
      /\\.squarespace\\.com$/,
      /\\.sqsp\\.net$/
    ],
    credentials: true
  }
});

// ===== CLIENT WORKSPACE ROUTES =====

// Get member's project
app.get('/api/workspace/member/:memberId', async (req, res) => {
  const { memberId } = req.params;
  
  try {
    // Find project linked to this Squarespace member
    const projectMember = await db.get(\`
      SELECT 
        pm.*,
        p.*,
        c.name as company_name
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      JOIN companies c ON p.companyId = c.id
      WHERE pm.squarespace_member_id = ?
      AND p.status = 'active'
      LIMIT 1
    \`, [memberId]);
    
    if (projectMember) {
      // Get additional project data
      const milestones = await db.all(\`
        SELECT * FROM project_milestones 
        WHERE project_id = ? 
        ORDER BY order_index
      \`, [projectMember.project_id]);
      
      const messages = await db.all(\`
        SELECT * FROM project_messages 
        WHERE project_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
      \`, [projectMember.project_id]);
      
      const files = await db.all(\`
        SELECT * FROM project_files 
        WHERE project_id = ? 
        ORDER BY uploaded_at DESC
      \`, [projectMember.project_id]);
      
      const designs = await db.all(\`
        SELECT * FROM project_designs 
        WHERE project_id = ? 
        ORDER BY created_at DESC
      \`, [projectMember.project_id]);
      
      res.json({
        success: true,
        project: {
          id: projectMember.project_id,
          name: projectMember.name,
          companyName: projectMember.company_name,
          progress: projectMember.progress || 0,
          currentStage: projectMember.current_stage || 'Planning',
          estimatedCompletion: projectMember.estimated_completion,
          dueDate: projectMember.due_date,
          milestones,
          messages,
          files,
          designs
        }
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No active project found for this member' 
      });
    }
  } catch (error) {
    console.error('Error fetching member project:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send message
app.post('/api/workspace/project/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  const { memberId, memberEmail, memberName, content } = req.body;
  
  try {
    // Verify member has access to this project
    const access = await db.get(\`
      SELECT * FROM project_members 
      WHERE project_id = ? 
      AND squarespace_member_id = ?
    \`, [projectId, memberId]);
    
    if (!access) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }
    
    // Insert message
    const result = await db.run(\`
      INSERT INTO project_messages 
      (project_id, sender, sender_name, sender_email, content, created_at)
      VALUES (?, 'client', ?, ?, ?, datetime('now'))
    \`, [projectId, memberName, memberEmail, content]);
    
    const message = {
      id: result.lastID,
      sender: 'client',
      senderName: memberName,
      senderEmail: memberEmail,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    // Emit to all connected users in this project room
    io.to(\`project-\${projectId}\`).emit('message:new', message);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message' 
    });
  }
});

// Submit feedback on design
app.post('/api/workspace/project/:projectId/feedback', async (req, res) => {
  const { projectId } = req.params;
  const { memberId, designId, x, y, content } = req.body;
  
  try {
    // Verify access
    const access = await db.get(\`
      SELECT * FROM project_members 
      WHERE project_id = ? 
      AND squarespace_member_id = ?
    \`, [projectId, memberId]);
    
    if (!access) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }
    
    // Insert feedback
    await db.run(\`
      INSERT INTO design_feedback 
      (project_id, design_id, member_id, x_position, y_position, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    \`, [projectId, designId, memberId, x, y, content]);
    
    // Notify project room
    io.to(\`project-\${projectId}\`).emit('feedback:new', {
      designId,
      x,
      y,
      content,
      memberName: access.member_name
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit feedback' 
    });
  }
});

// ===== WEBSOCKET SETUP =====

io.on('connection', (socket) => {
  const { projectId, memberEmail } = socket.handshake.query;
  
  if (projectId) {
    // Join project room
    socket.join(\`project-\${projectId}\`);
    console.log(\`Client \${memberEmail} joined project \${projectId}\`);
    
    socket.on('disconnect', () => {
      console.log(\`Client \${memberEmail} left project \${projectId}\`);
    });
  }
});

// ===== DATABASE TABLES =====
// Run these SQL commands to create the necessary tables:

/*
-- Link Squarespace members to projects
CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  squarespace_member_id VARCHAR(255) UNIQUE,
  member_email VARCHAR(255),
  member_name VARCHAR(255),
  access_level VARCHAR(50) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project messages (chat)
CREATE TABLE IF NOT EXISTS project_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  sender VARCHAR(50), -- 'client' or 'team'
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  order_index INTEGER,
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project files
CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(255),
  url TEXT,
  size INTEGER,
  type VARCHAR(100),
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project designs
CREATE TABLE IF NOT EXISTS project_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(255),
  url TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Design feedback
CREATE TABLE IF NOT EXISTS design_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  design_id INTEGER REFERENCES project_designs(id),
  member_id VARCHAR(255),
  x_position FLOAT,
  y_position FLOAT,
  content TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add progress tracking to projects table if not exists
ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN current_stage VARCHAR(50) DEFAULT 'Planning';
ALTER TABLE projects ADD COLUMN estimated_completion DATE;
*/
`;

console.log(setupCode);

console.log('\n📋 Setup Instructions:\n');
console.log('1. Copy the code above into your server index.ts');
console.log('2. Run the SQL commands to create database tables');
console.log('3. Upload client-workspace.js to your server');
console.log('4. Test with test-local.html');
console.log('\n✨ Done!');
