import {
  CalendarDays,
  Banknote,
  LayoutDashboard,
  FileText,
  Inbox,
} from "lucide-react";
import { t } from "@/shared/i18n";

export const getLegalSidebar = () => [
  {
    title: t("legal_sidebar.section_title"),
    items: [
      {
        label: t("legal_sidebar.dashboard"),
        icon: LayoutDashboard,
        to: "/legal",
        end: true,
      },
      {
        label: t("legal_sidebar.available_slots"),
        icon: CalendarDays,
        to: "/legal/slots",
      },
      {
        label: t("legal_sidebar.sales"),
        icon: Banknote,
        to: "/legal/sales",
      },
      {
        label: t("legal_sidebar.contracts"),
        icon: FileText,
        to: "/legal/contracts",
      },
      {
        label: t("legal_sidebar.incoming_orders"),
        icon: Inbox,
        to: "/legal/incoming-orders",
      },
    ],
  },
];
