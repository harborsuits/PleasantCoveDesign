# ✅ UI Implementation Checklist

## Files to Update & Exact Changes:

### 1. **Lead Management Stats** 📊
**File:** `pleasantcovedesign/admin-ui/src/pages/LeadsUnified.tsx`
**Lines:** 61-109

**Change From:**
```jsx
<div className="text-xl font-semibold text-gray-900">-</div>
```

**Change To:**
```jsx
const [stats, setStats] = useState({
  totalLeads: 0,
  noWebsite: 0,
  hasWebsite: 0,
  thisWeek: 0
});

useEffect(() => {
  fetchLeadStats();
}, [refreshTrigger]);

const fetchLeadStats = async () => {
  try {
    const response = await api.get('/api/companies');
    const companies = response.data;
    
    setStats({
      totalLeads: companies.length,
      noWebsite: companies.filter(c => !c.website).length,
      hasWebsite: companies.filter(c => c.website).length,
      thisWeek: companies.filter(c => {
        const created = new Date(c.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

// In the JSX:
<div className="text-xl font-semibold text-gray-900">{stats.totalLeads}</div>
<div className="text-xl font-semibold text-gray-900">{stats.hasWebsite}</div>
<div className="text-xl font-semibold text-gray-900">{stats.noWebsite}</div>
<div className="text-xl font-semibold text-gray-900">{stats.thisWeek}</div>
```

---

### 2. **Priority Badges in Lead Table** 🔥
**File:** `pleasantcovedesign/admin-ui/src/components/LeadsTable.tsx`

**Add this function:**
```jsx
const calculatePriority = (lead) => {
  let score = 50;
  
  // No website = highest priority
  if (!lead.website || lead.website === '') score += 50;
  
  // High rating
  if (lead.rating >= 4.5) score += 30;
  else if (lead.rating >= 4.0) score += 20;
  else if (lead.rating >= 3.5) score += 10;
  
  // Established business (reviews)
  if (lead.reviews >= 50) score += 15;
  else if (lead.reviews >= 20) score += 10;
  else if (lead.reviews >= 5) score += 5;
  
  // Has contact info
  if (lead.phone && lead.phone !== 'No phone provided') score += 20;
  
  // Industry bonus
  const highValueTypes = ['plumbing', 'electrical', 'hvac', 'roofing'];
  if (highValueTypes.includes(lead.businessType?.toLowerCase())) {
    score += 25;
  }
  
  return {
    score,
    label: score >= 80 ? '🔥 Hot' : 
           score >= 60 ? '⭐ High' : 
           score >= 40 ? '📈 Medium' : 
           '📋 Low',
    color: score >= 80 ? 'bg-red-100 text-red-800' : 
           score >= 60 ? 'bg-orange-100 text-orange-800' : 
           score >= 40 ? 'bg-yellow-100 text-yellow-800' : 
           'bg-gray-100 text-gray-800'
  };
};
```

**In the table row, add:**
```jsx
<td className="px-6 py-4 whitespace-nowrap">
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${calculatePriority(lead).color}`}>
    {calculatePriority(lead).label}
  </span>
</td>
```

---

### 3. **Dashboard Real Data** 📈
**File:** `pleasantcovedesign/admin-ui/src/pages/Dashboard.tsx`

**Add after imports:**
```jsx
const [metrics, setMetrics] = useState({
  leadFunnel: { scraped: 0, contacted: 0, responded: 0, customers: 0 },
  monthlyRevenue: 0,
  activeProjects: 0,
  conversionRate: 0
});

useEffect(() => {
  fetchDashboardMetrics();
}, []);

const fetchDashboardMetrics = async () => {
  try {
    const [companiesRes, ordersRes, conversationsRes] = await Promise.all([
      api.get('/api/companies'),
      api.get('/api/orders'),
      api.get('/api/conversations')
    ]);
    
    const companies = companiesRes.data;
    const orders = ordersRes.data;
    const conversations = conversationsRes.data;
    
    // Calculate funnel
    const contacted = companies.filter(c => c.lastContactDate).length;
    const responded = conversations.filter(c => c.messages?.length > 1).length;
    const customers = orders.filter(o => o.paymentStatus === 'paid').length;
    
    // Monthly revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyRevenue = orders
      .filter(o => new Date(o.createdAt) > thisMonth && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
    
    setMetrics({
      leadFunnel: {
        scraped: companies.length,
        contacted,
        responded,
        customers
      },
      monthlyRevenue,
      activeProjects: orders.filter(o => o.status === 'in_progress').length,
      conversionRate: companies.length > 0 ? (customers / companies.length * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
  }
};
```

---

### 4. **Scraper Progress Updates** 🔄
**File:** `pleasantcovedesign/admin-ui/src/components/ScrapeProgressPanel.tsx`

**Update the polling logic:**
```jsx
useEffect(() => {
  if (!runId || !isActive) return;
  
  const checkProgress = async () => {
    try {
      const response = await api.get(`/api/scrape-runs/${runId}`);
      const data = response.data;
      
      setProgress(data.progress || 0);
      setStatus(data.status);
      setMessage(data.message || 'Scraping in progress...');
      
      // Update stats if available
      if (data.stats) {
        setStats({
          businessesFound: data.stats.found || 0,
          noWebsite: data.stats.noWebsite || 0,
          processed: data.stats.processed || 0
        });
      }
      
      if (data.status === 'completed' || data.status === 'failed') {
        setIsActive(false);
        onComplete(); // Trigger parent refresh
      }
    } catch (error) {
      console.error('Failed to check progress:', error);
    }
  };
  
  // Initial check
  checkProgress();
  
  // Poll every 2 seconds
  const interval = setInterval(checkProgress, 2000);
  
  return () => clearInterval(interval);
}, [runId, isActive]);
```

---

### 5. **Outreach Campaign Launcher** 📧
**File:** `pleasantcovedesign/admin-ui/src/pages/Outreach.tsx`

**Add campaign launcher:**
```jsx
const [selectedLeads, setSelectedLeads] = useState([]);
const [campaignType, setCampaignType] = useState('sms');
const [template, setTemplate] = useState('introduction');

const launchCampaign = async () => {
  if (selectedLeads.length === 0) {
    toast.error('Please select leads first');
    return;
  }
  
  try {
    const response = await api.post('/api/bot/launch-outreach', {
      businessIds: selectedLeads.map(l => l.id),
      campaignType,
      template
    });
    
    if (response.data.success) {
      toast.success(`Campaign sent to ${selectedLeads.length} leads!`);
      setSelectedLeads([]);
      fetchCampaigns(); // Refresh campaign list
    }
  } catch (error) {
    toast.error('Failed to launch campaign');
  }
};
```

---

## 🚀 Testing Your Changes:

### 1. Test Lead Stats:
1. Go to Lead Management page
2. Stats should show real numbers
3. Add a new lead and refresh - numbers should update

### 2. Test Priority Badges:
1. Look at lead table
2. Each lead should have colored priority badge
3. Sort by priority - hot leads should be on top

### 3. Test Dashboard:
1. Go to Dashboard
2. Should see real funnel numbers
3. Revenue should reflect actual paid orders

### 4. Test Scraper:
1. Click "Start New Scrape"
2. Progress panel should update in real-time
3. When done, lead table should refresh automatically

### 5. Test Outreach:
1. Go to Outreach page
2. Select multiple leads
3. Launch campaign
4. Check that messages were sent

---

## 📝 Priority Order:

**Do First (Quick Wins):**
1. Lead Stats Cards - 15 minutes
2. Priority Badges - 20 minutes
3. Dashboard Metrics - 30 minutes

**Do Second (Important):**
4. Scraper Progress - 30 minutes
5. Outreach Campaign - 45 minutes

**Total Time: ~2.5 hours to connect everything**

---

## ✅ Success Criteria:

When complete, you should see:
- ✅ Real numbers everywhere (no more "-")
- ✅ Priority badges on all leads
- ✅ Dashboard showing actual business metrics
- ✅ Scraper progress updating live
- ✅ Ability to launch outreach campaigns from UI

This will make your UI fully reflect all the data flowing through your system!
