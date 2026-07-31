import {
  LayoutDashboard,
  Tag,
  BadgeDollarSign,
 
    Building2,
    Sparkles 
  
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
      label: "المشاريع ",
      icon: Building2,
      to: "/marketing/projects",
    },
    {
  label: "الخدمات",
        icon: Sparkles,
        to: "/marketing/services",
        end: true,
},
{
    label: "العروض والخصومات", 
    to: "/marketing/offers",
    icon: Tag,
    end: true,
  },
  ],
},
];