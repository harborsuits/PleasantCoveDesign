# 👁️ Monitoring Components in Real-Time

## Live Dashboard View

### Terminal Setup (4 Windows)
```
┌─────────────────────────┬─────────────────────────┐
│ Terminal 1: Server      │ Terminal 2: UI          │
│ cd server               │ cd admin-ui             │
│ npm run dev             │ npm start               │
├─────────────────────────┼─────────────────────────┤
│ Terminal 3: Database    │ Terminal 4: Scrapers    │
│ watch -n 2 'sqlite3     │ tail -f scraper.log     │
│ pleasant_cove.db        │                         │
│ "SELECT COUNT(*) FROM   │                         │
│ companies"'             │                         │
└─────────────────────────┴─────────────────────────┘
```

---

## 📊 Key Metrics to Watch

### 1. Lead Flow Metrics
```sql
-- Run this query to see real-time lead stats
SELECT 
  COUNT(*) as total_leads,
  SUM(CASE WHEN websiteStatus = 'NO_SITE' THEN 1 ELSE 0 END) as no_website,
  SUM(CASE WHEN createdAt > datetime('now', '-1 day') THEN 1 ELSE 0 END) as last_24h,
  SUM(CASE WHEN priority_score >= 80 THEN 1 ELSE 0 END) as hot_leads
FROM companies;
```

### 2. Engagement Metrics
```sql
-- Track outreach effectiveness
SELECT 
  COUNT(DISTINCT companyId) as contacted,
  SUM(CASE WHEN type = 'demo_view' THEN 1 ELSE 0 END) as demos_viewed,
  SUM(CASE WHEN type = 'cta_click' THEN 1 ELSE 0 END) as cta_clicks
FROM activities
WHERE timestamp > datetime('now', '-7 days');
```

### 3. Revenue Metrics
```sql
-- Monitor sales pipeline
SELECT 
  COUNT(*) as total_orders,
  SUM(CASE WHEN paymentStatus = 'paid' THEN total ELSE 0 END) as revenue,
  AVG(CASE WHEN paymentStatus = 'paid' THEN total ELSE NULL END) as avg_deal
FROM orders
WHERE createdAt > datetime('now', '-30 days');
```

---

## 🔴 Real-Time Monitoring Commands

### Watch Scraper Progress
```bash
# See businesses being found live
tail -f scraper.log | grep "Found business"

# Count in real-time
watch -n 1 'grep -c "NO_SITE" scraper.log'
```

### Monitor API Traffic
```bash
# Watch all API calls
tail -f server.log | grep "API"

# See specific endpoints
tail -f server.log | grep "/api/companies"
```

### Track Outreach
```bash
# Watch messages being sent
tail -f outreach.log | grep "SMS sent"

# Monitor demo generation
ls -la demos/ | tail -10
```

---

## 📈 Performance Monitoring

### Component Response Times
```javascript
// Add to your API calls
console.time('API_CALL');
const result = await api.get('/companies');
console.timeEnd('API_CALL');
// Should be <200ms
```

### Database Performance
```sql
-- Check slow queries
.timer on
SELECT * FROM companies WHERE priority_score > 80;
-- Should be <50ms

-- Index performance
EXPLAIN QUERY PLAN
SELECT * FROM companies WHERE websiteStatus = 'NO_SITE';
```

### Memory Usage
```bash
# Monitor Node.js memory
ps aux | grep node | awk '{print $2, $3, $4, $11}'

# Monitor Python processes
ps aux | grep python | awk '{print $2, $3, $4, $11}'
```

---

## 🚨 Alert Conditions

### Set Up Alerts For:

#### 1. Scraper Stopped
```bash
# Check if scraper hasn't found anything in 10 minutes
if [ $(find scraper.log -mmin -10 | wc -l) -eq 0 ]; then
  echo "⚠️ ALERT: Scraper may be stuck!"
fi
```

#### 2. API Errors
```bash
# Monitor 500 errors
tail -f server.log | grep "500" | while read line; do
  echo "🚨 SERVER ERROR: $line"
  # Could send notification here
done
```

#### 3. Database Growth
```bash
# Alert if database gets too large
DB_SIZE=$(du -h pleasant_cove.db | cut -f1)
echo "Database size: $DB_SIZE"
```

---

## 📱 Browser DevTools Monitoring

### Network Tab
```
Watch for:
- Red requests (failures)
- Slow requests (>1s)
- 404s or 500s
- CORS errors
```

### Console Monitoring
```javascript
// Add performance marks
performance.mark('leads-fetch-start');
// ... fetch leads ...
performance.mark('leads-fetch-end');
performance.measure('leads-fetch', 'leads-fetch-start', 'leads-fetch-end');
```

### React DevTools
```
Monitor:
- Component render counts
- State changes
- Props updates
- Performance bottlenecks
```

---

## 📊 Dashboard Queries

### Business Intelligence Dashboard
```sql
-- Run these together for full picture

-- Pipeline Status
SELECT 
  'Scraped' as stage, COUNT(*) as count 
FROM companies 
WHERE stage = 'scraped'
UNION
SELECT 
  'Contacted' as stage, COUNT(*) as count 
FROM companies 
WHERE lastContactDate IS NOT NULL
UNION
SELECT 
  'Responded' as stage, COUNT(*) as count 
FROM companies 
WHERE id IN (SELECT DISTINCT companyId FROM conversations)
UNION
SELECT 
  'Customer' as stage, COUNT(*) as count 
FROM companies 
WHERE id IN (SELECT companyId FROM orders WHERE paymentStatus = 'paid');

-- Daily Activity
SELECT 
  DATE(timestamp) as day,
  COUNT(*) as actions
FROM activities
WHERE timestamp > datetime('now', '-7 days')
GROUP BY DATE(timestamp)
ORDER BY day DESC;
```

---

## 🔄 Automated Monitoring Script

### Create `monitor.sh`
```bash
#!/bin/bash

while true; do
  clear
  echo "🔍 Pleasant Cove Monitor - $(date)"
  echo "================================"
  
  # Check services
  echo -n "Server: "
  curl -s http://localhost:3001/health && echo "✅" || echo "❌"
  
  echo -n "UI: "
  curl -s http://localhost:3000 && echo "✅" || echo "❌"
  
  # Database stats
  echo -e "\n📊 Database Stats:"
  sqlite3 pleasant_cove.db "
    SELECT 
      'Total Leads: ' || COUNT(*) 
    FROM companies;
  "
  
  # Recent activity
  echo -e "\n📈 Last Hour Activity:"
  sqlite3 pleasant_cove.db "
    SELECT 
      type, COUNT(*) as count 
    FROM activities 
    WHERE timestamp > datetime('now', '-1 hour')
    GROUP BY type;
  "
  
  sleep 5
done
```

### Run it:
```bash
chmod +x monitor.sh
./monitor.sh
```

---

## 🎯 What Success Looks Like

### Healthy System Indicators:
- ✅ New leads appearing every scrape run
- ✅ 10-15% demo view rate on outreach
- ✅ <2 second page loads
- ✅ No error logs in last hour
- ✅ Database queries <100ms
- ✅ Memory usage stable

### Warning Signs:
- ⚠️ No new leads in 24 hours
- ⚠️ API response times >1 second
- ⚠️ Demo views dropping below 5%
- ⚠️ Database over 1GB
- ⚠️ Memory usage climbing

This is how you keep your finger on the pulse of your system!
