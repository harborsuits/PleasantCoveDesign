# Railway Deployment Quick Checklist

## ✅ Local Verification Complete

All sanity checks passed:
- Admin JWT: `365d` expiration ✓
- Protected routes: Working with Bearer token ✓
- WS-exchange: Returns valid WebSocket tokens ✓
- Socket.IO auth: Verifies JWT properly ✓

## 🚀 Railway Deployment Settings

### 1. Environment Variables (Settings → Variables)
```
ADMIN_TOKEN=pleasantcove2024admin
JWT_SECRET=<generate-64-char-random-string>
NODE_ENV=production
PORT=3000
```

If using persistent storage:
```
DATA_DIR=/data
DB_PATH=/data/pleasantcove.db
```

### 2. Start Command (Deploy tab)
**IMPORTANT**: Clear any custom start command so Railway uses the Dockerfile's CMD

### 3. Volume (Settings → Volumes)
- Mount path: `/data`
- Only needed if you want persistent SQLite database

### 4. Dockerfile Status
✅ Already switched to Debian (`node:20-bullseye-slim`)
✅ Multi-stage build working
✅ `CMD ["tini","--","node","dist/index.js"]`

## 🧪 Production Smoke Tests

```bash
# 1. Health check
curl -s https://pleasantcovedesign-production.up.railway.app/health

# 2. Admin JWT (365 days)
curl -s -X POST https://pleasantcovedesign-production.up.railway.app/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"adminKey":"pleasantcove2024admin"}'

# 3. WS-exchange
curl -s -X POST https://pleasantcovedesign-production.up.railway.app/api/public/ws-exchange \
  -H "Content-Type: application/json" \
  -d '{"token":"<PROJECT_TOKEN>"}'
```

## 📝 What Changed

1. **JWT Duration**: 24h → 365d (for long-term projects)
2. **Auth Endpoint**: Added `/api/auth/admin` that frontend expects
3. **Role Check**: `requireAdmin` now verifies `role === 'admin'`
4. **Compatibility**: `/api/token` alias for backward compatibility

## 🔐 Security Notes

- JWT_SECRET should be long & random (64+ chars)
- Rotating JWT_SECRET invalidates all tokens immediately
- 365-day tokens are appropriate for your months-long design projects

## 🎯 Frontend Integration

The frontend (lovable-ui-integration) now:
1. Automatically requests JWT on startup
2. Stores token in localStorage (`auth_token` and `pcd_token`)
3. Uses JWT for all API calls (`Authorization: Bearer <token>`)
4. Uses JWT for WebSocket auth (`auth: { token }`)

## 🚨 If Railway Build Fails

Look for the first npm error in the build log. Common issues:
- Native module compilation → Already fixed with Debian base
- Missing env vars → Check Variables tab
- Port conflicts → Ensure PORT=3000 in env vars

