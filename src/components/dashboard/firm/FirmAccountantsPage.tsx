import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Mail, Users, FileText, Grid3x3, List, UserPlus, Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { invitesApi } from "@/lib/api";

interface Accountant {
  id: string;
  accountant_id: string;
  profiles: { full_name: string | null; email: string } | null;
  clientCount?: number;
}

interface Client {
  id: string;
  user_id: string;
  company_name: string | null;
  assigned_accountant_id: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

interface FirmAccountantsPageProps {
  accountants: Accountant[];
  clientsByAccountant: Record<string, number>;
  clients?: Client[];
}

export default function FirmAccountantsPage({ accountants, clientsByAccountant, clients = [] }: FirmAccountantsPageProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountant, setSelectedAccountant] = useState<Accountant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteType, setInviteType] = useState<"accountant" | "client">("accountant");
  const [loading, setLoading] = useState(false);

  const filteredAccountants = accountants.filter((acc) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (acc.profiles?.full_name || "").toLowerCase();
    const email = (acc.profiles?.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const getAccountantClients = (accountantId: string) => {
    return clients.filter(c => c.assigned_accountant_id === accountantId);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await invitesApi.create({
        email: inviteEmail.trim(),
        type: inviteType,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: `${inviteType === "accountant" ? "Accountant" : "Client"} invitation sent successfully`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Accountants</h2>
          <p className="text-muted-foreground">{filteredAccountants.length} of {accountants.length} team members</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent" onClick={() => setInviteType("accountant")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Accountant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite {inviteType === "client" ? "Client" : "Accountant"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} noValidate className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={inviteType}
                    onValueChange={(v) => setInviteType(v as "accountant" | "client")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating invite..." : "Generate Invite Link"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accountants Grid */}
      {filteredAccountants.length === 0 ? (
        <Card className="shadow-md border-border/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Building className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {accountants.length === 0
                  ? "No accountants yet. Invite your first team member to get started."
                  : "No accountants match your search."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccountants.map((accountant) => {
            const clientCount = clientsByAccountant[accountant.accountant_id] || 0;
            
            return (
              <Card 
                key={accountant.id} 
                className="shadow-md border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedAccountant(accountant);
                  setDialogOpen(true);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold text-lg">
                        {accountant.profiles?.full_name?.charAt(0) || accountant.profiles?.email?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {accountant.profiles?.full_name || "Unnamed Accountant"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{accountant.profiles?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Assigned Clients
                    </span>
                    <Badge variant="secondary" className="text-sm">
                      {clientCount} {clientCount === 1 ? "client" : "clients"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-md border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Assigned Clients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccountants.map((accountant) => {
                  const clientCount = clientsByAccountant[accountant.accountant_id] || 0;
                  return (
                    <TableRow
                      key={accountant.id}
                      onClick={() => {
                        setSelectedAccountant(accountant);
                        setDialogOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-primary font-medium text-sm">
                              {accountant.profiles?.full_name?.charAt(0) || accountant.profiles?.email?.charAt(0) || "?"}
                            </span>
                          </div>
                          <p className="font-medium text-foreground">
                            {accountant.profiles?.full_name || "Unnamed Accountant"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{accountant.profiles?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-sm">
                          {clientCount} {clientCount === 1 ? "client" : "clients"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Accountant Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAccountant?.profiles?.full_name || selectedAccountant?.profiles?.email || "Accountant Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedAccountant && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{selectedAccountant.profiles?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Assigned Clients</p>
                {getAccountantClients(selectedAccountant.accountant_id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No clients assigned</p>
                ) : (
                  <div className="space-y-2">
                    {getAccountantClients(selectedAccountant.accountant_id).map((client) => (
                      <div key={client.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <p className="font-medium">{client.profiles?.full_name || client.profiles?.email}</p>
                        {client.company_name && (
                          <p className="text-sm text-muted-foreground">{client.company_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
