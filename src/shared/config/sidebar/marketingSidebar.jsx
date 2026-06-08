import {
  LayoutDashboard,
 
  BadgeDollarSign,
 
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
        label: "الإعلانات",
        icon: BadgeDollarSign,
        to: "/marketing/ads",
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