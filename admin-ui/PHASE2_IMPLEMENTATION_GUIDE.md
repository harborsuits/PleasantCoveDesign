# 🚀 Phase 2 Implementation Guide - Dashboard & Companies

## 📋 Validation Results
✅ **Phase 1 APIs**: Working (projects, messages, auth, public)
❌ **Phase 2 APIs**: Not yet implemented (expected - that's our job!)

**Ready to proceed:** All infrastructure validated, Phase 2 APIs correctly return 404 (to be implemented).

---

## 🗓️ Day 1: Dashboard Metrics (2-3 hours)

### 🎯 Goal: Connect real KPIs to dashboard charts with loading states

### Backend Tasks (30 min)
Add stats endpoints to `server/routes.ts`:

```typescript
// Add these routes around line 2633 (after existing stats)
app.get("/api/stats/kpis", async (req: Request, res: Response) => {
  try {
    // Mock data for now - replace with real calculations
    const stats = {
      totalLeads: 247,
      totalRevenue: 32500,
      activeProjects: 18,
      totalDemos: 64,
      conversionRate: 32,
      avgProjectValue: 2850
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

app.get("/api/stats/revenueByMonth", async (req: Request, res: Response) => {
  try {
    // Mock revenue data
    const data = [
      { month: "Jan", revenue: 12000 },
      { month: "Feb", revenue: 15000 },
      { month: "Mar", revenue: 18000 },
      { month: "Apr", revenue: 22000 },
      { month: "May", revenue: 28000 },
      { month: "Jun", revenue: 32000 },
    ];
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

app.get("/api/stats/leadsBySource", async (req: Request, res: Response) => {
  try {
    // Mock leads data
    const data = [
      { week: "W1", leads: 45 },
      { week: "W2", leads: 52 },
      { week: "W3", leads: 48 },
      { week: "W4", leads: 61 },
    ];
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads data' });
  }
});
```

### Frontend Tasks (2 hours)
1. **Update Dashboard.tsx** to use real hooks:
```typescript
// Replace mock data imports
import { useDashboardKPIs, useRevenueChart, useLeadChart } from '@/hooks/useStats';

// In component:
const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
const { data: revenueData } = useRevenueChart();
const { data: leadData } = useLeadChart();

// Replace static cards with dynamic data
<MetricCard
  title="Total Leads"
  value={kpis?.totalLeads?.toString() || '0'}
  // ... rest of props
/>
```

2. **Add loading states** with Skeleton components
3. **Test validation**: Run `node validate-phase2-apis.js` - should show ✅ for all 3 stats endpoints

### ✅ Success Criteria
- Dashboard loads real KPI numbers
- Charts render with actual data
- Loading skeletons appear during fetch
- No console errors
- `node validate-phase2-apis.js` shows ✅ for stats endpoints

---

## 🗓️ Day 2: Companies CRUD (3-4 hours)

### 🎯 Goal: Full companies management with search, pagination, create/edit/delete

### Backend Tasks (45 min)
Add companies endpoints to `server/routes.ts`:

```typescript
// Add around line 2655 (after existing companies route)
app.get("/api/companies", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    // Mock companies data for now
    const mockCompanies = [
      {
        id: 1,
        name: "Harbor View Restaurant",
        email: "contact@harborview.com",
        phone: "(555) 123-4567",
        industry: "Hospitality",
        website: "https://harborview.com",
        priority: "high",
        tags: ["restaurant", "hospitality"],
        createdAt: new Date().toISOString(),
      },
      // Add more mock companies...
    ];

    // Apply search filter
    let filtered = mockCompanies;
    if (search) {
      filtered = mockCompanies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedItems = filtered.slice(startIndex, endIndex);

    res.json({
      items: paginatedItems,
      total: filtered.length,
      page: Number(page),
      pageSize: Number(limit),
      hasMore: endIndex < filtered.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.get("/api/companies/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Mock single company lookup
    const company = {
      id: Number(id),
      name: "Harbor View Restaurant",
      email: "contact@harborview.com",
      phone: "(555) 123-4567",
      industry: "Hospitality",
      website: "https://harborview.com",
      priority: "high",
      tags: ["restaurant", "hospitality"],
      createdAt: new Date().toISOString(),
    };
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

app.post("/api/companies", requireAdmin, async (req: Request, res: Response) => {
  try {
    const companyData = req.body;
    // Mock company creation
    const newCompany = {
      id: Date.now(), // Simple ID generation
      ...companyData,
      createdAt: new Date().toISOString(),
    };
    res.json(newCompany);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.put("/api/companies/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Mock company update
    const updatedCompany = {
      id: Number(id),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    res.json(updatedCompany);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete("/api/companies/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    // Mock deletion
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});
```

### Frontend Tasks (2.5 hours)
1. **Create Companies page** (`src/pages/Companies.tsx`):
```typescript
import CompaniesTable from '@/components/companies/CompaniesTable';

export default function Companies() {
  return (
    <div className="space-y-6">
      <CompaniesTable />
    </div>
  );
}
```

2. **Add route** to `App.tsx`:
```typescript
import Companies from "./pages/Companies";
// Add route: <Route path="/companies" element={<Companies />} />
```

3. **Create CRUD modals** - Add to `CompaniesTable.tsx`:
```typescript
const [showCreateModal, setShowCreateModal] = useState(false);
const [editingCompany, setEditingCompany] = useState<Company | null>(null);

// Add create/edit modal components with react-hook-form + zod
```

4. **Implement optimistic updates** in hooks
5. **Test validation**: `node validate-phase2-apis.js` should show ✅ for companies

### ✅ Success Criteria
- Companies table loads with search/pagination
- Create/edit/delete modals work with validation
- Optimistic updates prevent UI lag
- `node validate-phase2-apis.js` shows ✅ for companies endpoints

---

## 🗓️ Days 3-5: Appointments, Activities & Files

**Quick Implementation Notes:**

### 📅 Appointments (Day 3)
- Add `/api/appointments` endpoints (mock data initially)
- Install `react-big-calendar`
- Create Schedule page with calendar view
- Test Acuity webhook integration

### 🔔 Activities (Day 4)
- Add `/api/activities/recent` endpoint
- Connect ActivityToastSystem to real WebSocket events
- Add activity feed sidebar component

### 📁 Files (Day 4)
- Add `/api/upload` and file management endpoints
- Implement upload progress and R2 integration
- Add file preview/download in project details

---

## 🧪 Daily Testing Protocol

**End of each day:**
1. Run `node validate-phase2-apis.js`
2. Check browser console for errors
3. Test Squarespace widget endpoints still work
4. Update `.testplan/phase2.md` with completed items

**Weekly:**
1. Full Postman collection run
2. Cross-browser testing
3. Performance check (<2s dashboard load)

---

## 🚀 Ready for Day 1!

**Start here:**
1. Add the 3 stats endpoints to your backend
2. Update Dashboard.tsx to use real hooks
3. Run validation script to confirm ✅
4. Commit and push: "feat: dashboard real KPIs and charts"

**Questions?** The validation script will guide you - any ❌ means the endpoint needs implementation! 🎯
