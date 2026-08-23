import PropTypes from "prop-types";
import { useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import platinumLogo from "@/assets/platinum-logo-clean.png";
import LogoutConfirm from "@/shared/components/LogoutConfirm";
import { t } from "@/shared/i18n";

export default function Sidebar({
  open = true,
  onClose = () => { },
  sections = [],
  footer,
}) {
  const defaultFooter = {
    label: t("sign_out"),
    onClick: () => {
      window.location.assign(`${window.location.origin}/logout`);
    },
    icon: LogOut,
  };

  const finalFooter = Object.assign({}, defaultFooter, footer || {});
  const FooterIcon = finalFooter.icon || LogOut;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = useSelector((state) => state.auth?.user);
  const account = user?.account || user || {};
  const accountName =
    account.full_name ||
    [account.first_name, account.last_name].filter(Boolean).join(" ") ||
    "Administrator";

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
        <div className="sidebar-brand platinum-brand">
          <img
            className="platinum-logo-image platinum-logo-base"
            src={platinumLogo}
            alt="Platinum Contracting and Construction"
          />
          <img
            className="platinum-logo-image platinum-logo-mark-layer"
            src={platinumLogo}
            alt=""
            aria-hidden="true"
          />
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
                    onClick={onClose}
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

      <div className="sidebar-skyline" aria-hidden="true">
        <svg viewBox="0 0 220 180" role="presentation">
          <g className="skyline-back">
            <path d="M14 166V108l24-18v76M30 101V58l30-20v128M50 166V92l28-18v92M73 166V45l25-22v143M93 166V79l28-23v110M117 166V105l25-18v79M140 166V67l32-27v126M170 166V99l24-17v84" />
          </g>
          <g className="skyline-front">
            <path d="M17 166V113l20-14v67M76 166V51l18-16v131M143 166V72l25-20v114" />
            <path d="M82 59h6M82 71h6M82 83h6M82 95h6M82 107h6M82 119h6M150 80h10M150 92h10M150 104h10M150 116h10" />
          </g>
        </svg>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <span className="sidebar-user-avatar" aria-hidden="true">
            {accountName.charAt(0).toUpperCase()}
          </span>
          <span className="sidebar-user-copy">
            <strong>{accountName}</strong>
            <small>{account.email || "Admin"}</small>
          </span>
        </div>
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
