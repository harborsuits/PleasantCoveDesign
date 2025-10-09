# 🚀 Pleasant Cove Design - Production Deployment

## Overview

Pleasant Cove Design is a comprehensive CRM and messaging platform for web design agencies, featuring real-time communication, project management, and client portals.

## 🏗️ Production Architecture

```
pleasantcovedesign/
├── server/                    # Backend API (Node.js + Express + Socket.IO)
│   ├── routes/               # API endpoints
│   ├── config/               # Configuration files
│   ├── monitoring.ts         # Health & metrics
│   └── socket.ts            # WebSocket handling
│
├── admin-ui/                  # Admin Dashboard (React + Vite)
│   ├── src/                 # React components
│   ├── dist/                # Built files (after npm run build)
│   └── package.json         # Includes serve for Railway
│
├── widgets/                   # Squarespace Integration
│   └── messaging-widget-unified.html
│
├── scripts/                   # Deployment & Testing
│   ├── deploy-railway.sh    # Railway deployment script
│   └── railway-smoke-tests.sh # Post-deploy verification
│
└── archive/legacy-2025-01/    # Legacy code (Python bots, scrapers, etc.)
```

## 🚂 Railway Deployment

### Prerequisites
- Railway account with GitHub connected
- Railway CLI installed: `npm i -g @railway/cli`

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git add -A
   git commit -m "Production-ready structure"
   git push origin main
   ```

2. **Deploy Backend**
   - Create service in Railway → Select repo → Root: `server`
   - Add environment variables:
     ```
     ADMIN_TOKEN=<generate-secure-token>
     JWT_SECRET=<openssl rand -base64 32>
     CORS_ORIGINS=https://pcd-admin-ui.railway.app
     UPLOADS_DIR=/data/uploads
     NODE_ENV=production
     ```
   - Add volume at `/data`

3. **Deploy Admin UI**
   - Create service in Railway → Select repo → Root: `admin-ui`
   - Add environment variables:
     ```
     VITE_API_URL=https://pcd-backend.railway.app
     VITE_WS_URL=wss://pcd-backend.railway.app
     VITE_ADMIN_KEY=<same-as-ADMIN_TOKEN>
     ```

4. **Run Smoke Tests**
   ```bash
   ADMIN_KEY=your-token API_URL=https://pcd-backend.railway.app ./scripts/railway-smoke-tests.sh
   ```

## 🔧 Local Development

### Backend
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:3000
```

### Admin UI
```bash
cd admin-ui
npm install
npm run dev
# Runs on http://localhost:5173
```

## 📊 Monitoring

- Health Check: `https://your-backend.railway.app/api/health`
- Metrics: `https://your-backend.railway.app/api/metrics`
- Logs: `railway logs --service=pcd-backend`

## 🔗 Squarespace Integration

Add to Code Injection:
```html
<script>
  window.PCD_CONFIG = {
    apiBase: "https://pcd-backend.railway.app",
    wsBase: "wss://pcd-backend.railway.app",
    projectToken: "your-client-token"
  };
</script>
<script src="/path/to/widgets/messaging-widget-unified.html"></script>
```

## 🛠️ Useful Commands

```bash
# Railway CLI
railway login                    # Login to Railway
railway link                     # Link to project
railway logs --service=pcd-backend   # View backend logs
railway logs --service=pcd-admin-ui  # View frontend logs
railway domain                   # Get deployment URLs
railway variables               # List environment variables

# Local testing
npm run dev                     # Development mode
npm run build                   # Production build
npm test                        # Run tests
```

## 📚 Key Features

- **Real-time Messaging**: Socket.IO powered chat
- **JWT Authentication**: Secure admin and client access  
- **File Uploads**: Persistent storage with Railway volumes
- **Health Monitoring**: Built-in health and metrics endpoints
- **CORS Support**: Configurable cross-origin access
- **WebSocket Support**: Real-time bidirectional communication

## 🚨 Troubleshooting

### WebSocket Connection Issues
- Ensure Railway Pro plan for WebSocket support
- Check CORS_ORIGINS includes frontend URL
- Verify JWT token is being sent

### File Upload Issues
- Confirm volume mounted at `/data`
- Check UPLOADS_DIR environment variable
- Verify file size limits

### Authentication Errors
- Clear localStorage and retry
- Verify ADMIN_TOKEN matches between services
- Check JWT_SECRET is consistent

## 🔒 Security

- All admin endpoints require JWT authentication
- WebSocket connections are authenticated
- CORS restricted to allowed origins
- Environment variables for sensitive data

## 📈 Scaling

Railway automatically handles:
- SSL certificates
- Load balancing
- Auto-scaling (with Pro plan)
- Zero-downtime deployments

## 🤝 Support

- Railway Docs: https://docs.railway.app
- Check `/scripts` for deployment helpers
- Review smoke tests for verification steps

---

**Version**: 2.0 Production  
**Last Updated**: October 2024  
**Status**: Railway Production Ready ✅
