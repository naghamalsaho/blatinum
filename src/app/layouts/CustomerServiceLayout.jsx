import { Outlet } from "react-router-dom";
import { LogOut, Globe } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "@/app/layouts/DashboardLayout";
import { customerServiceSidebar } from "@/shared/config/sidebar/customerServiceSidebar";
import { t, getLanguage } from "@/shared/i18n";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";

export default function CustomerServiceLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dir = getLanguage() === "en" ? "ltr" : "rtl";

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
        title: t("service_title"),
        subtitle: "",
        searchPlaceholder: t("search_placeholder"),
        actions: [ { key: "lang", label: t("language"), icon: Globe } ],
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
