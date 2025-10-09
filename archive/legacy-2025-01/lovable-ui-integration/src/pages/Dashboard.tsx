import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, FolderKanban, Presentation, TrendingUp, Flame } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useDashboardKPIs, useRevenueChart, useLeadChart } from "@/hooks/useStats";
import { ActivityToastSystem } from "@/components/notifications/ActivityToast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Settings, Wrench, Palette, CheckCircle, XCircle, Activity } from "lucide-react";
import { toast } from "sonner";

const recentActivity = [
  { id: 1, type: "lead", message: "New hot lead: Ocean View Restaurant", time: "2 min ago", status: "new" as const },
  { id: 2, type: "demo", message: "Demo viewed by Coastal Cafe", time: "15 min ago", status: "active" as const },
  { id: 3, type: "project", message: "Website launch: Harbor Grill", time: "1 hour ago", status: "completed" as const },
  { id: 4, type: "message", message: "Response from Bay Side Bistro", time: "2 hours ago", status: "active" as const },
  { id: 5, type: "payment", message: "Payment received: $2,500", time: "3 hours ago", status: "completed" as const },
];

export default function Dashboard() {
  // Real data from APIs
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueChart();
  const { data: leadData, isLoading: leadsLoading } = useLeadChart();

  // Health check state
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [healthData, setHealthData] = useState<{
    status: string;
    uptime_seconds: number;
    request_count: number;
    service: string;
  } | null>(null);

  // Check health status
  const checkHealth = async () => {
    try {
      const response = await fetch('http://localhost:8003/health');
      const data = await response.json();
      setHealthStatus('healthy');
      setHealthData(data);
    } catch (error) {
      console.log('Health dashboard not available:', error);
      setHealthStatus('error');
      setHealthData(null);
    }
  };

  // Initial health check and periodic updates
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpisLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gradient-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <MetricCard
              title="Total Leads"
              value={kpis?.totalLeads?.toString() || '0'}
              icon={Users}
              variant="primary"
              trend={{ value: "12%", positive: true }}
            />
            <MetricCard
              title="Revenue"
              value={`$${(kpis?.totalRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              variant="success"
              trend={{ value: "8%", positive: true }}
            />
            <MetricCard
              title="Active Projects"
              value={kpis?.activeProjects?.toString() || '0'}
              icon={FolderKanban}
              variant="warning"
              trend={{ value: "3%", positive: true }}
            />
            <MetricCard
              title="Demos Created"
              value={kpis?.totalDemos?.toString() || '0'}
              icon={Presentation}
              variant="default"
              trend={{ value: "15%", positive: true }}
            />
            <MetricCard
              title="System Health"
              value={healthStatus === 'healthy' ? 'Online' : healthStatus === 'checking' ? 'Checking...' : 'Offline'}
              icon={Activity}
              variant={healthStatus === 'healthy' ? 'success' : healthStatus === 'checking' ? 'default' : 'destructive'}
              trend={healthData ? { value: `${healthData.request_count} req`, positive: true } : undefined}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="text-xl font-semibold text-foreground">Revenue Growth</h2>
          </div>
          {revenueLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(revenueData) ? revenueData : []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--success))", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-5 w-5 text-warning" />
            <h2 className="text-xl font-semibold text-foreground">Lead Generation</h2>
          </div>
          {leadsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Array.isArray(leadData) ? leadData : []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar
                  dataKey="leads"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="p-6 bg-gradient-card">
        <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background transition-colors border border-border/50"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
              <StatusBadge status={activity.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-gradient-primary text-primary-foreground">
          <div className="space-y-2">
            <p className="text-sm font-medium opacity-90">Hot Leads</p>
            <p className="text-4xl font-bold">42</p>
            <p className="text-xs opacity-75">Requires immediate attention</p>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-success text-success-foreground">
          <div className="space-y-2">
            <p className="text-sm font-medium opacity-90">Conversion Rate</p>
            <p className="text-4xl font-bold">32%</p>
            <p className="text-xs opacity-75">From demo to client</p>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border/50">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Project Value</p>
            <p className="text-4xl font-bold text-foreground">$2,850</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </Card>
      </div>

      {/* System Health Details */}
      {healthStatus !== 'checking' && (
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-2 mb-6">
            <Activity className={`h-5 w-5 ${healthStatus === 'healthy' ? 'text-success' : 'text-destructive'}`} />
            <h2 className="text-xl font-semibold text-foreground">System Health</h2>
            <Badge variant={healthStatus === 'healthy' ? 'default' : 'destructive'}>
              {healthStatus === 'healthy' ? 'Online' : 'Offline'}
            </Badge>
          </div>
          {healthData && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{Math.floor(healthData.uptime_seconds / 60)}m</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{healthData.request_count}</p>
                <p className="text-sm text-muted-foreground">Requests Served</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{healthData.service}</p>
                <p className="text-sm text-muted-foreground">Service</p>
              </div>
            </div>
          )}
          {healthStatus === 'error' && (
            <p className="text-sm text-muted-foreground mt-4">
              Health dashboard not available. Make sure the health server is running on port 8003.
            </p>
          )}
        </Card>
      )}

      {/* Activity Toast System */}
      <ActivityToastSystem />
    </div>
  );
}
