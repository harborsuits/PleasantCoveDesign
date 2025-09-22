# 🔌 UI-API Connection Map - Making Everything Work

## API Endpoints Available:

```
SCRAPING:
POST /api/scrape-runs              - Start new scrape
GET  /api/scrape-runs/:id          - Check scrape progress
POST /api/bot/scrape               - Legacy scrape endpoint

LEADS:
GET  /api/leads                    - Get all leads (with filters)
GET  /api/companies                - Get companies/leads
GET  /api/leads/verify             - Verify website status

OUTREACH:
POST /api/bot/outreach/:id         - Send outreach to single lead
POST /api/bot/launch-outreach      - Bulk outreach campaign

ORDERS:
POST /api/orders                   - Create order
GET  /api/orders                   - Get all orders
GET  /api/orders/:id               - Get specific order

MESSAGES:
GET  /api/conversations            - Get all conversations
POST /api/conversations/:id/messages - Send message
```

---

## 🔴 Critical UI Connections Needed:

### 1. **Lead Management Stats Cards**
```javascript
// In LeadsUnified.tsx - Update the stats cards

useEffect(() => {
  const fetchStats = async () => {
    const response = await api.get('/api/companies');
    const companies = response.data;
    
    // Calculate stats
    const totalLeads = companies.length;
    const noWebsite = companies.filter(c => !c.website).length;
    const hasWebsite = companies.filter(c => c.website).length;
    const thisWeek = companies.filter(c => {
      const createdDate = new Date(c.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length;
    
    // Update the display
    setStats({
      totalLeads,
      noWebsite,
      hasWebsite,
      thisWeek
    });
  };
  
  fetchStats();
}, [refreshTrigger]);
```

### 2. **Priority Score Display**
```javascript
// In LeadsTable.tsx - Add priority badge

const getPriorityBadge = (company) => {
  // Calculate score based on criteria
  let score = 50;
  if (!company.website) score += 50;
  if (company.rating >= 4.5) score += 30;
  if (company.reviews >= 20) score += 15;
  if (company.phone) score += 20;
  
  // Return badge based on score
  if (score >= 80) return { text: '🔥 Hot Lead', color: 'red' };
  if (score >= 60) return { text: '⭐ High', color: 'orange' };
  if (score >= 40) return { text: '📈 Medium', color: 'yellow' };
  return { text: '📋 Low', color: 'gray' };
};

// In the table row
<td>
  <span className={`badge ${getPriorityBadge(lead).color}`}>
    {getPriorityBadge(lead).text}
  </span>
</td>
```

### 3. **Scraper Progress Real-Time Updates**
```javascript
// In ScrapeProgressPanel.tsx - Poll for updates

useEffect(() => {
  if (!runId) return;
  
  const pollInterval = setInterval(async () => {
    const response = await api.get(`/api/scrape-runs/${runId}`);
    const { status, progress, leadsFound } = response.data;
    
    setProgress(progress);
    setLeadsFound(leadsFound);
    
    if (status === 'completed' || status === 'failed') {
      clearInterval(pollInterval);
      onComplete(); // Refresh the leads table
    }
  }, 2000); // Poll every 2 seconds
  
  return () => clearInterval(pollInterval);
}, [runId]);
```

### 4. **Dashboard Metrics**
```javascript
// In Dashboard.tsx - Connect to real data

const fetchDashboardData = async () => {
  const [companies, orders, conversations] = await Promise.all([
    api.get('/api/companies'),
    api.get('/api/orders'),
    api.get('/api/conversations')
  ]);
  
  // Lead funnel
  const totalLeads = companies.data.length;
  const contacted = companies.data.filter(c => c.lastContactDate).length;
  const responded = conversations.data.filter(c => c.messages.length > 1).length;
  const customers = orders.data.filter(o => o.status === 'paid').length;
  
  setFunnelData({
    scraped: totalLeads,
    contacted,
    responded,
    customers
  });
  
  // Revenue this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const monthlyRevenue = orders.data
    .filter(o => new Date(o.createdAt) > thisMonth && o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);
  
  setRevenue(monthlyRevenue);
};
```

### 5. **Outreach Campaign UI**
```javascript
// In Outreach.tsx - Add campaign launcher

const launchCampaign = async () => {
  const selectedLeads = getSelectedLeads();
  
  const response = await api.post('/api/bot/launch-outreach', {
    businessIds: selectedLeads.map(l => l.id),
    campaignType: selectedTemplate,
    channel: selectedChannel // 'sms' or 'email'
  });
  
  if (response.data.success) {
    toast.success(`Campaign launched to ${selectedLeads.length} leads!`);
    refreshCampaigns();
  }
};
```

---

## 📋 Step-by-Step Implementation:

### Phase 1: Fix What's Broken (Today)
1. **Lead Stats Cards**
   ```javascript
   // File: LeadsUnified.tsx
   // Line: ~70-109 (Quick Stats section)
   // Action: Replace "-" with real data from API
   ```

2. **Add Priority Scoring**
   ```javascript
   // File: LeadsTable.tsx
   // Action: Add calculatePriority function
   // Display: Color-coded badges
   ```

3. **Dashboard Metrics**
   ```javascript
   // File: Dashboard.tsx
   // Action: Fetch real data instead of mock
   // Display: Charts with actual numbers
   ```

### Phase 2: Add Missing Features (This Week)
1. **Scraper Progress**
   - Real-time updates during scraping
   - Auto-refresh leads when complete
   - Show businesses as they're found

2. **Demo Generation**
   - "Generate Demo" button on each lead
   - Links to demo preview
   - Track demo views

3. **Outreach Campaigns**
   - Multi-select leads
   - Choose template
   - Track opens/responses

---

## 🎯 Testing Each Connection:

### 1. Test Lead Stats
```bash
# In browser console:
fetch('/api/companies').then(r => r.json()).then(console.log)
# Should show array of companies
```

### 2. Test Scraper
```bash
# Start a scrape:
fetch('/api/scrape-runs', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    city: 'Portland',
    category: 'plumber',
    limit: 10
  })
}).then(r => r.json()).then(console.log)
```

### 3. Test Outreach
```bash
# Send to single lead:
fetch('/api/bot/outreach/123', {
  method: 'POST'
}).then(r => r.json()).then(console.log)
```

---

## ✅ Quick Wins (Do These First):

1. **Lead Management Page**
   - Connect stats cards to `/api/companies`
   - Add priority badges to table
   - Sort by priority by default

2. **Dashboard**
   - Show real lead funnel
   - Display actual revenue
   - List recent activities

3. **Scraper Integration**
   - Show progress in real-time
   - Auto-refresh when done
   - Display new leads with "NEW" badge

These connections will make your UI fully functional and show all the data flowing through your system!
