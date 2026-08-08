import { Outlet } from "react-router-dom";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import { financialSidebar } from "@/shared/config/sidebar/financialSidebar";
import { Bell, Globe, LogOut } from "lucide-react";

export default function FinancialLayout() {
  return (
    <DashboardLayout
      sidebarConfig={financialSidebar}
      brand={{
        short: "م",
        title: "النظام المالي",
        subtitle: "إدارة المعاملات والدفعات",
      }}
      topbar={{
        title: "القسم المالي",
        subtitle: "إدارة الحركات المالية والإيصالات والاستثناءات",
        searchPlaceholder: "بحث في القسم المالي...",

        actions: [
          {
            key: "bell",
            label: "الإشعارات",
            icon: Bell,
            onClick: () => {},
          },
          {
            key: "lang",
            label: "اللغة",
            icon: Globe,
            onClick: () => {},
          },
        ],

        user: {
          name: "المشرف المالي",
          avatar: "م",
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