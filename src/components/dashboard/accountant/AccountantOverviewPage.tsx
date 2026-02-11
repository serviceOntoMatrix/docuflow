import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building,
  Eye,
  Download,
  RotateCcw,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

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

interface AccountantOverviewPageProps {
  documents: Document[];
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onAction: (doc: Document, type: DocumentStatus) => void;
}

type TimelineOption = "week" | "month" | "year" | "all" | "dateRange";

export default function AccountantOverviewPage({
  documents,
  onPreview,
  onDownload,
  onAction,
}: AccountantOverviewPageProps) {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<TimelineOption>("month");
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(undefined);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

  const pendingDocs = documents.filter((d) => d.status === "pending");
  const postedCount = documents.filter((d) => d.status === "posted").length;
  const needsActionCount = documents.filter((d) =>
    ["clarification_needed", "resend_requested"].includes(d.status)
  ).length;

  // Calculate stats based on timeline
  const timelineStats = useMemo(() => {
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

    const filteredDocs = documents.filter((doc) => {
      const docDate = new Date(doc.uploaded_at);
      return docDate >= startDate && docDate <= endDate;
    });

    return {
      totalProcessed: filteredDocs.filter((d) => d.status === "posted").length,
      totalUploaded: filteredDocs.length,
      pending: filteredDocs.filter((d) => d.status === "pending").length,
      needsAction: filteredDocs.filter((d) =>
        ["clarification_needed", "resend_requested"].includes(d.status)
      ).length,
    };
  }, [documents, timeline, selectedDate]);

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
    <div className="space-y-8 animate-fade-in">
      {/* Timeline Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="text-muted-foreground">Monitor your assigned documents</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-warning/50 transition-all"
          onClick={() => navigate("/dashboard/documents")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold text-foreground">{pendingDocs.length}</p>
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
                <p className="text-sm text-muted-foreground">Posted</p>
                <p className="text-3xl font-bold text-foreground">{postedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-destructive/50 transition-all"
          onClick={() => navigate("/dashboard/documents")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Need Action</p>
                <p className="text-3xl font-bold text-foreground">{needsActionCount}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="shadow-md border-border/50 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
          onClick={() => navigate("/dashboard/documents")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {timeline === "week" ? "This Week" :
                   timeline === "month" ? "This Month" :
                   timeline === "year" ? "This Year" : "Total"} Processed
                </p>
                <p className="text-3xl font-bold text-foreground">{timelineStats.totalProcessed}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {timelineStats.totalUploaded} total
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Statistics */}
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
                ({timeline === "week" ? "This Week" : timeline === "month" ? "This Month" : timeline === "year" ? "This Year" : "Custom Range"})
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
              <p className="text-2xl font-bold text-foreground">{timelineStats.totalUploaded}</p>
              <p className="text-sm text-muted-foreground">Total Uploaded</p>
            </div>
            <div
              className="text-center p-4 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-success">{timelineStats.totalProcessed}</p>
              <p className="text-sm text-muted-foreground">Processed</p>
            </div>
            <div
              className="text-center p-4 rounded-lg bg-warning/10 cursor-pointer hover:bg-warning/20 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-warning">{timelineStats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div
              className="text-center p-4 rounded-lg bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => navigate("/dashboard/documents")}
            >
              <p className="text-2xl font-bold text-destructive">{timelineStats.needsAction}</p>
              <p className="text-sm text-muted-foreground">Needs Action</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Documents */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Pending Review
            {pendingDocs.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingDocs.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>All caught up! No pending documents to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDocs.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.client_name || "Unknown client"}
                        {doc.company_name && (
                          <span className="inline-flex items-center gap-1 ml-1">
                            <Building className="w-3 h-3" />
                            {doc.company_name}
                          </span>
                        )} • {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPreview(doc)}
                      title="View document"
                    >
                      <Eye className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(doc)}
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction(doc, "posted")}
                      title="Mark as posted"
                    >
                      <CheckCircle className="w-4 h-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction(doc, "clarification_needed")}
                      title="Request clarification"
                    >
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction(doc, "resend_requested")}
                      title="Request resend"
                    >
                      <RotateCcw className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingDocs.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/dashboard/documents")}
                >
                  View all {pendingDocs.length} pending documents
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
