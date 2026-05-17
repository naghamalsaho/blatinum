import PropTypes from "prop-types";
import { Menu, Search, SunMedium, Moon } from "lucide-react";
import { useTheme } from "../../theme/useTheme";

export default function Topbar({
  onMenuClick = () => {},
  title = "Platinum Admin",
  subtitle = "",
  searchPlaceholder = "Search...",
  actions = [],
}) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? SunMedium : Moon;

  return (
    <header className="dashboard-topbar">
      <div className="topbar-right">
        <div className="topbar-title">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          <ThemeIcon size={18} />
        </button>

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key || action.label}
              type="button"
              className={`icon-btn ${action.key === "notifications" ? "notification-btn" : ""}`}
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
            >
              <Icon size={18} />
            </button>
          );
        })}

        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder={searchPlaceholder} />
        </div>
      </div>
    </header>
  );
}

Topbar.propTypes = {
  onMenuClick: PropTypes.func,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      onClick: PropTypes.func,
    })
  ),
};
