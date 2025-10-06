# Pleasant Cove Design Launcher

A comprehensive launcher application for managing your complete CRM + Squarespace integration system.

## 🚀 What It Does

This launcher provides a unified interface to manage all components of your Pleasant Cove Design system:

- **Backend Server** (Port 3000) - Express.js API with webhook integration
- **Frontend UI** (Port 5173) - Modern React dashboard with shadcn/ui
- **Webhook Testing** - Automated testing for Acuity and Squarespace integrations
- **Service Management** - Start, stop, and monitor all services
- **Health Monitoring** - Real-time status checks and diagnostics

## 🎯 Features

### System Management
- ✅ Start full system (backend + UI)
- ✅ Start individual services
- ✅ Stop all services gracefully
- ✅ Real-time service status monitoring

### Webhook Integration
- ✅ Test Acuity appointment webhooks
- ✅ Test Squarespace lead form webhooks
- ✅ Validate webhook responses
- ✅ Monitor webhook health

### Development Tools
- ✅ Open admin dashboard in browser
- ✅ Open CRM interface in browser
- ✅ View recent logs
- ✅ System health checks

### Production Ready
- ✅ Handles environment variables
- ✅ Graceful service management
- ✅ Cross-platform compatibility
- ✅ Error handling and recovery

## 🖥️ How to Use

### Quick Start
1. **Double-click** `Pleasant Cove Launcher.command` (macOS)
2. Choose option **1** to start the full system
3. The launcher will automatically open your browsers

### Manual Start
```bash
# From the Pleasant Cove Design directory
node launcher.js
```

## 📋 Menu Options

```
🎯 Available Actions:
  1. Start Full System (Backend + UI)     - Launches everything
  2. Start Backend Only                   - Just the API server
  3. Start UI Only                       - Just the React dashboard
  4. Stop All Services                   - Graceful shutdown
  5. Test Webhooks                       - Run integration tests
  6. Open Admin Dashboard                - Browser to UI
  7. Open CRM Interface                  - Browser to API
  8. View Logs                           - Recent system logs
  9. System Health Check                 - Diagnostic report
  0. Exit                                - Close launcher
```

## 🔧 System Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Squarespace   │───▶│   Webhooks      │
│   (Client)      │    │   (Acuity &     │
└─────────────────┘    │   Squarespace)  │
                       └─────────────────┘
                               │
                               ▼
┌─────────────────┐    ┌─────────────────┐
│   Backend API   │◀──▶│   CRM Database  │
│   (Port 3000)   │    │   (SQLite)      │
└─────────────────┘    └─────────────────┘
                               │
                               ▼
┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │◀──▶│   Admin         │
│   (Port 5173)   │    │   Dashboard     │
└─────────────────┘    └─────────────────┘
```

## 🧪 Webhook Testing

The launcher includes automated tests for your webhook integrations:

### Acuity Appointments
- Tests appointment creation
- Validates webhook payload structure
- Confirms database storage

### Squarespace Leads
- Tests lead form submissions
- Validates field mapping
- Confirms company/project creation

## 📊 Health Monitoring

### Backend Health Check
- API endpoint responsiveness
- Database connectivity
- Webhook endpoint availability

### UI Health Check
- React app loading
- API connectivity
- WebSocket connections

## 🚨 Troubleshooting

### Services Won't Start
1. Check if ports 3000 and 5173 are available
2. Ensure Node.js and npm are installed
3. Check system logs for error details

### Webhook Tests Fail
1. Ensure backend is running (option 2)
2. Check webhook endpoints are accessible
3. Review error messages for specific issues

### Browser Won't Open
1. Manual navigation: http://localhost:5173 (UI) or http://localhost:3000 (API)
2. Check firewall settings
3. Try different browser

## 🔐 Security Features

- **Webhook Verification**: HMAC signature validation
- **IP Allowlisting**: Configurable trusted IP ranges
- **Rate Limiting**: Built-in request throttling
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error reporting

## 📝 Environment Variables

The launcher respects these environment variables:

```env
# Webhook Security (optional)
ACUITY_WEBHOOK_SECRET=your_secret
ACUITY_TRUSTED_IPS=54.197.5.71,34.205.2.18
SQUARESPACE_WEBHOOK_SECRET=your_secret
SQUARESPACE_TRUSTED_IPS=

# Service Configuration
NODE_ENV=development|production
PORT=3000
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

- ✅ **Green checkmarks** in system status
- ✅ **Webhook tests passing** with 200 responses
- ✅ **Browsers opening automatically** to correct URLs
- ✅ **Real-time updates** in the admin dashboard
- ✅ **Webhook data** appearing in CRM instantly

## 🚀 Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure Railway environment variables
3. Set up webhook URLs in Acuity/Squarespace
4. Enable HTTPS certificates
5. Configure monitoring and alerts

## 📞 Support

If you encounter issues:

1. Run **System Health Check** (option 9)
2. Check **Logs** (option 8) for error details
3. Ensure all dependencies are installed
4. Verify environment variables are set

---

**🎊 Your Pleasant Cove Design system is now fully manageable through this unified launcher!**
