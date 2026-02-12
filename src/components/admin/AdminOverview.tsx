import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import {
  Building2,
  Users,
  FileText,
  HardDrive,
  Activity,
  TrendingUp,
  DollarSign,
  UserPlus,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface DashboardData {
  firms: {
    total: number;
    active: number;
    suspended: number;
    new_this_month: number;
    by_plan: Record<string, number>;
  };
  users: {
    total: number;
    by_role: Record<string, number>;
    new_this_month: number;
  };
  documents: {
    total: number;
    this_month: number;
    by_status: Record<string, number>;
  };
  storage: {
    total_bytes: number;
    total_mb: number;
  };
  sessions: {
    active: number;
  };
  top_firms: any[];
  recent_activity: any[];
}

export default function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard();
      if (res.data?.data) {
        setData(res.data.data);
      } else if (res.data) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data. Make sure the admin API is accessible.</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Platform Overview</h2>
        <p className="text-muted-foreground mt-1">Real-time platform statistics and health metrics</p>
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

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.users.by_role).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      role === "super_admin" ? "bg-red-500" :
                      role === "firm" ? "bg-blue-500" :
                      role === "accountant" ? "bg-purple-500" : "bg-green-500"
                    }`} />
                    <span className="capitalize text-sm">{role.replace("_", " ")}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Firms by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Firms by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.firms.by_plan).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{plan}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${data.firms.total > 0 ? (count / data.firms.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-semibold text-sm w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Documents by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.documents.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === "posted" ? "bg-emerald-500" :
                      status === "pending" ? "bg-amber-500" :
                      status === "clarification_needed" ? "bg-red-500" : "bg-blue-500"
                    }`} />
                    <span className="capitalize text-sm">{status.replace("_", " ")}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Firms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Firms by Clients
          </CardTitle>
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
                  </tr>
                </thead>
                <tbody>
                  {data.top_firms.map((firm: any) => (
                    <tr key={firm.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{firm.name}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize">
                          {firm.plan || "free"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          firm.status === "active" ? "bg-green-100 text-green-700" :
                          firm.status === "suspended" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {firm.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">{firm.client_count}</td>
                      <td className="py-3 px-2 text-right">{firm.accountant_count}</td>
                      <td className="py-3 px-2 text-right">{firm.document_count}</td>
                      <td className="py-3 px-2 text-right">{formatBytes(firm.storage_bytes || 0)}</td>
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
