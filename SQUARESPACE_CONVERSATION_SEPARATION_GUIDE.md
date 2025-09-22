# Squarespace Conversation Separation Implementation Guide

## Overview

This guide ensures that conversations are properly separated by Squarespace account in your Pleasant Cove Design system.

## Current Architecture Analysis

### What We Have
1. **Backend Infrastructure**
   - Node.js/Express server with WebSocket support
   - PostgreSQL database with project_messages table
   - Real-time messaging via Socket.IO

2. **Frontend Components**
   - Admin dashboard with unified inbox
   - Client messaging widget for Squarespace
   - Canvas viewer with commenting

3. **Missing Pieces**
   - No conversation context separation by Squarespace member
   - Messages grouped only by project, not by member
   - No visual separation in the UI

## Implementation Solution

### Step 1: Database Schema Update

Create a new migration file:

```sql
-- Add Squarespace member tracking
ALTER TABLE companies 
ADD COLUMN squarespace_member_id VARCHAR(255),
ADD COLUMN squarespace_site_id VARCHAR(255),
ADD COLUMN squarespace_email VARCHAR(255);

-- Create member conversation contexts
CREATE TABLE member_conversation_contexts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    squarespace_member_id VARCHAR(255) NOT NULL,
    squarespace_email VARCHAR(255),
    context_type VARCHAR(50) DEFAULT 'general',
    title VARCHAR(255),
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, squarespace_member_id, context_type)
);

-- Add context reference to messages
ALTER TABLE project_messages
ADD COLUMN member_context_id INTEGER REFERENCES member_conversation_contexts(id),
ADD COLUMN squarespace_member_id VARCHAR(255);

-- Create indexes
CREATE INDEX idx_member_contexts_project ON member_conversation_contexts(project_id);
CREATE INDEX idx_member_contexts_member ON member_conversation_contexts(squarespace_member_id);
CREATE INDEX idx_messages_context ON project_messages(member_context_id);
```

### Step 2: Update Backend Routes

Add these endpoints to your routes.ts:

```typescript
// Get member-specific conversations
app.get('/api/public/project/:token/member-conversations', async (req, res) => {
    const { token } = req.params;
    const squarespaceMemberId = req.headers['x-squarespace-member-id'];
    
    if (!squarespaceMemberId) {
        return res.status(401).json({ error: 'Member ID required' });
    }
    
    const project = await storage.getProjectByToken(token);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get or create member context
    const context = await storage.getOrCreateMemberContext(
        project.id,
        squarespaceMemberId,
        req.headers['x-squarespace-email']
    );
    
    // Get messages for this member only
    const messages = await storage.getMemberMessages(project.id, squarespaceMemberId);
    
    res.json({
        context,
        messages,
        projectId: project.id
    });
});

// Send member-specific message
app.post('/api/public/project/:token/member-message', async (req, res) => {
    const { token } = req.params;
    const { content, attachments } = req.body;
    const squarespaceMemberId = req.headers['x-squarespace-member-id'];
    
    if (!squarespaceMemberId) {
        return res.status(401).json({ error: 'Member ID required' });
    }
    
    const project = await storage.getProjectByToken(token);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get or create context
    const context = await storage.getOrCreateMemberContext(
        project.id,
        squarespaceMemberId,
        req.headers['x-squarespace-email']
    );
    
    // Create message with member context
    const message = await storage.createProjectMessage({
        projectId: project.id,
        memberContextId: context.id,
        squarespaceMemberId,
        senderType: 'client',
        senderName: req.headers['x-squarespace-name'] || 'Member',
        content,
        attachments: attachments || []
    });
    
    // Emit to specific rooms
    io.to(`project-${project.id}`).emit('newMemberMessage', {
        ...message,
        contextId: context.id,
        memberId: squarespaceMemberId
    });
    
    res.json({ success: true, message });
});
```

### Step 3: Update Storage Layer

Add these methods to your storage implementation:

```typescript
async getOrCreateMemberContext(projectId, memberId, memberEmail) {
    const existing = await this.query(
        `SELECT * FROM member_conversation_contexts 
         WHERE project_id = $1 AND squarespace_member_id = $2`,
        [projectId, memberId]
    );
    
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    
    // Create new context
    const result = await this.query(
        `INSERT INTO member_conversation_contexts 
         (project_id, squarespace_member_id, squarespace_email, title)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [projectId, memberId, memberEmail, `${memberEmail || 'Member'} Conversation`]
    );
    
    return result.rows[0];
}

async getMemberMessages(projectId, memberId) {
    const result = await this.query(
        `SELECT pm.*, mcc.title as context_title
         FROM project_messages pm
         JOIN member_conversation_contexts mcc ON pm.member_context_id = mcc.id
         WHERE pm.project_id = $1 AND pm.squarespace_member_id = $2
         ORDER BY pm.created_at ASC`,
        [projectId, memberId]
    );
    
    return result.rows;
}
```

### Step 4: Update Widget for Member Separation

Modify your messaging widget to send member information:

```javascript
// In messaging-widget-unified.html
async sendMessage(messageText) {
    if (!this.memberInfo) {
        console.error('No member info available');
        return;
    }
    
    const payload = {
        content: messageText,
        attachments: [],
        metadata: {
            memberContext: true,
            sentFrom: 'squarespace_widget',
            siteUrl: window.location.hostname
        }
    };
    
    try {
        const response = await fetch(`${this.serverUrl}/api/public/project/${this.projectToken}/member-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Squarespace-Member-Id': this.memberInfo.id,
                'X-Squarespace-Email': this.memberInfo.email,
                'X-Squarespace-Name': this.memberInfo.name,
                'X-Squarespace-Site': window.location.hostname
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        const result = await response.json();
        console.log('✅ Message sent with member context');
        
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}
```

### Step 5: Update Admin UI for Member Context

Create a new component for the admin dashboard:

```typescript
// MemberConversationView.tsx
import React, { useState, useEffect } from 'react';
import api from '../api';

interface MemberContext {
  id: number;
  squarespaceMemberId: string;
  squarespaceEmail: string;
  title: string;
  lastActivityAt: string;
  messageCount: number;
}

const MemberConversationView: React.FC<{ projectId: number }> = ({ projectId }) => {
  const [memberContexts, setMemberContexts] = useState<MemberContext[]>([]);
  const [selectedContext, setSelectedContext] = useState<MemberContext | null>(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMemberContexts();
  }, [projectId]);

  const loadMemberContexts = async () => {
    try {
      const response = await api.get(`/admin/projects/${projectId}/member-contexts`);
      setMemberContexts(response.data.contexts);
    } catch (error) {
      console.error('Failed to load member contexts:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Member list */}
      <div className="w-64 border-r">
        <h3 className="p-4 font-semibold">Member Conversations</h3>
        {memberContexts.map(context => (
          <div
            key={context.id}
            onClick={() => setSelectedContext(context)}
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedContext?.id === context.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="font-medium">{context.squarespaceEmail}</div>
            <div className="text-sm text-gray-500">
              Member ID: {context.squarespaceMemberId.substring(0, 8)}...
            </div>
            <div className="text-xs text-gray-400">
              Last active: {new Date(context.lastActivityAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1">
        {selectedContext ? (
          <MessageThread contextId={selectedContext.id} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            Select a member conversation
          </div>
        )}
      </div>
    </div>
  );
};
```

### Step 6: Visual Separation in Admin Inbox

Update your inbox to show member-specific threads:

```typescript
// Enhanced inbox with member grouping
const EnhancedMemberInbox: React.FC = () => {
  const renderConversations = () => {
    // Group by member
    const memberGroups = {};
    
    conversations.forEach(conv => {
      const memberId = conv.squarespaceMemberId || 'general';
      if (!memberGroups[memberId]) {
        memberGroups[memberId] = {
          memberInfo: conv.memberInfo,
          conversations: []
        };
      }
      memberGroups[memberId].conversations.push(conv);
    });

    return Object.entries(memberGroups).map(([memberId, group]) => (
      <div key={memberId} className="mb-6">
        <div className="px-4 py-2 bg-gray-100 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">
                {group.memberInfo?.email || 'General Messages'}
              </span>
              {group.memberInfo && (
                <span className="ml-2 text-xs text-gray-500">
                  Squarespace Member
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {group.conversations.length} conversations
            </span>
          </div>
        </div>
        
        {group.conversations.map(conv => (
          <ConversationItem key={conv.id} conversation={conv} />
        ))}
      </div>
    ));
  };
};
```

## Testing & Validation

### Test Scenarios

1. **Member Isolation Test**
   ```javascript
   // Test with two different Squarespace members
   const member1 = { id: 'member123', email: 'john@example.com' };
   const member2 = { id: 'member456', email: 'jane@example.com' };
   
   // Each should only see their own messages
   ```

2. **Admin View Test**
   - Admin should see all member conversations
   - Conversations should be clearly labeled by member
   - Admin can respond to specific member threads

3. **Real-time Updates**
   - Member A sends message
   - Admin sees it in Member A's thread
   - Member B doesn't see Member A's messages

### Verification Checklist

- [ ] Database schema updated with member context tables
- [ ] API endpoints handle member-specific requests
- [ ] Widget sends member ID with every request
- [ ] Admin UI shows member-separated conversations
- [ ] Real-time updates respect member boundaries
- [ ] Messages are properly attributed to members
- [ ] Guest users cannot access member conversations

## Deployment Steps

1. **Database Migration**
   ```bash
   psql -U your_user -d your_database -f add_member_contexts.sql
   ```

2. **Backend Deployment**
   ```bash
   npm run build
   npm run deploy
   ```

3. **Widget Update**
   - Replace existing widget code in Squarespace
   - Test member detection
   - Verify message sending

4. **Admin UI Update**
   - Deploy updated admin dashboard
   - Train team on new member view

## Monitoring & Maintenance

### Key Metrics
- Member context creation rate
- Messages per member
- Response time by member
- Member engagement levels

### Logs to Monitor
```javascript
// Add logging for member operations
console.log('[MEMBER_CONTEXT] Created new context:', {
  projectId,
  memberId,
  email
});

console.log('[MEMBER_MESSAGE] Message sent:', {
  contextId,
  memberId,
  messageId
});
```

This implementation ensures complete separation of conversations by Squarespace member while maintaining a unified experience for your admin team.
