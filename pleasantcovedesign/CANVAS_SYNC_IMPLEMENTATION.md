# Canvas Synchronization: Admin ↔ Customer

## Current State

### ✅ What's Working:
1. **Admin → Customer Canvas Updates**
   - When admin updates canvas in ProjectWorkspace, it broadcasts to customer via WebSocket
   - Route: `POST /api/projects/:projectId/canvas` 
   - Broadcasts to room: `canvas:${project.accessToken}`
   - Customer receives read-only view

2. **Customer → Admin Feedback**
   - Design feedback route exists: `POST /api/projects/:id/designs/:designId/feedback`
   - Emits to: `project-${projectId}` room
   - Updates feedback count

3. **Messaging System**
   - Messages sync both ways via WebSocket
   - Broadcasts to both project room AND admin room

### ❌ What's Missing:

1. **Canvas Feedback in Admin UI**
   - Customer feedback on designs needs to show in admin ProjectWorkspace
   - No listener for `new_feedback` events in admin UI

2. **Real-time Canvas Updates in Customer Module**
   - Customer module doesn't connect to WebSocket for live updates
   - No listener for `canvas:update` events

3. **Design Status Updates**
   - When admin approves/rejects design, customer doesn't see update
   - No status sync mechanism

## Implementation Needed

### 1. Add WebSocket to Customer Module
```javascript
// In SQUARESPACE_MODULE_BLACK_WHITE.html
setupWebSocket() {
  const ws = new WebSocket(CONFIG.WS_URL);
  
  ws.on('connect', () => {
    // Join canvas room
    ws.emit('canvas:view', this.data.projectToken);
  });
  
  ws.on('canvas:update', (canvasData) => {
    // Update designs in real-time
    this.data.project.designs = canvasData.elements;
    if (this.data.currentTab === 'canvas') {
      this.renderCanvas();
    }
  });
  
  ws.on('design:statusUpdate', (data) => {
    // Update design status
    const design = this.data.project.designs.find(d => d.id === data.designId);
    if (design) {
      design.status = data.status;
      this.renderCanvas();
    }
  });
}
```

### 2. Update Admin UI to Listen for Feedback
```typescript
// In ProjectWorkspace.tsx
useEffect(() => {
  const socket = getSocket();
  
  socket.on('new_feedback', (feedback) => {
    // Show notification
    showNotification(`New feedback on ${feedback.designName}`);
    
    // Update local state
    setDesignFeedbacks(prev => [...prev, feedback]);
  });
  
  return () => socket.off('new_feedback');
}, []);
```

### 3. Add Feedback API Call in Customer Module
```javascript
// Update submitFeedback in customer module
async submitFeedback(designId) {
  const feedback = input.value.trim();
  
  const response = await fetch(`${CONFIG.API_URL}/api/projects/${this.data.project.id}/designs/${designId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.data.projectToken}`
    },
    body: JSON.stringify({
      content: feedback,
      author: this.data.memberName
    })
  });
  
  if (response.ok) {
    // Success - admin will receive via WebSocket
  }
}
```

### 4. Server Routes for Design Status
```typescript
// Add to server routes
app.post('/api/projects/:projectId/designs/:designId/status', requireAdmin, async (req, res) => {
  const { status } = req.body; // 'approved', 'in-review', 'rejected'
  
  // Update in database
  await storage.updateDesignStatus(designId, status);
  
  // Broadcast to customer
  io.to(`canvas:${project.accessToken}`).emit('design:statusUpdate', {
    designId,
    status,
    updatedAt: new Date()
  });
  
  res.json({ success: true });
});
```

## Summary

To make the canvas fully operational in tandem:

1. **Add WebSocket connection** to customer module for real-time updates
2. **Listen for feedback** in admin UI to see customer comments
3. **Implement design status sync** so approvals show instantly
4. **Add feedback notifications** so you know when customers comment

The infrastructure is mostly there - just needs these connections completed!
