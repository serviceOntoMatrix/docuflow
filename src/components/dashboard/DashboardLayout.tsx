import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationPopover from "./NotificationPopover";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  FileUp,
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  isNotification?: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  unreadCount?: number;
}

export default function DashboardLayout({ children, navItems, title, unreadCount = 0 }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const settings = useAppSettings();
  const appName = settings?.app_name || "DocqFlow";

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNewNotification = (notification: { title: string; message: string }) => {
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const handleNotificationClick = (notification: { title: string; message: string }) => {
    const t = ((notification.title || "") + " " + (notification.message || "")).toLowerCase();
    if (t.includes("reminder")) {
      navigate("/dashboard/reminders");
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
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <FileUp className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">{appName}</span>
            </Link>
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
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative border-b border-sidebar-border/30 last:border-b-0",
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
                  </Link>
                );
              })}
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
                <p className="text-xs text-sidebar-foreground/60 capitalize">{title}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={handleSignOut}
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
          <h1 className="text-lg font-semibold text-foreground">{title} Dashboard</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationPopover onNewNotification={handleNewNotification} onNotificationClick={handleNotificationClick} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
