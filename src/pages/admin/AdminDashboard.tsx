import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminFirmsPage from "@/components/admin/AdminFirmsPage";
import AdminUsersPage from "@/components/admin/AdminUsersPage";
import AdminSettingsPage from "@/components/admin/AdminSettingsPage";
import AdminUsagePage from "@/components/admin/AdminUsagePage";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
    if (!loading && user && userRole && userRole !== "super_admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== "super_admin") return null;

  const currentPath = location.pathname;

  const renderContent = () => {
    if (currentPath === "/admin/firms") return <AdminFirmsPage />;
    if (currentPath === "/admin/users") return <AdminUsersPage />;
    if (currentPath === "/admin/usage") return <AdminUsagePage />;
    if (currentPath === "/admin/settings") return <AdminSettingsPage />;
    return <AdminOverview />;
  };

  return <AdminLayout>{renderContent()}</AdminLayout>;
}
