import {
  Bell,
  Building2,
  BriefcaseBusiness,
  Globe,
  LayoutGrid,
  LogOut,
  UsersRound,
} from "lucide-react";

export const adminDashboardConfig = {
  brand: {
    title: "Platinum",
    subtitle: "Admin Suite",
  },

  sidebarSections: [
    {
      title: "Main",
      items: [
        {
          key: "dashboard",
          to: "/admin",
          label: "Dashboard",
          icon: LayoutGrid,
          end: true,
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          key: "departments",
          to: "/admin/departments",
          label: "Departments",
          icon: BriefcaseBusiness,
        },
        {
          key: "employees",
          to: "/admin/employees",
          label: "Employees",
          icon: UsersRound,
        },
        {
          key: "warehouses",
          to: "/admin/warehouses",
          label: "Warehouses",
          icon: Building2,
        },
      ],
    },
  ],

  topbar: {
    title: "Platinum",
    subtitle: "",
    searchPlaceholder: "Search...",
    actions: [
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "lang", label: "Language", icon: Globe },
    ],
  },

  footer: {
    label: "Sign out",
    icon: LogOut,
    onClick: () => {},
  },
};
