import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminFirmsPage from "@/components/admin/AdminFirmsPage";
import AdminFirmDetail from "@/components/admin/AdminFirmDetail";
import AdminUsersPage from "@/components/admin/AdminUsersPage";
import AdminSettingsPage from "@/components/admin/AdminSettingsPage";
import AdminUsagePage from "@/components/admin/AdminUsagePage";
import AdminAuditPage from "@/components/admin/AdminAuditPage";
import AdminAnnouncementsPage from "@/components/admin/AdminAnnouncementsPage";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login", { replace: true });
    }
    if (!loading && user && userRole && userRole !== "super_admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto" />
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== "super_admin") return null;

  const currentPath = location.pathname;

  const renderContent = () => {
    if (currentPath.startsWith("/admin/firms/") && currentPath !== "/admin/firms") {
      const firmId = currentPath.replace("/admin/firms/", "");
      return <AdminFirmDetail firmId={firmId} />;
    }
    if (currentPath === "/admin/firms") return <AdminFirmsPage />;
    if (currentPath === "/admin/users") return <AdminUsersPage />;
    if (currentPath === "/admin/usage") return <AdminUsagePage />;
    if (currentPath === "/admin/settings") return <AdminSettingsPage />;
    if (currentPath === "/admin/audit") return <AdminAuditPage />;
    if (currentPath === "/admin/announcements") return <AdminAnnouncementsPage />;
    return <AdminOverview />;
  };

  return <AdminLayout>{renderContent()}</AdminLayout>;
}
