import { useState } from "react";
import PropTypes from "prop-types";

import Sidebar from "@/shared/components/dashboard/Sidebar";
import Topbar from "@/shared/components/dashboard/Topbar";
import GlobalErrorDialog from "@/shared/components/GlobalErrorDialog";
import { t } from "@/shared/i18n";
export default function DashboardLayout({
  sidebarConfig = [],
  topbar = {},
  brand = {},
  footer = {},
  dir = "rtl",
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
  <div className="dashboard-shell" dir={dir}>
    <Sidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      brand={brand}
      sections={sidebarConfig}
      footer={footer}
    />

    <main className="dashboard-main">
      <Topbar
        title={topbar.title}
        subtitle={topbar.subtitle}
        searchPlaceholder={topbar.searchPlaceholder}
        actions={topbar.actions}
        user={topbar.user}
      />

      <section className="dashboard-content">
        {children}
      </section>
    </main>

    {sidebarOpen && (
      <button
        type="button"
        className="dashboard-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-label={t("close")}
      />
    )}

    <GlobalErrorDialog />
  </div>
);
}

DashboardLayout.propTypes = {
  sidebarConfig: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          icon: PropTypes.elementType.isRequired,
          path: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ),
  topbar: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    searchPlaceholder: PropTypes.string,
    actions: PropTypes.array,
    user: PropTypes.shape({
      name: PropTypes.string,
      avatar: PropTypes.string,
    }),
  }),
  brand: PropTypes.shape({
    short: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
  }),
  footer: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.elementType,
  }),
  dir: PropTypes.oneOf(["ltr", "rtl"]),
  children: PropTypes.node,
};
