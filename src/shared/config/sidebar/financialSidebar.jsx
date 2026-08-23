import { AlertTriangle, CreditCard, LayoutDashboard, Receipt } from "lucide-react";

import { t } from "@/shared/i18n";

export const financialSidebar = [
  {
    title: t("financial_department"),
    items: [{ label: t("dashboard"), icon: LayoutDashboard, to: "/financial", end: true }],
  },
  {
    title: t("transaction_management"),
    items: [
      { label: t("financial_transactions"), icon: Receipt, to: "/financial/transactions" },
      { label: t("payment_methods"), icon: CreditCard, to: "/financial/payments" },
    ],
  },
  {
    title: t("reviews_requests"),
    items: [{ label: t("financial_exceptions"), icon: AlertTriangle, to: "/financial/exceptions" }],
  },
];
