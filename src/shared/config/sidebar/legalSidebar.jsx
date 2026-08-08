import {
  CalendarDays,
  Banknote,
  LayoutDashboard,
  FileText,
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
    ],
  },
];