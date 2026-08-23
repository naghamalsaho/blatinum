import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Bell, Globe, LogOut } from "lucide-react";

import DashboardLayout from "@/app/layouts/DashboardLayout";
import { financialSidebar } from "@/shared/config/sidebar/financialSidebar";
import { getDirection, t } from "@/shared/i18n";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";
import { deleteDeviceTokenApi } from "@/shared/api/notifications.api";

export default function FinancialLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dir = getDirection();

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
    <DashboardLayout
      dir={dir}
      sidebarConfig={financialSidebar}
      brand={{ short: "F", title: t("financial_system"), subtitle: t("financial_system_desc") }}
      topbar={{
        title: t("financial_department"),
        subtitle: t("financial_department_desc"),
        searchPlaceholder: t("search_financial"),
        actions: [
          { key: "bell", label: t("notifications"), icon: Bell },
          { key: "lang", label: t("language"), icon: Globe },
        ],
        user: { name: t("financial_supervisor"), avatar: "F" },
      }}
      footer={{ label: t("sign_out"), icon: LogOut, onClick: handleLogout }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
