# Client Access Flow Guide

## 🔐 How Client Access Works

### Two Authentication Methods:

**1. Email-Based (Squarespace Members)**
- Client logs into Squarespace with their email
- Module auto-detects their account
- Automatically loads their project
- No token needed

**2. Token-Based (Direct Access)**
- Client enters access token
- Works without Squarespace login
- Direct project access
- Shareable link

## 👨‍💼 Admin Controls

### In Your Admin UI:

**Project List View:**
- Shows client email for each project
- Quick "Copy Token" button
- One-click access to workspace

**Project Workspace (Overview Tab):**
- **Client Access Management** section
- Shows client email
- Display/copy access token
- Generate token if missing
- Copy client portal URL
- Email access instructions
- Preview client view

### What the Controls Look Like:
```
┌─────────────────────────────────────────────┐
│ 🔑 Client Access Management                 │
├─────────────────────────────────────────────┤
│ Client Email: sarah@lobstershack.com        │
│                                             │
│ Access Token: proj_abc123xyz789             │
│ [Copy Token]                                │
│                                             │
│ Portal URL:                                 │
│ yoursite.com/clientportal/proj_abc123xyz789 │
│ [Copy URL] [Open →]                         │
│                                             │
│ Squarespace Instructions:                   │
│ ✓ Auto-login with: sarah@lobstershack.com  │
│ ✓ Or use token: proj_abc123xyz789          │
│                                             │
│ [📧 Email Instructions] [👁️ Preview]        │
└─────────────────────────────────────────────┘
```

## 🚀 Workflow

### 1. Create Project
```javascript
// When you create a project:
- Company must have email set
- Project gets unique ID
- Token can be generated later
```

### 2. Generate Access Token
```javascript
// Click "Generate Token" in admin UI
POST /api/projects/{id}/generate-token
→ Creates secure token
→ Updates project record
→ Shows in UI immediately
```

### 3. Share with Client

**Option A: Email Instructions**
- Click "Email Instructions" 
- Sends professional email with:
  - Both access methods
  - Direct portal link
  - Clear instructions

**Option B: Manual Share**
- Copy token or URL
- Send via your preferred method
- Client can access immediately

### 4. Client Access

**Via Squarespace:**
```
1. Client logs into Squarespace
2. Goes to page with your module
3. Module detects their email
4. Shows their project automatically
```

**Via Token:**
```
1. Client goes to module page
2. Enters access token
3. Clicks "Access Project"
4. Views project (no login needed)
```

## 📋 Testing Guide

### 1. Test Token Generation
```
1. Open any project in admin
2. Go to Overview tab
3. Find "Client Access Management"
4. Click "Generate Token"
5. Token appears immediately
```

### 2. Test Email Detection
```
1. Set client email in company record
2. Client logs into Squarespace with that email
3. Module auto-detects and shows project
```

### 3. Test Token Access
```
1. Copy project token from admin
2. Open incognito window
3. Go to Squarespace module
4. Enter token (not email)
5. Project loads without login
```

## 🔧 API Endpoints

### Generate Token
```
POST /api/projects/{id}/generate-token
Headers: Authorization: Bearer pleasantcove2024admin
Response: { token: "proj_abc123...", message: "..." }
```

### Get Project by Token
```
GET /api/projects/token/{token}
Response: { project: {...}, billing: {...}, designs: [...] }
```

### Get Project by Email
```
GET /api/projects/member/{email}
Response: { project: {...}, projectToken: "..." }
```

## ⚠️ Important Notes

1. **Tokens are permanent** - They don't expire
2. **One token per project** - Regenerating overwrites old token
3. **Email must match** - For auto-detection, Squarespace email must match company email
4. **Secure tokens** - 32+ character cryptographically secure
5. **Activity logged** - Token generation is tracked

## 🎯 Best Practices

1. **Always set client email** when creating companies
2. **Generate tokens** before sharing with clients
3. **Use email method** for Squarespace sites
4. **Use token method** for external access
5. **Test both methods** before going live

## 💡 Troubleshooting

**"No project found" error:**
- Check client email matches exactly
- Ensure project has active status
- Verify token was generated

**Auto-detection not working:**
- Confirm Squarespace member is logged in
- Check email in company record
- Try token method as fallback

**Token not generating:**
- Ensure you're logged in as admin
- Check project exists in database
- Look for console errors

Your admin UI now has complete control over client access!
