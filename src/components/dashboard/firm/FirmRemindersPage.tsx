import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { remindersApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Calendar,
  User,
  Building,
  Send,
  CheckCircle,
  Loader2,
  Trash2,
  Search,
  Filter,
  Clock,
} from "lucide-react";

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

interface Reminder {
  id: string;
  title: string;
  message: string;
  recipient_type: 'client' | 'accountant';
  recipient_id: string;
  recipient_name: string;
  sent_at: string | null;
  created_at: string;
  status?: 'pending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  recurrence_type?: string;
  recurrence_end_at?: string | null;
}

interface FirmRemindersPageProps {
  firmId: string;
  clients: Client[];
  accountants: Accountant[];
  /** When true (accountant view), only allow sending to clients (no accountant option). */
  accountantView?: boolean;
}

export default function FirmRemindersPage({ firmId, clients, accountants, accountantView = false }: FirmRemindersPageProps) {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state: accountant can only send to client
  const [recipientType, setRecipientType] = useState<'client' | 'accountant'>(accountantView ? 'client' : 'client');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [reminderSearch, setReminderSearch] = useState('');
  const [reminderRecipientFilter, setReminderRecipientFilter] = useState<string>('all');
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      const q = reminderSearch.trim().toLowerCase();
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.message.toLowerCase().includes(q) || (r.recipient_name || '').toLowerCase().includes(q);
      const matchesRecipient = reminderRecipientFilter === 'all' || r.recipient_type === reminderRecipientFilter;
      return matchesSearch && matchesRecipient;
    });
  }, [reminders, reminderSearch, reminderRecipientFilter]);

  // Load reminders from API on mount
  const fetchReminders = async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const response = await remindersApi.getByFirm(firmId);
      if (response.data) {
        const mappedReminders: Reminder[] = response.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          recipient_type: r.recipient_type,
          recipient_id: r.recipient_id,
          recipient_name: r.recipient_name || r.recipient_email || 'Unknown',
          sent_at: r.sent_at ?? null,
          created_at: r.created_at,
          status: r.status,
          scheduled_at: r.scheduled_at,
          recurrence_type: r.recurrence_type,
          recurrence_end_at: r.recurrence_end_at,
        }));
        setReminders(mappedReminders);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!firmId) return;
    const run = async () => {
      await remindersApi.processDue();
      await fetchReminders();
    };
    run();
  }, [firmId]);

  const handleCreateReminder = async () => {
    if (!selectedRecipient || !reminderTitle.trim() || !reminderMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (sendOption === 'schedule' && !scheduleDateTime) {
      toast({
        title: "Validation Error",
        description: "Please set a date and time for the scheduled reminder",
        variant: "destructive",
      });
      return;
    }
    if (sendOption === 'schedule' && new Date(scheduleDateTime).getTime() <= Date.now()) {
      toast({
        title: "Validation Error",
        description: "Scheduled time must be in the future",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Find the recipient details
      let recipientName: string;
      let recipientUserId: string;

      if (recipientType === 'client') {
        const client = clients.find(c => c.id === selectedRecipient);
        if (!client) throw new Error('Client not found');
        recipientName = client.profiles?.full_name || client.company_name || 'Unknown Client';
        recipientUserId = client.user_id;
      } else {
        const accountant = accountants.find(a => a.accountant_id === selectedRecipient);
        if (!accountant) throw new Error('Accountant not found');
        recipientName = accountant.profiles?.full_name || 'Unknown Accountant';
        recipientUserId = accountant.accountant_id;
      }

      const scheduledAt =
        sendOption === 'now'
          ? new Date().toISOString()
          : scheduleDateTime
            ? new Date(scheduleDateTime).toISOString()
            : new Date().toISOString();

      const response = await remindersApi.create({
        firm_id: firmId,
        recipient_type: recipientType,
        recipient_id: selectedRecipient,
        recipient_user_id: recipientUserId,
        title: reminderTitle,
        message: reminderMessage,
        scheduled_at: scheduledAt,
        send_option: sendOption,
        recurrence_type: isRecurring ? recurrenceType : 'none',
        recurrence_end_at: isRecurring && recurrenceEndDate ? `${recurrenceEndDate}T23:59:59` : undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: sendOption === 'now' ? "Reminder Sent" : "Reminder Scheduled",
        description:
          sendOption === 'now'
            ? `Reminder sent to ${recipientName}`
            : `Reminder scheduled for ${new Date(scheduleDateTime).toLocaleString()}`,
      });

      // Refresh reminders list
      await fetchReminders();

      setRecipientType('client');
      setSelectedRecipient('');
      setReminderTitle('');
      setReminderMessage('');
      setSendOption('now');
      setScheduleDateTime('');
      setIsRecurring(false);
      setRecurrenceType('weekly');
      setRecurrenceEndDate('');
      setCreateDialogOpen(false);

    } catch (error: any) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await remindersApi.delete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Deleted",
        description: "Reminder deleted from history",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    }
  };

  const getRecipientOptions = () => {
    if (recipientType === 'client') {
      return clients.map(client => ({
        id: client.id,
        name: client.profiles?.full_name || client.company_name || client.profiles?.email || 'Unknown',
        type: 'client' as const
      }));
    } else {
      return accountants.map(accountant => ({
        id: accountant.accountant_id,
        name: accountant.profiles?.full_name || accountant.profiles?.email || 'Unknown',
        type: 'accountant' as const
      }));
    }
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
          <h2 className="text-2xl font-bold text-foreground">Reminders</h2>
          <p className="text-muted-foreground">{filteredReminders.length} of {reminders.length} reminders sent</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Reminder</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Recipient Type: hidden for accountant (only clients) */}
              {!accountantView && (
                <div className="space-y-2">
                  <Label>Recipient Type</Label>
                  <Select value={recipientType} onValueChange={(value) => {
                    setRecipientType(value as 'client' | 'accountant');
                    setSelectedRecipient('');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Recipient */}
              <div className="space-y-2">
                <Label>Select {accountantView ? 'Client' : (recipientType === 'client' ? 'Client' : 'Accountant')}</Label>
                <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${recipientType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getRecipientOptions().map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          {option.type === 'client' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Building className="w-4 h-4" />
                          )}
                          {option.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Reminder Title</Label>
                <Input
                  placeholder="e.g., Tax Document Deadline"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter reminder details..."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* When to send */}
              <div className="space-y-3">
                <Label>When to send</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sendOption"
                      checked={sendOption === 'now'}
                      onChange={() => setSendOption('now')}
                      className="rounded-full border-input"
                    />
                    <span>Send now</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sendOption"
                      checked={sendOption === 'schedule'}
                      onChange={() => setSendOption('schedule')}
                      className="rounded-full border-input"
                    />
                    <span>Set a date and time</span>
                  </label>
                  {sendOption === 'schedule' && (
                    <div className="pl-6 pt-1">
                      <Input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="max-w-[240px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Recurring */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">Recurring reminder</span>
                </label>
                {isRecurring && (
                  <div className="pl-6 flex flex-wrap items-center gap-3">
                    <Select value={recurrenceType} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setRecurrenceType(v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label className="text-muted-foreground text-xs whitespace-nowrap">End date (optional)</Label>
                      <Input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-[140px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateReminder}
                  disabled={
                    sending ||
                    !selectedRecipient ||
                    !reminderTitle.trim() ||
                    !reminderMessage.trim() ||
                    (sendOption === 'schedule' && !scheduleDateTime)
                  }
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {sendOption === 'now' ? 'Sending...' : 'Scheduling...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {sendOption === 'now' ? 'Send Now' : 'Schedule Reminder'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {(() => {
        const sent = filteredReminders.filter((r) => r.status === "sent").length;
        const scheduled = filteredReminders.filter((r) => r.status === "pending").length;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{filteredReminders.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">{sent}</p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-warning">{scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {filteredReminders.filter((r) => r.recurrence_type && r.recurrence_type !== "none").length}
                </p>
                <p className="text-sm text-muted-foreground">Recurring</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Filters */}
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
              {!accountantView && (
                <Select value={reminderRecipientFilter} onValueChange={setReminderRecipientFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders Table */}
      <Card className="shadow-md border-border/50">
        <CardContent className="p-0">
          {filteredReminders.length === 0 ? (
            <div className="py-12 text-center">
              <Send className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {reminders.length === 0 ? "No reminders sent yet." : "No reminders match your filters."}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                {reminders.length === 0 ? "Send your first reminder to get started." : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Send className="w-4 h-4 text-primary" />
                          </div>
                          <p className="font-medium text-foreground truncate max-w-[180px]">{reminder.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={reminder.message}>
                          {reminder.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          {reminder.recipient_type === "client" ? (
                            <User className="w-3.5 h-3.5" />
                          ) : (
                            <Building className="w-3.5 h-3.5" />
                          )}
                          <span className="truncate max-w-[120px]">{reminder.recipient_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{reminder.recipient_type}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {reminder.status === "pending"
                              ? new Date(reminder.scheduled_at || reminder.created_at).toLocaleString()
                              : new Date(reminder.sent_at || reminder.created_at).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {reminder.status === "pending" ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sent
                          </Badge>
                        )}
                        {reminder.recurrence_type && reminder.recurrence_type !== "none" && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {reminder.recurrence_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
