import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { exportToCSV } from "@/lib/csv-export";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Building2, Users, FileText, HardDrive, Activity, TrendingUp,
  DollarSign, UserPlus, Loader2, Download, ArrowRight,
  CheckCircle, UserCheck, Mail, FileUp,
} from "lucide-react";

interface DashboardData {
  firms: { total: number; active: number; suspended: number; new_this_month: number; by_plan: Record<string, number>; };
  users: { total: number; by_role: Record<string, number>; new_this_month: number; };
  documents: { total: number; this_month: number; by_status: Record<string, number>; };
  storage: { total_bytes: number; total_mb: number; };
  sessions: { active: number; };
  top_firms: any[];
  recent_activity: any[];
  monthly_trends: { month: string; label: string; firms: number; users: number; documents: number }[];
  onboarding: { stages: Record<string, number>; firms: any[] };
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function AdminOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard();
      setData(res.data?.data ?? res.data ?? null);
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>);
  }
  if (!data) {
    return (<div className="text-center py-12"><p className="text-muted-foreground">Failed to load dashboard data.</p></div>);
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const exportTopFirms = () => {
    exportToCSV(data.top_firms, "top_firms", [
      { key: "name", label: "Firm" }, { key: "plan", label: "Plan" }, { key: "status", label: "Status" },
      { key: "client_count", label: "Clients" }, { key: "accountant_count", label: "Accountants" },
      { key: "document_count", label: "Documents" },
    ]);
  };

  // Prepare pie chart data for firms by plan
  const planPieData = Object.entries(data.firms.by_plan).map(([name, value]) => ({ name, value }));
  const docStatusPie = Object.entries(data.documents.by_status).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // Onboarding funnel
  const stages = data.onboarding?.stages || {};
  const stageOrder = [
    { key: "registered", label: "Registered", icon: Building2, color: "text-gray-500" },
    { key: "accountant_added", label: "Accountant Added", icon: UserCheck, color: "text-blue-500" },
    { key: "client_invited", label: "Client Invited", icon: Mail, color: "text-purple-500" },
    { key: "active", label: "Active (Has Docs)", icon: FileUp, color: "text-emerald-500" },
  ];

  const stalledFirms = (data.onboarding?.firms || []).filter((f: any) => f.stage !== "active").slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Platform Overview</h2>
          <p className="text-muted-foreground mt-1">Real-time platform statistics and health metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportTopFirms}>
          <Download className="w-4 h-4 mr-2" /> Export Firms CSV
        </Button>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Firms</p>
                <p className="text-3xl font-bold">{data.firms.total}</p>
                <p className="text-xs text-green-600 mt-1">+{data.firms.new_this_month} this month</p>
              </div>
              <Building2 className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{data.users.total}</p>
                <p className="text-xs text-green-600 mt-1">+{data.users.new_this_month} this month</p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold">{data.documents.total}</p>
                <p className="text-xs text-green-600 mt-1">+{data.documents.this_month} this month</p>
              </div>
              <FileText className="w-10 h-10 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-3xl font-bold">{formatBytes(data.storage.total_bytes)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data.sessions.active} active sessions</p>
              </div>
              <HardDrive className="w-10 h-10 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      {data.monthly_trends && data.monthly_trends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Document Uploads (12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="documents" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Documents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Growth Trends (12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="firms" stroke="#3b82f6" name="New Firms" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="users" stroke="#8b5cf6" name="New Users" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pie Charts + Onboarding Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Firms by Plan Pie */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5" /> Firms by Plan</CardTitle></CardHeader>
          <CardContent>
            {planPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={planPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {planPieData.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Document Status Pie */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5" /> Documents by Status</CardTitle></CardHeader>
          <CardContent>
            {docStatusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={docStatusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${value}`}>
                    {docStatusPie.map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Onboarding Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Onboarding Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageOrder.map((s, idx) => {
                const count = stages[s.key] || 0;
                const pct = data.firms.total > 0 ? Math.round((count / data.firms.total) * 100) : 0;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{s.label}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {stalledFirms.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Stalled Firms (need attention)</p>
                {stalledFirms.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm truncate max-w-[120px]">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{f.stage.replace(/_/g, " ")}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => navigate(`/admin/firms/${f.id}`)}>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Firms Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Top Firms by Clients
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportTopFirms}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.top_firms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No firms yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Firm</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Plan</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Clients</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Accountants</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Documents</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Storage</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_firms.map((firm: any) => (
                    <tr key={firm.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{firm.name}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize">{firm.plan || "free"}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${firm.status === "active" ? "bg-green-100 text-green-700" : firm.status === "suspended" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{firm.status}</span>
                      </td>
                      <td className="py-3 px-2 text-right">{firm.client_count}</td>
                      <td className="py-3 px-2 text-right">{firm.accountant_count}</td>
                      <td className="py-3 px-2 text-right">{firm.document_count}</td>
                      <td className="py-3 px-2 text-right">{formatBytes(firm.storage_bytes || 0)}</td>
                      <td className="py-3 px-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/firms/${firm.id}`)}>
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
