# Unified Production Configuration

## Current State (BROKEN)
- **SQUARESPACE_MODULE_FINAL.html**: `api.pleasantcovedesign.com` ❌ (not active)
- **SQUARESPACE_MODULE_PRODUCTION.html**: `pleasantcovedesign-production.up.railway.app` ❓
- **appointment-booking.html**: `pcd-production-clean-production-e6f3.up.railway.app` ✅
- **project-workspace-module.html**: `pcd-production-clean-production-e6f3.up.railway.app` ✅
- **messaging-widget-unified.html**: No production URL defined ❌

## Correct Production URL
Based on the Python scripts and working widgets:
```
https://pcd-production-clean-production-e6f3.up.railway.app
```

## WebSocket Event Name Mismatches

### Admin UI Emits:
- `design:update`
- `project:update` 
- `milestone:update`
- `payment:received`
- `new_feedback`

### SQUARESPACE_MODULE_FINAL Expects:
- `project_update` (missing colon!)
- `new_design`
- `milestone_update` (missing colon!)
- `payment_update`

### SQUARESPACE_MODULE_PRODUCTION Expects:
- `design:update` ✅
- `project:update` ✅
- `milestone:update` ✅ 
- `payment:received` ✅
- `new_feedback` ✅

## Action Items:
1. Update ALL UI components to use `pcd-production-clean-production-e6f3.up.railway.app`
2. Fix WebSocket event names in SQUARESPACE_MODULE_FINAL.html
3. Add missing production URL to messaging-widget-unified.html
4. Archive SQUARESPACE_MODULE_PRODUCTION after porting features
