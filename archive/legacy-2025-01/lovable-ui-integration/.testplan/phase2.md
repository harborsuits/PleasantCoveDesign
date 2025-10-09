# Phase 2 Test Plan - Pleasant Cove Design Dashboard

## Overview
Phase 2 expands the dashboard with comprehensive data visualization, CRUD operations, real-time notifications, and file management while maintaining all existing Squarespace integrations.

## Module Acceptance Criteria

### 📊 Dashboard KPIs & Charts
- **Done**: `/api/stats/kpis` returns data and populates metric cards
- **Done**: Revenue chart (`/api/stats/revenueByMonth`) renders with Recharts
- **Done**: Lead generation chart (`/api/stats/leadsBySource`) displays correctly
- **Done**: All charts show loading skeletons
- **Done**: Charts update when data changes
- **Done**: Mobile responsive chart layouts

### 🏢 Companies CRUD
- **Done**: `/api/companies` loads in table with pagination
- **Done**: Create company modal with validation (react-hook-form + zod)
- **Done**: Edit company form pre-populates data
- **Done**: Delete company with confirmation dialog
- **Done**: Search/filter companies by name, industry, tags
- **Done**: Company detail view shows related projects

### 📅 Appointments & Calendar
- **Done**: `/api/appointments` loads in calendar view
- **Done**: Day/week/month calendar views work
- **Done**: Click appointment shows detail modal
- **Done**: Create appointment form with date/time picker
- **Done**: Acuity webhook appointments appear in calendar
- **Done**: Appointment status updates reflect in UI

### 🔔 Activities & Notifications
- **Done**: Socket `activity:new` events trigger toast notifications
- **Done**: Activity feed in sidebar shows recent items
- **Done**: Activity timeline in project detail pages
- **Done**: Toast notifications dismissible and styled
- **Done**: Activity types (lead, demo, project, payment) display correctly

### 📁 File Management
- **Done**: `/api/upload` accepts files and returns signed URLs
- **Done**: File upload progress bar during upload
- **Done**: Files display in project detail with preview/download
- **Done**: File attachments in messages work
- **Done**: R2 storage URLs resolve correctly
- **Done**: File deletion removes from both UI and backend

## End-to-End Integration Tests

### Squarespace Widget Compatibility
- **Done**: Public project access works from allowed origins
- **Done**: File uploads from widgets save to correct project
- **Done**: Message sending from widgets appears in admin dashboard
- **Done**: Webhook triggers (lead form, appointment) create records
- **Done**: Token isolation prevents cross-project access

### Performance & UX
- **Done**: Dashboard loads under 2 seconds with cached data
- **Done**: Message threads support 1000+ messages with virtualization
- **Done**: File uploads show progress and don't block UI
- **Done**: Calendar handles 100+ appointments without lag
- **Done**: Search/filter operations complete under 500ms

### Error Handling & Resilience
- **Done**: Network failures show user-friendly error messages
- **Done**: WebSocket disconnection/reconnection is seamless
- **Done**: Form validation prevents invalid data submission
- **Done**: File upload failures provide clear feedback
- **Done**: Offline queue for message sending works

## Regression Tests (Phase 1 Features)

### ✅ Core Functionality
- **Done**: Admin authentication persists across reloads
- **Done**: Project navigation and detail views work
- **Done**: Message sending/receiving with real-time updates
- **Done**: Public endpoints accessible from Squarespace origins
- **Done**: All existing API contracts still function

### ✅ WebSocket & Real-time
- **Done**: Message delivery instant across admin + public views
- **Done**: Connection recovery after network interruptions
- **Done**: Proper cleanup on component unmount

### ✅ Data Integrity
- **Done**: No undefined values in API responses
- **Done**: Proper error handling for invalid requests
- **Done**: Token validation prevents unauthorized access

## Deployment Readiness

### ✅ Production Build
- **Done**: `npm run build` completes without errors
- **Done**: Bundle size under 1MB after gzip
- **Done**: Source maps generated for debugging
- **Done**: Environment variables properly configured

### ✅ API Compatibility
- **Done**: All endpoints work with production backend
- **Done**: CORS properly configured for production domains
- **Done**: WebSocket connections work in production
- **Done**: File uploads work with production R2 storage

## Sign-off Checklist

- [ ] All Phase 2 modules marked "Done"
- [ ] All integration tests passing
- [ ] All regression tests passing
- [ ] Performance benchmarks met
- [ ] Production build successful
- [ ] Code review completed
- [ ] QA testing completed

## Notes for Future Phases

- Phase 3: Advanced analytics, reporting, user management
- Phase 4: Mobile app, push notifications, advanced integrations
- Consider implementing feature flags for gradual rollout
- Monitor bundle size growth with new features
