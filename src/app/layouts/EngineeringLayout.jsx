import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import { engineeringSidebar } from "@/shared/config/sidebar/engineeringSidebar";
import { Bell, Globe, LogOut } from "lucide-react";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";
import { deleteDeviceTokenApi } from "@/shared/api/notifications.api";

export default function EngineeringLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("fcmToken");
      if (token) {
        try {
          await deleteDeviceTokenApi(token);
        } catch (e) {}
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
      footer={{ label: "تسجيل الخروج", icon: LogOut, onClick: handleLogout }}
    >
      <Outlet />
    </DashboardLayout>
  );
}