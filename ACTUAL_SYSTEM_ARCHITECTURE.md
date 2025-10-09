# Pleasant Cove Design - Actual System Architecture

## The Real Flow (as it should work)

### 1. Customer Journey (via Squarespace)
```
Customer → Signs up on Squarespace → Becomes a member
         ↓
    Logs into member area
         ↓
    Sees 3 widgets:
    • Messaging (chat with you)
    • Appointment booking
    • Project progress (not finished)
         ↓
    Each widget calls /api/token with type:'member'
         ↓
    Gets project token for their conversation
```

### 2. Admin Journey (via Lovable UI)
```
You (admin) → Open Lovable UI dashboard
           ↓
      Auto-authenticates with admin token
           ↓
      Gets JWT valid for 365 days
           ↓
      Can see ALL:
      • Companies (all customers)
      • Projects (all customer projects)
      • Messages (all conversations)
      • Appointments
```

## What's Currently Working

✅ **Backend API** - All endpoints work
✅ **Squarespace Widgets** - Customer-facing widgets authenticate members
✅ **Admin JWT** - Now returns 365-day tokens
✅ **Admin Endpoints** - Return all data when authenticated

## What Needs Connection

The Lovable UI just needs to:
1. Get the admin JWT on startup ✅ (already implemented)
2. Use it for all API calls ✅ (already implemented)
3. Connect to the correct backend URL 🔧

## Current Status

- Backend running on: http://localhost:3000
- Lovable UI running on: http://localhost:5173
- Admin JWT working and returns all company data

## The Simple Fix

The Lovable UI is already coded correctly. It just needs to:
1. Point to the right backend (localhost:3000 in dev, Railway in production)
2. Use the JWT token it gets on startup

That's it. Everything else is already built and working.

