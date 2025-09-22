# 🔗 How Components Actually Work Together

## Real-World Component Interactions

### Scenario 1: Finding & Converting a Lead

```
USER ACTION: Click "Start Scraping" for plumbers in Portland
     ↓
COMPONENT: Scraper Service (google_maps_scraper.py)
├── Searches Google Maps API
├── Finds 50 plumbing businesses
├── For each business:
│   ├── Extracts: name, phone, rating, reviews
│   ├── Checks for website presence
│   └── Calls verify_site.py to confirm status
└── Saves to database with calculated priority score
     ↓
COMPONENT: Database (SQLite)
├── Table: companies
├── New records inserted with:
│   ├── websiteStatus: 'NO_SITE'
│   ├── priority_score: 95
│   └── createdAt: now()
└── Triggers UI update
     ↓
COMPONENT: Admin UI (LeadsUnified.tsx)
├── Polls /api/scrape-runs/:id every 2 seconds
├── Updates progress panel in real-time
├── Shows: "Found 8 businesses without websites!"
└── Refreshes lead table when complete
     ↓
USER SEES: Bob's Plumbing with 🔥 Hot badge
```

---

### Scenario 2: Launching an Outreach Campaign

```
USER ACTION: Create campaign "Summer Plumber Special"
     ↓
COMPONENT: Outreach UI (Outreach.tsx)
├── Fetches available leads via /api/companies
├── Filters: no website + not contacted recently
├── Shows: "23 leads available"
└── User clicks "Launch Campaign"
     ↓
COMPONENT: API Route (/api/bot/launch-outreach)
├── Receives: businessIds[], campaignType, template
├── For each lead:
│   ├── Calls smart_demo_generator.py
│   ├── Generates personalized demo
│   └── Queues for sending
└── Returns success response
     ↓
COMPONENT: Outreach Manager (outreach_manager.py)
├── Processes queue
├── For SMS campaigns:
│   ├── Formats message with demo link
│   ├── Sends via Twilio API
│   └── Logs delivery status
└── Updates lead.lastContactDate
     ↓
COMPONENT: Demo Tracking (demo_tracking_integration.py)
├── Monitors demo views
├── Records: time on site, pages viewed, CTA clicks
└── Updates lead engagement score
     ↓
USER SEES: Campaign active, 18/23 sent, 3 responses
```

---

### Scenario 3: Lead Views Demo & Converts

```
EXTERNAL ACTION: Bob clicks demo link in SMS
     ↓
COMPONENT: Demo Server (smart_demo_generator.py)
├── Serves personalized HTML
├── Includes:
│   ├── Bob's actual Google reviews
│   ├── Portland weather widget
│   ├── Local competitor analysis
│   └── Revenue projections
└── Tracks all interactions
     ↓
BOB'S ACTION: Clicks "Yes, I Want More Customers!"
     ↓
COMPONENT: Lead Capture (embedded in demo)
├── Shows contact form
├── Bob enters: "This looks great! How much?"
└── Submits to /api/conversations
     ↓
COMPONENT: Conversation Handler (routes.ts)
├── Creates new conversation
├── Links to Bob's company record
├── Sends notification to admin
└── Updates lead status: "responded"
     ↓
COMPONENT: Admin UI Notification
├── Dashboard shows: "🔥 Hot lead responded!"
├── Messages tab has badge (1)
└── Lead priority increases
     ↓
ADMIN ACTION: Responds to Bob, creates order
```

---

### Scenario 4: Order to Project Flow

```
ADMIN ACTION: Build order for Bob ($3,888 growth package)
     ↓
COMPONENT: Order Builder (Orders page)
├── Selects package + addons
├── Calculates total with tax
└── Creates order via POST /api/orders
     ↓
COMPONENT: Order API (routes.ts)
├── Creates order record
├── Generates Stripe payment link
├── Sends invoice email
└── Returns order details
     ↓
COMPONENT: Stripe Integration (stripe-config.ts)
├── Payment link created
├── Webhook listener active
└── Waits for payment
     ↓
EXTERNAL: Bob pays invoice
     ↓
COMPONENT: Stripe Webhook Handler
├── Receives payment confirmation
├── Updates order.paymentStatus = 'paid'
├── Triggers project creation
└── Sends confirmation email
     ↓
COMPONENT: Project Service
├── Creates project record
├── Generates unique workspace token
├── Sets initial milestones
└── Activates client portal
     ↓
COMPONENT: Client Widget (Squarespace module)
├── Bob logs in with email
├── Sees personalized workspace
├── Can: track progress, upload assets, message
└── All isolated to his project
```

---

## 🧩 Component Dependencies

### What Depends on What:

```
Database (SQLite)
    ↑ Used by everything
    
Scrapers
    ↓ Feeds into
Lead Service
    ↓ Used by
Admin UI + Outreach Manager
    
Demo Generator
    ↑ Called by
Outreach Manager
    ↓ Tracks with
Analytics Service

Order Service
    ↓ Triggers
Stripe Integration
    ↓ Creates
Project Service
    ↓ Activates
Client Portal
```

---

## 🔧 Key Integration Points

### 1. Database as Central Hub
- All components read/write here
- Single source of truth
- Real-time updates via polling

### 2. API Routes as Controllers
- Handle business logic
- Validate data
- Coordinate components

### 3. Background Services
- Scrapers run independently
- Outreach processes queues
- Demos generate on-demand

### 4. UI as View Layer
- Reflects database state
- Initiates actions
- Shows real-time feedback

---

## 💡 How to Test Component Interactions

### Test Lead Flow:
```bash
# 1. Start a scrape
curl -X POST http://localhost:3001/api/scrape-runs \
  -H "Content-Type: application/json" \
  -d '{"city":"Portland","category":"plumber","limit":10}'

# 2. Check progress
curl http://localhost:3001/api/scrape-runs/[RUN_ID]

# 3. View leads
curl http://localhost:3001/api/companies
```

### Test Outreach:
```bash
# Launch campaign to one lead
curl -X POST http://localhost:3001/api/bot/outreach/123 \
  -H "Content-Type: application/json"
```

### Test Order Creation:
```bash
# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"companyId":123,"package":"growth","total":3888}'
```

---

## 🚨 Critical Component Relationships

### Must Work Together:
1. **Scraper + Database** - No leads without this
2. **Leads + Scoring** - Prioritization is key
3. **Outreach + Tracking** - Need to measure success
4. **Orders + Stripe** - Revenue collection
5. **Projects + Portal** - Client experience

### Can Work Independently:
1. **Demo Generator** - On-demand service
2. **Analytics** - Read-only reporting
3. **Minerva** - Optional automation
4. **File Storage** - Separate concern

This is how your components actually talk to each other in production!
