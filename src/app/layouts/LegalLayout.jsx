import DashboardLayout from "@/app/layouts/DashboardLayout";
import { Outlet } from "react-router-dom";
import { legalSidebar } from "@/shared/config/sidebar/legalSidebar";
import { LogOut, Globe, Bell } from "lucide-react";

export default function LegalLayout() {
  return (
    <DashboardLayout
      sidebarConfig={legalSidebar}
      brand={{
        short: "ق",
        title: "النظام القانوني",
        subtitle: "إدارة المواعيد والمهندسين",
      }}
      topbar={{
        title: "القسم القانوني",
        subtitle: "إدارة المواعيد والمهندسين",
        searchPlaceholder: "بحث في القسم القانوني...",
        actions: [
          { key: "bell", label: "الإشعارات", icon: Bell, onClick: () => {} },
          { key: "lang", label: "اللغة", icon: Globe, onClick: () => {} },
        ],
        user: {
          name: "المشرف القانوني",
          avatar: "ق",
        },
      }}
      footer={{
        label: "تسجيل الخروج",
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