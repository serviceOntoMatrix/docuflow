import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import {
  Settings,
  DollarSign,
  Loader2,
  Save,
  Plus,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_clients: number | null;
  max_accountants: number | null;
  max_documents_per_month: number | null;
  max_storage_mb: number | null;
  price_per_client: number;
  price_per_document: number;
  base_price: number;
  billing_cycle: string;
  is_active: boolean;
  firms_count: number;
  sort_order: number;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  // Plan edit dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "", slug: "", description: "",
    max_clients: "", max_accountants: "", max_documents_per_month: "", max_storage_mb: "",
    price_per_client: "0", price_per_document: "0", base_price: "0",
    billing_cycle: "monthly", is_active: true, sort_order: "0",
  });
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPlans();
  }, []);

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await adminApi.settings.get();
      const raw = res.data?.data ?? res.data ?? [];
      const obj: Record<string, string> = {};
      if (Array.isArray(raw)) {
        raw.forEach((s: PlatformSetting) => { obj[s.setting_key] = s.setting_value; });
      }
      setSettings(obj);
    } catch {}
    setLoadingSettings(false);
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await adminApi.plans.list();
      const d = res.data?.data ?? res.data ?? [];
      setPlans(Array.isArray(d) ? d : []);
    } catch {}
    setLoadingPlans(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await adminApi.settings.update(settings);
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
    setSavingSettings(false);
  };

  const openPlanDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name, slug: plan.slug, description: plan.description || "",
        max_clients: plan.max_clients !== null ? String(plan.max_clients) : "",
        max_accountants: plan.max_accountants !== null ? String(plan.max_accountants) : "",
        max_documents_per_month: plan.max_documents_per_month !== null ? String(plan.max_documents_per_month) : "",
        max_storage_mb: plan.max_storage_mb !== null ? String(plan.max_storage_mb) : "",
        price_per_client: String(plan.price_per_client), price_per_document: String(plan.price_per_document),
        base_price: String(plan.base_price), billing_cycle: plan.billing_cycle,
        is_active: Boolean(plan.is_active), sort_order: String(plan.sort_order),
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "", slug: "", description: "",
        max_clients: "", max_accountants: "", max_documents_per_month: "", max_storage_mb: "",
        price_per_client: "0", price_per_document: "0", base_price: "0",
        billing_cycle: "monthly", is_active: true, sort_order: "0",
      });
    }
    setPlanDialogOpen(true);
  };

  const savePlan = async () => {
    setSavingPlan(true);
    try {
      const data = {
        name: planForm.name,
        slug: planForm.slug,
        description: planForm.description || null,
        max_clients: planForm.max_clients ? parseInt(planForm.max_clients) : null,
        max_accountants: planForm.max_accountants ? parseInt(planForm.max_accountants) : null,
        max_documents_per_month: planForm.max_documents_per_month ? parseInt(planForm.max_documents_per_month) : null,
        max_storage_mb: planForm.max_storage_mb ? parseInt(planForm.max_storage_mb) : null,
        price_per_client: parseFloat(planForm.price_per_client) || 0,
        price_per_document: parseFloat(planForm.price_per_document) || 0,
        base_price: parseFloat(planForm.base_price) || 0,
        billing_cycle: planForm.billing_cycle,
        is_active: planForm.is_active ? 1 : 0,
        sort_order: parseInt(planForm.sort_order) || 0,
      };
      
      if (editingPlan) {
        await adminApi.plans.update(editingPlan.id, data);
      } else {
        await adminApi.plans.create(data);
      }
      toast({ title: editingPlan ? "Plan updated" : "Plan created" });
      setPlanDialogOpen(false);
      loadPlans();
    } catch {
      toast({ title: "Error", description: "Failed to save plan", variant: "destructive" });
    }
    setSavingPlan(false);
  };

  const deletePlan = async (plan: Plan) => {
    if (plan.firms_count > 0) {
      toast({ title: "Cannot delete", description: `${plan.firms_count} firms are using this plan`, variant: "destructive" });
      return;
    }
    if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      await adminApi.plans.delete(plan.id);
      toast({ title: "Plan deleted" });
      loadPlans();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold">Platform Settings</h2>
        <p className="text-muted-foreground">Configure global platform settings and manage subscription plans.</p>
      </div>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Platform Name</Label>
                  <Input value={settings.platform_name || ""} onChange={(e) => updateSetting("platform_name", e.target.value)} />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input value={settings.support_email || ""} onChange={(e) => updateSetting("support_email", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Platform Description</Label>
                  <Input value={settings.platform_description || ""} onChange={(e) => updateSetting("platform_description", e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Default Plan for New Firms</Label>
                  <Input value={settings.default_plan || "free"} onChange={(e) => updateSetting("default_plan", e.target.value)} />
                </div>
                <div>
                  <Label>Default Theme</Label>
                  <Input value={settings.default_theme || "default"} onChange={(e) => updateSetting("default_theme", e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.allow_self_registration === "true"}
                    onCheckedChange={(v) => updateSetting("allow_self_registration", v ? "true" : "false")}
                  />
                  <Label>Allow Self-Registration</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.require_email_verification === "true"}
                    onCheckedChange={(v) => updateSetting("require_email_verification", v ? "true" : "false")}
                  />
                  <Label>Require Email Verification</Label>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Subscription Plans
            </CardTitle>
            <Button size="sm" onClick={() => openPlanDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Add Plan
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage billing plans. Each firm is charged: Base Price + (Clients x Per-Client) + (Documents x Per-Document).
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Base $/mo</TableHead>
                  <TableHead className="text-right">$/Client</TableHead>
                  <TableHead className="text-right">$/Document</TableHead>
                  <TableHead className="text-right">Max Clients</TableHead>
                  <TableHead className="text-right">Max Docs/mo</TableHead>
                  <TableHead className="text-center">Firms</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">${Number(plan.base_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${Number(plan.price_per_client).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">${Number(plan.price_per_document).toFixed(4)}</TableCell>
                    <TableCell className="text-right">{plan.max_clients ?? "∞"}</TableCell>
                    <TableCell className="text-right">{plan.max_documents_per_month ?? "∞"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{plan.firms_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Yes</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openPlanDialog(plan)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deletePlan(plan)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Plan Edit Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {editingPlan ? "Edit Plan" : "Create Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name *</Label>
                <Input value={planForm.name} onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Professional" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={planForm.slug} onChange={(e) => setPlanForm(p => ({ ...p, slug: e.target.value }))} placeholder="e.g. professional" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={planForm.description} onChange={(e) => setPlanForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <Separator />
            <p className="text-sm font-semibold">Pricing</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Base Price ($/mo)</Label>
                <Input type="number" step="0.01" value={planForm.base_price} onChange={(e) => setPlanForm(p => ({ ...p, base_price: e.target.value }))} />
              </div>
              <div>
                <Label>Per Client ($)</Label>
                <Input type="number" step="0.01" value={planForm.price_per_client} onChange={(e) => setPlanForm(p => ({ ...p, price_per_client: e.target.value }))} />
              </div>
              <div>
                <Label>Per Document ($)</Label>
                <Input type="number" step="0.0001" value={planForm.price_per_document} onChange={(e) => setPlanForm(p => ({ ...p, price_per_document: e.target.value }))} />
              </div>
            </div>
            <Separator />
            <p className="text-sm font-semibold">Limits (leave blank for unlimited)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Max Clients</Label>
                <Input type="number" value={planForm.max_clients} onChange={(e) => setPlanForm(p => ({ ...p, max_clients: e.target.value }))} placeholder="∞" />
              </div>
              <div>
                <Label>Max Accountants</Label>
                <Input type="number" value={planForm.max_accountants} onChange={(e) => setPlanForm(p => ({ ...p, max_accountants: e.target.value }))} placeholder="∞" />
              </div>
              <div>
                <Label>Max Docs/Month</Label>
                <Input type="number" value={planForm.max_documents_per_month} onChange={(e) => setPlanForm(p => ({ ...p, max_documents_per_month: e.target.value }))} placeholder="∞" />
              </div>
              <div>
                <Label>Max Storage (MB)</Label>
                <Input type="number" value={planForm.max_storage_mb} onChange={(e) => setPlanForm(p => ({ ...p, max_storage_mb: e.target.value }))} placeholder="∞" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={planForm.sort_order} onChange={(e) => setPlanForm(p => ({ ...p, sort_order: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={planForm.is_active} onCheckedChange={(v) => setPlanForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={savePlan} disabled={savingPlan || !planForm.name || !planForm.slug}>
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
