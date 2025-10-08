# 🚀 Pleasant Cove Design - Squarespace Integration Guide

## Quick Start

### 1. **Environment Setup**
First, create your `.env` file by copying this content:

```bash
# Create .env file in the root directory
NODE_ENV=development
PORT=3000
API_BASE_URL=https://pcd-production-clean-production-e6f3.up.railway.app
CORS_ORIGINS="http://localhost:5173 http://localhost:3000 http://localhost:8080 https://pcd-production-clean-production-e6f3.up.railway.app https://*.squarespace.com"
JWT_SECRET=pleasant-cove-dev-jwt-secret-2025
SESSION_SECRET=pleasant-cove-dev-session-secret-2025
DATABASE_URL=./pleasantcove.db
LOCAL_UPLOAD_PATH=./uploads
ENABLE_WEBSOCKETS=true
WS_PORT=8080
```

### 2. **Start All Services**

Run this command to start everything:
```bash
cd /Users/bendickinson/Desktop/pleasantcovedesign
npm run dev
```

Or use the launcher:
```bash
./pleasantcove-launcher.sh start
```

Your services will be available at:
- **Admin Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Widget Server**: http://localhost:8080

### 3. **Squarespace Widget Installation**

## 📋 Widget Components

### 1. **Messaging Widget** (`widgets/messaging-widget-unified.html`)
Provides real-time chat functionality for project communication.

**To install in Squarespace:**
1. Go to your Squarespace page
2. Add a **Code Block**
3. Copy the entire contents of `widgets/messaging-widget-unified.html`
4. Paste into the code block
5. Save the page

**Features:**
- Auto-detects Squarespace members
- Real-time WebSocket messaging
- File upload support
- Conversation history
- Mobile responsive

### 2. **Project Workspace Module** (`widgets/squarespace-module.html`)
Complete project management interface for clients.

**To install in Squarespace:**
1. Create a new page or use existing member area page
2. Add a **Code Block**
3. Copy the entire contents of `widgets/squarespace-module.html`
4. Paste into the code block
5. Save the page

**Features:**
- Project progress tracking
- Milestone visualization
- Design canvas viewer
- Message history
- Real-time updates

### 3. **Appointment Booking Widget** (`widgets/appointment-booking.html`)
Allows clients to book consultations directly from your site.

**To install in Squarespace:**
1. Go to your contact or services page
2. Add a **Code Block**
3. Copy the entire contents of `widgets/appointment-booking.html`
4. Paste into the code block
5. Save the page

**Features:**
- Service selection
- Available time slots
- Timezone support
- Email confirmations
- Member pre-fill

## 🔧 Configuration

### Production URLs
All widgets are pre-configured with the correct production URL:
```
https://pcd-production-clean-production-e6f3.up.railway.app
```

### Debug Mode
To force widgets to use localhost for testing:
1. Open browser console
2. Run: `localStorage.setItem('pcd_debug_mode', 'true')`
3. Refresh the page

To disable debug mode:
```javascript
localStorage.removeItem('pcd_debug_mode')
```

## 🔐 Squarespace Member Integration

The widgets automatically detect Squarespace members using:
1. `Static.SQUARESPACE_CONTEXT` object
2. `SiteUserInfo` cookie
3. Member area context

### Member Isolation
Each Squarespace member sees only their own:
- Project information
- Conversation history
- Appointments
- Design feedback

## 📊 Testing Your Integration

### 1. **Test Messaging Widget**
- Open the chat bubble
- Send a test message
- Check if it appears in admin dashboard at `/inbox`

### 2. **Test Project Workspace**
- Access with `?token=YOUR_PROJECT_TOKEN`
- Or authenticate with email
- Verify project data loads
- Test real-time updates

### 3. **Test Appointment Booking**
- Select a service
- Choose date and time
- Submit booking
- Check admin dashboard at `/schedule`

## 🛠️ Troubleshooting

### "Widget not connecting"
1. Check if services are running: `./pleasantcove-launcher.sh status`
2. Verify CORS settings in .env file
3. Check browser console for errors
4. Ensure production URL is accessible

### "Member not detected"
1. Ensure user is logged into Squarespace
2. Check if on member-only page
3. Try manual authentication with email

### "Messages not sending"
1. Check WebSocket connection in browser console
2. Verify project token is valid
3. Check network tab for API errors

### "Appointments not showing times"
1. Ensure date is selected
2. Check timezone setting
3. Verify backend is running

## 🚀 Advanced Features

### Custom Styling
Add custom CSS to match your brand:
```css
<style>
/* Override widget colors */
.pcd-chat-button {
    background: #your-brand-color !important;
}
.pcd-booking-header {
    background: linear-gradient(135deg, #color1 0%, #color2 100%) !important;
}
</style>
```

### Event Tracking
Add analytics tracking:
```javascript
<script>
// Track widget opens
document.addEventListener('pcd:chat:opened', () => {
    gtag('event', 'chat_opened', { event_category: 'engagement' });
});
</script>
```

### Custom Project Tokens
Pass project tokens via URL:
```
https://yoursite.com/project-workspace?token=specific-project-token
```

## 📱 Mobile Optimization

All widgets are mobile-responsive:
- Chat widget becomes full-screen on mobile
- Booking form adjusts to single column
- Project workspace uses mobile-friendly tabs

## 🔄 Real-time Updates

The system uses WebSockets for real-time features:
- Message delivery
- Project progress updates
- Milestone changes
- Design feedback

## 📧 Email Notifications

Configure email settings in your .env file:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Pleasant Cove Design <hello@pleasantcovedesign.com>"
```

## 🎉 Success Checklist

- [ ] Environment variables configured
- [ ] All services running
- [ ] Widgets installed in Squarespace
- [ ] Member detection working
- [ ] Messages sending/receiving
- [ ] Appointments booking successfully
- [ ] Project data loading
- [ ] Real-time updates working

## Need Help?

1. Check the logs: `tail -f pleasant-cove.log`
2. View browser console for client-side errors
3. Test API endpoints directly: `curl http://localhost:3000/health`
4. Review the troubleshooting section above

Your Pleasant Cove Design system is now fully integrated with Squarespace! 🚀
