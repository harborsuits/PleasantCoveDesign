# 🎯 Squarespace Client Project Workspace Module

## What This Is

A **self-contained JavaScript module** that your clients can embed in their Squarespace site to access their project workspace. It gives them:

- 📊 Real-time project progress
- 🎨 Design viewing with click-to-comment feedback
- 💬 Direct messaging with you
- 📁 File downloads
- ✅ Milestone tracking

## How It Works

### 1. Client adds this to their Squarespace page:
```html
<!-- Add to Code Block in Squarespace -->
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script src="https://pleasantcovedesign.com/client-module/client-workspace.js"></script>
<div id="pleasant-cove-workspace"></div>
```

### 2. Module automatically:
- Detects logged-in Squarespace member
- Loads their specific project
- Connects WebSocket for real-time updates
- Shows only their data

### 3. Client sees:
```
┌─────────────────────────────────────────────────┐
│       Bob's Plumbing Website Project            │
│              Welcome, Bob Smith                  │
├─────────────────────────────────────────────────┤
│ Overview | Designs | Messages | Milestones | Files │
├─────────────────────────────────────────────────┤
│                                                 │
│  Project Progress                               │
│  ████████████████░░░░░░  75% Complete         │
│                                                 │
│  Current Stage: Development                     │
│  Est. Completion: March 15, 2024               │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Server Requirements

### 1. API Endpoints Needed:
```javascript
// Get member's project
GET /api/workspace/member/:memberId

// Get project messages  
GET /api/workspace/project/:projectId/messages

// Send message
POST /api/workspace/project/:projectId/messages

// Submit feedback on design
POST /api/workspace/project/:projectId/feedback
```

### 2. WebSocket Events:
```javascript
// Server emits:
socket.emit('message:new', messageData);
socket.emit('project:updated', projectData);
socket.emit('design:new', designData);

// Client emits:
socket.emit('message:send', messageData);
```

### 3. Database Schema:
```sql
-- Link Squarespace members to projects
CREATE TABLE project_members (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  squarespace_member_id VARCHAR(255),
  member_email VARCHAR(255),
  member_name VARCHAR(255),
  access_level VARCHAR(50) DEFAULT 'client'
);
```

---

## Deployment Steps

### 1. Host the Module Files:
```bash
# Upload to your server
/public/client-module/
  └── client-workspace.js

# Or use CDN
Upload to Cloudflare R2 and get public URL
```

### 2. Update URLs in Module:
```javascript
// In client-workspace.js, update:
const API_URL = 'https://your-api-domain.com';
const WS_URL = 'wss://your-api-domain.com';
```

### 3. Enable CORS:
```javascript
// In your server
app.use(cors({
  origin: [
    /\.squarespace\.com$/,
    /\.sqsp\.net$/
  ],
  credentials: true
}));
```

### 4. Create Test Project:
```sql
-- Add test data
INSERT INTO projects (name, companyId, status, progress)
VALUES ('Test Website Project', 1, 'active', 50);

INSERT INTO project_members (project_id, squarespace_member_id, member_email)
VALUES (1, 'sq_test_123', 'test@example.com');
```

---

## Client Instructions

### For Your Customers:

1. **Log into Squarespace**
2. **Go to the page** where you want the project workspace
3. **Add a Code Block**
4. **Paste this code:**
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script src="https://pleasantcovedesign.com/client-module/client-workspace.js"></script>
<div id="pleasant-cove-workspace"></div>
```
5. **Save and refresh** - your project appears!

---

## Features in Detail

### 📊 Overview Tab
- Progress bar with percentage
- Current project stage
- Estimated completion date
- Quick stats

### 🎨 Designs Tab
- View all uploaded designs
- Click anywhere to add feedback
- Feedback pins stay on exact spot
- Real-time design updates

### 💬 Messages Tab
- Chat interface
- Real-time messaging via WebSocket
- Message history
- File attachments (coming soon)

### ✅ Milestones Tab
- Project phases
- Completion status
- Timeline view
- Automatic updates

### 📁 Files Tab
- Download deliverables
- Organized by type
- Version history
- One-click downloads

---

## Testing Locally

### 1. Mock Squarespace Environment:
```html
<!DOCTYPE html>
<html>
<head>
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
  <h1>Test Page</h1>
  
  <!-- Module embed -->
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  <script src="client-workspace.js"></script>
  <div id="pleasant-cove-workspace"></div>
</body>
</html>
```

### 2. URL Parameter Testing:
```
http://localhost:8080/test.html?member_email=test@example.com&member_id=123
```

---

## Customization

### Change Colors:
```javascript
// In client-workspace.js, modify:
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

### Add Your Logo:
```javascript
// In the header section:
<img src="https://yoursite.com/logo.png" style="height: 40px;" />
```

### Custom Fields:
```javascript
// Add to project data:
customField1: project.customField1,
customField2: project.customField2
```

---

## Security

1. **Member Isolation**: Each member only sees their project
2. **API Authentication**: Verify member ID server-side
3. **CORS Protection**: Only allow Squarespace domains
4. **Input Sanitization**: Clean all user inputs
5. **SSL Required**: Use HTTPS/WSS only

---

## Troubleshooting

### "No project found"
- Check member ID in database
- Verify project is marked 'active'
- Check browser console for errors

### Messages not updating
- Verify WebSocket connection
- Check CORS settings
- Ensure Socket.IO is loaded

### Can't see designs
- Check image URLs are accessible
- Verify CORS for images
- Check design data in project

---

## The Complete Flow

1. **Customer visits their Squarespace site**
2. **Module detects they're logged in**
3. **Fetches their project from your API**
4. **Establishes WebSocket connection**
5. **Shows their project workspace**
6. **Updates in real-time as you work**

This gives your clients a premium experience right inside their own website!
