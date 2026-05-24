import {
  LayoutDashboard,
  Megaphone,
  BadgeDollarSign,
  TicketPercent,
  ChartNoAxesCombined,
} from "lucide-react";


export const marketingSidebar = [
  {
    title: "قسم التسويق",
    items: [
      {
        label: "لوحة التسويق",
        icon: LayoutDashboard,
        to: "/marketing",
        end: true,
      },
    ],
  },

  {
    title: "إدارة التسويق",
    items: [
      {
        label: "الحملات الإعلانية",
        icon: Megaphone,
        to: "/marketing/campaigns",
      },

      {
        label: "الإعلانات",
        icon: BadgeDollarSign,
        to: "/marketing/ads",
      },

      {
        label: "العروض",
        icon: TicketPercent,
        to: "/marketing/offers",
      },
    ],
  },

  {
    title: "التحليلات",
    items: [
      {
        label: "التقارير والإحصائيات",
        icon: ChartNoAxesCombined,
        to: "/marketing/analytics",
      },
    ],
  },
];