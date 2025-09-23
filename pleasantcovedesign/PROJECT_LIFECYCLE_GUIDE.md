# Project Lifecycle Management Guide

## 🚀 Starting a Project

### From Admin UI:

1. **Option 1: From Lead → Project**
   ```
   Leads Page → Select Lead → "Create Project" button
   ```

2. **Option 2: Quick Project Creation**
   ```
   Dashboard → "New Project" → Fill form:
   - Select or create company
   - Project title
   - Type (website/marketing/etc)
   - Stage (planning/active/etc)
   ```

3. **Option 3: From Schedule/Appointment**
   ```
   Schedule appointment → Select client → Create project
   ```

### What Happens:
- Project gets unique ID
- Access token generated automatically
- Client can access via token
- Project appears in ProjectWorkspace

### API Call:
```javascript
POST /api/projects
{
  companyId: 123,
  title: "Website Redesign",
  type: "website",
  stage: "planning",
  status: "active",
  notes: "Initial consultation scheduled"
}
```

## 📊 Project Stages & Status

### Stages (Where in sales process):
- `scraped` - Lead identified
- `contacted` - Initial outreach sent
- `interested` - Client responded positively
- `proposal` - Proposal sent
- `active` - Project in progress
- `completed` - Project finished
- `paused` - On hold

### Status (Current state):
- `active` - Currently working
- `review` - Awaiting client feedback
- `completed` - All done
- `on_hold` - Temporarily paused

## 🔑 Client Access

### Automatic Token Generation:
When project is created, system generates access token:
```javascript
// In storage layer
const project = await storage.createProject({
  ...data,
  accessToken: generateSecureProjectToken()
});
```

### Client Access URL:
```
https://yoursite.com/clientportal/{accessToken}
```

### Squarespace Module:
- Uses member email to find project
- Or uses direct token if provided
- Syncs with admin in real-time

## ✅ Completing a Project

### 1. Update Project Status:
```javascript
PUT /api/projects/{id}
{
  status: "completed",
  stage: "completed"
}
```

### 2. Final Tasks:
- [ ] Mark all milestones complete
- [ ] Ensure final payment received
- [ ] Export project data if needed
- [ ] Send completion notification

### 3. From Admin UI:
```
ProjectWorkspace → Project → Settings → "Complete Project"
```

## 🔄 Project State Sync

### Admin → Customer:
- Status changes broadcast via WebSocket
- Progress updates show instantly
- Milestone completions sync
- Design approvals update live

### Customer → Admin:
- Feedback submitted via API
- Messages sync to admin inbox
- File uploads appear in admin

## ⚠️ Important Considerations

### 1. **Payment Tracking**
- Projects track `totalAmount` and `paidAmount`
- Integrate with Stripe for payment links
- Update payment status on completion

### 2. **Access Control**
- Each project has unique `accessToken`
- Tokens don't expire (stable access)
- Client access via email or token

### 3. **Data Persistence**
- Projects never deleted, only marked complete
- Full audit trail maintained
- Canvas designs archived

### 4. **Communication**
- All messages stored with project
- Email notifications for milestones
- Real-time updates via WebSocket

## 🛠️ Missing Components to Address

### ❌ Not Yet Implemented:
1. **Project Templates** - Preset project structures
2. **Automated Invoicing** - Generate invoices on milestones
3. **Time Tracking** - Track hours per project
4. **File Versioning** - Track design iterations
5. **Client Approvals** - Formal approval workflow

### ✅ Ready to Use:
1. **Project Creation** ✓
2. **Client Access** ✓
3. **Real-time Sync** ✓
4. **Payment Tracking** ✓
5. **Messaging System** ✓
6. **Design Canvas** ✓
7. **Milestone Tracking** ✓

## 💡 Best Practices

1. **Always Create Company First**
   - Projects must belong to a company
   - Company holds client contact info

2. **Use Consistent Stages**
   - Follow the stage progression
   - Update stage as project moves

3. **Generate Tokens Securely**
   - Let system generate tokens
   - Don't reuse tokens

4. **Track Everything**
   - Log all activities
   - Update progress regularly
   - Document client feedback

## 🚦 Testing Workflow

1. **Create Test Company**
   ```
   Name: Test Business LLC
   Email: test@example.com
   ```

2. **Create Test Project**
   ```
   Title: Test Website Project
   Stage: active
   Status: active
   ```

3. **Access as Client**
   - Get project token from database
   - Use in Squarespace module
   - Test real-time sync

4. **Complete Project**
   - Update status to "completed"
   - Verify client sees completion
   - Check all data preserved
