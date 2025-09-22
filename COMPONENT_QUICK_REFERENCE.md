# ⚡ Component Quick Reference

## 🚀 Starting Each Component

### 1. Main Server (Required)
```bash
cd pleasantcovedesign/server
npm run dev
# Runs on http://localhost:3001
# Handles: API, database, webhooks
```

### 2. Admin UI
```bash
cd pleasantcovedesign/admin-ui  
npm start
# Opens http://localhost:3000
# Your main control panel
```

### 3. Python Services
```bash
# Scrapers (standalone)
python3 scrapers/google_maps_scraper.py

# Demo Generator (API service)
python3 smart_demo_generator.py

# Outreach Manager
python3 outreach_manager.py

# Minerva Assistant
python3 minerva_full_control.py
```

---

## 📁 Component Locations

### Frontend Components
```
pleasantcovedesign/admin-ui/src/
├── pages/
│   ├── Dashboard.tsx         → Main overview
│   ├── LeadsUnified.tsx      → Lead management 
│   ├── Outreach.tsx          → Campaign manager
│   ├── Orders.tsx            → Sales tracking
│   └── ProjectWorkspace.tsx  → Client portal
│
├── components/
│   ├── LeadsTable.tsx        → Lead display + priority
│   ├── ScrapeProgressPanel.tsx → Real-time scraping
│   └── AnalyticsDashboard.tsx → Metrics display
```

### Backend Components
```
pleasantcovedesign/server/
├── routes.ts                 → All API endpoints
├── db.ts                     → Database queries
├── scraper-service.ts        → Scraping coordinator
├── stripe-config.ts          → Payment handling
└── outreach.ts              → Messaging service
```

### Python Components
```
/scrapers/
├── google_maps_scraper.py    → Find businesses
├── verify_site.py            → Check websites
└── real_business_scraper_clean.py → Production scraper

/root/
├── smart_demo_generator.py   → Personalized demos
├── outreach_manager.py       → Campaign automation
├── demo_tracking_integration.py → Engagement tracking
└── minerva_*.py             → AI assistant modules
```

---

## 🛠️ Key Functions by Component

### Scraper
```python
# Main scraping function
scraper = GoogleMapsScraper()
results = scraper.scrape_google_maps(
    search_query="plumber",
    location="Portland, ME",
    max_results=50
)
```

### Lead Scoring
```javascript
// In LeadsTable.tsx
const calculatePriority = (lead) => {
  let score = 50;
  if (!lead.website) score += 50;
  if (lead.rating >= 4.5) score += 30;
  // ... etc
  return { score, label, color };
}
```

### Demo Generation
```python
# In smart_demo_generator.py
generator = SmartDemoGenerator()
demo_html = generator.generate_demo({
    'name': 'Bob\'s Plumbing',
    'city': 'Portland',
    'rating': 4.5,
    'reviews': 47
})
```

### Outreach
```python
# In outreach_manager.py
manager = OutreachManager()
manager.send_sms(
    to_number='+1234567890',
    message='Hi Bob, check out your demo...',
    business_id=123
)
```

---

## 🔌 API Endpoints by Component

### Lead Management
```bash
GET  /api/companies           # List all leads
POST /api/scrape-runs         # Start scraping
GET  /api/scrape-runs/:id     # Check progress
GET  /api/leads              # Scraper results
```

### Outreach Campaigns  
```bash
POST /api/bot/launch-outreach # Bulk campaign
POST /api/bot/outreach/:id    # Single message
GET  /api/outreach/campaigns  # List campaigns
```

### Orders & Projects
```bash
POST /api/orders             # Create order
GET  /api/orders/:id         # Order details
POST /api/projects           # Create project
GET  /api/projects/:id       # Project details
```

---

## 💾 Database Tables by Component

### Scraper → companies table
```sql
INSERT INTO companies (
  name, phone, email, website,
  rating, reviews, city, 
  websiteStatus, priority_score
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### Orders → orders table
```sql
INSERT INTO orders (
  companyId, status, package,
  subtotal, tax, total,
  invoiceId, stripePaymentIntentId
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

### Projects → projects table
```sql
INSERT INTO projects (
  companyId, orderId, name,
  status, startDate, deadline
) VALUES (?, ?, ?, ?, ?, ?)
```

---

## 🔍 Testing Each Component

### Test Scraper
```bash
# Run scraper directly
python3 scrapers/google_maps_scraper.py

# Via API
curl -X POST http://localhost:3001/api/scrape-runs \
  -H "Content-Type: application/json" \
  -d '{"city":"Portland","category":"plumber","limit":10}'
```

### Test Lead Display
```bash
# Get all companies
curl http://localhost:3001/api/companies

# Should see priority scores
```

### Test Outreach
```bash
# Send test message
curl -X POST http://localhost:3001/api/bot/outreach/123
```

### Test Demo
```bash
# Generate demo
python3 test_smart_demo.py

# View in browser
open demo_example.html
```

---

## 🚦 Component Status Checks

### Is Server Running?
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### Is Database Connected?
```bash
# Check for database file
ls pleasantcovedesign/server/pleasant_cove.db
```

### Are Scrapers Working?
```bash
# Check scraper logs
tail -f scraper.log
```

### Is UI Connected?
```javascript
// Browser console
fetch('/api/companies').then(r => r.json()).then(console.log)
```

---

## 🔧 Common Component Commands

### Reset Database
```bash
# Backup first!
cp pleasant_cove.db pleasant_cove.db.backup

# Reset (careful!)
rm pleasant_cove.db
npm run setup-db
```

### Clear Scraper Cache
```bash
# If scraper gets stuck
rm -rf scrapers/__pycache__
rm scrapers/chromedriver_cache/*
```

### Rebuild UI
```bash
cd admin-ui
rm -rf node_modules
npm install
npm start
```

### Check Logs
```bash
# Server logs
tail -f server.log

# Scraper logs  
tail -f scraper.log

# Minerva logs
tail -f minerva.log
```

This is your component command center - everything you need to operate the system!
