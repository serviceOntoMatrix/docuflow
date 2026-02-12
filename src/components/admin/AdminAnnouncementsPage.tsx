import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  Wrench,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "maintenance";
  target: "all" | "firms" | "accountants" | "clients";
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_by_name: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  info: { icon: Info, color: "bg-blue-100 text-blue-700", label: "Info" },
  warning: { icon: AlertTriangle, color: "bg-amber-100 text-amber-700", label: "Warning" },
  critical: { icon: AlertCircle, color: "bg-red-100 text-red-700", label: "Critical" },
  maintenance: { icon: Wrench, color: "bg-purple-100 text-purple-700", label: "Maintenance" },
};

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", type: "info", target: "all",
    is_active: true, starts_at: "", ends_at: "",
  });

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await adminApi.announcements.list();
      const d = res.data?.data ?? res.data ?? [];
      setAnnouncements(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  };

  const openDialog = (a?: Announcement) => {
    if (a) {
      setEditing(a);
      setForm({
        title: a.title, message: a.message, type: a.type, target: a.target,
        is_active: Boolean(a.is_active),
        starts_at: a.starts_at ? a.starts_at.split("T")[0].split(" ")[0] : "",
        ends_at: a.ends_at ? a.ends_at.split("T")[0].split(" ")[0] : "",
      });
    } else {
      setEditing(null);
      setForm({ title: "", message: "", type: "info", target: "all", is_active: true, starts_at: "", ends_at: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: form.title,
        message: form.message,
        type: form.type,
        target: form.target,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editing) {
        await adminApi.announcements.update(editing.id, data);
      } else {
        await adminApi.announcements.create(data);
      }
      toast({ title: editing ? "Announcement updated" : "Announcement created" });
      setDialogOpen(false);
      loadAnnouncements();
    } catch {
      toast({ title: "Error", description: "Failed to save announcement", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (a: Announcement) => {
    if (!window.confirm(`Delete announcement "${a.title}"?`)) return;
    try {
      await adminApi.announcements.delete(a.id);
      toast({ title: "Announcement deleted" });
      loadAnnouncements();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await adminApi.announcements.update(a.id, { is_active: !a.is_active });
      loadAnnouncements();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="w-8 h-8" />
            Announcements
          </h2>
          <p className="text-muted-foreground">Broadcast messages to all firms, accountants, or clients.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" /> New Announcement
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => {
                  const tc = typeConfig[a.type] || typeConfig.info;
                  const TypeIcon = tc.icon;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">{a.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${tc.color} hover:opacity-90`}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {tc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{a.target}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={Boolean(a.is_active)} onCheckedChange={() => toggleActive(a)} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.starts_at && <div>From: {new Date(a.starts_at).toLocaleDateString()}</div>}
                        {a.ends_at && <div>Until: {new Date(a.ends_at).toLocaleDateString()}</div>}
                        {!a.starts_at && !a.ends_at && "Always"}
                      </TableCell>
                      <TableCell className="text-sm">{a.created_by_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openDialog(a)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(a)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={4} placeholder="Announcement message..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Select value={form.target} onValueChange={(v) => setForm(f => ({ ...f, target: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="firms">Firm Owners Only</SelectItem>
                    <SelectItem value="accountants">Accountants Only</SelectItem>
                    <SelectItem value="clients">Clients Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date (optional)</Label>
                <Input type="date" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))} />
              </div>
              <div>
                <Label>End Date (optional)</Label>
                <Input type="date" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active immediately</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
