import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Building,
  User,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";

type DocumentStatus = "pending" | "posted" | "clarification_needed" | "resend_requested";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  status: DocumentStatus;
  notes: string | null;
  uploaded_at: string;
  client_id: string;
  company_name?: string | null;
  client_name: string | null;
  client_email: string;
  client_user_id: string;
  firm_id?: string | null;
  firm_name?: string | null;
}

interface AccountantDocumentsPageProps {
  documents: Document[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onAction: (doc: Document, type: DocumentStatus) => void;
}

export default function AccountantDocumentsPage({
  documents,
  onPreview,
  onDownload,
  onAction,
}: AccountantDocumentsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const uniqueClients = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const d of documents) {
      if (d.client_id && !seen.has(d.client_id)) {
        seen.add(d.client_id);
        list.push({ id: d.client_id, name: d.client_name || "Unknown" });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);

  const uniqueCompanies = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    documents.forEach((d) => {
      const name = (d.company_name && d.company_name.trim()) || "no-company";
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    });
    return names.sort((a, b) => (a === "no-company" ? 1 : b === "no-company" ? -1 : a.localeCompare(b)));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.client_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (doc.company_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      const matchesClient = clientFilter === "all" || doc.client_id === clientFilter;
      const docCompany = (doc.company_name && doc.company_name.trim()) || "no-company";
      const matchesCompany =
        companyFilter === "all" ||
        (companyFilter === "no-company" && docCompany === "no-company") ||
        docCompany === companyFilter;

      return matchesSearch && matchesStatus && matchesClient && matchesCompany;
    });
  }, [documents, searchTerm, statusFilter, clientFilter, companyFilter]);

  const getStatusBadge = (status: DocumentStatus) => {
    const styles: Record<DocumentStatus, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      posted: "bg-success/10 text-success border-success/20",
      clarification_needed: "bg-destructive/10 text-destructive border-destructive/20",
      resend_requested: "bg-accent/10 text-accent border-accent/20",
    };

    const labels: Record<DocumentStatus, string> = {
      pending: "Pending",
      posted: "Posted",
      clarification_needed: "Needs Clarification",
      resend_requested: "Resend Requested",
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Documents</h2>
          <p className="text-muted-foreground">{filteredDocuments.length} of {documents.length} documents</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name, client, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="clarification_needed">Needs Clarification</SelectItem>
                  <SelectItem value="resend_requested">Resend Requested</SelectItem>
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {uniqueClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="no-company">No Company</SelectItem>
                  {uniqueCompanies.filter((n) => n !== "no-company").map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {documents.length === 0
                  ? "No documents yet. Documents will appear here when clients upload them."
                  : "No documents match your search criteria."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate">{doc.client_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building className="w-3.5 h-3.5" />
                          <span className="truncate">{doc.company_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => onPreview(doc)} title="Preview">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onDownload(doc)} title="Download">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAction(doc, "posted")}
                            title="Mark as posted"
                          >
                            <CheckCircle className="w-4 h-4 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAction(doc, "clarification_needed")}
                            title="Request clarification"
                          >
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAction(doc, "resend_requested")}
                            title="Request resend"
                          >
                            <RotateCcw className="w-4 h-4 text-destructive" />
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
    </div>
  );
}
