import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function Sidebar({
  open = true,
  onClose = () => {},
  brand = {
    short: "عق",
    title: "نظام العقارات",
    subtitle: "لوحة الإدارة",
  },
  sections = [],
  footer = {
    label: "تسجيل الخروج",
    onClick: () => {},
    icon: LogOut,
  },
}) {
  const FooterIcon = footer.icon || LogOut;

  return (
    <aside className={`dashboard-sidebar ${open ? "is-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-badge">{brand.short}</span>

          <div className="brand-text">
            <h1>{brand.title}</h1>
            <p>{brand.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        >
          ×
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
                    end={item.end}
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
        <button type="button" className="logout-btn" onClick={footer.onClick}>
          <FooterIcon size={18} />
          <span>{footer.label}</span>
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  brand: PropTypes.shape({
    short: PropTypes.string,
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