# Project Workspace Module - Complete Implementation Guide

## Overview

The Project Workspace Module is a complete, embeddable solution that gives each Squarespace account member:
- 🎯 Visual project progress tracking
- 🎨 Design canvas with feedback capabilities
- 💬 Member-specific messaging
- 📊 Stage-based feedback organization
- 📱 Mobile-responsive interface

## How It Works

### 1. Member-Specific Isolation
Each Squarespace member sees ONLY their own:
- Project progress
- Design elements
- Feedback conversations
- Messages with your team

### 2. Visual Progress Flow
```
Discovery → Design → Feedback → Development → Testing → Launch
    🔍        🎨        💬          ⚙️         🔧        🚀
```

### 3. Interactive Design Canvas
- Members click on design elements to add feedback
- Comment pins show where feedback was left
- Real-time updates when designs change

## Backend Implementation

### Step 1: Database Schema

```sql
-- Member-specific project contexts
CREATE TABLE project_member_contexts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    squarespace_member_id VARCHAR(255) NOT NULL,
    squarespace_email VARCHAR(255),
    member_name VARCHAR(255),
    access_level VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, squarespace_member_id)
);

-- Member feedback entries
CREATE TABLE member_feedback (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    member_context_id INTEGER REFERENCES project_member_contexts(id),
    stage VARCHAR(50),
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    element_id VARCHAR(255),
    element_position JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Design elements for canvas
CREATE TABLE project_design_elements (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    element_type VARCHAR(50),
    x INTEGER,
    y INTEGER,
    width INTEGER,
    height INTEGER,
    content TEXT,
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Element comments
CREATE TABLE element_comments (
    id SERIAL PRIMARY KEY,
    element_id INTEGER REFERENCES project_design_elements(id),
    member_context_id INTEGER REFERENCES project_member_contexts(id),
    x INTEGER,
    y INTEGER,
    content TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_member_contexts_project ON project_member_contexts(project_id);
CREATE INDEX idx_member_contexts_squarespace ON project_member_contexts(squarespace_member_id);
CREATE INDEX idx_feedback_member ON member_feedback(member_context_id);
CREATE INDEX idx_feedback_stage ON member_feedback(stage);
```

### Step 2: API Endpoints

Add these endpoints to your `routes.ts`:

```typescript
// Get workspace data for specific member
app.get('/api/public/project/:token/workspace', async (req, res) => {
    const { token } = req.params;
    const memberId = req.headers['x-squarespace-member-id'];
    const memberEmail = req.headers['x-squarespace-email'];
    
    if (!memberId) {
        return res.status(401).json({ error: 'Member authentication required' });
    }
    
    // Get or create member context
    const project = await storage.getProjectByToken(token);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    const memberContext = await storage.getOrCreateProjectMemberContext(
        project.id,
        memberId,
        memberEmail
    );
    
    // Get project data with member-specific info
    const workspaceData = {
        projectId: project.id,
        projectTitle: project.title,
        companyName: project.company?.name,
        currentStage: project.stage || 'discovery',
        memberContext: memberContext,
        stageProgress: await storage.getProjectStageProgress(project.id)
    };
    
    res.json(workspaceData);
});

// Get member-specific feedback
app.get('/api/public/project/:token/member-feedback', async (req, res) => {
    const { token } = req.params;
    const memberId = req.headers['x-squarespace-member-id'];
    
    const project = await storage.getProjectByToken(token);
    const memberContext = await storage.getProjectMemberContext(project.id, memberId);
    
    if (!memberContext) {
        return res.status(404).json({ error: 'Member context not found' });
    }
    
    const feedback = await storage.getMemberFeedback(memberContext.id);
    res.json({ feedback });
});

// Submit member feedback
app.post('/api/public/project/:token/member-feedback', async (req, res) => {
    const { token } = req.params;
    const { stage, subject, content, elementId } = req.body;
    const memberId = req.headers['x-squarespace-member-id'];
    
    const project = await storage.getProjectByToken(token);
    const memberContext = await storage.getProjectMemberContext(project.id, memberId);
    
    const feedback = await storage.createMemberFeedback({
        projectId: project.id,
        memberContextId: memberContext.id,
        stage,
        subject,
        content,
        elementId
    });
    
    // Notify admin via WebSocket
    io.to(`admin-project-${project.id}`).emit('new-member-feedback', {
        feedback,
        memberInfo: {
            id: memberId,
            email: req.headers['x-squarespace-email'],
            name: req.headers['x-squarespace-name']
        }
    });
    
    res.json({ success: true, feedback });
});

// Get design elements
app.get('/api/public/project/:token/design-elements', async (req, res) => {
    const { token } = req.params;
    const memberId = req.headers['x-squarespace-member-id'];
    
    const project = await storage.getProjectByToken(token);
    const elements = await storage.getProjectDesignElements(project.id);
    
    // Include member-specific comment status
    const elementsWithComments = await Promise.all(
        elements.map(async (element) => {
            const comments = await storage.getElementComments(element.id, memberId);
            return {
                ...element,
                comments,
                hasFeedback: comments.length > 0
            };
        })
    );
    
    res.json({ elements: elementsWithComments });
});

// WebSocket room management for members
io.on('connection', (socket) => {
    socket.on('join-member-room', async (data) => {
        const { projectToken, memberId } = data;
        
        // Verify member has access
        const project = await storage.getProjectByToken(projectToken);
        const memberContext = await storage.getProjectMemberContext(project.id, memberId);
        
        if (memberContext) {
            // Join member-specific room
            socket.join(`member-${project.id}-${memberId}`);
            // Also join project room for general updates
            socket.join(`project-${project.id}`);
            
            socket.emit('joined-workspace', {
                projectId: project.id,
                memberId: memberId
            });
        }
    });
});
```

### Step 3: Storage Implementation

Add these methods to your storage layer:

```typescript
// Member context management
async getOrCreateProjectMemberContext(projectId, memberId, memberEmail) {
    const existing = await this.query(
        `SELECT * FROM project_member_contexts 
         WHERE project_id = $1 AND squarespace_member_id = $2`,
        [projectId, memberId]
    );
    
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    
    const result = await this.query(
        `INSERT INTO project_member_contexts 
         (project_id, squarespace_member_id, squarespace_email)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [projectId, memberId, memberEmail]
    );
    
    return result.rows[0];
}

// Feedback management
async getMemberFeedback(memberContextId) {
    const result = await this.query(
        `SELECT f.*, 
         COUNT(r.id) as response_count,
         MAX(r.created_at) as last_response_at
         FROM member_feedback f
         LEFT JOIN feedback_responses r ON f.id = r.feedback_id
         WHERE f.member_context_id = $1
         GROUP BY f.id
         ORDER BY f.created_at DESC`,
        [memberContextId]
    );
    
    return result.rows;
}

async createMemberFeedback(data) {
    const result = await this.query(
        `INSERT INTO member_feedback 
         (project_id, member_context_id, stage, subject, content, element_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.projectId, data.memberContextId, data.stage, data.subject, data.content, data.elementId]
    );
    
    return result.rows[0];
}

// Design elements
async getProjectDesignElements(projectId) {
    const result = await this.query(
        `SELECT * FROM project_design_elements 
         WHERE project_id = $1 
         ORDER BY created_at ASC`,
        [projectId]
    );
    
    return result.rows;
}

async getElementComments(elementId, memberId) {
    const result = await this.query(
        `SELECT ec.*, pmc.member_name, pmc.squarespace_email
         FROM element_comments ec
         JOIN project_member_contexts pmc ON ec.member_context_id = pmc.id
         WHERE ec.element_id = $1
         AND (pmc.squarespace_member_id = $2 OR ec.resolved = false)
         ORDER BY ec.created_at DESC`,
        [elementId, memberId]
    );
    
    return result.rows;
}
```

## Squarespace Integration

### Step 1: Add to Squarespace Page

1. Go to your Squarespace page (member-only area)
2. Add a **Code Block**
3. Paste this embed code:

```html
<!-- Pleasant Cove Design Project Workspace -->
<div id="pcd-workspace-container"></div>

<script>
// Configuration
window.PCD_CONFIG = {
    serverUrl: 'https://your-server-url.com', // Replace with your server URL
    projectToken: 'YOUR_PROJECT_TOKEN' // Replace with actual project token
};

// Load the workspace module
(function() {
    const script = document.createElement('script');
    script.src = window.PCD_CONFIG.serverUrl + '/widgets/project-workspace-module.js';
    script.async = true;
    document.head.appendChild(script);
    
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = window.PCD_CONFIG.serverUrl + '/widgets/project-workspace-module.css';
    document.head.appendChild(styles);
})();
</script>

<!-- Container styling -->
<style>
#pcd-workspace-container {
    width: 100%;
    min-height: 800px;
    margin: 20px 0;
}
</style>
```

### Step 2: Set Page Permissions

1. Go to page settings
2. Under "Page Availability", select "Member Area"
3. Choose which member areas have access
4. Save

### Step 3: Test Member Isolation

1. **Test as Member A**:
   - Log in as Member A
   - Add feedback on design element
   - Send a message

2. **Test as Member B**:
   - Log in as Member B
   - Verify you DON'T see Member A's feedback
   - Verify you have your own workspace

3. **Test as Admin**:
   - Check admin dashboard
   - Verify you see both Member A and B's feedback
   - Verify conversations are separated

## Admin Dashboard Integration

### Admin View Component

```typescript
// ProjectMemberView.tsx
import React, { useState, useEffect } from 'react';
import api from '../api';

const ProjectMemberView: React.FC<{ projectId: number }> = ({ projectId }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  
  useEffect(() => {
    loadProjectMembers();
  }, [projectId]);
  
  const loadProjectMembers = async () => {
    const response = await api.get(`/admin/projects/${projectId}/members`);
    setMembers(response.data.members);
  };
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Member List */}
      <div className="col-span-1">
        <h3 className="font-semibold mb-4">Project Members</h3>
        {members.map(member => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className={`p-4 mb-2 rounded cursor-pointer ${
              selectedMember?.id === member.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50'
            }`}
          >
            <div className="font-medium">{member.email}</div>
            <div className="text-sm text-gray-500">
              {member.feedbackCount} feedback items
            </div>
            <div className="text-sm text-gray-500">
              Last active: {formatDate(member.lastActivity)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Member Details */}
      <div className="col-span-2">
        {selectedMember ? (
          <MemberWorkspaceDetails member={selectedMember} />
        ) : (
          <div className="text-center text-gray-500">
            Select a member to view their workspace activity
          </div>
        )}
      </div>
    </div>
  );
};
```

## Real-time Updates

### WebSocket Events

```javascript
// Client-side (in workspace module)
socket.on('design-update', (data) => {
    // Reload design elements
    this.loadDesignElements();
});

socket.on('feedback-response', (data) => {
    // Show notification
    this.showNotification('Admin responded to your feedback!');
    // Update feedback list
    this.loadFeedback();
});

socket.on('project-stage-update', (data) => {
    // Update progress chart
    this.updateProgressChart(data.newStage);
});

// Server-side broadcast
io.to(`member-${projectId}-${memberId}`).emit('design-update', {
    elements: updatedElements
});
```

## Security Considerations

1. **Always validate member ID server-side**
   ```typescript
   if (!req.headers['x-squarespace-member-id']) {
       return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Verify member has access to project**
   ```typescript
   const memberContext = await storage.verifyMemberAccess(projectId, memberId);
   if (!memberContext) {
       return res.status(403).json({ error: 'Access denied' });
   }
   ```

3. **Sanitize all user input**
   ```typescript
   const sanitizedContent = DOMPurify.sanitize(req.body.content);
   ```

## Testing Checklist

- [ ] Member detection works on Squarespace
- [ ] Each member sees only their workspace
- [ ] Feedback is properly attributed to members
- [ ] Messages are member-specific
- [ ] Design elements load correctly
- [ ] Real-time updates work
- [ ] Mobile responsive design works
- [ ] Progress tracking updates properly
- [ ] Admin can see all member activity
- [ ] WebSocket connections are stable

## Troubleshooting

### "Member not detected"
- Check if user is logged into Squarespace
- Verify SiteUserInfo cookie is present
- Check CORS settings on your server

### "Project not loading"
- Verify project token is correct
- Check server logs for errors
- Ensure database migrations are run

### "Real-time updates not working"
- Check WebSocket connection in browser console
- Verify socket.io is properly configured
- Check firewall/proxy settings

## Support

For additional help:
- Check server logs: `tail -f server.log`
- Browser console for client errors
- Network tab for API failures

This complete implementation provides a robust, member-specific project workspace that integrates seamlessly with Squarespace!
