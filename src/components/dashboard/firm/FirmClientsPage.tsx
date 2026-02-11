import { useState, useEffect } from "react";
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
import { Users, Search, Filter, Mail, Building, UserCheck, Grid3x3, List, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { companiesApi } from "@/lib/api";

interface Client {
  id: string;
  user_id: string;
  company_name: string | null;
  assigned_accountant_id: string | null;
  profiles: { full_name: string | null; email: string } | null;
  documentCount?: number;
}

interface Accountant {
  id: string;
  accountant_id: string;
  profiles: { full_name: string | null; email: string } | null;
}

interface FirmClientsPageProps {
  clients: Client[];
  accountants: Accountant[];
  onAssignAccountant: (clientId: string, accountantId: string) => void;
}

export default function FirmClientsPage({ clients, accountants, onAssignAccountant }: FirmClientsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccountant, setFilterAccountant] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [clientCompanies, setClientCompanies] = useState<Record<string, Array<{ id: string; company_name: string }>>>({});
  const [viewCompaniesDialogOpen, setViewCompaniesDialogOpen] = useState(false);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterAccountant === "all" ||
      (filterAccountant === "unassigned" && !client.assigned_accountant_id) ||
      client.assigned_accountant_id === filterAccountant;

    return matchesSearch && matchesFilter;
  });

  const getAssignedAccountantName = (accountantId: string | null) => {
    if (!accountantId) return "Unassigned";
    const acc = accountants.find((a) => a.accountant_id === accountantId);
    return acc?.profiles?.full_name || acc?.profiles?.email || "Unknown";
  };

  useEffect(() => {
    // Fetch companies for all clients
    const fetchAllCompanies = async () => {
      const companiesMap: Record<string, Array<{ id: string; company_name: string }>> = {};
      for (const client of clients) {
        try {
          const res = await companiesApi.getByClient(client.id);
          if (res.data) {
            companiesMap[client.id] = res.data as Array<{ id: string; company_name: string }>;
          }
        } catch (error) {
          console.error(`Error fetching companies for client ${client.id}:`, error);
        }
      }
      setClientCompanies(companiesMap);
    };
    if (clients.length > 0) {
      fetchAllCompanies();
    }
  }, [clients]);

  const handleViewCompanies = (clientId: string) => {
    setViewingClientId(clientId);
    setViewCompaniesDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="text-muted-foreground">{clients.length} total clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={filterAccountant} onValueChange={setFilterAccountant}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by accountant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {accountants.map((acc) => (
                  <SelectItem key={acc.accountant_id} value={acc.accountant_id}>
                    {acc.profiles?.full_name || acc.profiles?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card className="shadow-md border-border/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterAccountant !== "all"
                  ? "No clients match your filters"
                  : "No clients yet. Invite your first client to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="shadow-md border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-accent font-semibold text-lg">
                      {client.profiles?.full_name?.charAt(0) || client.profiles?.email?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {client.profiles?.full_name || "Unnamed Client"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{client.profiles?.email}</span>
                    </div>
                    {client.company_name && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <Building className="w-3.5 h-3.5" />
                        <span className="truncate">{client.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      Assigned to
                    </span>
                    <Badge variant={client.assigned_accountant_id ? "default" : "secondary"}>
                      {getAssignedAccountantName(client.assigned_accountant_id)}
                    </Badge>
                  </div>
                  
                  <Select
                    value={client.assigned_accountant_id || "unassigned"}
                    onValueChange={(v) => onAssignAccountant(client.id, v === "unassigned" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assign accountant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {accountants.map((acc) => (
                        <SelectItem key={acc.accountant_id} value={acc.accountant_id}>
                          {acc.profiles?.full_name || acc.profiles?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewCompanies(client.id)}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    View Companies ({clientCompanies[client.id]?.length || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-md border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Assigned Accountant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <span className="text-accent font-medium text-sm">
                            {client.profiles?.full_name?.charAt(0) || client.profiles?.email?.charAt(0) || "?"}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">
                          {client.profiles?.full_name || "Unnamed Client"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{client.profiles?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building className="w-3.5 h-3.5" />
                        <span className="truncate">{client.company_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={client.assigned_accountant_id || "unassigned"}
                        onValueChange={(v) => onAssignAccountant(client.id, v === "unassigned" ? "" : v)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Assign accountant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {accountants.map((acc) => (
                            <SelectItem key={acc.accountant_id} value={acc.accountant_id}>
                              {acc.profiles?.full_name || acc.profiles?.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCompanies(client.id)}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        View ({clientCompanies[client.id]?.length || 0})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


      {/* View Companies Dialog */}
      <Dialog open={viewCompaniesDialogOpen} onOpenChange={setViewCompaniesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Companies for {clients.find(c => c.id === viewingClientId)?.profiles?.full_name || "Client"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingClientId && clientCompanies[viewingClientId] ? (
              clientCompanies[viewingClientId].length > 0 ? (
                <div className="space-y-2">
                  {clientCompanies[viewingClientId].map((company) => (
                    <div key={company.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-primary" />
                        <span className="font-medium">{company.company_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No companies added yet</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
