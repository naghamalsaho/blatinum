import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  AlertTriangle,
  
} from "lucide-react";

export const financialSidebar = [
  {
    title: "القسم المالي",
    items: [
      {
        label: "لوحة التحكم",
        icon: LayoutDashboard,
        to: "/financial",
        end: true,
      },
    ],
  },
  {
    title: "إدارة المعاملات",
    items: [
      {
        label: "المعاملات المالية",
        icon: Receipt,
        to: "/financial/transactions",
      },
      {
        label: "طرق الدفع",
        icon: CreditCard,
        to: "/financial/payments",
      },
    ],
  },
  {
    title: "المراجعات والطلبات",
    items: [
      {
        label: "الاستثناءات المالية",
        icon: AlertTriangle,
        to: "/financial/exceptions",
      },
     
    ],
  },
];