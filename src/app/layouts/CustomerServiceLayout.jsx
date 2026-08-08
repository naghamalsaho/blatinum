import { Outlet } from "react-router-dom";
import { Bell, LogOut, Globe } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import DashboardLayout from "@/app/layouts/DashboardLayout";
import { customerServiceSidebar } from "@/shared/config/sidebar/customerServiceSidebar";
import { t, getDirection } from "@/shared/i18n";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";

export default function CustomerServiceLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dir = getDirection();
  const pageMeta = {
    "/customer-service": [t("dashboard"), t("service_dashboard_desc")],
    "/customer-service/clients": [t("clients"), t("clients_page_desc")],
    "/customer-service/appointments": [t("appointments"), t("appointments_page_desc")],
    "/customer-service/orders": [t("orders"), t("orders_page_desc")],
    "/customer-service/complaints": [t("complaints"), t("complaints_page_desc")],
    "/customer-service/lottery": [t("lottery"), t("lottery_page_desc")],
    "/customer-service/chat": [t("service_chat_title"), t("chat_page_desc")],
  }[location.pathname] || [t("service_title"), ""];

  const handleLogout = async () => {
    await logoutRequest();
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <DashboardLayout
      dir={dir}
      sidebarConfig={customerServiceSidebar}
      brand={{
        short: "CS",
        title: t("service_title"),
        subtitle: t("service_subtitle"),
      }}
      topbar={{
        title: pageMeta[0],
        subtitle: pageMeta[1],
        searchPlaceholder: location.pathname === "/customer-service/chat" ? t("search_chats") : t("search_placeholder"),
        actions: [
          { key: "notifications", label: t("notifications"), icon: Bell },
          { key: "lang", label: t("language"), icon: Globe },
        ],
        user: {
          name: t("support_agent"),
          avatar: "CS",
        },
      }}
      footer={{
        label: t("sign_out"),
        icon: LogOut,
        onClick: handleLogout,
      }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
