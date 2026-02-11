import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AppSettingsProvider, useAppSettings } from "@/contexts/AppSettingsContext";
import {
  clientsApi,
  documentsApi,
  notificationsApi,
  companiesApi,
  profilesApi,
  clarificationsApi,
  remindersApi,
  uploadFile,
  API_BASE_URL,
} from "@/lib/api";
// documentsApi.replace is used for re-uploading documents in clarification
import {
  Home,
  FileText,
  Bell,
  Upload,
  Camera,
  ImageIcon,
  File as FileIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Loader2,
  User,
  LogOut,
  Plus,
  FolderOpen,
  MessageSquare,
  Menu,
  MessageCircle,
  Send,
  Search,
  Filter,
  Calendar,
  Eye,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building } from "lucide-react";
import ClientProfileSettings from "./ClientProfileSettings";
import { cn } from "@/lib/utils";
import NotificationPopover from "./NotificationPopover";

type DocumentStatus = "pending" | "posted" | "clarification_needed" | "resend_requested";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  status: DocumentStatus;
  notes: string | null;
  uploaded_at: string;
  company_id?: string | null;
  company_name?: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  document_id?: string | null;
}

interface ClientInfo {
  id: string;
  assigned_accountant_id: string | null;
  firm_id: string;
}

interface Company {
  id: string;
  client_id: string;
  company_name: string;
  created_at: string;
  updated_at?: string;
  assigned_accountant_id?: string | null;
  accountant_full_name?: string | null;
  accountant_email?: string | null;
}

interface ClientReminder {
  id: string;
  title: string;
  message: string;
  sent_at: string;
  created_at: string;
  sender_type: "firm" | "accountant";
  sender_name: string | null;
  firm_name: string | null;
  accountant_name?: string | null;
}

type TabType = "home" | "documents" | "notifications" | "profile" | "clarifications" | "companies" | "reminders";

const navItems = [
  { icon: Home, label: "Home", tab: "home" as TabType },
  { icon: Building, label: "Companies", tab: "companies" as TabType },
  { icon: FileText, label: "Documents", tab: "documents" as TabType },
  { icon: AlertCircle, label: "Clarifications", tab: "clarifications" as TabType },
  { icon: Clock, label: "Reminders", tab: "reminders" as TabType },
  { icon: Bell, label: "Notifications", tab: "notifications" as TabType, isNotification: true },
  { icon: User, label: "Profile", tab: "profile" as TabType },
];

function ClientDashboardContent({ onFirmId }: { onFirmId: (firmId: string | null) => void }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const settings = useAppSettings();
  const appName = settings?.app_name || "DocqFlow";
  const { isNative, takePhoto, pickFromGallery } = useCamera();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseFiles, setResponseFiles] = useState<File[]>([]);
  const [responseFilePreviews, setResponseFilePreviews] = useState<string[]>([]);
  const [uploadingResponse, setUploadingResponse] = useState(false);
  const [clarificationMessages, setClarificationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [clientReminders, setClientReminders] = useState<ClientReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [reminderSearch, setReminderSearch] = useState("");
  const [reminderSenderFilter, setReminderSenderFilter] = useState<string>("all");
  const filteredClientReminders = useMemo(() => {
    return clientReminders.filter((r) => {
      const q = reminderSearch.trim().toLowerCase();
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.message.toLowerCase().includes(q);
      const matchesSender = reminderSenderFilter === "all" || r.sender_type === reminderSenderFilter;
      return matchesSearch && matchesSender;
    });
  }, [clientReminders, reminderSearch, reminderSenderFilter]);

  // Document filters (for Documents tab table)
  const [documentSearch, setDocumentSearch] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState<string>("all");
  const [documentCompanyFilter, setDocumentCompanyFilter] = useState<string>("all");
  const uniqueDocumentCompanies = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    documents.forEach((d) => {
      const id = d.company_id || "no-company";
      const name = d.company_name?.trim() || "No Company";
      if (!seen.has(id)) {
        seen.add(id);
        list.push({ id, name });
      }
    });
    return list.sort((a, b) => (a.id === "no-company" ? 1 : b.id === "no-company" ? -1 : a.name.localeCompare(b.name)));
  }, [documents]);
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const q = documentSearch.trim().toLowerCase();
      const matchesSearch = !q || doc.file_name.toLowerCase().includes(q) || (doc.company_name || "").toLowerCase().includes(q);
      const matchesStatus = documentStatusFilter === "all" || doc.status === documentStatusFilter;
      const companyId = doc.company_id || "no-company";
      const matchesCompany = documentCompanyFilter === "all" || companyId === documentCompanyFilter;
      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [documents, documentSearch, documentStatusFilter, documentCompanyFilter]);

  // Notification filters (for Notifications tab table)
  const [notificationSearch, setNotificationSearch] = useState("");
  const [notificationReadFilter, setNotificationReadFilter] = useState<string>("all");
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const q = notificationSearch.trim().toLowerCase();
      const matchesSearch = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      const matchesRead = notificationReadFilter === "all" || (notificationReadFilter === "read" && n.is_read) || (notificationReadFilter === "unread" && !n.is_read);
      return matchesSearch && matchesRead;
    });
  }, [notifications, notificationSearch, notificationReadFilter]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await remindersApi.getForClient();
      if (res.data && Array.isArray(res.data)) {
        setClientReminders(res.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          sent_at: r.sent_at || r.created_at,
          created_at: r.created_at,
          sender_type: r.sender_type === "accountant" ? "accountant" : "firm",
          sender_name: r.sender_name || null,
          firm_name: r.firm_name || null,
          accountant_name: r.accountant_name || null,
        })));
      }
    } catch (e) {
      console.error("Error fetching reminders:", e);
    }
    setLoadingReminders(false);
  };

  useEffect(() => {
    if (user) {
      fetchClientData();
      fetchNotifications();
      fetchReminders();

      // Poll for notifications every 30 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 30000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user]);

  const fetchClientData = async () => {
    if (!user) return;

    try {
      const clientsRes = await clientsApi.getOwn();
      if (clientsRes.data && clientsRes.data.length > 0) {
        const client = clientsRes.data[0];
        setClientInfo({
          id: client.id,
          assigned_accountant_id: client.assigned_accountant_id,
          firm_id: client.firm_id,
        });
        onFirmId(client.firm_id ?? null);

        // Fetch companies for this client
        const companiesRes = await companiesApi.getByClient(client.id);
        if (companiesRes.data) {
          setCompanies(companiesRes.data as Company[]);
          // Auto-select first company if available
          if (companiesRes.data.length > 0 && !selectedCompanyId) {
            setSelectedCompanyId(companiesRes.data[0].id);
          }
        }

        const docsRes = await documentsApi.getOwn();
        if (docsRes.data) {
          setDocuments(docsRes.data as Document[]);
        }
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const res = await notificationsApi.get();
      if (res.data) {
        setNotifications(res.data as Notification[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const base64ToFile = (base64: string, fileName: string, mimeType: string): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  };

  const handleNativeCamera = async () => {
    try {
      const image = await takePhoto();
      if (image?.base64String) {
        const fileName = `photo_${Date.now()}.${image.format || "jpeg"}`;
        const mimeType = `image/${image.format || "jpeg"}`;
        const file = base64ToFile(image.base64String, fileName, mimeType);
        setSelectedFiles((prev) => [...prev, file]);
        setPreviews((prev) => [...prev, `data:${mimeType};base64,${image.base64String}`]);
        toast({ title: "Photo captured", description: "Ready to upload" });
      }
    } catch (error: any) {
      if (error.message !== "User cancelled photos app") {
        toast({ title: "Camera error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleNativeGallery = async () => {
    try {
      const image = await pickFromGallery();
      if (image?.base64String) {
        const fileName = `image_${Date.now()}.${image.format || "jpeg"}`;
        const mimeType = `image/${image.format || "jpeg"}`;
        const file = base64ToFile(image.base64String, fileName, mimeType);
        setSelectedFiles((prev) => [...prev, file]);
        setPreviews((prev) => [...prev, `data:${mimeType};base64,${image.base64String}`]);
      }
    } catch (error: any) {
      if (error.message !== "User cancelled photos app") {
        toast({ title: "Gallery error", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleCameraClick = () => {
    if (isNative) {
      handleNativeCamera();
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleGalleryClick = () => {
    if (isNative) {
      handleNativeGallery();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleResponseFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('[ClientDashboard] Response files selected:', files.length, files);
    console.log('[ClientDashboard] Input target:', e.target.id, e.target);

    if (files.length === 0) {
      console.log('[ClientDashboard] No files selected');
      return;
    }

    addResponseFiles(files);
    // Clear the input
    if (e.target) e.target.value = '';
  };

  const addResponseFiles = (files: File[]) => {
    const validFiles = files.filter((f) => {
      const isValid = f.type.startsWith("image/") || f.type === "application/pdf";
      if (!isValid) {
        toast({ title: "Invalid file", description: `${f.name} - only images and PDFs allowed`, variant: "destructive" });
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    // Add files
    setResponseFiles(prev => [...prev, ...validFiles]);

    // Add corresponding empty previews (will show file icons)
    setResponseFilePreviews(prev => [...prev, ...validFiles.map(() => '')]);
  };

  const removeResponseFile = (index: number) => {
    setResponseFiles(prev => prev.filter((_, i) => i !== index));
    setResponseFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((f) => {
      const isValid = f.type.startsWith("image/") || f.type === "application/pdf";
      if (!isValid) {
        toast({ title: "Invalid file", description: `${f.name} - only images and PDFs allowed`, variant: "destructive" });
      }
      return isValid;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
      } else {
        setPreviews((prev) => [...prev, "pdf"]);
      }
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!clientInfo || selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: !clientInfo ? "Client information not found. Please refresh." : "No files selected.",
        variant: "destructive",
      });
      return;
    }

    if (companies.length > 0 && !selectedCompanyId) {
      toast({
        title: "Error",
        description: "Please select a company before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);

    try {
      for (const file of selectedFiles) {
        const uploadRes = await uploadFile(file, clientInfo.id, selectedCompanyId);
        
        if (uploadRes.error) {
          throw new Error(uploadRes.error);
        }

        if (clientInfo.assigned_accountant_id) {
          const companyName = companies.find(c => c.id === selectedCompanyId)?.company_name || "No Company";
          await notificationsApi.create({
            user_id: clientInfo.assigned_accountant_id,
            title: "New Document Uploaded",
            message: `A client uploaded "${file.name}" for ${companyName}`,
            document_id: uploadRes.data?.document_id,
          });
        }
      }

      toast({ title: "Uploaded!", description: `${selectedFiles.length} document(s) sent for review` });
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setPreviews([]);
      fetchClientData();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRespond = async (replaceDocument: boolean = false) => {
    if (!selectedDocument || !clientInfo?.assigned_accountant_id) {
      toast({
        title: "Error",
        description: "Missing document or accountant information",
        variant: "destructive",
      });
      return;
    }

    // If replacing document, file is required
    if (replaceDocument && responseFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select a file to replace the document",
        variant: "destructive",
      });
      return;
    }

    // If not replacing, message is required
    if (!replaceDocument && !responseMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response message",
        variant: "destructive",
      });
      return;
    }

    setUploadingResponse(true);
    try {
      if (replaceDocument && responseFiles.length > 0) {
        // Upload new file
        const file = responseFiles[0];
        const uploadRes = await uploadFile(file, clientInfo.id, selectedDocument.company_id || undefined);
        if (uploadRes.error) {
          throw new Error(`Failed to upload ${file.name}: ${uploadRes.error}`);
        }
        
        const newDocumentId = uploadRes.data?.document_id;
        if (!newDocumentId) {
          throw new Error('Failed to get new document ID');
        }

        // Replace old document with new one (transfers clarification history)
        const replaceRes = await documentsApi.replace(selectedDocument.id, newDocumentId);
        if (replaceRes.error) {
          throw new Error(replaceRes.error);
        }

        // Send a message about the re-upload if there's a message
        if (responseMessage.trim()) {
          await clarificationsApi.sendMessage({
            document_id: newDocumentId,
            message: `[Re-uploaded document] ${responseMessage}`,
            recipient_role: 'accountant',
            is_reply: true,
          });
        }

        toast({
          title: "Document replaced",
          description: "New document uploaded and clarification history transferred",
        });

        setRespondDialogOpen(false);
      } else {
        // Just send message (with optional additional files)
        const uploadedFileIds: string[] = [];
        if (responseFiles.length > 0) {
          for (const file of responseFiles) {
            const uploadRes = await uploadFile(file, clientInfo.id, selectedDocument.company_id || undefined);
            if (uploadRes.error) {
              throw new Error(`Failed to upload ${file.name}: ${uploadRes.error}`);
            }
            if (uploadRes.data?.document_id) {
              uploadedFileIds.push(uploadRes.data.document_id);
            }
          }
        }

        const fileInfo = uploadedFileIds.length > 0
          ? ` (${uploadedFileIds.length} additional file${uploadedFileIds.length > 1 ? 's' : ''} attached)`
          : '';

        const response = await clarificationsApi.sendMessage({
          document_id: selectedDocument.id,
          message: responseMessage + fileInfo,
          recipient_role: 'accountant',
          is_reply: true,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        toast({
          title: "Response sent",
          description: `Your response${uploadedFileIds.length > 0 ? ' and files' : ''} have been sent to your accountant`,
        });

        // Refresh messages to show the new one
        await fetchClarificationMessages(selectedDocument.id);
      }

      setResponseMessage("");
      setResponseFiles([]);
      setResponseFilePreviews([]);
      fetchClientData();
    } catch (error: any) {
      console.error("Response error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setUploadingResponse(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const getStatusInfo = (status: DocumentStatus) => {
    const statusMap = {
      pending: { icon: Clock, label: "Pending", color: "text-amber-500", bg: "bg-amber-500/10" },
      posted: { icon: CheckCircle2, label: "Posted", color: "text-emerald-500", bg: "bg-emerald-500/10" },
      clarification_needed: { icon: AlertCircle, label: "Clarification", color: "text-red-500", bg: "bg-red-500/10" },
      resend_requested: { icon: RotateCcw, label: "Resend", color: "text-blue-500", bg: "bg-blue-500/10" },
    };
    return statusMap[status];
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${origin}/${filePath.replace(/^\//, "")}`;
  };

  const handleDocumentPreview = (doc: Document) => {
    const url = getFileUrl(doc.file_path);
    if (url) window.open(url, "_blank");
  };

  const handleDocumentDownload = (doc: Document) => {
    const url = getFileUrl(doc.file_path);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const stats = {
    pending: documents.filter((d) => d.status === "pending").length,
    posted: documents.filter((d) => d.status === "posted").length,
    action: documents.filter((d) => ["clarification_needed", "resend_requested"].includes(d.status)).length,
  };

  // HOME TAB
  const HomeTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 text-center border border-border/50">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border border-border/50">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.posted}</p>
          <p className="text-xs text-muted-foreground">Posted</p>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border border-border/50">
          <div className="w-12 h-12 rounded-full bg-red-500/10 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.action}</p>
          <p className="text-xs text-muted-foreground">Action</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-card rounded-lg p-6 border border-border/50">
        <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => { setUploadDialogOpen(true); setTimeout(handleCameraClick, 150); }}
            className="flex flex-col items-center p-5 bg-secondary/30 rounded-xl border-2 border-dashed border-muted hover:border-primary transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <span className="text-sm font-medium mt-3">Camera</span>
          </button>
          <button
            onClick={() => { setUploadDialogOpen(true); setTimeout(handleGalleryClick, 150); }}
            className="flex flex-col items-center p-5 bg-secondary/30 rounded-xl border-2 border-dashed border-muted hover:border-primary transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-primary" />
            </div>
            <span className="text-sm font-medium mt-3">Gallery</span>
          </button>
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="flex flex-col items-center p-5 bg-secondary/30 rounded-xl border-2 border-dashed border-muted hover:border-primary transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-primary" />
            </div>
            <span className="text-sm font-medium mt-3">Files</span>
          </button>
        </div>
      </div>
    </div>
  );

  // DOCUMENTS TAB — table like accountant with filters
  const DocumentsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Documents</h2>
        <p className="text-muted-foreground">{filteredDocuments.length} of {documents.length} documents</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{filteredDocuments.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{filteredDocuments.filter((d) => d.status === "pending").length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{filteredDocuments.filter((d) => d.status === "posted").length}</p>
            <p className="text-sm text-muted-foreground">Posted</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{filteredDocuments.filter((d) => ["clarification_needed", "resend_requested"].includes(d.status)).length}</p>
            <p className="text-sm text-muted-foreground">Action</p>
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
                placeholder="Search by file name or company..."
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={documentStatusFilter} onValueChange={setDocumentStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="clarification_needed">Clarification</SelectItem>
                  <SelectItem value="resend_requested">Resend</SelectItem>
                </SelectContent>
              </Select>
              <Select value={documentCompanyFilter} onValueChange={setDocumentCompanyFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {uniqueDocumentCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {documents.length === 0 ? "No documents uploaded" : "No documents match your filters"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
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
                              {doc.file_type?.includes("pdf") ? (
                                <FileIcon className="w-4 h-4 text-primary" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <p className="font-medium text-foreground truncate max-w-[200px]">{doc.file_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[140px]">{doc.company_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(doc.status === "clarification_needed" || doc.status === "resend_requested") ? (
                            <Badge
                              variant="outline"
                              className={`${status.bg} cursor-pointer hover:opacity-80 transition-opacity border-0`}
                              onClick={() => setActiveTab("clarifications")}
                              title="View clarifications"
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`${status.bg} border-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleDocumentPreview(doc)} title="Preview">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDocumentDownload(doc)} title="Download">
                              <Download className="w-4 h-4" />
                            </Button>
                            {(doc.status === "clarification_needed" || doc.status === "resend_requested") && (
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab("clarifications")} title="View clarification">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            )}
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
    </div>
  );

  // REMINDERS TAB — table format like firm documents; From: Firm/Accountant, Firm, Accountant columns
  const RemindersTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reminders</h2>
        <p className="text-muted-foreground">
          {filteredClientReminders.length} of {clientReminders.length} reminder{clientReminders.length !== 1 ? "s" : ""} received
        </p>
      </div>
      {/* Filters — same design as firm documents */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reminders..."
                value={reminderSearch}
                onChange={(e) => setReminderSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={reminderSenderFilter} onValueChange={setReminderSenderFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="firm">From Firm</SelectItem>
                  <SelectItem value="accountant">From Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Reminders Table */}
      <Card className="shadow-md border-border/50">
        <CardContent className="p-0">
          {loadingReminders ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClientReminders.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {clientReminders.length === 0 ? "No reminders yet" : "No reminders match your filters"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Firm</TableHead>
                    <TableHead>Accountant</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientReminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <p className="font-medium text-foreground truncate max-w-[160px]">{reminder.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={reminder.message}>
                          {reminder.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {reminder.sender_type === "accountant" ? "Accountant" : "Firm"}
                          {reminder.sender_type === "accountant" && reminder.sender_name
                            ? ` (${reminder.sender_name})`
                            : reminder.firm_name
                              ? ` (${reminder.firm_name})`
                              : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{reminder.firm_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">
                            {reminder.accountant_name ?? reminder.sender_name ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(reminder.sent_at).toLocaleString()}
                        </span>
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

  // NOTIFICATIONS TAB — table like documents/reminders; clicking row marks read and navigates
  const handleNotificationClick = (notif: Notification) => {
    markNotificationRead(notif.id);
    const t = (notif.title + " " + notif.message).toLowerCase();
    if (t.includes("clarification") || t.includes("resend")) {
      setActiveTab("clarifications");
    } else if (t.includes("reminder")) {
      setActiveTab("reminders");
    } else {
      setActiveTab("home");
    }
  };

  const NotificationsTab = () => {
    const [markingAllRead, setMarkingAllRead] = useState(false);

    const handleMarkAllRead = async () => {
      if (unreadCount === 0) return;
      setMarkingAllRead(true);
      try {
        await notificationsApi.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        toast({ title: "Success", description: "All notifications marked as read" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
      }
      setMarkingAllRead(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
            <p className="text-muted-foreground">{filteredNotifications.length} of {notifications.length} · {unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
        {/* Filters */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={notificationSearch}
                  onChange={(e) => setNotificationSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select value={notificationReadFilter} onValueChange={setNotificationReadFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Notifications Table */}
        <Card className="shadow-md border-border/50">
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">
                  {notifications.length === 0 ? "No notifications" : "No notifications match your filters"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notif) => (
                      <TableRow
                        key={notif.id}
                        className={`cursor-pointer hover:bg-primary/10 transition-colors ${!notif.is_read ? "bg-primary/5" : ""}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <p className="font-medium text-foreground truncate max-w-[200px]">{notif.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground truncate max-w-[280px]" title={notif.message}>
                            {notif.message}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {notif.is_read ? (
                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-0">
                              Read
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                              Unread
                            </Badge>
                          )}
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
  };

  // COMPANIES TAB – list companies and assigned accountant per company
  const CompaniesTab = () => {
    const [clientAccountant, setClientAccountant] = useState<{ full_name: string | null; email: string } | null>(null);
    const [loadingAccountant, setLoadingAccountant] = useState(true);

    useEffect(() => {
      const fetchClientAccountant = async () => {
        if (!clientInfo?.assigned_accountant_id) {
          setClientAccountant(null);
          setLoadingAccountant(false);
          return;
        }
        setLoadingAccountant(true);
        try {
          const res = await profilesApi.get(clientInfo.assigned_accountant_id);
          if (res.data && typeof res.data === "object" && "email" in res.data) {
            const d = res.data as { full_name?: string | null; email?: string };
            setClientAccountant({
              full_name: d.full_name ?? null,
              email: d.email ?? "",
            });
          } else {
            setClientAccountant(null);
          }
        } catch {
          setClientAccountant(null);
        }
        setLoadingAccountant(false);
      };
      fetchClientAccountant();
    }, [clientInfo?.assigned_accountant_id]);

    const getAccountantForCompany = (company: Company) => {
      if (company.accountant_full_name || company.accountant_email) {
        return company.accountant_full_name || company.accountant_email || "—";
      }
      if (company.assigned_accountant_id && (company.accountant_full_name !== undefined || company.accountant_email !== undefined)) {
        return company.accountant_full_name || company.accountant_email || "—";
      }
      return clientAccountant ? (clientAccountant.full_name || clientAccountant.email) : "—";
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Companies</h2>
          <p className="text-muted-foreground">Your companies and assigned accountant for each</p>
        </div>

        <div className="bg-card rounded-lg border border-border/50">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold">Your companies</h3>
            <p className="text-sm text-muted-foreground">
              Companies added to your account. Each company may have its own assigned accountant.
            </p>
          </div>
          <div className="p-4">
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">No companies yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your firm will add companies to organize your documents.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{company.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(company.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Assigned accountant</p>
                      {loadingAccountant && !company.accountant_full_name && !company.accountant_email ? (
                        <span className="text-sm flex items-center gap-1 justify-end">
                          <Loader2 className="w-3 h-3 animate-spin" /> …
                        </span>
                      ) : (
                        <p className="text-sm font-medium">{getAccountantForCompany(company)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // PROFILE TAB
  const ProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>
      <ClientProfileSettings />
      <div className="bg-card rounded-lg p-6 border border-border/50">
        <Button variant="destructive" className="w-full" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  // CLARIFICATIONS TAB — same structure as firm/accountant: table + filters (search, status, company)
  const ClarificationsTab = () => {
    const [clarificationDocs, setClarificationDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [clarificationSearch, setClarificationSearch] = useState("");
    const [clarificationStatusFilter, setClarificationStatusFilter] = useState<string>("all");
    const [clarificationCompanyFilter, setClarificationCompanyFilter] = useState<string>("all");

    useEffect(() => {
      const fetchClarificationDocs = async () => {
        setLoadingDocs(true);
        try {
          const res = await clarificationsApi.getDocuments();
          if (res.data) {
            setClarificationDocs(res.data);
          }
        } catch (error) {
          console.error("Error fetching clarification documents:", error);
        }
        setLoadingDocs(false);
      };
      fetchClarificationDocs();
    }, []);

    const uniqueClarificationCompanies = useMemo(() => {
      const seen = new Set<string>();
      const list: { id: string; name: string }[] = [];
      clarificationDocs.forEach((d: any) => {
        const id = d.company_id || "no-company";
        const name = (d.company_name && d.company_name.trim()) || "No Company";
        if (!seen.has(id)) {
          seen.add(id);
          list.push({ id, name });
        }
      });
      return list.sort((a, b) => (a.id === "no-company" ? 1 : b.id === "no-company" ? -1 : a.name.localeCompare(b.name)));
    }, [clarificationDocs]);

    const filteredClarificationDocs = useMemo(() => {
      return clarificationDocs.filter((doc: any) => {
        const q = clarificationSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          (doc.file_name || "").toLowerCase().includes(q) ||
          (doc.company_name || "").toLowerCase().includes(q) ||
          (doc.notes || "").toLowerCase().includes(q);
        const matchesStatus =
          clarificationStatusFilter === "all" || doc.status === clarificationStatusFilter;
        const companyId = doc.company_id || "no-company";
        const matchesCompany =
          clarificationCompanyFilter === "all" || companyId === clarificationCompanyFilter;
        return matchesSearch && matchesStatus && matchesCompany;
      });
    }, [clarificationDocs, clarificationSearch, clarificationStatusFilter, clarificationCompanyFilter]);

    const openReplyDialog = async (doc: any) => {
      setSelectedDocument(doc);
      setClarificationMessages([]);
      setRespondDialogOpen(true);
      await fetchClarificationMessages(doc.id);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clarifications</h2>
          <p className="text-muted-foreground">
            {filteredClarificationDocs.length} of {clarificationDocs.length} document
            {clarificationDocs.length !== 1 ? "s" : ""} need your attention
          </p>
        </div>
        {/* Filters — same design as firm documents/reminders */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by file name, company or notes..."
                  value={clarificationSearch}
                  onChange={(e) => setClarificationSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select value={clarificationStatusFilter} onValueChange={setClarificationStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="clarification_needed">Clarification</SelectItem>
                    <SelectItem value="resend_requested">Resend</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={clarificationCompanyFilter} onValueChange={setClarificationCompanyFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {uniqueClarificationCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Clarifications Table */}
        <Card className="shadow-md border-border/50">
          <CardContent className="p-0">
            {loadingDocs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClarificationDocs.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">
                  {clarificationDocs.length === 0
                    ? "No clarifications needed"
                    : "No documents match your filters"}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {clarificationDocs.length === 0 ? "All your documents are up to date" : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Clarification Notes</TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClarificationDocs.map((doc: any) => {
                      const docStatus = doc.status as DocumentStatus;
                      const status = getStatusInfo(docStatus) || {
                        icon: AlertCircle,
                        label: "Clarification",
                        color: "text-amber-500",
                        bg: "bg-amber-500/10",
                      };
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate max-w-[180px]">{doc.file_name}</p>
                                {doc.unread_count > 0 && (
                                  <Badge variant="destructive" className="mt-1 text-xs">
                                    {doc.unread_count} new
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">{doc.company_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={doc.notes || ""}>
                              {doc.notes || "—"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {doc.last_message_at
                                ? new Date(doc.last_message_at).toLocaleString()
                                : new Date(doc.uploaded_at).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${status.bg} border-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => openReplyDialog(doc)}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              View & Reply
                            </Button>
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
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "companies":
        return <CompaniesTab />;
      case "documents":
        return <DocumentsTab />;
      case "reminders":
        return <RemindersTab />;
      case "notifications":
        return <NotificationsTab />;
      case "clarifications":
        return <ClarificationsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar h-screen overflow-y-hidden transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col min-h-0">
          {/* Logo - Fixed at top */}
          <div className="flex-shrink-0 p-6 flex items-center justify-between border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <FileIcon className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">{appName}</span>
            </div>
            <button
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation - Fixed height with internal scrolling */}
          <div className="flex-1 min-h-0">
            <nav className="h-full overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative border-b border-sidebar-border/30 last:border-b-0",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">
                      {item.label}
                      {item.isNotification && unreadCount > 0 && (
                        <div className="absolute -top-1 -right-3 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                          <span className="text-[10px] text-white font-extrabold leading-none px-0.5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </span>
                  </button>
                );
              })}

              {/* Upload Button */}
              <div className="pt-4 border-t border-sidebar-border/50">
                <button
                  onClick={() => setUploadDialogOpen(true)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Documents</span>
                </button>
              </div>
            </nav>
          </div>

          {/* User Section - Always visible at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-sidebar-foreground/60">Client</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Client Dashboard</h1>
          <div className="flex items-center gap-2">
            <NotificationPopover
              onNewNotification={(n) => {
                toast({ title: n.title, description: n.message });
              }}
              onNotificationClick={(n) => {
                const t = (n.title + " " + n.message).toLowerCase();
                if (t.includes("clarification") || t.includes("resend")) setActiveTab("clarifications");
                else if (t.includes("reminder")) setActiveTab("reminders");
                else setActiveTab("home");
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) {
          setSelectedFiles([]);
          setPreviews([]);
          // Reset to first company if available
          if (companies.length > 0) {
            setSelectedCompanyId(companies[0].id);
          } else {
            setSelectedCompanyId(null);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {companies.length > 0 ? (
              <div className="space-y-2">
                <Label>Select Company *</Label>
                <Select value={selectedCompanyId || ""} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select which company this document belongs to</p>
              </div>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">
                  No companies have been added yet. Your firm will add companies for you to organize your documents.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleCameraClick} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed hover:border-primary transition-all">
                <Camera className="w-7 h-7 text-primary" />
                <span className="text-xs font-medium">Camera</span>
              </button>
              <button onClick={handleGalleryClick} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed hover:border-primary transition-all">
                <ImageIcon className="w-7 h-7 text-primary" />
                <span className="text-xs font-medium">Gallery</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed hover:border-primary transition-all">
                <FileIcon className="w-7 h-7 text-primary" />
                <span className="text-xs font-medium">Files</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{selectedFiles.length} file(s) selected</p>
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative">
                      {preview === "pdf" ? (
                        <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                          <FileIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <img src={preview} alt="" className="aspect-square object-cover rounded-lg" />
                      )}
                      <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { 
                setUploadDialogOpen(false); 
                setSelectedFiles([]); 
                setPreviews([]);
                if (companies.length > 0) {
                  setSelectedCompanyId(companies[0].id);
                } else {
                  setSelectedCompanyId(null);
                }
              }}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || uploading || (companies.length > 0 && !selectedCompanyId)}
                title={companies.length > 0 && !selectedCompanyId ? "Please select a company first" : ""}
              >
                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Respond to Accountant Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={(open) => {
        setRespondDialogOpen(open);
        if (!open) {
          // Clean up when dialog closes
          setSelectedDocument(null);
          setResponseMessage("");
          setResponseFiles([]);
          setResponseFilePreviews([]);
          setClarificationMessages([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Clarification Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDocument && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium">Document: {selectedDocument.file_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Status: {getStatusInfo(selectedDocument.status).label}
                  {selectedDocument.company_name && ` • Company: ${selectedDocument.company_name}`}
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
                          msg.sender_role === "client"
                            ? "bg-primary/10 ml-8"
                            : "bg-secondary mr-8"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {msg.sender_role === "client" ? "You" : msg.sender_name || "Accountant"}
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
                Your reply will be sent only to your assigned accountant.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Reply (optional if re-uploading)</Label>
              <Textarea
                placeholder="Type your response to the accountant..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Re-upload Section */}
            <div className="space-y-2 p-3 border border-dashed border-accent/50 rounded-lg bg-accent/5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Re-upload Document</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Replace the original document. Clarification history will be preserved.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('response-camera-input') as HTMLInputElement;
                      if (input) input.click();
                    }}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Camera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('response-gallery-input') as HTMLInputElement;
                      if (input) input.click();
                    }}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Select File
                  </Button>
                </div>
              </div>

              {/* File Previews */}
              {responseFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {responseFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg text-sm">
                      <FileIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResponseFile(index)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Response dialog file inputs */}
            <input
              id="response-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleResponseFileSelect}
            />
            <input
              id="response-gallery-input"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleResponseFileSelect}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                setRespondDialogOpen(false);
                setSelectedDocument(null);
                setResponseMessage("");
                setResponseFiles([]);
                setResponseFilePreviews([]);
                setClarificationMessages([]);
              }}>
                Close
              </Button>
              {responseFiles.length > 0 ? (
                <Button 
                  className="flex-1 bg-accent hover:bg-accent/90" 
                  onClick={() => handleRespond(true)} 
                  disabled={uploadingResponse}
                >
                  {uploadingResponse ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Replacing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-upload & Replace
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  className="flex-1" 
                  onClick={() => handleRespond(false)} 
                  disabled={!responseMessage.trim() || uploadingResponse}
                >
                  {uploadingResponse ? (
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
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClientDashboard() {
  const [firmId, setFirmId] = useState<string | null>(null);
  const [firmIdLoading, setFirmIdLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await clientsApi.getOwn();
        if (cancelled) return;
        if (res.data && res.data.length > 0 && res.data[0].firm_id) {
          setFirmId(res.data[0].firm_id);
        }
      } catch {
        if (!cancelled) setFirmId(null);
      } finally {
        if (!cancelled) setFirmIdLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (firmIdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppSettingsProvider firmId={firmId || undefined}>
      <ClientDashboardContent onFirmId={setFirmId} />
    </AppSettingsProvider>
  );
}
