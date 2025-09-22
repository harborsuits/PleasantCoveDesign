# 🏗️ Core Components & System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Pleasant Cove Design System                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DATA ACQUISITION           2. PROCESSING              3. ENGAGEMENT │
│  ┌──────────────────┐         ┌──────────────────┐      ┌────────────┐│
│  │ • Google Scraper │ ──────> │ • Lead Scoring   │ ───> │ • Outreach ││
│  │ • Form Webhooks  │         │ • Prioritization │      │ • Demos    ││
│  │ • Manual Entry   │         │ • Enrichment     │      │ • Tracking ││
│  └──────────────────┘         └──────────────────┘      └────────────┘│
│           ↓                            ↓                        ↓       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        DATABASE (SQLite)                         │  │
│  │  companies • orders • projects • conversations • activities     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│           ↓                            ↓                        ↓       │
│  4. CONVERSION                5. DELIVERY              6. MANAGEMENT   │
│  ┌──────────────────┐         ┌──────────────────┐    ┌─────────────┐│
│  │ • Order Builder  │         │ • Project Portal │    │ • Admin UI  ││
│  │ • Stripe Payment │         │ • Client Widget  │    │ • Analytics ││
│  │ • Invoicing      │         │ • Squarespace    │    │ • Minerva   ││
│  └──────────────────┘         └──────────────────┘    └─────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. 🔍 Data Acquisition Components

### Lead Scrapers
**Location:** `/scrapers/`
**Purpose:** Find businesses without websites

```python
# How it works:
1. Search Google Maps for business type + location
2. Extract business details (name, phone, rating)
3. Check if they have a website
4. Save to database with priority score
```

**Key Files:**
- `google_maps_scraper.py` - Main scraper with website detection
- `verify_site.py` - Verifies website status (NO_SITE, SOCIAL_ONLY, etc.)
- `real_business_scraper_clean.py` - Production-ready scraper

### Form Webhooks
**Location:** `/pleasantcovedesign/server/routes.ts`
**Purpose:** Capture leads from Squarespace forms

```javascript
// Webhook receives form data
app.post('/webhooks/form-submission', (req, res) => {
  // Save lead to database
  // Trigger follow-up actions
})
```

---

## 2. 🎯 Processing & Intelligence

### Lead Scoring Engine
**Location:** Multiple files
**Purpose:** Prioritize best opportunities

```javascript
// Scoring Algorithm:
calculatePriority(lead) {
  let score = 50;  // Base
  if (!website) score += 50;  // Biggest factor!
  if (rating >= 4.5) score += 30;
  if (reviews >= 20) score += 15;
  if (hasPhone) score += 20;
  if (serviceType) score += 25;
  return score;
}
```

### Smart Demo Generator
**Location:** `smart_demo_generator.py`
**Purpose:** Create hyper-personalized demos

```python
# Personalization includes:
- Business name & details
- Local weather & landmarks
- Competitor analysis
- Revenue calculations
- Industry-specific design
```

---

## 3. 📧 Engagement & Outreach

### Multi-Channel Outreach
**Location:** `outreach_manager.py`
**Purpose:** Automated SMS/Email campaigns

```python
# Campaign Flow:
1. Select target segment (no_website, high_rated)
2. Generate personalized message/demo
3. Send via SMS or Email
4. Track opens, clicks, responses
5. Update lead status
```

### Demo Tracking
**Location:** `demo_tracking_integration.py`
**Purpose:** Monitor engagement

```python
# Tracks:
- Demo views
- Time on site
- CTA clicks
- Form submissions
```

---

## 4. 💰 Conversion & Sales

### Order Builder
**Location:** `/pleasantcovedesign/server/routes.ts`
**Purpose:** Create quotes and process payments

```javascript
// Order Flow:
POST /api/orders
├── Calculate pricing (package + addons)
├── Apply tax
├── Create Stripe payment link
├── Send invoice
└── Track payment status
```

### Stripe Integration
**Location:** `stripe-config.ts`
**Purpose:** Payment processing

```javascript
// Handles:
- Payment links
- Webhook verification
- Payment confirmation
- Invoice generation
```

---

## 5. 🚀 Project Delivery

### Project Workspace
**Location:** `/pleasantcovedesign/client-widget/`
**Purpose:** Client portal for project management

```html
<!-- Features: -->
- Progress tracking
- Design canvas
- File sharing
- Messaging
- Feedback collection
```

### Squarespace Module
**Location:** `/pleasantcovedesign/workspace-module/`
**Purpose:** Embeddable client experience

```javascript
// Modular design:
- embed.js (loader)
- workspace.js (functionality)
- workspace.css (styling)
```

---

## 6. 🎛️ Management & Control

### Admin UI
**Location:** `/pleasantcovedesign/admin-ui/`
**Purpose:** Central command center

```
Key Pages:
├── Dashboard - Overview metrics
├── Leads - Manage prospects
├── Outreach - Campaign management
├── Orders - Sales tracking
├── Projects - Active work
└── Analytics - Performance data
```

### Minerva AI Assistant
**Location:** `minerva_*.py` files
**Purpose:** Automation and intelligence

```python
# Capabilities:
- Auto-generate demos
- Schedule appointments
- Process orders
- Send outreach
- Analyze performance
```

---

## 🔄 Data Flow Example

Let's trace a lead through the system:

```
1. ACQUISITION
   Bob's Plumbing found by scraper
   ↓
2. SCORING
   No website + 4.5 rating = 95 score (🔥 Hot)
   ↓
3. DEMO GENERATION
   Personalized site created with local data
   ↓
4. OUTREACH
   SMS sent: "Hi Bob, see what your website could look like..."
   ↓
5. ENGAGEMENT
   Bob views demo, spends 3:47, clicks CTA
   ↓
6. CONVERSION
   Bob fills form → Order created → Payment link sent
   ↓
7. PROJECT
   Payment received → Project created → Workspace activated
   ↓
8. DELIVERY
   Freelancer assigned → Site built → Client trained
```

---

## 🗄️ Database Schema

### Core Tables:
```sql
companies (leads/clients)
├── id, name, email, phone, website
├── rating, reviews, industry
├── createdAt, lastContactDate
└── stage, priority_score

orders (sales)
├── id, companyId, status
├── package, customItems
├── subtotal, tax, total
├── invoiceId, paymentStatus
└── stripePaymentIntentId

projects (delivery)
├── id, companyId, orderId
├── status, progress
├── startDate, deadline
└── assignedTo, completedAt

conversations (communication)
├── id, companyId, projectId
├── messages[], participants[]
└── lastActivity, status
```

---

## 🔌 API Endpoints

### Lead Management
```
GET  /api/companies         - List all leads
POST /api/companies         - Create lead
GET  /api/leads            - Scraper results
POST /api/scrape-runs      - Start scraping
```

### Sales & Orders
```
POST /api/orders           - Create order
GET  /api/orders/:id       - Get order details
POST /api/stripe/webhook   - Payment updates
```

### Outreach
```
POST /api/bot/outreach/:id      - Single outreach
POST /api/bot/launch-outreach   - Bulk campaign
GET  /api/outreach/campaigns    - List campaigns
```

### Projects
```
GET  /api/projects         - List projects
POST /api/projects         - Create project
GET  /api/workspace/:token - Client access
```

---

## 🛠️ Supporting Services

### Background Jobs
- Scraper automation
- Email/SMS sending
- Demo generation
- Data enrichment

### File Storage
- Cloudflare R2 for demos
- Local uploads for projects
- Database for metadata

### External APIs
- Google Maps API (scraping)
- OpenAI (content generation)
- Stripe (payments)
- Twilio/SendGrid (messaging)

---

## 🎯 Key Strengths

1. **Automated Lead Generation** - Scrapers find opportunities 24/7
2. **Smart Prioritization** - Hot leads bubble to the top
3. **Hyper-Personalization** - Every demo is unique
4. **Full-Cycle Tracking** - From lead to delivery
5. **Scalable Architecture** - Can handle growth

---

## ⚡ System Performance

- Scraping: ~100 businesses/20 minutes
- Demo Generation: <5 seconds per demo
- Outreach: 50+ messages/minute capability
- UI Updates: Real-time via polling/websockets
- Database: SQLite handles current load well

---

## 🔐 Security & Reliability

- API authentication (admin routes)
- Stripe webhook verification
- Input validation
- Error handling & logging
- Backup capabilities

This is your complete system - from finding leads to delivering websites!
