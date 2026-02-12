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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import {
  Search,
  Filter,
  ScrollText,
  Loader2,
  Shield,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.audit.list({
        search: search || undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        page,
        per_page: 50,
      });
      const raw = res.data;
      setLogs(raw?.data ?? []);
      setActions(raw?.actions ?? []);
      if (raw?.pagination) {
        setTotalPages(raw.pagination.total_pages || 1);
        setTotal(raw.pagination.total || 0);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadLogs(); }, 300);
    return () => clearTimeout(t);
  }, [search, actionFilter]);

  const actionColor = (action: string) => {
    if (action.includes("delete")) return "bg-red-100 text-red-700";
    if (action.includes("create")) return "bg-green-100 text-green-700";
    if (action.includes("update")) return "bg-blue-100 text-blue-700";
    if (action.includes("suspend")) return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  const parseDetails = (details: string | null): string => {
    if (!details) return "—";
    try {
      const obj = typeof details === "string" ? JSON.parse(details) : details;
      if (Array.isArray(obj)) return obj.join(", ");
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(", ");
    } catch {
      return String(details).substring(0, 100);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <ScrollText className="w-8 h-8" />
          Audit Logs
        </h2>
        <p className="text-muted-foreground">{total} total log entries. All admin actions are recorded.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by user or action..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
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
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <ScrollText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{log.user_name || "System"}</p>
                              <p className="text-xs text-muted-foreground">{log.user_email || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionColor(log.action)} hover:opacity-90`}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.entity_type ? (
                            <span className="text-sm">
                              <span className="capitalize">{log.entity_type}</span>
                              {log.entity_id && (
                                <span className="text-xs text-muted-foreground ml-1 font-mono">
                                  {log.entity_id.substring(0, 8)}...
                                </span>
                              )}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-[200px] truncate" title={parseDetails(log.details)}>
                            {parseDetails(log.details)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">{log.ip_address || "—"}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
