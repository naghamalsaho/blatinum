import DashboardLayout from "@/app/layouts/DashboardLayout";
import { Outlet } from "react-router-dom";
import { getLegalSidebar } from "@/shared/config/sidebar/legalSidebar";
import { LogOut, Globe, Bell } from "lucide-react";
import { t } from "@/shared/i18n";

export default function LegalLayout() {
  const sidebarConfig = getLegalSidebar();

  return (
    <DashboardLayout
      sidebarConfig={sidebarConfig}
      brand={{
        short: t("legal_layout.brand_short"),
        title: t("legal_layout.brand_title"),
        subtitle: t("legal_layout.brand_subtitle"),
      }}
      topbar={{
        title: t("legal_layout.topbar_title"),
        subtitle: t("legal_layout.brand_subtitle"),
        searchPlaceholder: t("legal_layout.search_placeholder"),
        actions: [
          {
            key: "bell",
            label: t("legal_layout.notifications"),
            icon: Bell,
            onClick: () => {},
          },
          {
            key: "lang",
            label: t("legal_layout.language"),
            icon: Globe,
            onClick: () => {},
          },
        ],
        user: {
          name: t("legal_layout.user_name"),
          avatar: t("legal_layout.brand_short"),
        },
      }}
      footer={{
        label: t("legal_layout.logout"),
        icon: LogOut,
        onClick: () => {
          window.location.href = `${window.location.origin}/logout`;
        },
      }}
    >
      <Outlet />
    </DashboardLayout>
  );
}