# Pleasant Cove Design - Proper Authentication Architecture

## The Problem You're Solving

You're building a system for managing **months-long design projects**, not 24-hour sessions. The authentication needs to:

1. Support long-term client projects (months)
2. Allow admin access to all projects
3. Enable real-time messaging via WebSockets
4. Work with both Squarespace widgets and the admin UI

## Current Authentication Confusion

The system currently has THREE different authentication mechanisms that aren't properly integrated:

### 1. Simple Admin Token
- Token: `'pleasantcove2024admin'`
- Used by: Legacy API endpoints
- Problem: It's just a string, not a JWT

### 2. Project Tokens
- Format: `'project_XXXXXX'`
- Used by: Squarespace member widgets
- Problem: These are long-lived but not JWTs

### 3. JWT Tokens
- Format: Standard JWT signed with `JWT_SECRET`
- Used by: WebSocket/Socket.IO connections
- Problem: Currently set to expire in 24 hours

## The Real Solution

### Option 1: Use Project Tokens Everywhere (Recommended)

Since project tokens are already designed to last for the entire project duration:

```javascript
// In AuthService.ts
private async getProjectTokenForAdmin(): Promise<string> {
  // Admin gets a special project token that gives access to all projects
  const response = await fetch('http://localhost:3000/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type: 'admin',
      // This returns a project-style token, not a JWT
    })
  });
  
  const data = await response.json();
  return data.token; // This will be 'pleasantcove2024admin' or similar
}
```

Then modify the server to accept project tokens for WebSocket:

```typescript
// In server/socket.ts
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  // Check if it's a project token or admin token
  if (token === process.env.ADMIN_TOKEN) {
    socket.data.isAdmin = true;
    return next();
  }
  
  // Check if it's a valid project token
  const project = await storage.getProjectByToken(token);
  if (project) {
    socket.data.projectId = project.id;
    return next();
  }
  
  // Fall back to JWT validation
  // ... existing JWT code ...
});
```

### Option 2: Long-Lived JWTs

Modify the JWT creation to have much longer expiration:

```typescript
// In server/routes/auth.ts
const token = jwt.sign(
  { userId, businessId, role, scope },
  process.env.JWT_SECRET,
  { 
    expiresIn: '365d' // 1 year instead of 24 hours
  }
);
```

### Option 3: Implement Refresh Tokens (Most Robust)

Add a refresh token system:

```typescript
// In server
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '1y' });

// Store refresh token in database
await storage.storeRefreshToken(userId, refreshToken);

// In client AuthService
private async refreshAccessToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });
  
  const { accessToken } = await response.json();
  localStorage.setItem('auth_token', accessToken);
}
```

## Immediate Fix for Your Current Setup

1. **Backend**: Ensure the `/api/auth/admin` endpoint exists and returns a proper JWT:

```typescript
// Add to server/routes/auth.ts
router.post('/auth/admin', async (req, res) => {
  const { adminKey } = req.body;
  
  if (adminKey === process.env.ADMIN_TOKEN) {
    const token = jwt.sign(
      { 
        userId: 1, 
        role: 'admin', 
        scope: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // Long-lived for development
    );
    
    return res.json({
      token,
      userId: 1,
      email: 'admin@pleasantcove.com',
      name: 'Admin',
      role: 'admin'
    });
  }
  
  return res.status(401).json({ error: 'Invalid admin key' });
});
```

2. **Frontend**: The AuthService is already updated to request this JWT.

3. **Environment**: Make sure `.env` has:
```
JWT_SECRET=pleasant-cove-jwt-secret-2025
ADMIN_TOKEN=pleasantcove2024admin
```

## How to Properly Integrate the New UI

1. **Start the backend server**:
   ```bash
   cd archive/Pleasantcovedesign-main
   npm run server
   ```

2. **Start the frontend UI**:
   ```bash
   cd archive/lovable-ui-integration
   npm run dev
   ```

3. **The UI will automatically**:
   - Check for existing auth token
   - If none found, request a JWT using the admin key
   - Use that JWT for all API and WebSocket connections

4. **For production**, you'll need to:
   - Deploy both the backend and frontend
   - Update the backend URL in the frontend config
   - Ensure environment variables are set in production

## Key Takeaways

1. **Don't use 24-hour JWTs for months-long projects**
2. **Project tokens are already designed for this use case**
3. **The admin UI needs consistent authentication with the rest of the system**
4. **WebSocket authentication should accept the same tokens as the API**

The confusion comes from having three separate auth systems that evolved independently. The solution is to unify them around your actual use case: long-term project management.

