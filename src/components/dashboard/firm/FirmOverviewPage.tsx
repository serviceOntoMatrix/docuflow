import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Users,
  Building,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface Stats {
  totalClients: number;
  totalAccountants: number;
  pendingDocuments: number;
  processedToday: number;
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

interface FirmOverviewPageProps {
  stats: Stats;
  clients: Client[];
  accountants: Accountant[];
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  inviteType: "accountant" | "client";
  setInviteType: (value: "accountant" | "client") => void;
  dialogOpen: boolean;
  setDialogOpen: (value: boolean) => void;
  onInvite: (e: React.FormEvent) => void;
  loading: boolean;
  onAssignAccountant: (clientId: string, accountantId: string) => void;
  documents?: any[]; // Add documents for monthly stats
}

type TimelineOption = "week" | "month" | "year" | "all" | "dateRange";

export default function FirmOverviewPage({
  stats,
  clients,
  accountants,
  inviteEmail,
  setInviteEmail,
  inviteType,
  setInviteType,
  dialogOpen,
  setDialogOpen,
  onInvite,
  loading,
  onAssignAccountant,
  documents = [],
}: FirmOverviewPageProps) {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<TimelineOption>("month");
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(undefined);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
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

    const filteredDocs = documents.filter((doc: any) => {
      const docDate = new Date(doc.uploaded_at || doc.created_at);
      return docDate >= startDate && docDate <= endDate;
    });

    return {
      totalProcessed: filteredDocs.filter((d: any) => d.status === "posted").length,
      totalUploaded: filteredDocs.length,
      pending: filteredDocs.filter((d: any) => d.status === "pending").length,
      needsAction: filteredDocs.filter((d: any) => 
        ["clarification_needed", "resend_requested"].includes(d.status)
      ).length,
    };
  }, [documents, timeline, selectedDate]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Timeline Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="text-muted-foreground">Monitor your firm's activity</p>
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
                    classNames={{
                      months: "flex flex-col sm:flex-col space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center px-2",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center justify-between absolute w-full px-2",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-sm",
                      nav_button_previous: "absolute left-2",
                      nav_button_next: "absolute right-2",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem] text-center",
                      row: "flex w-full mt-1",
                      cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-xs hover:bg-accent hover:text-accent-foreground",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-accent/50 transition-all"
          onClick={() => navigate("/dashboard/clients")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalClients}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
          onClick={() => navigate("/dashboard/accountants")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accountants</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalAccountants}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-warning/50 transition-all"
          onClick={() => navigate("/dashboard/documents")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Documents</p>
                <p className="text-3xl font-bold text-foreground">{stats.pendingDocuments}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-success/50 transition-all"
          onClick={() => navigate("/dashboard/documents")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {timeline === "week" ? "Processed This Week" :
                   timeline === "month" ? "Processed This Month" :
                   timeline === "year" ? "Processed This Year" :
                   timeline === "dateRange" && selectedDate?.from && selectedDate?.to ?
                     `Processed ${format(selectedDate.from, "MMM dd")} - ${format(selectedDate.to, "MMM dd")}` :
                   "Total Processed"}
                </p>
                <p className="text-3xl font-bold text-foreground">{monthlyStats.totalProcessed}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {monthlyStats.totalUploaded} total uploaded
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats Section */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle
            className="text-foreground flex items-center gap-2 cursor-pointer hover:text-accent transition-colors"
            onClick={() => navigate("/dashboard/documents")}
          >
            <FileText className="w-5 h-5 text-accent" />
            Document Statistics
            {timeline !== "all" && (
              <span className="text-sm font-normal text-muted-foreground">
                ({timeline === "week" ? "This Week" : timeline === "month" ? "This Month" : "This Year"})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className="text-center p-4 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-foreground">{monthlyStats.totalUploaded}</p>
              <p className="text-sm text-muted-foreground">Total Uploaded</p>
            </div>
            <div
              className="text-center p-4 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-success">{monthlyStats.totalProcessed}</p>
              <p className="text-sm text-muted-foreground">Processed</p>
            </div>
            <div
              className="text-center p-4 rounded-lg bg-warning/10 cursor-pointer hover:bg-warning/20 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-warning">{monthlyStats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div
              className="text-center p-4 rounded-lg bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-destructive">{monthlyStats.needsAction}</p>
              <p className="text-sm text-muted-foreground">Needs Action</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Recent Clients & Accountants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No clients yet. Invite your first client to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.slice(0, 5).map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-accent font-medium">
                          {client.profiles?.full_name?.charAt(0) || client.profiles?.email?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {client.profiles?.full_name || client.profiles?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.company_name || "No company name"}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                      <Select
                        value={client.assigned_accountant_id || "unassigned"}
                        onValueChange={(v) =>
                          onAssignAccountant(client.id, v === "unassigned" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Assign" />
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Accountants */}
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Accountants</CardTitle>
          </CardHeader>
          <CardContent>
            {accountants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No accountants yet. Invite your first accountant to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accountants.slice(0, 5).map((acc) => {
                  const clientCount = clients.filter(
                    (c) => c.assigned_accountant_id === acc.accountant_id
                  ).length;
                  return (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {acc.profiles?.full_name?.charAt(0) || acc.profiles?.email?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {acc.profiles?.full_name || acc.profiles?.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {clientCount} client{clientCount !== 1 ? "s" : ""} assigned
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
