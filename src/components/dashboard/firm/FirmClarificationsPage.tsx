import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  MessageSquare,
  Send,
  MessageCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { companiesApi, clarificationsApi } from "@/lib/api";
import { Label } from "@/components/ui/label";

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
  last_message_at?: string | null;
  unread_count?: number;
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

interface FirmClarificationsPageProps {
  firmId: string;
  clients: Client[];
  accountants?: Accountant[];
}

export default function FirmClarificationsPage({ firmId, clients, accountants = [] }: FirmClarificationsPageProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [accountantFilter, setAccountantFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companies, setCompanies] = useState<Array<{ id: string; company_name: string; client_id: string }>>([]);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedDocForReply, setSelectedDocForReply] = useState<Document | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);
  const [clarificationMessages, setClarificationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchClarificationMessages = async (documentId: string) => {
    setLoadingMessages(true);
    try {
      const res = await clarificationsApi.getMessages(documentId);
      if (res.data) {
        setClarificationMessages(res.data);
      }
    } catch (error) {
      console.error("Error fetching clarification messages:", error);
    }
    setLoadingMessages(false);
  };

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
      // Use clarificationsApi to get documents with messages sent to/from firm
      // This includes last_message_at field
      const response = await clarificationsApi.getDocuments();

      if (response.error) {
        console.error("Error fetching documents:", response.error);
        toast({
          title: "Error loading clarifications",
          description: response.error,
          variant: "destructive",
        });
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
    return documents.filter((doc) => {
      const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClient = clientFilter === "all" || doc.client_id === clientFilter;
      const matchesAccountant = accountantFilter === "all" ||
        (accountantFilter === "unassigned" && !doc.assigned_accountant_id) ||
        doc.assigned_accountant_id === accountantFilter;
      const matchesCompany = companyFilter === "all" ||
        (companyFilter === "no-company" && !doc.company_id) ||
        doc.company_id === companyFilter;
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

      return matchesSearch && matchesClient && matchesAccountant && matchesCompany && matchesStatus;
    });
  }, [documents, searchQuery, clientFilter, accountantFilter, companyFilter, statusFilter]);

  const handleReplyClarification = async (doc: Document) => {
    setSelectedDocForReply(doc);
    setReplyMessage("");
    setClarificationMessages([]);
    setReplyDialogOpen(true);
    await fetchClarificationMessages(doc.id);
  };

  const handleReplySubmit = async () => {
    if (!selectedDocForReply || !replyMessage.trim()) return;

    setReplying(true);
    try {
      // Send clarification reply using clarificationsApi
      const response = await clarificationsApi.sendMessage({
        document_id: selectedDocForReply.id,
        message: replyMessage,
        recipient_role: 'accountant',
        is_reply: true,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Reply Sent",
        description: "The accountant has been notified of your reply.",
      });

      // Refresh messages to show the new one
      await fetchClarificationMessages(selectedDocForReply.id);
      setReplyMessage("");
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    }
    setReplying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Error boundary for rendering issues
  try {
    return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clarifications</h2>
          <p className="text-muted-foreground">{filteredDocuments.length} documents need clarification</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <p className="text-lg font-bold text-destructive">{filteredDocuments.length}</p>
            </div>
            <p className="text-sm text-muted-foreground">Need Clarification</p>
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="clarification_needed">Clarification</SelectItem>
                  <SelectItem value="resend_requested">Resend</SelectItem>
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
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {documents.length === 0
                  ? "No documents need clarification at this time."
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
                    <TableHead>Clarification Notes</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Size</TableHead>
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
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                                {doc.unread_count && doc.unread_count > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                    {doc.unread_count} new
                                  </span>
                                )}
                              </div>
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
                          <div className="max-w-xs">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {doc.notes || "No clarification notes provided"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {doc.last_message_at 
                                ? new Date(doc.last_message_at).toLocaleString()
                                : new Date(doc.uploaded_at).toLocaleDateString()
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handlePreview(doc)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReplyClarification(doc)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Reply
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

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={(open) => {
        setReplyDialogOpen(open);
        if (!open) {
          setClarificationMessages([]);
          setReplyMessage("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Clarification Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocForReply && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium">Document: {selectedDocForReply.file_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Client: {selectedDocForReply.client_name || "Unknown"} • Company: {selectedDocForReply.company_name || "N/A"}
                </p>
              </div>
            )}

            {/* Message History */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversation History
              </Label>
              <ScrollArea className="h-[250px] border rounded-lg p-3 bg-muted/20">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clarificationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clarificationMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.sender_role === "firm"
                            ? "bg-primary/10 ml-8"
                            : "bg-secondary mr-8"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {msg.sender_role === "firm" ? "You (Firm)" : msg.sender_name || "Unknown"}
                            <span className="text-muted-foreground ml-2 capitalize">({msg.sender_role})</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Your reply will be sent only to the assigned accountant.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Reply to Accountant</Label>
              <textarea
                className="w-full p-3 border border-border rounded-md bg-background text-sm resize-none"
                placeholder="Type your response to the accountant..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setReplyDialogOpen(false);
                  setClarificationMessages([]);
                }}
              >
                Close
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleReplySubmit}
                disabled={replying || !replyMessage.trim()}
              >
                {replying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
  } catch (error) {
    console.error("[FirmClarificationsPage] Render error:", error);
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error Loading Clarifications</h3>
          <p className="text-muted-foreground">There was an error displaying the clarifications page.</p>
          <p className="text-sm text-muted-foreground mt-2">Check the console for details.</p>
        </div>
      </div>
    );
  }
}
