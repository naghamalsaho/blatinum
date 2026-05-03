import {
  LayoutGrid,
  Bell,
  ClipboardList,
  FileText,
  Folder,
  Scale,
  Users,
  Building2,
  Settings,
  LogOut,
  Globe,
} from "lucide-react";

export const adminDashboardConfig = {
  brand: {
    short: "عق",
    title: "نظام العقارات",
    subtitle: "لوحة الإدارة",
  },

  sidebarSections: [
    {
      title: "الرئيسية",
      items: [
        { key: "dashboard", to: "/admin", label: "لوحة التحكم", icon: LayoutGrid, end: true },
        { key: "notifications", to: "/admin/notifications", label: "الإشعارات", icon: Bell },
      ],
    },
    {
      title: "إدارة النظام",
      items: [
        { key: "orders", to: "/admin/orders", label: "الطلبات", icon: ClipboardList },
        { key: "payments", to: "/admin/payments", label: "الدفعات", icon: FileText },
        { key: "contracts", to: "/admin/contracts", label: "العقود", icon: Scale },
        { key: "files", to: "/admin/files", label: "المستندات", icon: Folder },
      ],
    },
    {
      title: "الموارد",
      items: [
        { key: "users", to: "/admin/users", label: "المستخدمون", icon: Users },
        { key: "warehouses", to: "/admin/warehouses", label: "المستودعات", icon: Building2 },
        { key: "settings", to: "/admin/settings", label: "الإعدادات", icon: Settings },
      ],
    },
  ],

  topbar: {
    title: "لوحة التحكم",
    subtitle: "مرحباً، هذه نظرة عامة على النظام",
    searchPlaceholder: "بحث...",
    actions: [
      { key: "lang", label: "اللغة", icon: Globe },
    ],
    user: {
      name: "المدير",
      avatar: "ع",
    },
  },

  footer: {
    label: "تسجيل الخروج",
    icon: LogOut,
    onClick: () => {},
  },
};