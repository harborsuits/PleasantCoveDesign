# 🎨 How Canvas Sync Works Between Admin & Customer

## 📊 Overview

Your admin canvas and the Squarespace customer canvas work together in real-time! Here's the flow:

```
Admin UI                    Server                    Squarespace Module
   |                          |                              |
   |--[Save Canvas]---------->|                              |
   |                          |--[Broadcast Update]--------->|
   |                          |                              |
   |                          |<--[Customer Feedback]--------|
   |<--[Feedback Alert]-------|                              |
```

## 👨‍💼 Admin Canvas (Your Side)

**Full Control:**
- ✏️ Add design elements (images, text, shapes)
- 🖱️ Drag and position elements
- 🎨 Style and customize
- 💾 Save changes
- 🗑️ Delete elements
- 📐 Grid snapping
- 🔍 Zoom controls
- 👥 See who's viewing

**What Happens When You Save:**
1. Canvas data sent to server
2. Server broadcasts to all clients
3. Customer sees updates instantly
4. No page refresh needed!

## 👤 Customer Canvas (Squarespace Side)

**View-Only Mode:**
- 👁️ See all your designs
- 🔍 View full-size images
- 💬 Submit feedback on designs
- ⭐ See design status (pending/approved)
- 📱 Responsive preview
- 🔄 Real-time updates
- ❌ Cannot edit or move elements
- ❌ Cannot delete anything

## 🔄 Real-Time Sync

### When You Make Changes:
```javascript
Admin: Adds new design → Clicks Save
↓
Server: Receives canvas data
↓
Server: Broadcasts to room `canvas:${projectToken}`
↓
Customer: Receives update via WebSocket
↓
Customer: Canvas updates automatically!
```

### When Customer Gives Feedback:
```javascript
Customer: Clicks design → Types feedback → Submit
↓
Server: Stores feedback
↓
Server: Notifies admin
↓
Admin: Sees feedback notification
```

## 🛠️ Technical Details

### Admin Side:
```javascript
// In DesignCanvas.tsx
const handleSave = async () => {
  await fetch(`/api/projects/${projectId}/canvas`, {
    method: 'POST',
    body: JSON.stringify(canvasState)
  });
  // Server broadcasts to clients automatically
};
```

### Server Broadcasting:
```javascript
// In routes.ts
app.post('/api/projects/:projectId/canvas', async (req, res) => {
  // Save canvas data
  await storage.saveCanvasData(projectId, canvasData);
  
  // Create client-safe version
  const clientCanvasData = {
    ...canvasData,
    viewMode: 'preview',    // Force preview
    readOnly: true,         // No editing
    selectedElement: null   // No selection
  };
  
  // Broadcast to all clients viewing this canvas
  io.to(`canvas:${project.accessToken}`).emit('canvas:update', clientCanvasData);
});
```

### Customer Side:
```javascript
// In Squarespace module
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'canvas:update') {
    // Update canvas with new designs
    renderCanvas(message.data);
  }
};
```

## 🎯 Key Features

### For You (Admin):
- **Full editing power** - Complete design control
- **Instant broadcast** - Changes appear immediately
- **Feedback alerts** - Know when clients comment
- **Version history** - Track design iterations

### For Customer:
- **Live preview** - See changes as you make them
- **Easy feedback** - Click and comment on designs
- **Progress tracking** - See what's approved/pending
- **No refresh needed** - WebSocket keeps it live

## 💡 Best Practices

1. **Save Often** - Each save broadcasts to client
2. **Organize Designs** - Use clear titles/descriptions
3. **Check Feedback** - Clients can comment on each design
4. **Test Both Sides** - Open admin and client view together

## 🚀 Testing the Sync

### To See It Work:
1. Open project in admin UI
2. Open same project in Squarespace (different browser/incognito)
3. Add a design element in admin
4. Click Save
5. Watch it appear instantly in Squarespace!

### What Should Happen:
- ✅ Design appears in customer view within 1-2 seconds
- ✅ Customer can click design to view larger
- ✅ Customer can submit feedback
- ✅ You get notified of feedback

## ⚠️ Troubleshooting

**Changes not appearing?**
- Check WebSocket connection (green dot = connected)
- Ensure you clicked Save in admin
- Verify project tokens match

**Customer can't see canvas?**
- Check they're logged in with correct email
- Or using correct access token
- Ensure project has designs saved

**Feedback not working?**
- Check API endpoints are running
- Verify project token is valid
- Look for console errors

Your canvas is fully synchronized! Design in admin, customer sees it live! 🎨✨
