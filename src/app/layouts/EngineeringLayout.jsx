import { Outlet } from "react-router-dom";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import { engineeringSidebar } from "@/shared/config/sidebar/engineeringSidebar";
import { Bell, Globe, LogOut } from "lucide-react";

export default function EngineeringLayout() {
  return (
    <DashboardLayout
      sidebarConfig={engineeringSidebar}
      brand={{
        short: "ه",
        title: "النظام الهندسي",
        subtitle: "إدارة المشاريع والمهندسين",
      }}
      topbar={{
        title: "القسم الهندسي",
        subtitle: "إدارة المشاريع والإسنادات",
        searchPlaceholder: "بحث في القسم الهندسي...",
        actions: [
          { key: "bell", label: "الإشعارات", icon: Bell, onClick: () => {} },
          { key: "lang", label: "اللغة", icon: Globe, onClick: () => {} },
        ],
        user: {
          name: "المشرف الهندسي",
          avatar: "ه",
        },
      }}
      footer={{
        label: "تسجيل الخروج",
        icon: LogOut,
        onClick: () => {},
      }}
    >
      <Outlet />
    </DashboardLayout>
  );
}