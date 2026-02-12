import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import {
  Search,
  Filter,
  Building2,
  Users,
  FileText,
  HardDrive,
  Loader2,
  Pencil,
  Ban,
  CheckCircle,
  Trash2,
  BarChart3,
  Eye,
} from "lucide-react";

interface Firm {
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
  notes: string | null;
}

export default function AdminFirmsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [editFirm, setEditFirm] = useState<Firm | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editMaxClients, setEditMaxClients] = useState("");
  const [editMaxAccountants, setEditMaxAccountants] = useState("");
  const [editMaxDocs, setEditMaxDocs] = useState("");
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    loadFirms();
    loadPlans();
  }, []);

  const loadFirms = async () => {
    setLoading(true);
    try {
      const res = await adminApi.firms.list({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        plan: planFilter !== "all" ? planFilter : undefined,
      });
      const d = res.data?.data ?? res.data ?? [];
      setFirms(Array.isArray(d) ? d : []);
    } catch (error) {
      console.error("Failed to load firms:", error);
    }
    setLoading(false);
  };

  const loadPlans = async () => {
    try {
      const res = await adminApi.plans.list();
      const d = res.data?.data ?? res.data ?? [];
      setPlans(Array.isArray(d) ? d : []);
    } catch {}
  };

  useEffect(() => {
    const t = setTimeout(loadFirms, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, planFilter]);

  const openEditDialog = (firm: Firm) => {
    setEditFirm(firm);
    setEditPlan(firm.plan || "free");
    setEditNotes(firm.notes || "");
    setEditMaxClients(firm.max_clients !== null ? String(firm.max_clients) : "");
    setEditMaxAccountants(firm.max_accountants !== null ? String(firm.max_accountants) : "");
    setEditMaxDocs(firm.max_documents_per_month !== null ? String(firm.max_documents_per_month) : "");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editFirm) return;
    setSaving(true);
    try {
      await adminApi.firms.update(editFirm.id, {
        plan: editPlan,
        notes: editNotes || null,
        max_clients: editMaxClients ? parseInt(editMaxClients) : null,
        max_accountants: editMaxAccountants ? parseInt(editMaxAccountants) : null,
        max_documents_per_month: editMaxDocs ? parseInt(editMaxDocs) : null,
      });
      toast({ title: "Firm updated" });
      setEditDialogOpen(false);
      loadFirms();
    } catch {
      toast({ title: "Error", description: "Failed to update firm", variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleSuspend = async (firm: Firm) => {
    const newStatus = firm.status === "suspended" ? "active" : "suspended";
    const confirmed = window.confirm(
      newStatus === "suspended"
        ? `Suspend "${firm.name}"? They will lose access.`
        : `Reactivate "${firm.name}"?`
    );
    if (!confirmed) return;

    try {
      await adminApi.firms.update(firm.id, { status: newStatus });
      toast({ title: `Firm ${newStatus === "suspended" ? "suspended" : "reactivated"}` });
      loadFirms();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (firm: Firm) => {
    const confirmed = window.confirm(
      `DELETE "${firm.name}" and ALL associated data (clients, documents, etc.)? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await adminApi.firms.delete(firm.id);
      toast({ title: "Firm deleted" });
      loadFirms();
    } catch {
      toast({ title: "Error", description: "Failed to delete firm", variant: "destructive" });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Firms Management</h2>
        <p className="text-muted-foreground">{firms.length} firm{firms.length !== 1 ? "s" : ""} registered</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search firms or owners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : firms.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No firms found</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firm</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Docs</TableHead>
                    <TableHead className="text-right">Storage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firms.map((firm) => (
                    <TableRow key={firm.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{firm.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{firm.owner_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{firm.owner_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{firm.plan || "free"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          firm.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          firm.status === "suspended" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                          "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        }>
                          {firm.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{firm.clients_count}</TableCell>
                      <TableCell className="text-right">{firm.documents_count}</TableCell>
                      <TableCell className="text-right">{formatBytes(firm.storage_bytes)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(firm.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/firms/${firm.id}`)} title="View Detail & Pricing">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(firm)} title="Quick Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSuspend(firm)}
                            title={firm.status === "suspended" ? "Reactivate" : "Suspend"}
                          >
                            {firm.status === "suspended" ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Ban className="w-4 h-4 text-amber-600" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(firm)} title="Delete">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Firm: {editFirm?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name} — ${p.base_price}/mo</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
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
            </div>
            <div>
              <Label>Admin Notes</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
