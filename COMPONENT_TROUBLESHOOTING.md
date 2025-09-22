# 🔧 Component Troubleshooting Guide

## Common Issues by Component

### 🔍 Scraper Issues

#### Problem: "Scraper finds 0 businesses"
```bash
# Check 1: API credentials
cat .env | grep GOOGLE_MAPS_API_KEY
# If missing, scrapers use Selenium fallback (slower)

# Check 2: Search query
python3 -c "
from scrapers.google_maps_scraper import GoogleMapsScraper
s = GoogleMapsScraper()
print(s._build_search_query('plumber', 'Portland ME'))
"
# Should show: "plumber near Portland ME"

# Fix: Run with debug mode
python3 scrapers/google_maps_scraper.py --debug
```

#### Problem: "Website detection wrong"
```python
# Test website verification directly
python3 scrapers/verify_site.py "Bob's Plumbing" "bobsplumbing.com"

# Common issues:
# - Site redirects to Facebook (marked as SOCIAL_ONLY) ✓
# - Site is parked domain (marked as NO_SITE) ✓
# - Site has SSL errors (marked as BROKEN) ✓
```

---

### 📊 Database Issues

#### Problem: "Can't find leads in UI"
```bash
# Check 1: Database exists
ls pleasantcovedesign/server/pleasant_cove.db

# Check 2: Query database directly
sqlite3 pleasantcovedesign/server/pleasant_cove.db
sqlite> SELECT COUNT(*) FROM companies;
sqlite> SELECT name, websiteStatus FROM companies LIMIT 5;

# Check 3: API endpoint
curl http://localhost:3001/api/companies | jq
```

#### Problem: "Database locked"
```bash
# Find processes using database
lsof | grep pleasant_cove.db

# Kill stuck processes
kill -9 [PID]

# Or restart everything
npm run restart-all
```

---

### 🎨 UI Display Issues

#### Problem: "Stats show 0 or -"
```javascript
// Browser console debugging
// Check 1: API responding
fetch('/api/companies').then(r => r.json()).then(console.log)

// Check 2: Network tab
// Look for 404s or 500s

// Check 3: Component state
// React DevTools → LeadsUnified → State → stats
```

#### Problem: "Priority badges not showing"
```javascript
// In LeadsTable.tsx, add debug:
console.log('Lead data:', lead);
console.log('Priority calc:', calculatePriority(lead));

// Common issues:
// - Missing rating field
// - website vs websiteUrl field mismatch
// - Wrong data types (string vs number)
```

---

### 📧 Outreach Issues

#### Problem: "Campaign won't send"
```bash
# Check 1: API endpoint
curl -X POST http://localhost:3001/api/bot/launch-outreach \
  -H "Content-Type: application/json" \
  -d '{"businessIds":[1],"campaignType":"sms","template":"demo"}'

# Check 2: Python service running
ps aux | grep outreach_manager

# Check 3: Credentials
cat .env | grep TWILIO
cat .env | grep SENDGRID
```

#### Problem: "Demo links broken"
```python
# Test demo generation
from smart_demo_generator import SmartDemoGenerator
gen = SmartDemoGenerator()
demo = gen.generate_demo({
    'name': 'Test Business',
    'city': 'Portland'
})
print('Demo generated:', len(demo), 'bytes')

# Check demo hosting
ls demos/
# Should see generated HTML files
```

---

### 💰 Payment Issues

#### Problem: "Stripe webhooks not working"
```bash
# Check 1: Webhook endpoint
curl -X POST http://localhost:3001/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
# Should get signature error (that's good)

# Check 2: Stripe CLI for testing
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Check 3: Webhook secret
cat .env | grep STRIPE_WEBHOOK_SECRET
```

#### Problem: "Orders not updating after payment"
```sql
-- Check order status
sqlite3 pleasant_cove.db
SELECT id, companyId, paymentStatus, stripePaymentIntentId 
FROM orders 
WHERE paymentStatus != 'paid';

-- Manual fix if needed
UPDATE orders 
SET paymentStatus = 'paid' 
WHERE stripePaymentIntentId = 'pi_xxx';
```

---

### 🚀 Project/Portal Issues

#### Problem: "Client can't access workspace"
```bash
# Check 1: Workspace token exists
sqlite3 pleasant_cove.db
SELECT id, companyId, workspaceToken 
FROM projects 
WHERE companyId = [ID];

# Check 2: Portal endpoint
curl http://localhost:3001/api/workspace/[TOKEN]

# Check 3: Squarespace embed
# View page source, look for:
# <script src="workspace-module/embed.js">
```

---

## 🔍 Debugging Tools

### Enable Debug Logging
```javascript
// In server/routes.ts
console.log('🔍 DEBUG:', request.body);
console.log('📊 RESULT:', result);

// In Python scripts
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Monitor Real-Time Logs
```bash
# Terminal 1: Server logs
cd pleasantcovedesign/server
npm run dev

# Terminal 2: Scraper logs
tail -f scraper.log

# Terminal 3: Database queries
sqlite3 pleasant_cove.db .mode line
.headers on
SELECT * FROM companies ORDER BY createdAt DESC LIMIT 5;
```

### Test Individual Components
```bash
# Test scraper
python3 test_scraper_accuracy.py

# Test API
python3 test_ui_connections.py

# Test demo
python3 test_smart_demo.py
```

---

## 🚨 Emergency Fixes

### Reset Everything
```bash
# BACKUP FIRST!
cp pleasant_cove.db pleasant_cove.backup.db

# Kill all processes
pkill -f node
pkill -f python

# Restart services
cd pleasantcovedesign/server && npm run dev
cd pleasantcovedesign/admin-ui && npm start
```

### Clear Bad Data
```sql
-- Remove test scraped data
DELETE FROM companies WHERE source = 'scraped' AND name LIKE '%test%';

-- Reset failed outreach
UPDATE companies 
SET lastContactDate = NULL, outreachStatus = NULL 
WHERE outreachStatus = 'failed';

-- Clear stuck orders
DELETE FROM orders WHERE status = 'draft' AND createdAt < date('now', '-7 days');
```

### Rebuild Indexes
```sql
-- If queries are slow
VACUUM;
ANALYZE;
REINDEX;
```

---

## 📞 Component Health Checks

### Quick Health Check Script
```bash
#!/bin/bash
echo "🔍 Checking components..."

# Server
curl -s http://localhost:3001/health || echo "❌ Server down"

# Database
test -f pleasant_cove.db && echo "✅ Database exists" || echo "❌ No database"

# Scrapers
python3 -c "import scrapers.google_maps_scraper" && echo "✅ Scrapers OK" || echo "❌ Scraper import failed"

# UI
curl -s http://localhost:3000 || echo "❌ UI not running"

echo "✅ Health check complete"
```

Keep this guide handy for when things don't work as expected!
