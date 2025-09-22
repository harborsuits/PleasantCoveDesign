# Project Workspace Module - Deployment Guide

## Quick Start

### 1. Deploy Module Files
Upload these files to your web server:
```
/workspace/
├── embed.js
├── workspace.js
├── workspace.css
└── assets/      (if any images/icons)
```

### 2. Add to Squarespace
Clients add this to any page:
```html
<script src="https://pleasantcovedesign.com/workspace/embed.js"></script>
<div id="pleasant-cove-workspace"></div>
```

### 3. Done!
The module auto-detects Squarespace members and loads their project.

---

## Server Setup

### Required API Endpoints

Add these endpoints to your server (`pleasantcovedesign/server/routes.ts`):

```typescript
// Get member's project
app.get('/api/workspace/member/:memberId', async (req, res) => {
  const { memberId } = req.params;
  
  try {
    // Find project for this Squarespace member
    const query = `
      SELECT 
        p.*,
        pmc.access_level,
        pmc.member_name,
        c.name as company_name
      FROM projects p
      JOIN project_member_contexts pmc ON p.id = pmc.project_id
      JOIN companies c ON p.company_id = c.id
      WHERE pmc.squarespace_member_id = ?
      AND p.status = 'active'
      LIMIT 1
    `;
    
    const project = await db.get(query, [memberId]);
    
    if (project) {
      res.json({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          token: project.token,
          currentStage: project.current_stage || 'Discovery',
          estimatedCompletion: project.estimated_completion,
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

// Get project feedback
app.get('/api/workspace/project/:projectId/feedback', async (req, res) => {
  const { projectId } = req.params;
  const { memberId } = req.query;
  
  try {
    const feedback = await db.all(`
      SELECT * FROM member_feedback 
      WHERE project_id = ? 
      AND member_context_id IN (
        SELECT id FROM project_member_contexts 
        WHERE project_id = ? AND squarespace_member_id = ?
      )
      ORDER BY created_at DESC
    `, [projectId, projectId, memberId]);
    
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Post new feedback
app.post('/api/workspace/project/:projectId/feedback', async (req, res) => {
  const { projectId } = req.params;
  const { memberId, memberEmail, subject, content, stage, elementId } = req.body;
  
  try {
    // Get member context
    const context = await db.get(`
      SELECT id FROM project_member_contexts 
      WHERE project_id = ? AND squarespace_member_id = ?
    `, [projectId, memberId]);
    
    if (!context) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Insert feedback
    const result = await db.run(`
      INSERT INTO member_feedback 
      (project_id, member_context_id, stage, subject, content, element_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [projectId, context.id, stage, subject, content, elementId]);
    
    const feedback = await db.get('SELECT * FROM member_feedback WHERE id = ?', [result.lastID]);
    
    // Broadcast to admin
    io.to(`project-${projectId}`).emit('feedback:new', feedback);
    
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error posting feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get messages
app.get('/api/workspace/project/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  const { memberId } = req.query;
  
  try {
    const messages = await db.all(`
      SELECT * FROM messages 
      WHERE project_id = ? 
      AND (member_id = ? OR sender_type = 'admin')
      ORDER BY created_at ASC
    `, [projectId, memberId]);
    
    const unreadCount = messages.filter(m => 
      m.sender_type === 'admin' && !m.read_by_member
    ).length;
    
    res.json({ success: true, messages, unreadCount });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Post message
app.post('/api/workspace/project/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  const { memberId, memberEmail, memberName, content } = req.body;
  
  try {
    const result = await db.run(`
      INSERT INTO messages 
      (project_id, member_id, member_email, member_name, content, sender_type)
      VALUES (?, ?, ?, ?, ?, 'client')
    `, [projectId, memberId, memberEmail, memberName, content]);
    
    const message = await db.get('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    
    // Broadcast to admin
    io.to(`project-${projectId}`).emit('message:new', message);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get design elements
app.get('/api/workspace/project/:projectId/design-elements', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const elements = await db.all(`
      SELECT 
        de.*,
        COUNT(mf.id) as feedback_count
      FROM project_design_elements de
      LEFT JOIN member_feedback mf ON de.id = mf.element_id
      WHERE de.project_id = ?
      GROUP BY de.id
    `, [projectId]);
    
    res.json({ success: true, elements });
  } catch (error) {
    console.error('Error fetching design elements:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

### Database Schema

Add these tables if not already present:

```sql
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

-- Add member tracking to messages
ALTER TABLE messages ADD COLUMN member_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN member_email VARCHAR(255);
ALTER TABLE messages ADD COLUMN member_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN read_by_member BOOLEAN DEFAULT FALSE;
```

### WebSocket Updates

Update your Socket.IO configuration:

```typescript
io.on('connection', (socket) => {
  const { projectToken, memberId, memberEmail } = socket.handshake.query;
  
  if (projectToken) {
    // Join project room
    socket.join(`project-${projectToken}`);
    
    // Join member-specific room
    if (memberId) {
      socket.join(`member-${memberId}`);
    }
    
    console.log(`Member ${memberEmail} connected to project ${projectToken}`);
  }
  
  socket.on('disconnect', () => {
    console.log(`Member ${memberEmail} disconnected`);
  });
});
```

### CORS Configuration

Update CORS to allow Squarespace domains:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://pleasantcovedesign.com',
    /^https:\/\/.*\.squarespace\.com$/,
    /^https:\/\/.*\.sqsp\.net$/
  ],
  credentials: true
}));
```

### Nginx Configuration

If using Nginx, add this configuration:

```nginx
# Workspace module files
location /workspace/ {
    alias /var/www/pleasantcovedesign/workspace-module/;
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";
    
    # Cache settings
    location ~ \.(js|css)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}

# API endpoints
location /api/workspace/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## Testing

### 1. Test Module Loading
```html
<!DOCTYPE html>
<html>
<head>
    <title>Workspace Module Test</title>
    <script>
        // Mock Squarespace member
        window.Static = {
            SQUARESPACE_CONTEXT: {
                authenticatedAccount: {
                    id: 'test-member-123',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                }
            }
        };
    </script>
</head>
<body>
    <h1>Project Workspace Test</h1>
    
    <!-- Embed the module -->
    <script src="http://localhost:3000/workspace/embed.js"></script>
    <div id="pleasant-cove-workspace"></div>
</body>
</html>
```

### 2. Create Test Data
```sql
-- Create test project
INSERT INTO projects (name, company_id, status, current_stage, token)
VALUES ('Test Website Project', 1, 'active', 'Design', 'test-token-123');

-- Create member context
INSERT INTO project_member_contexts (project_id, squarespace_member_id, squarespace_email, member_name)
VALUES (1, 'test-member-123', 'test@example.com', 'Test User');

-- Add some design elements
INSERT INTO project_design_elements (project_id, name, type, image_url, x, y, width, height)
VALUES 
(1, 'Homepage Header', 'image', '/demo/header.png', 50, 50, 800, 200),
(1, 'Navigation Menu', 'image', '/demo/nav.png', 50, 270, 800, 60);
```

### 3. Monitor Console
Check browser console for:
- Module loading confirmation
- API call success/errors  
- WebSocket connection status
- Member detection results

---

## Production Checklist

- [ ] Upload module files to production server
- [ ] Configure CORS for Squarespace domains
- [ ] Add API endpoints to server
- [ ] Run database migrations
- [ ] Test with real Squarespace site
- [ ] Set up SSL certificates
- [ ] Configure CDN caching
- [ ] Monitor error logs
- [ ] Create client documentation
- [ ] Set up analytics tracking

---

## Client Instructions

Share this with your clients:

### Adding the Project Workspace to Your Squarespace Site

1. **Log into Squarespace**
   - Go to your site dashboard
   - Navigate to the page where you want the workspace

2. **Add a Code Block**
   - Click "+" to add a new block
   - Choose "Code" from the menu

3. **Paste the Embed Code**
   ```html
   <script src="https://pleasantcovedesign.com/workspace/embed.js"></script>
   <div id="pleasant-cove-workspace"></div>
   ```

4. **Save and Publish**
   - Click "Apply" 
   - Save your changes
   - Publish the page

5. **That's It!**
   - The workspace will automatically detect logged-in members
   - Each member sees only their own project
   - Updates appear in real-time

### Troubleshooting

**Not seeing the workspace?**
- Make sure you're logged into your member account
- Check that your project is active
- Try refreshing the page

**Need help?**
Contact support@pleasantcovedesign.com
