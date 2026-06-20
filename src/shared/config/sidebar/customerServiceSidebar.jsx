import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";
import { t } from "@/shared/i18n";

export const customerServiceSidebar = [
  {
    title: t("workspace"),
    items: [
      {
        label: t("dashboard"),
        icon: LayoutDashboard,
        to: "/customer-service",
        end: true,
      },
    ],
  },
  {
    title: t("manage"),
    items: [
      {
        label: t("clients"),
        icon: UsersRound,
        to: "/customer-service/clients",
      },
      {
        label: t("appointments"),
        icon: CalendarDays,
        to: "/customer-service/appointments",
      },
      {
        label: t("orders"),
        icon: ClipboardList,
        to: "/customer-service/orders",
      },
    ],
  },
];
