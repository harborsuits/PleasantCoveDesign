#!/usr/bin/env node

/**
 * Setup script for Customer Project Workspace
 * This creates the necessary database tables and API routes
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Customer Project Workspace...\n');

// SQL for creating tables
const workspaceSchema = `
-- Member contexts for Squarespace accounts
CREATE TABLE IF NOT EXISTS project_member_contexts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    squarespace_member_id VARCHAR(255) NOT NULL,
    squarespace_email VARCHAR(255),
    member_name VARCHAR(255),
    access_level VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, squarespace_member_id)
);

-- Member-specific feedback
CREATE TABLE IF NOT EXISTS member_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    member_context_id INTEGER REFERENCES project_member_contexts(id),
    stage VARCHAR(50),
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    element_id VARCHAR(255),
    element_position TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Design elements for interactive canvas
CREATE TABLE IF NOT EXISTS project_design_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255),
    type VARCHAR(50),
    image_url TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 300,
    height INTEGER DEFAULT 200,
    layer_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT OR IGNORE INTO project_member_contexts (project_id, squarespace_member_id, squarespace_email, member_name)
SELECT 
    p.id,
    'test_member_' || p.id,
    c.email,
    c.contactPerson
FROM projects p
JOIN companies c ON p.companyId = c.id
WHERE p.status = 'active'
LIMIT 1;

-- Add sample design elements
INSERT OR IGNORE INTO project_design_elements (project_id, name, type, image_url, x, y)
SELECT 
    p.id,
    'Homepage Hero Design',
    'image',
    '/demos/homepage-hero.png',
    100,
    100
FROM projects p
WHERE p.status = 'active'
LIMIT 1;
`;

// Workspace routes code
const workspaceRoutesCode = `import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get member's project
router.get('/member/:memberId', async (req, res) => {
  const { memberId } = req.params;
  
  try {
    const project = await db.get(\`
      SELECT 
        p.*,
        pmc.access_level,
        pmc.member_name,
        c.name as company_name
      FROM projects p
      JOIN project_member_contexts pmc ON p.id = pmc.project_id
      JOIN companies c ON p.companyId = c.id
      WHERE pmc.squarespace_member_id = ?
      AND p.status = 'active'
      LIMIT 1
    \`, [memberId]);
    
    if (project) {
      res.json({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          token: project.token,
          currentStage: project.currentStage || 'Design',
          estimatedCompletion: project.estimatedCompletion,
          companyName: project.company_name
        },
        memberContext: {
          accessLevel: project.access_level,
          memberName: project.member_name
        }
      });
    } else {
      res.json({ success: false, project: null });
    }
  } catch (error) {
    console.error('Error fetching member project:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get design elements
router.get('/project/:projectId/design-elements', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const elements = await db.all(\`
      SELECT * FROM project_design_elements
      WHERE project_id = ?
      ORDER BY layer_order ASC
    \`, [projectId]);
    
    res.json({ success: true, elements });
  } catch (error) {
    console.error('Error fetching design elements:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get messages (using existing conversations table)
router.get('/project/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const conversations = await db.all(\`
      SELECT * FROM conversations 
      WHERE projectId = ? 
      ORDER BY lastActivity DESC
    \`, [projectId]);
    
    // Extract messages from conversations
    const messages = [];
    conversations.forEach(conv => {
      const convMessages = JSON.parse(conv.messages || '[]');
      convMessages.forEach(msg => {
        messages.push({
          ...msg,
          conversationId: conv.id
        });
      });
    });
    
    // Sort by timestamp
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Post message
router.post('/project/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  const { memberId, memberEmail, memberName, content } = req.body;
  
  try {
    // Find existing conversation or create new one
    let conversation = await db.get(\`
      SELECT * FROM conversations 
      WHERE projectId = ? 
      ORDER BY lastActivity DESC 
      LIMIT 1
    \`, [projectId]);
    
    const newMessage = {
      sender: memberEmail,
      content: content,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    
    if (conversation) {
      // Update existing conversation
      const messages = JSON.parse(conversation.messages || '[]');
      messages.push(newMessage);
      
      await db.run(\`
        UPDATE conversations 
        SET messages = ?, lastActivity = ?
        WHERE id = ?
      \`, [JSON.stringify(messages), new Date().toISOString(), conversation.id]);
    } else {
      // Create new conversation
      const project = await db.get('SELECT companyId FROM projects WHERE id = ?', [projectId]);
      
      await db.run(\`
        INSERT INTO conversations 
        (projectId, companyId, participants, messages, lastActivity, status)
        VALUES (?, ?, ?, ?, ?, ?)
      \`, [
        projectId,
        project.companyId,
        JSON.stringify([memberEmail, 'admin@pleasantcovedesign.com']),
        JSON.stringify([newMessage]),
        new Date().toISOString(),
        'active'
      ]);
    }
    
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get feedback
router.get('/project/:projectId/feedback', async (req, res) => {
  const { projectId } = req.params;
  const { memberId } = req.query;
  
  try {
    const feedback = await db.all(\`
      SELECT mf.*, pmc.member_name 
      FROM member_feedback mf
      JOIN project_member_contexts pmc ON mf.member_context_id = pmc.id
      WHERE mf.project_id = ? 
      ORDER BY mf.created_at DESC
    \`, [projectId]);
    
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Post feedback
router.post('/project/:projectId/feedback', async (req, res) => {
  const { projectId } = req.params;
  const { memberId, subject, content, elementId } = req.body;
  
  try {
    // Get member context
    const context = await db.get(\`
      SELECT id FROM project_member_contexts 
      WHERE project_id = ? AND squarespace_member_id = ?
    \`, [projectId, memberId]);
    
    if (!context) {
      // Create context if doesn't exist
      await db.run(\`
        INSERT INTO project_member_contexts 
        (project_id, squarespace_member_id, member_name)
        VALUES (?, ?, ?)
      \`, [projectId, memberId, 'Customer']);
      
      const newContext = await db.get(\`
        SELECT id FROM project_member_contexts 
        WHERE project_id = ? AND squarespace_member_id = ?
      \`, [projectId, memberId]);
      
      context.id = newContext.id;
    }
    
    // Insert feedback
    const result = await db.run(\`
      INSERT INTO member_feedback 
      (project_id, member_context_id, subject, content, element_id)
      VALUES (?, ?, ?, ?, ?)
    \`, [projectId, context.id, subject, content, elementId]);
    
    res.json({ success: true, feedbackId: result.lastID });
  } catch (error) {
    console.error('Error posting feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
`;

// Create the routes file
const routesPath = path.join(__dirname, 'pleasantcovedesign/server/routes/workspace.ts');
console.log('📝 Creating workspace routes...');
fs.writeFileSync(routesPath, workspaceRoutesCode);
console.log('✅ Workspace routes created at:', routesPath);

// Create SQL file
const sqlPath = path.join(__dirname, 'pleasantcovedesign/server/workspace-schema.sql');
console.log('\n📊 Creating database schema...');
fs.writeFileSync(sqlPath, workspaceSchema);
console.log('✅ Schema file created at:', sqlPath);

// Instructions
console.log('\n📋 Next Steps:\n');
console.log('1. Run the SQL schema:');
console.log('   sqlite3 pleasantcovedesign/server/pleasant_cove.db < pleasantcovedesign/server/workspace-schema.sql\n');

console.log('2. Add to your server index.ts:');
console.log(`   import workspaceRoutes from './routes/workspace';
   app.use('/api/workspace', workspaceRoutes);\n`);

console.log('3. Update CORS in your server to allow Squarespace:');
console.log(`   origin: [
     'http://localhost:5173',
     /^https:\\/\\/.*\\.squarespace\\.com$/,
     /^https:\\/\\/.*\\.sqsp\\.net$/
   ]\n`);

console.log('4. Deploy the workspace module files:');
console.log('   - Upload workspace-module/* to your server at /workspace/\n');

console.log('5. Give customers this embed code:');
console.log(`   <script src="https://pleasantcovedesign.com/workspace/embed.js"></script>
   <div id="pleasant-cove-workspace"></div>\n`);

console.log('✨ Customer workspace setup complete!');
