import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { emailPreferencesApi } from "@/lib/api";
import { Mail, Save, Loader2, Bell, FileText, MessageCircle, Clock, UserPlus, Megaphone } from "lucide-react";

interface Prefs {
  notify_document_uploaded: boolean;
  notify_document_status_changed: boolean;
  notify_clarification_received: boolean;
  notify_clarification_reply: boolean;
  notify_reminder: boolean;
  notify_new_client_joined: boolean;
  notify_new_accountant_joined: boolean;
  notify_invitation_received: boolean;
  notify_document_posted: boolean;
  notify_system_announcements: boolean;
  email_frequency: string;
}

const prefItems = [
  { key: "notify_document_uploaded", label: "Document Uploaded", desc: "When a client uploads a new document", icon: FileText, roles: ["firm", "accountant"] },
  { key: "notify_document_status_changed", label: "Document Status Changed", desc: "When a document status is updated (posted, clarification, etc.)", icon: FileText, roles: ["client"] },
  { key: "notify_document_posted", label: "Document Posted", desc: "When your document has been posted by the accountant", icon: FileText, roles: ["client"] },
  { key: "notify_clarification_received", label: "Clarification Received", desc: "When someone sends you a clarification request", icon: MessageCircle, roles: ["firm", "accountant", "client"] },
  { key: "notify_clarification_reply", label: "Clarification Reply", desc: "When someone replies to your clarification", icon: MessageCircle, roles: ["firm", "accountant", "client"] },
  { key: "notify_reminder", label: "Reminders", desc: "When a reminder is sent to you", icon: Clock, roles: ["accountant", "client"] },
  { key: "notify_new_client_joined", label: "New Client Joined", desc: "When a new client accepts an invitation", icon: UserPlus, roles: ["firm"] },
  { key: "notify_new_accountant_joined", label: "New Accountant Joined", desc: "When a new accountant accepts an invitation", icon: UserPlus, roles: ["firm"] },
  { key: "notify_invitation_received", label: "Invitation Received", desc: "When you receive a firm invitation", icon: Mail, roles: ["accountant", "client"] },
  { key: "notify_system_announcements", label: "System Announcements", desc: "Platform-wide announcements from DocqFlow", icon: Megaphone, roles: ["firm", "accountant", "client"] },
];

export default function EmailPreferences({ userRole }: { userRole?: string }) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>({
    notify_document_uploaded: true,
    notify_document_status_changed: true,
    notify_clarification_received: true,
    notify_clarification_reply: true,
    notify_reminder: true,
    notify_new_client_joined: true,
    notify_new_accountant_joined: true,
    notify_invitation_received: true,
    notify_document_posted: true,
    notify_system_announcements: true,
    email_frequency: "instant",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPrefs(); }, []);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const res = await emailPreferencesApi.get();
      const d = res.data?.data ?? res.data;
      if (d) {
        setPrefs({
          notify_document_uploaded: !!d.notify_document_uploaded,
          notify_document_status_changed: !!d.notify_document_status_changed,
          notify_clarification_received: !!d.notify_clarification_received,
          notify_clarification_reply: !!d.notify_clarification_reply,
          notify_reminder: !!d.notify_reminder,
          notify_new_client_joined: !!d.notify_new_client_joined,
          notify_new_accountant_joined: !!d.notify_new_accountant_joined,
          notify_invitation_received: !!d.notify_invitation_received,
          notify_document_posted: !!d.notify_document_posted,
          notify_system_announcements: !!d.notify_system_announcements,
          email_frequency: d.email_frequency || "instant",
        });
      }
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await emailPreferencesApi.update(prefs);
      toast({ title: "Email preferences saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    }
    setSaving(false);
  };

  const toggle = (key: keyof Prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  // Filter items relevant to the user's role
  const role = userRole || "client";
  const relevantItems = prefItems.filter((item) => item.roles.includes(role));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Choose which actions send you email notifications. You can turn off notifications you don't need to reduce email clutter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Email Frequency</Label>
            <p className="text-xs text-muted-foreground">How often to receive email notifications</p>
          </div>
          <Select value={prefs.email_frequency} onValueChange={(v) => setPrefs((p) => ({ ...p, email_frequency: v }))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="daily_digest">Daily Digest</SelectItem>
              <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
              <SelectItem value="off">Off (No Emails)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Individual toggles */}
        <div className="space-y-4">
          {relevantItems.map((item) => {
            const Icon = item.icon;
            const key = item.key as keyof Prefs;
            return (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={!!prefs[key]}
                  onCheckedChange={() => toggle(key)}
                  disabled={prefs.email_frequency === "off"}
                />
              </div>
            );
          })}
        </div>

        {prefs.email_frequency === "off" && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              Email notifications are turned off. You will only receive in-app notifications.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
