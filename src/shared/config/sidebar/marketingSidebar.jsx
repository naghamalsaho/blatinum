import {
  LayoutDashboard,
  Megaphone,
  BadgeDollarSign,
  TicketPercent,
    Building2,
  
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
  title: "إدارة المشاريع",
  items: [
    {
      label: "المشاريع والخدمات",
      icon: Building2,
      to: "/marketing/projects",
    },
  ],
},
];