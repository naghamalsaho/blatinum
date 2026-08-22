import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import DashboardLayout from "@/app/layouts/DashboardLayout";
import { marketingSidebar } from "@/shared/config/sidebar/marketingSidebar";

// استيراد الدوال من ملف الترجمة الخاص بك
import { getLanguage, setLanguage, t } from "@/shared/i18n";

import { Bell, Globe, LogOut } from "lucide-react";
import { logout } from "@/Rools/admin/features/auth/model/auth.slice";
import { logoutRequest } from "@/Rools/admin/features/auth/api/auth.api";
import { deleteDeviceTokenApi } from "@/shared/api/notifications.api";

export default function MarketingLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // حالة محلية لإجبار المكون على التحديث عند تغيير اللغة
  const [currentLang, setCurrentLang] = useState(getLanguage());

  // إعطاء الاتجاه واللغة للعنصر HTML عند بدء التحميل
  useEffect(() => {
    setLanguage(currentLang);
  }, [currentLang]);

  // دالة تبديل اللغة والاتجاه
  const handleLanguageToggle = () => {
    const nextLang = currentLang === "ar" ? "en" : "ar";
    setLanguage(nextLang); // تحديث الاتجاه و localStorage
    setCurrentLang(nextLang); // إعادة رسم الواجهة
  };

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
            label: currentLang === "ar" ? "English" : "العربية",
            icon: Globe,
            onClick: handleLanguageToggle,
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