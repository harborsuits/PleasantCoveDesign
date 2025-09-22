# 🎨 Customer Project Workspace - Complete Implementation Guide

## What You Have vs What You Need

### ✅ What Already Exists:

1. **Complete Frontend Module** (`/workspace-module/`)
   - `embed.js` - Auto-loader for Squarespace
   - `workspace.js` - Full functionality
   - `workspace.css` - Professional styling
   - `DEPLOYMENT_GUIDE.md` - Instructions

2. **Features Built Into Module:**
   - 📊 Progress tracking with visual stages
   - 🎨 Interactive design canvas
   - 💬 Real-time messaging
   - 📝 Feedback on specific design elements
   - 📁 File management
   - 🔔 Live updates via WebSocket
   - 👤 Member detection & isolation

3. **Database Schema** (in deployment guide)
   - Tables for member contexts
   - Feedback tracking
   - Design elements
   - Message threading

### ❌ What's Missing:

1. **API Endpoints** - Not implemented in server
2. **Database Tables** - Not created yet
3. **Deployment** - Files not on production server
4. **Testing** - No live customer using it yet

---

## 🚀 Complete Setup Guide

### Step 1: Add API Endpoints to Server

Create a new file: `pleasantcovedesign/server/routes/workspace.ts`

```typescript
import { Router } from 'express';
import { db } from '../db';
import { io } from '../index';

const router = Router();

// Get member's project
router.get('/member/:memberId', async (req, res) => {
  const { memberId } = req.params;
  
  try {
    // Find project for this Squarespace member
    const project = await db.get(`
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
    `, [memberId]);
    
    if (project) {
      res.json({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          token: project.token,
          currentStage: project.currentStage || 'Discovery',
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

// Get project feedback
router.get('/project/:projectId/feedback', async (req, res) => {
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
router.post('/project/:projectId/feedback', async (req, res) => {
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
router.get('/project/:projectId/messages', async (req, res) => {
  const { projectId } = req.params;
  const { memberId } = req.query;
  
  try {
    const messages = await db.all(`
      SELECT * FROM conversations 
      WHERE projectId = ? 
      ORDER BY createdAt ASC
    `, [projectId]);
    
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
    const result = await db.run(`
      INSERT INTO conversations 
      (projectId, companyId, participants, messages, lastActivity)
      VALUES (?, 
        (SELECT companyId FROM projects WHERE id = ?),
        ?, ?, ?)
    `, [
      projectId, 
      projectId,
      JSON.stringify([memberEmail, 'admin@pleasantcovedesign.com']),
      JSON.stringify([{
        sender: memberEmail,
        content: content,
        timestamp: new Date().toISOString(),
        type: 'text'
      }]),
      new Date().toISOString()
    ]);
    
    // Broadcast to admin
    io.to(`project-${projectId}`).emit('message:new', {
      projectId,
      sender: memberEmail,
      content,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get design elements
router.get('/project/:projectId/design-elements', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const elements = await db.all(`
      SELECT * FROM project_design_elements
      WHERE project_id = ?
      ORDER BY layer_order ASC
    `, [projectId]);
    
    res.json({ success: true, elements });
  } catch (error) {
    console.error('Error fetching design elements:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
```

Then add to your main `index.ts`:
```typescript
import workspaceRoutes from './routes/workspace';
app.use('/api/workspace', workspaceRoutes);
```

---

### Step 2: Create Database Tables

Run this SQL to add the necessary tables:

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

-- Add stage tracking to projects if not exists
ALTER TABLE projects ADD COLUMN currentStage VARCHAR(50) DEFAULT 'Discovery';
ALTER TABLE projects ADD COLUMN estimatedCompletion DATE;
```

---

### Step 3: Deploy Module Files

1. **Upload to your server:**
```bash
scp -r workspace-module/* your-server:/var/www/pleasantcovedesign/workspace/
```

2. **Set up nginx:**
```nginx
location /workspace/ {
    alias /var/www/pleasantcovedesign/workspace/;
    add_header Access-Control-Allow-Origin *;
    expires 1h;
}
```

---

### Step 4: Test with Mock Data

Create a test customer project:

```sql
-- Create a test project
INSERT INTO projects (name, companyId, status, currentStage, estimatedCompletion)
VALUES ('Bob''s Plumbing Website', 1, 'active', 'Design', '2024-02-15');

-- Create member context (use actual Squarespace member ID)
INSERT INTO project_member_contexts (project_id, squarespace_member_id, squarespace_email, member_name)
VALUES (1, 'sq_member_123', 'bob@bobsplumbing.com', 'Bob Smith');

-- Add some design elements
INSERT INTO project_design_elements (project_id, name, type, image_url, x, y)
VALUES 
(1, 'Homepage Hero', 'image', '/demos/bobs-hero.png', 100, 100),
(1, 'Navigation Design', 'image', '/demos/bobs-nav.png', 100, 350),
(1, 'Services Section', 'image', '/demos/bobs-services.png', 100, 450);
```

---

### Step 5: Client Instructions

Give your customers this simple code to add to their Squarespace site:

```html
<!-- Add this to any Member-Only page in Squarespace -->
<script src="https://pleasantcovedesign.com/workspace/embed.js"></script>
<div id="pleasant-cove-workspace"></div>
```

That's it! The module will:
- Auto-detect logged-in members
- Load their specific project
- Show real-time updates
- Allow communication & feedback

---

## 🎯 What Customers Will See

### 1. **Progress Tracking**
```
Discovery → Design → Development → Review → Launch
    ↑ You are here (25% complete)
```

### 2. **Interactive Design Canvas**
- Click on any design element
- Leave feedback directly on designs
- See updates in real-time
- Download approved versions

### 3. **Messaging**
- Direct line to you
- File attachments
- Read receipts
- Notification badges

### 4. **Project Details**
- Timeline & milestones
- Important dates
- Project documents
- Contact information

---

## 🔧 Quick Implementation Checklist

- [ ] Add workspace routes to server
- [ ] Create database tables
- [ ] Upload module files to production
- [ ] Configure CORS for Squarespace
- [ ] Create a test project
- [ ] Test with a real Squarespace site
- [ ] Document for customers

---

## 💡 Why This Is Powerful

1. **Professional Experience** - Customers feel involved
2. **Reduced Questions** - They can see progress
3. **Better Feedback** - Direct on designs
4. **Time Savings** - Less back-and-forth
5. **Trust Building** - Transparency

Your customers will love having a dedicated workspace where they can:
- See exactly where their project stands
- Communicate directly without email
- Provide feedback on actual designs
- Feel like they're part of the process

This is what separates you from competitors - a professional, integrated experience!
