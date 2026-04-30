import {
  LayoutDashboard,
  Bell,
  FileText,
  CreditCard,
  FolderOpen,
  Scale,
  Home,
  Users,
  Shuffle,
  HardHat,
  Megaphone,
  BarChart3,
  Bot,
  Settings,
  
} from "lucide-react";

export const roleLabels = {
  admin: "المدير العام",
  customer_service: "خدمة العملاء",
  legal: "القسم القانوني",
  financial: "القسم المالي",
  marketing: "التسويق",
};

export const navByRole = {
  admin: [
    {
      section: "الرئيسية",
      items: [
        { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
        { id: "notifications", label: "الإشعارات", icon: Bell, badge: 5 },
      ],
    },
    {
      section: "إدارة النظام",
      items: [
        { id: "requests", label: "الطلبات", icon: FileText, badge: 8 },
        { id: "payments", label: "الدفعات", icon: CreditCard, badge: 3 },
        { id: "documents", label: "المستندات", icon: FolderOpen },
        { id: "contracts", label: "العقود", icon: Scale },
        { id: "apartments", label: "الشقق", icon: Home },
        { id: "customers", label: "الزبائن", icon: Users },
        { id: "lottery", label: "نظام القرعة", icon: Shuffle },
      ],
    },
    {
      section: "الموارد",
      items: [
        { id: "engineers", label: "المهندسون", icon: HardHat },
        { id: "marketing", label: "التسويق", icon: Megaphone },
        { id: "finance", label: "التقارير المالية", icon: BarChart3 },
        { id: "chatbot", label: "المجيب الآلي", icon: Bot },
      ],
    },
    {
      section: "الإعدادات",
      items: [{ id: "settings", label: "الإعدادات", icon: Settings }],
    },
  ],
};