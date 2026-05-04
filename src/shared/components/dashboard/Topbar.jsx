import PropTypes from "prop-types";
import { Menu, Search, ChevronDown, SunMedium, Moon } from "lucide-react";
import { useTheme } from "../../theme/useTheme";

export default function Topbar({
  onMenuClick = () => {},
  title = "لوحة التحكم",
  subtitle = "مرحباً، هذه نظرة عامة على النظام",
  searchPlaceholder = "بحث...",
  actions = [],
  user = {
    name: "المدير",
    avatar: "ع",
  },
}) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? SunMedium : Moon;

  return (
    <header className="dashboard-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
        >
          <Menu size={20} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
          title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
        >
          <ThemeIcon size={18} />
        </button>

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key || action.label}
              type="button"
              className="icon-btn"
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

      <div className="topbar-right">
        <div className="topbar-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <button type="button" className="profile-pill">
          <span className="profile-avatar">{user.avatar}</span>
          <span className="profile-name">{user.name}</span>
          <ChevronDown size={16} />
        </button>
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
  user: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string,
  }),
};