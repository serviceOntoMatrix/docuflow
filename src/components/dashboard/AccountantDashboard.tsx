import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "./DashboardLayout";
import FirmNotificationsPage from "./firm/FirmNotificationsPage";
import FirmClientsPage from "./firm/FirmClientsPage";
import FirmClarificationsPage from "./firm/FirmClarificationsPage";
import FirmRemindersPage from "./firm/FirmRemindersPage";
import ClientProfileSettings from "./ClientProfileSettings";
import AccountantOverviewPage from "./accountant/AccountantOverviewPage";
import AccountantDocumentsPage from "./accountant/AccountantDocumentsPage";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { documentsApi, notificationsApi, clientsApi, firmsApi, clarificationsApi, accountantsApi, remindersApi, API_BASE_URL } from "@/lib/api";
import {
  LayoutDashboard,
  FileText,
  Bell,
  MessageCircle,
  Send,
  Loader2,
  Users,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Users, label: "Clients", href: "/dashboard/clients" },
  { icon: FileText, label: "Documents", href: "/dashboard/documents" },
  { icon: AlertTriangle, label: "Clarifications", href: "/dashboard/clarifications" },
  { icon: Clock, label: "Reminders", href: "/dashboard/reminders" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications", isNotification: true },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
];

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
  company_id?: string | null;
  company_name?: string | null;
  client_name: string | null;
  client_email: string;
  client_user_id: string;
  firm_id?: string | null;
  firm_name?: string | null;
  firm_owner_id?: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Client {
  id: string;
  user_id: string;
  company_name: string | null;
  assigned_accountant_id: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

interface Accountant {
  id: string;
  accountant_id: string;
  profiles: { full_name: string | null; email: string } | null;
}

export default function AccountantDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [firmIdReady, setFirmIdReady] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [notes, setNotes] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<DocumentStatus>("posted");
  const [loading, setLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [clarificationRecipient, setClarificationRecipient] = useState<'firm' | 'client'>('client');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clarificationMessages, setClarificationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [accountants, setAccountants] = useState<Accountant[]>([]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getFileUrl = useCallback((filePath: string) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${origin}/${filePath.replace(/^\//, "")}`;
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    try {
      const firmRes = await firmsApi.get();
      if (firmRes.error || !firmRes.data?.id) {
        toast({
          title: "Couldn't load firm",
          description: firmRes.error || "No firm found for this account.",
          variant: "destructive",
        });
        setDocuments([]);
        return;
      }

      const firmId = firmRes.data.id as string;
      setFirmId(firmId);

      const clientsRes = await clientsApi.getByFirm(firmId);
      const accountantsRes = await accountantsApi.getByFirm(firmId);

      const allClients = (clientsRes.data || []) as any[];
      const clientsWithProfiles: Client[] = allClients.map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        company_name: c.company_name ?? null,
        assigned_accountant_id: c.assigned_accountant_id ?? null,
        profiles: c.email ? { full_name: c.full_name ?? null, email: c.email } : null,
      }));
      setClients(clientsWithProfiles);

      const accountantsWithProfiles: Accountant[] = (accountantsRes.data || []).map((a: any) => ({
        id: a.id,
        accountant_id: a.accountant_id,
        profiles: a.email ? { full_name: a.full_name ?? null, email: a.email } : null,
      }));
      setAccountants(accountantsWithProfiles);

      if (clientsRes.error) {
        toast({
          title: "Couldn't load clients",
          description: clientsRes.error,
          variant: "destructive",
        });
        setDocuments([]);
        return;
      }

      const assignedClients = allClients.filter((c: any) => c.assigned_accountant_id === user.id);
      const assignedClientIds = assignedClients.map((c) => c.id);

      if (assignedClientIds.length === 0) {
        setDocuments([]);
        return;
      }

      const clientsMap: Record<string, any> = {};
      assignedClients.forEach((c) => {
        clientsMap[c.id] = c;
      });

      const docsRes = await documentsApi.getByFirm(firmId);
      if (docsRes.error) {
        toast({
          title: "Couldn't load documents",
          description: docsRes.error,
          variant: "destructive",
        });
        setDocuments([]);
        return;
      }

      const allDocs = (docsRes.data || []) as any[];
      const assignedDocs = allDocs
        .filter((d) => assignedClientIds.includes(d.client_id))
        .map((d) => {
          const c = clientsMap[d.client_id];
          return {
            id: d.id,
            file_name: d.file_name,
            file_path: d.file_path,
            file_type: d.file_type ?? null,
            status: d.status,
            notes: d.notes ?? null,
            uploaded_at: d.uploaded_at,
            client_id: d.client_id,
            company_name: c?.company_name ?? null,
            client_name: c?.full_name ?? null,
            client_email: c?.email ?? "",
            client_user_id: c?.user_id ?? "",
            firm_id: firmRes.data.id,
            firm_name: firmRes.data.name,
            firm_owner_id: firmRes.data.owner_id,
          } as Document;
        });

      setDocuments(assignedDocs);
    } catch (error: any) {
      toast({
        title: "Failed to load documents",
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
      setDocuments([]);
    }
  }, [toast, user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const res = await notificationsApi.get();
      if (res.data) {
        setNotifications(res.data as Notification[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user]);

  // Resolve firmId first so AppSettingsProvider gets firm_id and loads firm theme for client/accountant
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const firmRes = await firmsApi.get();
        if (cancelled) return;
        if (firmRes.data?.id) setFirmId(firmRes.data.id as string);
      } catch {
        if (!cancelled) setFirmId(null);
      } finally {
        if (!cancelled) setFirmIdReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (user && firmIdReady) {
      fetchDocuments();
      fetchNotifications();
      remindersApi.processDue().catch(() => {});

      const interval = setInterval(() => {
        fetchDocuments();
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, firmIdReady, fetchDocuments, fetchNotifications]);


  const handleAction = async () => {
    if (!selectedDoc) return;

    setLoading(true);

    try {
      if (actionType === "clarification_needed") {
        if (!notes.trim()) {
          toast({
            title: "Error",
            description: "Please enter a clarification message",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const response = await clarificationsApi.sendMessage({
          document_id: selectedDoc.id,
          message: notes,
          recipient_role: clarificationRecipient,
        });

        if (response.error) throw new Error(response.error);

        toast({
          title: "Clarification Sent",
          description: `Clarification request sent to ${clarificationRecipient}`,
        });

        await fetchClarificationMessages(selectedDoc.id);
        setNotes("");
        fetchDocuments();
      } else {
        const response = await documentsApi.update(selectedDoc.id, {
          status: actionType,
          notes,
        });

        if (response.error) throw new Error(response.error);

        const statusMessages: Record<DocumentStatus, string> = {
          posted: "Your document has been posted successfully",
          clarification_needed: `Clarification needed for ${selectedDoc.file_name}: ${notes}`,
          resend_requested: `Please resend ${selectedDoc.file_name}: ${notes}`,
          pending: "Document status updated",
        };

        await notificationsApi.create({
          user_id: selectedDoc.client_user_id,
          title: `Document ${actionType.replace("_", " ")}`,
          message: statusMessages[actionType],
          document_id: selectedDoc.id,
        });

        toast({
          title: "Success",
          description: `Document marked as ${actionType.replace("_", " ")}`,
        });

        setActionDialogOpen(false);
        setSelectedDoc(null);
        setNotes("");
        fetchDocuments();
      }
    } catch (error: any) {
      console.error("Action error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to complete action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const openActionDialog = async (doc: Document, type: DocumentStatus) => {
    setSelectedDoc(doc);
    setActionType(type);
    setNotes("");
    setClarificationRecipient("client");
    setClarificationMessages([]);
    setActionDialogOpen(true);
    
    if (type === "clarification_needed") {
      await fetchClarificationMessages(doc.id);
    }
  };

  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc);
    setPreviewLoading(true);
    setPreviewDialogOpen(true);

    const url = getFileUrl(doc.file_path);
    if (!url) {
      toast({
        title: "Preview failed",
        description: "Missing file path.",
        variant: "destructive",
      });
      setPreviewDialogOpen(false);
      setPreviewLoading(false);
      return;
    }

    setPreviewUrl(url);
    setPreviewLoading(false);
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

  const currentPath = location.pathname;

  if (user && !firmIdReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show profile page
  if (currentPath === "/dashboard/profile") {
    return (
      <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
        <div className="container mx-auto p-6 max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          <ClientProfileSettings />
        </div>
      </DashboardLayout>
    );
  }

  // Show clients page
  if (currentPath === "/dashboard/clients") {
    return (
      <AppSettingsProvider firmId={firmId || undefined}>
        <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
          <FirmClientsPage
            clients={clients}
            accountants={accountants}
            onAssignAccountant={() => {}}
          />
        </DashboardLayout>
      </AppSettingsProvider>
    );
  }

  // Show clarifications page
  if (currentPath === "/dashboard/clarifications" && firmId) {
    return (
      <AppSettingsProvider firmId={firmId || undefined}>
        <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
          <FirmClarificationsPage firmId={firmId} clients={clients} accountants={accountants} />
        </DashboardLayout>
      </AppSettingsProvider>
    );
  }

  // Show reminders page
  if (currentPath === "/dashboard/reminders" && firmId) {
    return (
      <AppSettingsProvider firmId={firmId || undefined}>
        <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
          <FirmRemindersPage firmId={firmId} clients={clients} accountants={accountants} accountantView />
        </DashboardLayout>
      </AppSettingsProvider>
    );
  }

  // Show notifications page
  if (currentPath === "/dashboard/notifications") {
    return (
      <AppSettingsProvider firmId={firmId || undefined}>
        <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
          <FirmNotificationsPage />
        </DashboardLayout>
      </AppSettingsProvider>
    );
  }

  // Show documents page
  if (currentPath === "/dashboard/documents") {
    return (
      <AppSettingsProvider firmId={firmId || undefined}>
        <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
          <AccountantDocumentsPage
            documents={documents}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onAction={openActionDialog}
          />

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={(open) => {
          setActionDialogOpen(open);
          if (!open) {
            setClarificationMessages([]);
            setNotes("");
          }
        }}>
          <DialogContent className={actionType === "clarification_needed" ? "max-w-2xl max-h-[85vh]" : ""}>
            <DialogHeader>
              <DialogTitle className="capitalize flex items-center gap-2">
                {actionType === "clarification_needed" && <MessageCircle className="w-5 h-5" />}
                {actionType.replace("_", " ")} Document
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium">{selectedDoc?.file_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Client: {selectedDoc?.client_name || "Unknown"} • Company: {selectedDoc?.company_name || "N/A"}
                </p>
              </div>

              {actionType === "clarification_needed" && (
                <>
                  {clarificationMessages.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Conversation History
                      </Label>
                      <ScrollArea className="h-[200px] border rounded-lg p-3 bg-muted/20">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {clarificationMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-lg ${
                                  msg.sender_role === "accountant"
                                    ? "bg-primary/10 ml-4"
                                    : "bg-secondary mr-4"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">
                                    {msg.sender_name || msg.sender_email} 
                                    <Badge variant="outline" className="ml-2 text-[10px]">
                                      {msg.sender_role}
                                    </Badge>
                                    <span className="text-muted-foreground ml-2">→ {msg.recipient_role}</span>
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
                  )}

                  <div className="space-y-3">
                    <Label>Send clarification to:</Label>
                    <RadioGroup
                      value={clarificationRecipient}
                      onValueChange={(value) => setClarificationRecipient(value as 'firm' | 'client')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="client" />
                        <Label htmlFor="client" className="cursor-pointer">
                          Client ({selectedDoc?.client_name || "Client"})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="firm" id="firm" />
                        <Label htmlFor="firm" className="cursor-pointer">
                          Firm ({selectedDoc?.firm_name || "Firm"})
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>New Message for {clarificationRecipient === "firm" ? "Firm" : "Client"}</Label>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your clarification message..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActionDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleAction}
                      disabled={loading || !notes.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Clarification
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {actionType !== "clarification_needed" && (
                <>
                  {actionType !== "posted" && (
                    <div className="space-y-2">
                      <Label>Notes for client</Label>
                      <Textarea
                        placeholder="Add a note explaining what's needed..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={actionType === "posted" ? "accent" : "default"}
                      className="flex-1"
                      onClick={handleAction}
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Confirm"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) {
            setPreviewUrl(null);
            setSelectedDoc(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="truncate pr-4">{selectedDoc?.file_name}</span>
                <div className="flex items-center gap-2">
                  {selectedDoc && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedDoc)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg overflow-hidden">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading preview...</p>
                </div>
              ) : previewUrl ? (
                selectedDoc?.file_type?.includes("pdf") ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] border-0"
                    title="Document Preview"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={selectedDoc?.file_name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="w-12 h-12 opacity-50" />
                  <p>Unable to load preview</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </DashboardLayout>
      </AppSettingsProvider>
    );
  }

  // Default: Overview page
  return (
    <AppSettingsProvider firmId={firmId || undefined}>
      <DashboardLayout navItems={navItems} title="Accountant" unreadCount={unreadCount}>
        <AccountantOverviewPage
          documents={documents}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onAction={openActionDialog}
        />

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={(open) => {
        setActionDialogOpen(open);
        if (!open) {
          setClarificationMessages([]);
          setNotes("");
        }
      }}>
        <DialogContent className={actionType === "clarification_needed" ? "max-w-2xl max-h-[85vh]" : ""}>
          <DialogHeader>
            <DialogTitle className="capitalize flex items-center gap-2">
              {actionType === "clarification_needed" && <MessageCircle className="w-5 h-5" />}
              {actionType.replace("_", " ")} Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm font-medium">{selectedDoc?.file_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Client: {selectedDoc?.client_name || "Unknown"} • Company: {selectedDoc?.company_name || "N/A"}
              </p>
            </div>

            {actionType === "clarification_needed" && (
              <>
                {clarificationMessages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Conversation History
                    </Label>
                    <ScrollArea className="h-[200px] border rounded-lg p-3 bg-muted/20">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {clarificationMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.sender_role === "accountant"
                                  ? "bg-primary/10 ml-4"
                                  : "bg-secondary mr-4"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">
                                  {msg.sender_name || msg.sender_email} 
                                  <Badge variant="outline" className="ml-2 text-[10px]">
                                    {msg.sender_role}
                                  </Badge>
                                  <span className="text-muted-foreground ml-2">→ {msg.recipient_role}</span>
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
                )}

                <div className="space-y-3">
                  <Label>Send clarification to:</Label>
                  <RadioGroup
                    value={clarificationRecipient}
                    onValueChange={(value) => setClarificationRecipient(value as 'firm' | 'client')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="client-overview" />
                      <Label htmlFor="client-overview" className="cursor-pointer">
                        Client ({selectedDoc?.client_name || "Client"})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="firm" id="firm-overview" />
                      <Label htmlFor="firm-overview" className="cursor-pointer">
                        Firm ({selectedDoc?.firm_name || "Firm"})
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>New Message for {clarificationRecipient === "firm" ? "Firm" : "Client"}</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your clarification message..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActionDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAction}
                    disabled={loading || !notes.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Clarification
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {actionType !== "clarification_needed" && (
              <>
                {actionType !== "posted" && (
                  <div className="space-y-2">
                    <Label>Notes for client</Label>
                    <Textarea
                      placeholder="Add a note explaining what's needed..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={actionType === "posted" ? "accent" : "default"}
                    className="flex-1"
                    onClick={handleAction}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Confirm"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => {
        setPreviewDialogOpen(open);
        if (!open) {
          setPreviewUrl(null);
          setSelectedDoc(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate pr-4">{selectedDoc?.file_name}</span>
              <div className="flex items-center gap-2">
                {selectedDoc && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedDoc)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg overflow-hidden">
            {previewLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            ) : previewUrl ? (
              selectedDoc?.file_type?.includes("pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-0"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={selectedDoc?.file_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileText className="w-12 h-12 opacity-50" />
                <p>Unable to load preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </DashboardLayout>
    </AppSettingsProvider>
  );
}
