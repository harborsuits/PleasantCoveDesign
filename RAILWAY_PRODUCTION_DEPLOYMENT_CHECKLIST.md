# 🚂 Railway Production Deployment Checklist

## Pre-Deploy Checklist

### 1. Local Testing ✓
- [ ] Run full test suite: `npm test`
- [ ] Test admin authentication flow
- [ ] Test WebSocket connections
- [ ] Test file uploads
- [ ] Verify health endpoint: `http://localhost:3000/api/health`
- [ ] Check metrics endpoint: `http://localhost:3000/api/metrics`

### 2. Environment Preparation
- [ ] Generate secure JWT secret: `openssl rand -base64 32`
- [ ] Generate secure admin token: `openssl rand -hex 32`
- [ ] Have your frontend domain ready (for CORS)

## Railway Deployment

### 3. Railway Project Setup
- [ ] Create new Railway project
- [ ] Connect GitHub repository (optional but recommended)
- [ ] Select the server directory as root

### 4. Environment Variables in Railway
Set these in Railway dashboard:
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000` (Railway will override with their port)
- [ ] `ADMIN_TOKEN` = (your generated secure token)
- [ ] `JWT_SECRET` = (your generated JWT secret)
- [ ] `CORS_ORIGINS` = (comma-separated list of allowed origins)
  - Example: `https://your-frontend.vercel.app,https://your-domain.com`
- [ ] `UPLOADS_DIR` = `/data/uploads`

### 5. Volume Configuration
- [ ] Add persistent volume mount at `/data`
- [ ] Verify volume is attached to your service

### 6. Deploy
```bash
# From server directory
cd archive/Pleasantcovedesign-main/server

# Deploy using Railway CLI
railway login
railway link
railway up

# Or use the deployment script
../../../scripts/deploy-railway.sh
```

### 7. Post-Deploy Verification
- [ ] Get deployment URL: `railway domain`
- [ ] Test health endpoint: `https://your-app.railway.app/api/health`
- [ ] Check metrics: `https://your-app.railway.app/api/metrics`
- [ ] Verify WebSocket connectivity
- [ ] Test admin authentication

## Frontend Deployment (Vercel/Netlify)

### 8. Frontend Environment Variables
Set these in your frontend hosting platform:
- [ ] `VITE_API_URL` = `https://your-app.railway.app`
- [ ] `VITE_WS_URL` = `wss://your-app.railway.app`
- [ ] `VITE_ADMIN_KEY` = `pleasantcove2024admin` (for initial auth)

### 9. Deploy Frontend
```bash
# From lovable-ui-integration directory
cd archive/lovable-ui-integration

# For Vercel
vercel

# For Netlify
netlify deploy --prod
```

### 10. Update CORS Origins
- [ ] Add frontend production URL to Railway's `CORS_ORIGINS`
- [ ] Redeploy Railway service to apply changes

## Post-Deployment Tests

### 11. End-to-End Testing
- [ ] Admin can login to dashboard
- [ ] WebSocket messages work in real-time
- [ ] File uploads persist across restarts
- [ ] Widget connects from Squarespace
- [ ] Customer messages reach admin inbox

### 12. Monitoring Setup
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (optional: Sentry)
- [ ] Set up log aggregation (Railway logs)

## Squarespace Integration

### 13. Widget Configuration
Update your widget code with production URLs:
```html
<script>
  window.PCD_CONFIG = {
    apiBase: 'https://your-app.railway.app',
    wsBase: 'wss://your-app.railway.app',
    projectToken: 'CLIENT_PROJECT_TOKEN'
  };
</script>
```

### 14. Webhook Configuration
- [ ] Update Squarespace webhook URL to: `https://your-app.railway.app/api/new-lead`
- [ ] Test form submission

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check Railway supports WebSocket (Pro plan required)
   - Verify CORS origins include frontend domain
   - Check browser console for specific errors

2. **File Uploads Don't Persist**
   - Verify volume is mounted at `/data`
   - Check `UPLOADS_DIR` environment variable
   - Verify write permissions on volume

3. **Authentication Errors**
   - Verify `JWT_SECRET` matches between deploys
   - Check `ADMIN_TOKEN` is set correctly
   - Clear browser localStorage and retry

4. **CORS Errors**
   - Add frontend domain to `CORS_ORIGINS`
   - Include protocol (https://) in origins
   - Restart Railway service after changes

### Debug Commands

```bash
# View Railway logs
railway logs

# Check deployment status
railway status

# View environment variables
railway variables

# SSH into container (if available)
railway run bash
```

## Rollback Plan

If issues arise:
1. Railway keeps previous deployments
2. Use Railway dashboard to rollback
3. Or redeploy last known good commit:
   ```bash
   git checkout <last-good-commit>
   railway up
   ```

## Success Metrics

Your deployment is successful when:
- ✅ Health check returns 200 OK
- ✅ Admin can login and see dashboard
- ✅ WebSocket connections establish
- ✅ Messages flow both directions
- ✅ Files upload and persist
- ✅ No errors in Railway logs

## Next Steps

After successful deployment:
1. Monitor logs for first 24 hours
2. Set up automated backups
3. Configure custom domain (optional)
4. Set up CI/CD pipeline (optional)
5. Document any custom configurations

---

**Last Updated:** October 2024
**Version:** Production-ready with Railway
