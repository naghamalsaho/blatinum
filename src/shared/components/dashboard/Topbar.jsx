import PropTypes from "prop-types";
import { ChevronDown, Menu, Search, SunMedium, Moon, PanelsTopLeft } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLanguage, setLanguage, t } from "@/shared/i18n";
import { getAssignedWorkspaces } from "@/shared/auth/workspaces";

export default function Topbar({
  onMenuClick = () => {},
  title = "",
  subtitle = "",
  searchPlaceholder = "Search...",
  actions = [],
}) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const ThemeIcon = theme === "dark" ? SunMedium : Moon;
  const user = useSelector((state) => state.auth?.user);
  const account = user?.account || user || {};
  const accountName =
    account.full_name ||
    [account.first_name, account.last_name].filter(Boolean).join(" ") ||
    "Administrator";
  const canSwitchWorkspace = getAssignedWorkspaces(user).length > 1;

  const handleLangToggle = () => {
    const next = getLanguage() === "en" ? "ar" : "en";
    setLanguage(next);
    window.location.reload();
  };

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

          if (action.key === "lang") {
            return (
              <button
                key={action.key}
                type="button"
                className="icon-btn topbar-lang-btn"
                onClick={handleLangToggle}
                aria-label={t("language")}
                title={t("language")}
              >
                <span>{getLanguage().toUpperCase()}</span>
                <ChevronDown size={13} />
              </button>
            );
          }

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

        {canSwitchWorkspace && (
          <button
            type="button"
            className="icon-btn workspace-switch-btn"
            onClick={() => navigate("/choose-workspace")}
            aria-label={t("switch_workspace")}
            title={t("switch_workspace")}
          >
            <PanelsTopLeft size={18} />
            <span>{t("switch_workspace")}</span>
          </button>
        )}

        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder={searchPlaceholder} />
          <span className="search-shortcut">Ctrl K</span>
        </div>

        <div className="topbar-user">
          <span className="topbar-user-avatar" aria-hidden="true">
            {accountName.charAt(0).toUpperCase()}
          </span>
          <span className="topbar-user-copy">
            <strong>{accountName}</strong>
            <small>{account.email || "Admin"}</small>
          </span>
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
