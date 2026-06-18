import {
  CalendarDays,
  Banknote,
  Scale,
  LayoutDashboard,
} from "lucide-react";

export const legalSidebar = [
  {
    title: "القسم القانوني",
    items: [
      {
  label: "لوحة القسم القانوني",
  icon: LayoutDashboard,
  to: "/legal",
  end: true,
},
      {
        label: "المواعيد المتاحة",
        icon: CalendarDays,
        to: "/legal/slots",
      },
     {
  label: "المبيعات",
  icon: Banknote,
  to: "/legal/sales",
},
    ],
  },
  {
    title: "القانون",
    items: [
      {
        label: "القضايا",
        icon: Scale,
        to: "/legal/cases",
      },
    ],
  },
];