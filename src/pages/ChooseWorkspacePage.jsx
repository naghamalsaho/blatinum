import { ArrowLeft, BriefcaseBusiness, Globe2, Headphones, Moon, Scale, Settings, ShieldCheck, SunMedium, Wrench } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import platinumLogo from "@/assets/platinum-logo-clean.png";
import { getWorkspaceForRole } from "@/shared/auth/workspaces";
import { selectRole } from "@/Rools/admin/features/auth/model/auth.thunks";
import { activateAssignedRole } from "@/Rools/admin/features/auth/model/auth.slice";
import { getLanguage, setLanguage, t } from "@/shared/i18n";
import { useTheme } from "@/shared/theme/useTheme";
import "@/shared/ui/login.css";

const icons = { admin: Settings, "customer-service": Headphones, engineering: Wrench, marketing: BriefcaseBusiness, legal: Scale };
const descriptions = { admin: "admin_workspace_desc", "customer-service": "customer_workspace_desc" };

export default function ChooseWorkspacePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { user, availableRoles, verifiedByBackend, roleSelecting, roleError } = useSelector((state) => state.auth);
  const roles = Array.isArray(availableRoles) ? availableRoles : [];
  const workspaces = roles
    .map((role) => ({ role, workspace: getWorkspaceForRole(role) }))
    .filter(({ workspace }) => Boolean(workspace));
  const account = user?.account || user || {};

  if (!verifiedByBackend) return <Navigate to="/" replace />;
  const chooseRole = async (role, workspace) => {
    if (!workspace) return;
    if (role.id == null) {
      dispatch(activateAssignedRole(role));
      navigate(workspace.path, { replace: true });
      return;
    }
    const result = await dispatch(selectRole(role));
    if (!selectRole.fulfilled.match(result)) return;
    navigate(workspace.path, { replace: true });
  };

  return (
    <main className="platinum-login-page">
      <section className="platinum-login-shell workspace-shell">
        <div className="auth-page-controls">
          <span className="workspace-account">{account.full_name || account.email || "Platinum"}</span>
          <button type="button" onClick={() => { setLanguage(getLanguage() === "ar" ? "en" : "ar"); window.location.reload(); }}><Globe2 size={16} /><span>{getLanguage() === "ar" ? "العربية" : "English"}</span></button>
          <button type="button" onClick={toggleTheme}>{theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}<span>{theme === "dark" ? t("light_mode") : t("dark_mode")}</span></button>
        </div>

        <div className="login-brand-panel">
          <img src={platinumLogo} alt="Platinum Contracting and Construction" />
          <div className="login-brand-copy"><span className="login-eyebrow">PLATINUM PORTAL</span><h1>{t("login_brand_title")}</h1><p>{t("login_brand_desc")}</p></div>
          <div className="login-trust"><ShieldCheck size={20} /><span>{t("secure_access")}</span></div>
        </div>

        <div className="login-form-panel workspace-panel">
          <span className="login-eyebrow">PLATINUM WORKSPACES</span>
          <h2>{t("choose_workspace")}</h2>
          <p className="login-intro">{t("choose_workspace_desc")}</p>
          <div className="workspace-grid">
            {workspaces.length === 0 && <div className="workspace-empty" role="alert">{t("no_workspace_assigned")}</div>}
            {roleError && <div className="workspace-empty" role="alert">{roleError}</div>}
            {workspaces.map(({ role, workspace }) => {
              const key = workspace?.key || `role-${role.id}`;
              const Icon = icons[workspace?.key] || BriefcaseBusiness;
              return (
                <button key={key} type="button" disabled={roleSelecting || !workspace} onClick={() => chooseRole(role, workspace)}>
                  <span className="workspace-icon"><Icon size={28} /></span>
                  <span className="workspace-choice-copy"><strong>{workspace ? t(workspace.labelKey) : role.name}</strong><small>{workspace ? t(descriptions[workspace.key] || "open_workspace") : "This workspace is not configured yet"}</small><em>{roleSelecting ? t("loading") : t("workspace_continue")} <ArrowLeft size={17} /></em></span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
