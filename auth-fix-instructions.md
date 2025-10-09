# 🔧 Fix WebSocket Authentication - Quick Solution

## The Issue
Your WebSocket connection is failing with "Unauthorized" because the JWT token in your browser doesn't match the server's JWT_SECRET.

## Quick Fix (Do This Now)

1. **I've opened a fix page for you** in your browser. On that page:
   - Click "Clear Old Tokens" 
   - Click "Set Authentication Token"
   - Click "Open Admin Dashboard"

2. **Alternative: Manual Fix**
   If the page didn't open, go to http://localhost:5173 and open the browser console (F12), then run:
   ```javascript
   localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImJ1c2luZXNzSWQiOjEsInJvbGUiOiJhZG1pbiIsInNjb3BlIjoiYWRtaW4iLCJpYXQiOjE3NTk4OTY3MzAsImV4cCI6MTc1OTk4MzEzMH0.qS_rqx7eUqGrG7YuWmaHShAtsHbMnVGUqgEz_PLABQs');
   location.reload();
   ```

## Why This Happened

1. The server requires a JWT token signed with `JWT_SECRET = pleasant-cove-dev-jwt-secret-2025`
2. Your browser either had no token or an invalid token
3. The token I generated matches the server's secret

## Long-term Solution

To avoid this in the future, make sure your `.env` file in the server directory contains:
```
JWT_SECRET=pleasant-cove-dev-jwt-secret-2025
ADMIN_TOKEN=pleasantcove2024admin
```

## For Production (Railway)

Set these environment variables in Railway:
- `JWT_SECRET` = (use a secure random string)
- `ADMIN_TOKEN` = (optional fallback token)
- `NODE_ENV` = production

## Success Indicators

When it's working, you'll see in the console:
- `[WS] connected` (instead of `[WS] error Unauthorized`)
- No more "Unauthorized" errors
- Real-time updates working in the admin dashboard

The fix page I opened will guide you through the process step by step!

