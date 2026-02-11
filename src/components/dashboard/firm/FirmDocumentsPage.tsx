import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Eye,
  Calendar,
  User,
  Loader2,
  Building,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentsApi, companiesApi } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type DocumentStatus = "pending" | "posted" | "clarification_needed" | "resend_requested";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  status: DocumentStatus;
  notes: string | null;
  uploaded_at: string;
  client_id: string;
  company_id?: string | null;
  company_name?: string | null;
  client_name?: string | null;
  client_email?: string;
  client_user_id?: string;
  assigned_accountant_id?: string | null;
  accountant_name?: string | null;
  accountant_email?: string | null;
}

interface Client {
  id: string;
  user_id: string;
  company_name: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

interface Accountant {
  id: string;
  accountant_id: string;
  profiles: { full_name: string | null; email: string } | null;
}

interface FirmDocumentsPageProps {
  firmId: string;
  clients: Client[];
  accountants?: Accountant[];
}

type TimelineOption = "week" | "month" | "year" | "all" | "dateRange";

export default function FirmDocumentsPage({ firmId, clients, accountants = [] }: FirmDocumentsPageProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [accountantFilter, setAccountantFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [timeline, setTimeline] = useState<TimelineOption>("all");
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(undefined);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; company_name: string; client_id: string }>>([]);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [notes, setNotes] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<DocumentStatus>("posted");

  useEffect(() => {
    fetchDocuments();
  }, [firmId]);

  useEffect(() => {
    if (clients.length > 0) {
      fetchCompanies();
    }
  }, [clients]);

  const fetchCompanies = async () => {
    if (!firmId) return;
    try {
      // Fetch companies for all clients in the firm
      const allCompanies: Array<{ id: string; company_name: string; client_id: string }> = [];
      for (const client of clients) {
        const res = await companiesApi.getByClient(client.id);
        if (res.data) {
          const clientCompanies = (res.data as any[]).map(c => ({
            id: c.id,
            company_name: c.company_name,
            client_id: client.id,
          }));
          allCompanies.push(...clientCompanies);
        }
      }
      setCompanies(allCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchDocuments = async () => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    try {
      const response = await documentsApi.getByFirm(firmId);
      
      if (response.error) {
        console.error("Error fetching documents:", response.error);
        setLoading(false);
        return;
      }
      
      if (response.data) {
        setDocuments(response.data as Document[]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
    setLoading(false);
  };

  const openChatForDocument = (document: Document) => {
    // For firm, open chat to discuss clarification
    navigate('/dashboard/chat', { 
      state: { 
        selectedDocument: {
          document_id: document.id,
          document_name: document.file_name
        }
      } 
    });
  };

  const openActionDialog = (doc: Document, type: DocumentStatus) => {
    if (type === 'clarification_needed') {
      // Open chat directly for clarification
      openChatForDocument(doc);
    } else {
      // Open regular dialog for other actions
      setSelectedDoc(doc);
      setActionType(type);
      setNotes(doc.notes || "");
      setActionDialogOpen(true);
    }
  };

  const getStatusInfo = (status: DocumentStatus) => {
    const statusMap = {
      pending: { icon: Clock, label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
      posted: { icon: CheckCircle, label: "Posted", color: "bg-success/10 text-success border-success/20" },
      clarification_needed: { icon: AlertTriangle, label: "Needs Clarification", color: "bg-destructive/10 text-destructive border-destructive/20" },
      resend_requested: { icon: RotateCcw, label: "Resend Requested", color: "bg-accent/10 text-accent border-accent/20" },
    };
    return statusMap[status];
  };

  const getClientName = (doc: Document) => {
    // First try to use embedded client info from PHP API
    if (doc.client_name) return doc.client_name;
    if (doc.company_name) return doc.company_name;
    if (doc.client_email) return doc.client_email;
    
    // Fallback to clients prop lookup
    const client = clients.find((c) => c.id === doc.client_id);
    return client?.profiles?.full_name || client?.company_name || client?.profiles?.email || "Unknown";
  };

  const getFileUrl = useCallback((filePath: string) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${origin}/${filePath.replace(/^\//, "")}`;
  }, []);

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
    setLoadingPreview(true);

    const url = getFileUrl(doc.file_path);
    if (!url) {
      toast({
        title: "Error",
        description: "Missing file path.",
        variant: "destructive",
      });
      setLoadingPreview(false);
      return;
    }

    setPreviewUrl(url);
    setLoadingPreview(false);
  };

  const handleDownload = (doc: Document) => {
    const url = getFileUrl(doc.file_path);
    if (!url) {
      toast({
        title: "Download failed",
        description: "Missing file path.",
        variant: "destructive",
      });
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (timeline) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "dateRange":
        startDate = selectedDate?.from || new Date(0);
        endDate = selectedDate?.to || now;
        break;
      default:
        startDate = new Date(0);
    }

    return documents.filter((doc) => {
      const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      const matchesClient = clientFilter === "all" || doc.client_id === clientFilter;
      const matchesAccountant = accountantFilter === "all" || 
        (accountantFilter === "unassigned" && !doc.assigned_accountant_id) ||
        doc.assigned_accountant_id === accountantFilter;
      const matchesCompany = companyFilter === "all" || 
        (companyFilter === "no-company" && !doc.company_id) ||
        doc.company_id === companyFilter;
      
      const docDate = new Date(doc.uploaded_at);
      const matchesTimeline = docDate >= startDate && docDate <= endDate;
      
      return matchesSearch && matchesStatus && matchesClient && matchesAccountant && matchesCompany && matchesTimeline;
    });
  }, [documents, searchQuery, statusFilter, clientFilter, accountantFilter, companyFilter, timeline, selectedDate]);

  const stats = useMemo(() => ({
    total: filteredDocuments.length,
    pending: filteredDocuments.filter((d) => d.status === "pending").length,
    posted: filteredDocuments.filter((d) => d.status === "posted").length,
    action: filteredDocuments.filter((d) => ["clarification_needed", "resend_requested"].includes(d.status)).length,
  }), [filteredDocuments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Documents</h2>
          <p className="text-muted-foreground">
            {stats.total} documents
            {timeline === "week"
              ? " (this week)"
              : timeline === "month"
              ? " (this month)"
              : timeline === "year"
              ? " (this year)"
              : timeline === "dateRange"
              ? selectedDate?.from && selectedDate.to
                ? ` (${format(selectedDate.from, "LLL dd, y")}-
                    ${format(selectedDate.to, "LLL dd, y")})`
                : " (Custom Range)"
              : ""}
          </p>
        </div>
        <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start text-left font-normal text-sm"
            >
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {timeline === "dateRange" && selectedDate?.from ? (
                  selectedDate.to ? (
                    <>
                      {format(selectedDate.from, "MMM dd")} -{" "}
                      {format(selectedDate.to, "MMM dd")}
                    </>
                  ) : (
                    format(selectedDate.from, "MMM dd")
                  )
                ) : (
                  <>
                    {timeline === "week" ? "This Week" :
                     timeline === "month" ? "This Month" :
                     timeline === "year" ? "This Year" :
                     timeline === "all" ? "All Time" : "Select Timeline"}
                  </>
                )}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Select Timeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                <Button
                  variant={timeline === "week" ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setTimeline("week");
                    setSelectedDate(undefined);
                    setCalendarDialogOpen(false);
                  }}
                >
                  This Week
                </Button>
                <Button
                  variant={timeline === "month" ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setTimeline("month");
                    setSelectedDate(undefined);
                    setCalendarDialogOpen(false);
                  }}
                >
                  This Month
                </Button>
                <Button
                  variant={timeline === "year" ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setTimeline("year");
                    setSelectedDate(undefined);
                    setCalendarDialogOpen(false);
                  }}
                >
                  This Year
                </Button>
                <Button
                  variant={timeline === "all" ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setTimeline("all");
                    setSelectedDate(undefined);
                    setCalendarDialogOpen(false);
                  }}
                >
                  All Time
                </Button>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Custom Date Range</p>
                <div className="flex justify-center">
                  <CalendarUI
                    mode="range"
                    defaultMonth={selectedDate?.from || new Date()}
                    selected={selectedDate}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setSelectedDate(range);
                        setTimeline("dateRange");
                        setCalendarDialogOpen(false);
                      } else {
                        setSelectedDate(range);
                      }
                    }}
                    numberOfMonths={1}
                    className="rounded-md border text-sm"
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.posted}</p>
            <p className="text-sm text-muted-foreground">Posted</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.action}</p>
            <p className="text-sm text-muted-foreground">Need Action</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <SelectItem value="all">All Statuses</SelectItem>
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
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.profiles?.full_name || client.company_name || client.profiles?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={accountantFilter} onValueChange={setAccountantFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Accountant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accountants</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {accountants.map((acc) => (
                  <SelectItem key={acc.accountant_id} value={acc.accountant_id}>
                    {acc.profiles?.full_name || acc.profiles?.email}
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
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="shadow-md border-border/50">
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {documents.length === 0
                  ? "No documents yet. Documents will appear when clients upload them."
                  : "No documents match your filters."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Accountant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const status = getStatusInfo(doc.status);
                    const StatusIcon = status.icon;

                    return (
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
                            <span className="truncate">{getClientName(doc)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building className="w-3.5 h-3.5" />
                            <span className="truncate">{doc.company_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1.5 text-sm ${doc.assigned_accountant_id ? 'text-muted-foreground' : 'text-warning'}`}>
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">
                              {doc.assigned_accountant_id
                                ? (doc.accountant_name || doc.accountant_email || "Assigned Accountant")
                                : "Unassigned"
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                        </TableCell>
                        <TableCell>
                          {doc.status === "clarification_needed" ? (
                            <Badge 
                              variant="outline" 
                              className={`${status.color} cursor-pointer hover:opacity-80 transition-opacity`}
                              onClick={() => navigate("/dashboard/clarifications")}
                              title="Click to view clarifications"
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handlePreview(doc)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg bg-secondary/30">
            {loadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : previewUrl ? (
              previewDoc?.file_type?.includes("image") ? (
                <img src={previewUrl} alt={previewDoc?.file_name} className="w-full h-full object-contain" />
              ) : previewDoc?.file_type?.includes("pdf") ? (
                <iframe src={previewUrl} className="w-full h-full" title={previewDoc?.file_name} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                  <Button variant="accent" onClick={() => previewDoc && handleDownload(previewDoc)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
