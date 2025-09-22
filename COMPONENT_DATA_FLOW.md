# 🌊 Component Data Flow Visualization

## The Complete Journey of Data Through Your System

```
                              🔍 ACQUISITION PHASE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Google Maps API          Squarespace Forms        Manual Entry        │
│       ↓                          ↓                      ↓              │
│  [Scraper.py] ←────────→ [Webhook Handler] ←────→ [Admin UI]          │
│       ↓                          ↓                      ↓              │
│  verify_site.py                  │                      │              │
│  "NO_SITE" ✓                    │                      │              │
│       ↓                          ↓                      ↓              │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                    SQLite: companies table                     │    │
│  │  id | name         | phone    | website | score | status      │    │
│  │  1  | Bob's Plumb  | 555-1234 | NULL    | 95    | scraped     │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                  ↓                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                         🎯 PRIORITIZATION PHASE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Lead Scoring Engine]                                                  │
│  calculatePriority() {                                                  │
│    No website: +50                  Bob's Score:                       │
│    Rating 4.5: +30        ────→     Base: 50                          │
│    47 reviews: +15                  +50 +30 +15 +20                   │
│    Has phone:  +20                  = 95 🔥 HOT                        │
│  }                                                                      │
│       ↓                                                                 │
│  [Admin UI: LeadsTable.tsx]                                            │
│  ┌────────────────────────────────────────────────┐                   │
│  │ Bob's Plumbing  [🔥 Hot]  Portland  555-1234   │                   │
│  │ Mike's Auto     [⭐ High] Camden    555-2345   │                   │
│  └────────────────────────────────────────────────┘                   │
│                                  ↓                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                          📧 ENGAGEMENT PHASE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Campaign Creation - Outreach.tsx]                                     │
│  • Select: "No Website" segment                                         │
│  • Type: SMS                                                            │
│  • Template: Personalized Demo                                          │
│       ↓                                                                 │
│  POST /api/bot/launch-outreach                                          │
│  { businessIds: [1,2,3...], type: 'sms' }                             │
│       ↓                                                                 │
│  [smart_demo_generator.py]          [outreach_manager.py]             │
│  For each lead:                     For each demo:                     │
│  • Fetch business data              • Format SMS message               │
│  • Get local weather    ─────→      • Include demo link                │
│  • Find competitors                 • Send via Twilio                  │
│  • Generate HTML                    • Log delivery                     │
│       ↓                                    ↓                            │
│  Demo saved to:                     Update database:                   │
│  /demos/bobs_plumbing_demo.html     lastContactDate = now()           │
│                                            ↓                            │
└─────────────────────────────────────────────────────────────────────────┘
                                            ↓
                              🎪 TRACKING PHASE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Bob clicks demo link]                                                 │
│       ↓                                                                 │
│  [demo_tracking_integration.py]                                         │
│  Track: page_view, time_on_site, cta_click                            │
│       ↓                                                                 │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                    SQLite: activities table                     │    │
│  │  companyId | type      | data                    | timestamp   │    │
│  │  1         | demo_view | {duration: 227, cta: 1} | 2024-01...  │    │
│  └───────────────────────────────────────────────────────────────┘    │
│       ↓                                                                 │
│  [Bob fills contact form]                                               │
│  "This looks great! How much?"                                         │
│       ↓                                                                 │
│  POST /api/conversations                                                │
│  Creates new conversation thread                                        │
│                                  ↓                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                           💰 CONVERSION PHASE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Admin UI: Orders Page]                                                │
│  • Select Bob's Plumbing                                                │
│  • Choose Growth Package ($2,497)                                       │
│  • Add SEO Package (+$797)                                             │
│       ↓                                                                 │
│  POST /api/orders                                                       │
│  { companyId: 1, package: 'growth', addons: ['seo'], total: 3294 }    │
│       ↓                                                                 │
│  [stripe-config.ts]                                                     │
│  • Create payment link                                                  │
│  • Generate invoice                                                     │
│  • Send to Bob                                                          │
│       ↓                                                                 │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                    SQLite: orders table                        │    │
│  │  id | companyId | total | status    | stripePaymentIntentId  │    │
│  │  1  | 1         | 3294  | pending   | pi_1234567890          │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                  ↓                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                            🚀 DELIVERY PHASE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  [Stripe Webhook: payment.succeeded]                                    │
│       ↓                                                                 │
│  Update order.paymentStatus = 'paid'                                   │
│       ↓                                                                 │
│  [Project Service]                                                      │
│  • Create project record                                                │
│  • Generate workspace token                                             │
│  • Set milestones                                                       │
│       ↓                                                                 │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                    SQLite: projects table                      │    │
│  │  id | companyId | orderId | status      | workspaceToken     │    │
│  │  1  | 1         | 1       | in_progress | ws_abc123          │    │
│  └───────────────────────────────────────────────────────────────┘    │
│       ↓                                                                 │
│  [Client Portal Activated]          [Freelancer Assignment]            │
│  • Bob gets login email             • Post to Upwork                   │
│  • Accesses workspace      ←────→   • Manage development               │
│  • Tracks progress                  • Update milestones                │
│                                            ↓                            │
│                                     [Completion]                        │
│                                     • Site delivered                    │
│                                     • Client trained                    │
│                                     • Project closed                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Transformation at Each Stage

### 1. Raw Data → Structured Lead
```
Google Maps Result:          Database Record:
{                      →     {
  "name": "Bob's...",         id: 1,
  "rating": 4.5,              name: "Bob's Plumbing",
  "user_ratings": 47          phone: "555-1234",
}                             websiteStatus: "NO_SITE",
                              priority_score: 95
                            }
```

### 2. Lead → Personalized Demo
```
Database Lead:               Generated Demo:
{                      →     <html>
  name: "Bob's",              <h1>Bob's Plumbing</h1>
  city: "Portland"            <p>Portland's Trusted...</p>
}                             <div>Weather: 42°F</div>
                            </html>
```

### 3. Engagement → Order
```
Activity Data:               Order Record:
{                      →     {
  demo_views: 3,              companyId: 1,
  cta_clicks: 1,              package: "growth",
  messages: [...]             total: 3294
}                           }
```

### 4. Order → Project
```
Paid Order:                  Active Project:
{                      →     {
  status: "paid",             status: "in_progress",
  total: 3294                 milestones: [...],
}                             workspaceToken: "ws_123"
                            }
```

---

## 🔁 Feedback Loops

### Lead Quality Loop
```
Conversion Data → Scoring Algorithm → Better Prioritization
     ↑                                        ↓
     └──────── More Conversions ←─────────────┘
```

### Demo Effectiveness Loop
```
Engagement Metrics → Demo Templates → Higher Engagement
        ↑                                    ↓
        └────── Better Conversions ←─────────┘
```

### Service Delivery Loop
```
Client Feedback → Process Improvements → Happier Clients
       ↑                                        ↓
       └──────── More Referrals ←───────────────┘
```

This is how data flows through your entire system, transforming from raw leads into completed projects!
