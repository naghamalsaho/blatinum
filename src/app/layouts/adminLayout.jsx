import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../shared/components/dashboard/Sidebar";
import Topbar from "../../shared/components/dashboard/Topbar";
import { adminDashboardConfig } from "../../shared/constants/dashboardData";
import { getDirection, t } from "@/shared/i18n";
import "../../shared/ui/layout.css";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";
import { deleteDeviceTokenApi } from "@/shared/api/notifications.api";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dir = getDirection();
  const { pathname } = useLocation();
  const pageMeta = {
    "/admin": [t("dashboard"), t("admin_dashboard_desc")],
    "/admin/departments": [t("departments"), t("departments_page_desc")],
    "/admin/employees": [t("employees"), t("employees_page_desc")],
    "/admin/warehouses": [t("warehouses"), t("warehouses_page_desc")],
    "/admin/items": [t("items"), t("items_page_desc")],
    "/admin/activity-logs": [t("activity_logs"), t("activity_logs_page_desc")],
    "/admin/reports": [t("reports"), t("reports_page_desc")],
    "/admin/roles-permissions": [t("roles_permissions"), t("roles_page_desc")],
  }[pathname] || [adminDashboardConfig.topbar.title, adminDashboardConfig.topbar.subtitle];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("fcmToken");
      if (token) {
        try { await deleteDeviceTokenApi(token); } catch { /* Logout must continue if token cleanup fails. */ }
        localStorage.removeItem("fcmToken");
      }
      await logoutRequest();
    } finally {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="dashboard-shell" dir={dir}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={adminDashboardConfig.brand}
        sections={adminDashboardConfig.sidebarSections}
        footer={{ ...adminDashboardConfig.footer, onClick: handleLogout }}
      />

      <main className="dashboard-main">
        <Topbar
          title={pageMeta[0]}
          subtitle={pageMeta[1]}
          searchPlaceholder={adminDashboardConfig.topbar.searchPlaceholder}
          actions={adminDashboardConfig.topbar.actions}
        />

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>

      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close backdrop"
        />
      )}
    </div>
  );
}
