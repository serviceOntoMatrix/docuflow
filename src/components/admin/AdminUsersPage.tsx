import { useEffect, useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import {
  Search,
  Filter,
  Users,
  Loader2,
  Pencil,
  Trash2,
  KeyRound,
  Shield,
  Building2,
  UserCircle,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  firm_name: string | null;
  firm_id: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 0 });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.users.list({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        page,
        per_page: 50,
      });
      const raw = res.data;
      const d = raw?.data ?? raw ?? [];
      setUsers(Array.isArray(d) ? d : []);
      if (raw?.pagination) setPagination(raw.pagination);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => loadUsers(1), 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const openEditDialog = (u: User) => {
    setEditUser(u);
    setEditName(u.full_name || "");
    setEditEmail(u.email);
    setEditPhone(u.phone || "");
    setNewPassword("");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const data: any = {
        full_name: editName,
        email: editEmail,
        phone: editPhone || null,
      };
      if (newPassword.trim()) {
        data.new_password = newPassword;
      }
      await adminApi.users.update(editUser.id, data);
      toast({ title: "User updated" });
      setEditDialogOpen(false);
      loadUsers();
    } catch {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (u: User) => {
    if (u.role === "super_admin") {
      toast({ title: "Cannot delete Super Admin", variant: "destructive" });
      return;
    }
    const confirmed = window.confirm(`Delete user "${u.email}"? This will remove all their data.`);
    if (!confirmed) return;

    try {
      await adminApi.users.delete(u.id);
      toast({ title: "User deleted" });
      loadUsers();
    } catch {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-red-100 text-red-700";
      case "firm": return "bg-blue-100 text-blue-700";
      case "accountant": return "bg-purple-100 text-purple-700";
      case "client": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Users Management</h2>
        <p className="text-muted-foreground">{pagination.total || users.length} user{(pagination.total || users.length) !== 1 ? "s" : ""} registered</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="firm">Firm Owner</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
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
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Firm</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {u.role === "super_admin" ? (
                              <Shield className="w-4 h-4 text-red-500" />
                            ) : (
                              <UserCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColor(u.role)} capitalize hover:opacity-90`}>
                          {u.role?.replace("_", " ") || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.firm_name ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">{u.firm_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(u)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {u.role !== "super_admin" && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
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
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="border-t pt-4">
              <Label className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Reset Password
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Setting a new password will invalidate all active sessions.</p>
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
