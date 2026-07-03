import { Outlet } from "react-router-dom";

import DashboardLayout from "@/app/layouts/DashboardLayout";

import { marketingSidebar } from "@/shared/config/sidebar/marketingSidebar";

import {
  Bell,
  Globe,
  LogOut,
} from "lucide-react";

export default function MarketingLayout() {
  return (
    <DashboardLayout
      sidebarConfig={marketingSidebar}
      brand={{
        short: "ت",
        title: "نظام التسويق",
        subtitle: "إدارة الحملات والإعلانات",
      }}
      topbar={{
        title: "قسم التسويق",
        subtitle: "إدارة الحملات والعروض والتحليلات",
        searchPlaceholder: "بحث في قسم التسويق...",

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
          name: "مشرف التسويق",
          avatar: "ت",
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