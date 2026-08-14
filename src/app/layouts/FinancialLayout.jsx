import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import { financialSidebar } from "@/shared/config/sidebar/financialSidebar";
import { Bell, Globe, LogOut } from "lucide-react";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";

export default function FinancialLayout() {
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
      footer={{ label: "تسجيل الخروج", icon: LogOut, onClick: handleLogout }}
    >
      <Outlet />
    </DashboardLayout>
  );
}