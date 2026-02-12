import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ScrollText,
  Megaphone,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Building2, label: "Firms", href: "/admin/firms" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: BarChart3, label: "Usage & Billing", href: "/admin/usage" },
  { icon: Megaphone, label: "Announcements", href: "/admin/announcements" },
  { icon: ScrollText, label: "Audit Logs", href: "/admin/audit" },
  { icon: Settings, label: "Platform Settings", href: "/admin/settings" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 h-screen overflow-y-hidden transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex-shrink-0 p-6 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">DocqFlow</span>
                <span className="text-xs text-red-400 block -mt-1">Super Admin</span>
              </div>
            </div>
            <button className="lg:hidden text-gray-300" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 min-h-0">
            <nav className="h-full overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== "/admin" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-red-600/20 text-red-400"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-700">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">SA</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.email}</p>
                <p className="text-xs text-red-400">Super Admin</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-gray-200 hover:bg-gray-800"
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
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Super Admin Panel</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              ADMIN
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
