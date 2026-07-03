import PropTypes from "prop-types";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Gem, LogOut } from "lucide-react";
import LogoutConfirm from "@/shared/components/LogoutConfirm";
import { t } from "@/shared/i18n";

export default function Sidebar({
  open = true,
  onClose = () => {},
  brand = {
    title: "Platinum",
    subtitle: "Admin",
  },
  sections = [],
  footer,
}) {
  const defaultFooter = {
    label: t("sign_out"),
    onClick: () => {
      window.location.href = `${window.location.origin}/logout`;
    },
    icon: LogOut,
  };

  const finalFooter = Object.assign({}, defaultFooter, footer || {});
  const FooterIcon = finalFooter.icon || LogOut;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirm = () => {
    try {
      finalFooter.onClick?.();
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  return (
    <aside className={`dashboard-sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-badge" aria-hidden="true">
            <Gem size={22} />
          </span>

          <div className="brand-text">
            <h1>{brand.title}</h1>
            <p>{brand.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="nav-group" key={section.title}>
            <span className="nav-group-title">{section.title}</span>

            <div className="nav-group-items">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.key || item.to}
                    to={item.to}
                    end={item.end ?? false}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <FooterIcon size={18} />
          <span>{finalFooter.label}</span>
        </button>
      </div>

      <LogoutConfirm
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirm}
      />
    </aside>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  brand: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
  }),
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string,
          to: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          icon: PropTypes.elementType.isRequired,
          end: PropTypes.bool,
        })
      ).isRequired,
    })
  ),
  footer: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.elementType,
  }),
};
