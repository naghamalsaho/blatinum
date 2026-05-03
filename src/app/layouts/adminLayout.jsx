import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/components/dashboard/Sidebar";
import Topbar from "../../shared/components/dashboard/Topbar";
import { adminDashboardConfig } from "../../shared/constants/dashboardData";
import "../../shared/ui/layout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell" dir="rtl">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={adminDashboardConfig.brand}
        sections={adminDashboardConfig.sidebarSections}
        footer={adminDashboardConfig.footer}
      />

      <main className="dashboard-main">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={adminDashboardConfig.topbar.title}
          subtitle={adminDashboardConfig.topbar.subtitle}
          searchPlaceholder={adminDashboardConfig.topbar.searchPlaceholder}
          actions={adminDashboardConfig.topbar.actions}
          user={adminDashboardConfig.topbar.user}
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
          aria-label="إغلاق الخلفية"
        />
      )}
    </div>
  );
}