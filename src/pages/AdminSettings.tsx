import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { applyFirmTheme, isThemeHex } from '@/lib/theme-vars';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';

const THEME_PRESETS = [
  { value: 'default', label: 'Navy (default)' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'violet', label: 'Violet' },
  { value: 'slate', label: 'Slate' },
  { value: 'amber', label: 'Amber' },
] as const;

function normalizeHex(hex: string): string {
  const h = hex.replace(/^#/, '').trim();
  if (h.length === 6 && /^[0-9A-Fa-f]{6}$/.test(h)) return '#' + h;
  if (h.length === 3 && /^[0-9A-Fa-f]{3}$/.test(h)) {
    return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return '#3b82f6';
}

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  is_public: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { refetchSettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/index.php`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        // Convert settings array to key-value object
        const settingsObj: Record<string, string> = {};
        data.settings.forEach((setting: Setting) => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
        setSettings(settingsObj);
      } else {
        throw new Error(data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Preview theme as soon as user changes (before save); only after form loaded
  useEffect(() => {
    if (loading) return;
    const theme = settings.theme_color || 'default';
    const toApply = theme === 'default' ? null : theme;
    applyFirmTheme(document.documentElement, toApply);
  }, [loading, settings.theme_color]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/index.php`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully!',
        });
        await refetchSettings?.();
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Customize Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your firm's branding. These settings will be reflected across your client portal.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <p className="text-sm text-muted-foreground">
              Company information and app name shown in the client portal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">App Name</label>
              <Input
                value={settings.app_name || ''}
                onChange={(e) => updateSetting('app_name', e.target.value)}
                placeholder="Your App Name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will appear in the header and throughout the application
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <Input
                value={settings.company_name || ''}
                onChange={(e) => updateSetting('company_name', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Support Email</label>
              <Input
                type="email"
                value={settings.support_email || ''}
                onChange={(e) => updateSetting('support_email', e.target.value)}
                placeholder="support@yourcompany.com"
              />
            </div>
            <div className="space-y-3">
              <Label>Theme colour</Label>
              <Select
                value={isThemeHex(settings.theme_color) ? 'custom' : (settings.theme_color || 'default')}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    const hex = isThemeHex(settings.theme_color) ? settings.theme_color! : '#3b82f6';
                    updateSetting('theme_color', normalizeHex(hex));
                  } else {
                    updateSetting('theme_color', value);
                  }
                }}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Choose theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom colour (hex)</SelectItem>
                </SelectContent>
              </Select>
              {isThemeHex(settings.theme_color) && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={isThemeHex(settings.theme_color) ? normalizeHex(settings.theme_color!) : '#3b82f6'}
                      onChange={(e) => updateSetting('theme_color', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                    />
                    <Label className="text-sm text-muted-foreground">Picker</Label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm text-muted-foreground">Hex code</Label>
                    <Input
                      type="text"
                      value={settings.theme_color || ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        updateSetting('theme_color', v ? (v.startsWith('#') ? v : '#' + v) : '#3b82f6');
                      }}
                      placeholder="#3b82f6"
                      className="font-mono w-28"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Applies to all accountants and clients under this firm. Use a preset or pick a custom colour.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={saveSettings} disabled={saving} className="min-w-[120px]">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}