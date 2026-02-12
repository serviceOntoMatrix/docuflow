import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { exportToCSV } from "@/lib/csv-export";
import {
  Search,
  BarChart3,
  Users,
  FileText,
  DollarSign,
  HardDrive,
  Loader2,
  Building2,
  TrendingUp,
  Calendar,
  Download,
} from "lucide-react";

interface FirmUsage {
  id: string;
  name: string;
  plan: string;
  status: string;
  clients_count: number;
  accountants_count: number;
  total_documents: number;
  documents_this_period: number;
  storage_bytes: number;
  storage_mb: number;
  estimated_bill: number;
  created_at: string;
}

interface Totals {
  total_clients: number;
  total_documents: number;
  documents_this_period: number;
  estimated_revenue: number;
  total_storage_bytes: number;
  total_storage_mb: number;
}

export default function AdminUsagePage() {
  const [firmsUsage, setFirmsUsage] = useState<FirmUsage[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("current_month");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsage();
  }, [period]);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const res = await adminApi.usage.getAll(period);
      const raw = res.data?.data ?? res.data;
      if (raw) {
        setFirmsUsage(raw.firms || []);
        setTotals(raw.totals || null);
      }
    } catch (error) {
      console.error("Failed to load usage:", error);
    }
    setLoading(false);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const filteredFirms = firmsUsage.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.plan || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Usage & Billing</h2>
          <p className="text-muted-foreground">
            Track portal usage per firm. Billing: base price + per-client + per-document charges.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          exportToCSV(filteredFirms, "usage_billing", [
            { key: "name", label: "Firm" }, { key: "plan", label: "Plan" }, { key: "status", label: "Status" },
            { key: "clients_count", label: "Clients" }, { key: "accountants_count", label: "Accountants" },
            { key: "total_documents", label: "Total Docs" }, { key: "documents_this_period", label: "Period Docs" },
            { key: "storage_mb", label: "Storage (MB)" }, { key: "estimated_bill", label: "Est. Bill ($)" },
          ]);
        }}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{totals.total_clients}</p>
                  <p className="text-xs text-muted-foreground">Total Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{totals.total_documents}</p>
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{totals.documents_this_period}</p>
                  <p className="text-xs text-muted-foreground">Docs This Period</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{formatBytes(totals.total_storage_bytes)}</p>
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">${totals.estimated_revenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Est. Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search firms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Firm Usage & Estimated Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFirms.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No usage data available</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firm</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Accountants</TableHead>
                    <TableHead className="text-right">Total Docs</TableHead>
                    <TableHead className="text-right">Period Docs</TableHead>
                    <TableHead className="text-right">Storage</TableHead>
                    <TableHead className="text-right">Est. Bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFirms.map((firm) => (
                    <TableRow key={firm.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{firm.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{firm.plan || "free"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          firm.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          "bg-red-100 text-red-700 hover:bg-red-100"
                        }>
                          {firm.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{firm.clients_count}</TableCell>
                      <TableCell className="text-right">{firm.accountants_count}</TableCell>
                      <TableCell className="text-right">{firm.total_documents}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-amber-600 font-medium">{firm.documents_this_period}</span>
                      </TableCell>
                      <TableCell className="text-right">{formatBytes(firm.storage_bytes)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-emerald-600">
                          ${firm.estimated_bill?.toFixed(2) || "0.00"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Billing Model Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Billing Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-semibold mb-1">Base Price</p>
              <p className="text-muted-foreground">
                Fixed monthly fee per plan tier. Covers basic platform access.
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-semibold mb-1">Per Client Charge</p>
              <p className="text-muted-foreground">
                Charged for each active client registered under a firm. Scales with firm growth.
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-semibold mb-1">Per Document Charge</p>
              <p className="text-muted-foreground">
                Charged per document uploaded/transferred. Tracks actual document throughput.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
