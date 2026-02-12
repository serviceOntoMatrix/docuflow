import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  HardDrive,
  DollarSign,
  Save,
  Loader2,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface FirmDetail {
  id: string;
  name: string;
  owner_email: string;
  owner_name: string;
  status: string;
  plan: string;
  clients_count: number;
  accountants_count: number;
  documents_count: number;
  storage_bytes: number;
  created_at: string;
  max_clients: number | null;
  max_accountants: number | null;
  max_documents_per_month: number | null;
  max_storage_mb: number | null;
  notes: string | null;
  custom_base_price: number | null;
  custom_price_per_client: number | null;
  custom_price_per_document: number | null;
  billing_notes: string | null;
  billing_status: string | null;
  trial_ends_at: string | null;
}

export default function AdminFirmDetail({ firmId }: { firmId: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firm, setFirm] = useState<FirmDetail | null>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [editPlan, setEditPlan] = useState("");
  const [editMaxClients, setEditMaxClients] = useState("");
  const [editMaxAccountants, setEditMaxAccountants] = useState("");
  const [editMaxDocs, setEditMaxDocs] = useState("");
  const [editMaxStorage, setEditMaxStorage] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editBillingStatus, setEditBillingStatus] = useState("active");
  const [editBillingNotes, setEditBillingNotes] = useState("");
  const [editTrialEnds, setEditTrialEnds] = useState("");
  // Custom pricing
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  const [customBasePrice, setCustomBasePrice] = useState("");
  const [customPerClient, setCustomPerClient] = useState("");
  const [customPerDocument, setCustomPerDocument] = useState("");

  useEffect(() => {
    loadData();
  }, [firmId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [firmRes, usageRes, plansRes] = await Promise.all([
        adminApi.firms.get(firmId),
        adminApi.usage.getByFirm(firmId),
        adminApi.plans.list(),
      ]);

      const f = firmRes.data?.data ?? firmRes.data;
      if (f) {
        setFirm(f);
        setEditPlan(f.plan || "free");
        setEditMaxClients(f.max_clients != null ? String(f.max_clients) : "");
        setEditMaxAccountants(f.max_accountants != null ? String(f.max_accountants) : "");
        setEditMaxDocs(f.max_documents_per_month != null ? String(f.max_documents_per_month) : "");
        setEditMaxStorage(f.max_storage_mb != null ? String(f.max_storage_mb) : "");
        setEditNotes(f.notes || "");
        setEditBillingStatus(f.billing_status || "active");
        setEditBillingNotes(f.billing_notes || "");
        setEditTrialEnds(f.trial_ends_at ? f.trial_ends_at.split("T")[0].split(" ")[0] : "");
        const hasCustom = f.custom_base_price != null || f.custom_price_per_client != null || f.custom_price_per_document != null;
        setUseCustomPricing(hasCustom);
        setCustomBasePrice(f.custom_base_price != null ? String(f.custom_base_price) : "");
        setCustomPerClient(f.custom_price_per_client != null ? String(f.custom_price_per_client) : "");
        setCustomPerDocument(f.custom_price_per_document != null ? String(f.custom_price_per_document) : "");
      }

      const u = usageRes.data?.data ?? usageRes.data;
      if (u) setUsageData(u);

      const p = plansRes.data?.data ?? plansRes.data ?? [];
      setPlans(Array.isArray(p) ? p : []);
    } catch (error) {
      console.error("Failed to load firm:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!firm) return;
    setSaving(true);
    try {
      await adminApi.firms.update(firm.id, {
        plan: editPlan,
        max_clients: editMaxClients ? parseInt(editMaxClients) : null,
        max_accountants: editMaxAccountants ? parseInt(editMaxAccountants) : null,
        max_documents_per_month: editMaxDocs ? parseInt(editMaxDocs) : null,
        max_storage_mb: editMaxStorage ? parseInt(editMaxStorage) : null,
        notes: editNotes || null,
        billing_status: editBillingStatus,
        billing_notes: editBillingNotes || null,
        trial_ends_at: editTrialEnds || null,
        custom_base_price: useCustomPricing && customBasePrice ? parseFloat(customBasePrice) : null,
        custom_price_per_client: useCustomPricing && customPerClient ? parseFloat(customPerClient) : null,
        custom_price_per_document: useCustomPricing && customPerDocument ? parseFloat(customPerDocument) : null,
      });
      toast({ title: "Firm updated successfully" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to update firm", variant: "destructive" });
    }
    setSaving(false);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!firm) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Firm not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/firms")}>Back to Firms</Button>
      </div>
    );
  }

  const billing = usageData?.billing_estimate;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/firms")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            {firm.name}
          </h2>
          <p className="text-muted-foreground">
            Owner: {firm.owner_name || "—"} ({firm.owner_email}) | Created: {new Date(firm.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={firm.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
          {firm.status}
        </Badge>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{firm.clients_count}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{firm.accountants_count}</p>
              <p className="text-xs text-muted-foreground">Accountants</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{firm.documents_count}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{formatBytes(firm.storage_bytes || 0)}</p>
              <p className="text-xs text-muted-foreground">Storage</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Estimate */}
      {billing && (
        <Card className="border-2 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Current Period Billing Estimate
              {billing.is_custom_pricing && (
                <Badge className="bg-amber-100 text-amber-700 ml-2">Custom Pricing</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Base Price</p>
                <p className="text-xl font-bold">${billing.base_price?.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Client Charge ({billing.client_count} x ${billing.price_per_client?.toFixed(2)})</p>
                <p className="text-xl font-bold">${billing.client_charge?.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Document Charge ({billing.document_count} x ${billing.price_per_document?.toFixed(4)})</p>
                <p className="text-xl font-bold">${billing.document_charge?.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium">Estimated Total</p>
                <p className="text-2xl font-bold text-emerald-700">${billing.estimated_total?.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subscription Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name} — ${Number(p.base_price).toFixed(2)}/mo</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Billing Status</Label>
              <Select value={editBillingStatus} onValueChange={setEditBillingStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Max Clients</Label>
              <Input type="number" value={editMaxClients} onChange={(e) => setEditMaxClients(e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <Label>Max Accountants</Label>
              <Input type="number" value={editMaxAccountants} onChange={(e) => setEditMaxAccountants(e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <Label>Max Docs/Month</Label>
              <Input type="number" value={editMaxDocs} onChange={(e) => setEditMaxDocs(e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <Label>Max Storage (MB)</Label>
              <Input type="number" value={editMaxStorage} onChange={(e) => setEditMaxStorage(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          {editBillingStatus === "trial" && (
            <div className="max-w-xs">
              <Label>Trial Ends At</Label>
              <Input type="date" value={editTrialEnds} onChange={(e) => setEditTrialEnds(e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Pricing Override */}
      <Card className="border-2 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Custom Pricing Override
            </CardTitle>
            <div className="flex items-center gap-2">
              <Switch checked={useCustomPricing} onCheckedChange={setUseCustomPricing} />
              <Label className="text-sm">{useCustomPricing ? "Enabled" : "Using plan defaults"}</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, these rates override the plan defaults for this firm only.
          </p>
        </CardHeader>
        {useCustomPricing && (
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700">
                Custom prices will be used instead of the plan's default rates for billing calculations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Custom Base Price ($/month)</Label>
                <Input type="number" step="0.01" value={customBasePrice} onChange={(e) => setCustomBasePrice(e.target.value)} placeholder="Plan default" />
                {billing && <p className="text-xs text-muted-foreground mt-1">Plan default: ${billing.plan_base_price?.toFixed(2)}</p>}
              </div>
              <div>
                <Label>Custom Price per Client ($)</Label>
                <Input type="number" step="0.01" value={customPerClient} onChange={(e) => setCustomPerClient(e.target.value)} placeholder="Plan default" />
                {billing && <p className="text-xs text-muted-foreground mt-1">Plan default: ${billing.plan_per_client?.toFixed(2)}</p>}
              </div>
              <div>
                <Label>Custom Price per Document ($)</Label>
                <Input type="number" step="0.0001" value={customPerDocument} onChange={(e) => setCustomPerDocument(e.target.value)} placeholder="Plan default" />
                {billing && <p className="text-xs text-muted-foreground mt-1">Plan default: ${billing.plan_per_document?.toFixed(4)}</p>}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Internal Notes</Label>
            <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal admin notes about this firm..." rows={3} />
          </div>
          <div>
            <Label>Billing Notes</Label>
            <Textarea value={editBillingNotes} onChange={(e) => setEditBillingNotes(e.target.value)} placeholder="Notes about billing arrangements..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/admin/firms")}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
