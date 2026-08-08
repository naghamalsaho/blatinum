import {
  Bell,
  Building2,
  BriefcaseBusiness,
  Globe,
  KeyRound,
  LayoutGrid,
  LogOut,
  PackageSearch,
  UsersRound,
} from "lucide-react";
import { t } from "@/shared/i18n";

export const adminDashboardConfig = {
  brand: {
    title: t("admin_brand_title"),
    subtitle: t("admin_brand_subtitle"),
  },

  sidebarSections: [
    {
      title: t("main"),
      items: [
        {
          key: "dashboard",
          to: "/admin",
          label: t("dashboard"),
          icon: LayoutGrid,
          end: true,
        },
      ],
    },
    {
      title: t("resources"),
      items: [
        {
          key: "departments",
          to: "/admin/departments",
          label: t("departments"),
          icon: BriefcaseBusiness,
        },
        {
          key: "employees",
          to: "/admin/employees",
          label: t("employees"),
          icon: UsersRound,
        },
        {
          key: "warehouses",
          to: "/admin/warehouses",
          label: t("warehouses"),
          icon: Building2,
        },
        {
          key: "items",
          to: "/admin/items",
          label: t("items"),
          icon: PackageSearch,
        },
        {
          key: "roles-permissions",
          to: "/admin/roles-permissions",
          label: t("roles_permissions"),
          icon: KeyRound,
        },
      ],
    },
  ],

  topbar: {
    title: t("admin_brand_title"),
    subtitle: "",
    searchPlaceholder: t("search_placeholder"),
    actions: [
      { key: "notifications", label: t("notifications"), icon: Bell },
      { key: "lang", label: t("language"), icon: Globe },
    ],
  },

  footer: {
    label: t("sign_out"),
    icon: LogOut,
    onClick: () => {
      window.location.href = `${window.location.origin}/logout`;
    },
  },
};
