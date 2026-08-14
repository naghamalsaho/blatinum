import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import DashboardLayout from "@/app/layouts/DashboardLayout";

import { marketingSidebar } from "@/shared/config/sidebar/marketingSidebar";

import { Bell, Globe, LogOut } from "lucide-react";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";

export default function MarketingLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } finally {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };
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
      footer={{ label: "تسجيل الخروج", icon: LogOut, onClick: handleLogout }}
    >
      <Outlet />
    </DashboardLayout>
  );
}