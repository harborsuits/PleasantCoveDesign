# 🚀 UI Quick Reference Card

## Priority Score Formula:
```javascript
let score = 50;  // Base
if (!website) score += 50;  // Biggest factor!
if (rating >= 4.5) score += 30;
if (reviews >= 20) score += 15;
if (hasPhone) score += 20;
if (serviceType) score += 25;

// Badges:
score >= 80 = "🔥 Hot"
score >= 60 = "⭐ High"  
score >= 40 = "📈 Medium"
score < 40  = "📋 Low"
```

## Key API Endpoints:
```
GET  /api/companies         → Lead stats, table data
POST /api/scrape-runs       → Start scraping
GET  /api/scrape-runs/:id   → Check progress
POST /api/bot/outreach/:id  → Send to one lead
POST /api/bot/launch-outreach → Campaign to many
GET  /api/orders           → Revenue data
GET  /api/conversations    → Messages/activity
```

## Files to Update:
1. `LeadsUnified.tsx` - Stats cards (lines 61-109)
2. `LeadsTable.tsx` - Priority badges
3. `Dashboard.tsx` - Real metrics
4. `ScrapeProgressPanel.tsx` - Live updates
5. `Outreach.tsx` - Campaign launcher

## Test Your Changes:
```bash
# Run the test script:
python3 test_ui_connections.py

# Or test in browser console:
fetch('/api/companies').then(r => r.json()).then(console.log)
```

## Success = You See:
✅ Real numbers (not "-")
✅ Priority badges on leads
✅ Dashboard with charts
✅ Scraper progress bar
✅ Campaign send button

Keep this handy while implementing! 📌
