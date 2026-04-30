import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/components/dashboard/Sidebar";
import Topbar from "../../shared/components/dashboard/Topbar";
import "../../shared/ui/layout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell" dir="rtl">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

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