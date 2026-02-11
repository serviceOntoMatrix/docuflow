import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { applyFirmTheme } from '@/lib/theme-vars';

interface AppSettings {
  app_name: string;
  app_description: string;
  company_name: string;
  hero_title: string;
  hero_subtitle: string;
  features_json: any[];
  support_email?: string;
  theme_color?: string;
  [key: string]: any;
}

type AppSettingsContextValue = AppSettings & { refetchSettings?: () => Promise<void> };

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};

interface AppSettingsProviderProps {
  children: React.ReactNode;
  firmId?: string; // Optional firm ID for firm-specific settings
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({
  children,
  firmId
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = React.useCallback(async () => {
    try {
      const url = firmId
        ? `${API_BASE_URL}/settings/index.php?public=1&firm_id=${encodeURIComponent(firmId)}`
        : `${API_BASE_URL}/settings/index.php?public=1`;

      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();

      if (data.success && data.settings && typeof data.settings === 'object') {
        const next = data.settings;
        const raw = next.theme_color;
        const theme =
          raw != null && String(raw).trim() !== '' && String(raw).trim() !== 'default'
            ? String(raw).trim()
            : null;
        applyFirmTheme(document.documentElement, theme);
        setSettings(next);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
      setSettings({
        app_name: 'DocqFlow',
        app_description: 'Streamline Your Document Workflow',
        company_name: 'DocqFlow',
        hero_title: 'Streamline Your Document Workflow',
        hero_subtitle: 'Connect your clients with your accounting team through a simple, secure document management platform.',
        features_json: [
          { title: "Easy Document Upload", description: "Clients can snap photos or upload documents directly from their mobile device", icon: "FileUp" },
          { title: "Team Management", description: "Firms can assign clients to accountants and track all document workflows", icon: "Users" },
          { title: "Real-time Notifications", description: "Stay updated with instant alerts when documents are uploaded or require action", icon: "Bell" },
          { title: "Secure & Compliant", description: "Bank-level security ensures your sensitive financial documents are protected", icon: "Shield" }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    setLoading(true);
    loadSettings();
  }, [loadSettings]);

  // Apply firm theme: set CSS variables on <html> so color definitely changes.
  useEffect(() => {
    const raw = settings?.theme_color;
    const theme =
      raw != null && String(raw).trim() !== '' && String(raw).trim() !== 'default'
        ? String(raw).trim()
        : null;
    applyFirmTheme(document.documentElement, theme);
  }, [settings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const contextValue: AppSettingsContextValue = {
    ...(settings || {}),
    refetchSettings: loadSettings
  };

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
};