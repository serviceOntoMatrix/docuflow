import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Check, CheckCheck, Loader2, FileText, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  document_id: string | null;
}

export default function FirmNotificationsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<string>("all");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || (n.title + " " + n.message).toLowerCase().includes(q);
      const matchesRead = readFilter === "all" || (readFilter === "read" && n.is_read) || (readFilter === "unread" && !n.is_read);
      return matchesSearch && matchesRead;
    });
  }, [notifications, searchQuery, readFilter]);

  const getNotificationRoute = (notification: Notification): string => {
    const title = (notification.title || "").toLowerCase();
    const message = (notification.message || "").toLowerCase();
    const text = title + " " + message;

    if (text.includes("reminder")) return "/dashboard/reminders";

    if (userRole === "firm") {
      if (text.includes("clarification")) return "/dashboard/clarifications";
      if (title.includes("new client") || (message.includes("joined") && message.includes("client"))) return "/dashboard/clients";
      if (title.includes("new accountant") || (message.includes("joined") && message.includes("accountant"))) return "/dashboard/accountants";
    }

    if (userRole === "accountant") {
      if (text.includes("clarification")) return "/dashboard/documents";
    }

    if (notification.document_id) return "/dashboard/documents";
    return "/dashboard";
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    navigate(getNotificationRoute(notification));
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      pollIntervalRef.current = setInterval(fetchNotifications, 30000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const res = await notificationsApi.get();
      if (res.data) {
        setNotifications(res.data as Notification[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const res = await notificationsApi.markRead(id);
    if (!res.error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    // Mark each unread notification as read
    const unreadNotifs = notifications.filter(n => !n.is_read);
    
    try {
      await Promise.all(unreadNotifs.map(n => notificationsApi.markRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        title: "All marked as read",
        description: "All notifications have been marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          <p className="text-muted-foreground">
            {filteredNotifications.length} of {notifications.length} · {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={readFilter} onValueChange={setReadFilter}>
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

      {/* Notifications List */}
      <Card className="shadow-md border-border/50">
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {notifications.length === 0 ? "No notifications yet" : "No notifications match your filters"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {notifications.length === 0 ? "You'll be notified when clients upload documents" : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Notification</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className={`cursor-pointer hover:bg-accent/10 ${!notification.is_read ? "bg-accent/5" : ""}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <TableCell>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            notification.document_id
                              ? "bg-primary/10"
                              : "bg-accent/10"
                          }`}
                        >
                          {notification.document_id ? (
                            <FileText className="w-4 h-4 text-primary" />
                          ) : (
                            <Bell className="w-4 h-4 text-accent" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!notification.is_read ? (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Read
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark Read
                          </Button>
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
}
