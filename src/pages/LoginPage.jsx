import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  SunMedium,
} from "lucide-react";

import { loginUser } from "@/Rools/admin/features/auth/model/auth.thunks";
import { validateLogin, validatePassword } from "@/shared/utils/validation";
import { getAssignedWorkspaces } from "@/shared/auth/workspaces";
import platinumLogo from "@/assets/platinum-logo-clean.png";
import { getLanguage, setLanguage, t } from "@/shared/i18n";
import { useTheme } from "@/shared/theme/useTheme";
import "@/shared/ui/login.css";

// --- منطق استخراج ومطابقة الأدوار والمسارات الذكي ---
const normalizeText = (value) => String(value || "").trim().toLowerCase();

const collectUserText = (user = {}, availableRoles = []) => {
  const rolesText = availableRoles
    .map((r) => (typeof r === "string" ? r : r.name || r.slug || r.role || ""))
    .join(" ");

  return [
    user.role,
    user.type,
    user.position,
    user.job_title,
    user.department,
    user.department?.name,
    user.department?.slug,
    user.employee?.department,
    user.employee?.department?.name,
    user.employee?.department?.slug,
    user.account?.type,
    user.account?.full_name,
    user.account?.email,
    user.account?.roles?.join(" "),
    user.additional_info?.position,
    rolesText,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
};

const hasAnyMatch = (value, words) => words.some((word) => value.includes(word));

const getLoginPath = (payload = {}) => {
  const user = payload.user || payload.data?.user || {};
  const permissions =
    payload.permissions ||
    payload.user?.permissions ||
    payload.data?.permissions ||
    [];
  const availableRoles =
    payload.available_roles || payload.data?.available_roles || [];

  // 1. إذا كان لدى المستخدم أكثر من مساحة عمل محددة في نظام Workspaces الجديد
  try {
    const assigned = getAssignedWorkspaces(user);
    if (assigned && assigned.length > 1) {
      return "/choose-workspace";
    }
  } catch (e) {
    console.warn("Workspaces resolution fallback:", e);
  }

  // 2. التحقق حسب بيانات الوظيفة والـ Roles المسجلة
  const userText = collectUserText(user, availableRoles);

  if (hasAnyMatch(userText, ["engineering", "engineer", "engineering_staff", "هندسة"])) {
    return "/engineering";
  }

  if (
    hasAnyMatch(userText, [
      "finance_staff",
      "finance",
      "financial",
      "accounting",
      "مالية",
      "مالي",
      "محاسب",
      "محاسبة",
    ])
  ) {
    return "/financial";
  }

  if (
    hasAnyMatch(userText, [
      "customer_service_staff",
      "customer_service",
      "customer service",
      "support",
      "خدمة العملاء",
    ])
  ) {
    return "/customer-service";
  }

  if (hasAnyMatch(userText, ["marketing_staff", "marketing", "marketer", "تسويق"])) {
    return "/marketing";
  }

  if (hasAnyMatch(userText, ["legal", "law", "قانون"])) {
    return "/legal/slots";
  }

  if (hasAnyMatch(userText, ["admin", "administrator", "مدير"])) {
    return "/admin";
  }

  // 3. التحقق حسب الصلاحيات (Permissions)
  const permissionsText = permissions
    .map((p) => (typeof p === "string" ? p : p?.name || p?.key || p?.slug || ""))
    .map(normalizeText)
    .join(" ");

  if (hasAnyMatch(permissionsText, ["engineering", "engineer", "engineering_staff", "هندسة"])) {
    return "/engineering";
  }

  if (
    hasAnyMatch(permissionsText, [
      "payment",
      "finance",
      "contract-exception",
      "مالية",
      "مالي",
    ])
  ) {
    return "/financial";
  }

  if (
    hasAnyMatch(permissionsText, [
      "read.client",
      "create.client",
      "read.appointment",
      "create.appointment",
      "read.order",
      "update.order",
      "customer_service_staff",
      "client",
      "appointment",
    ])
  ) {
    return "/customer-service";
  }

  if (hasAnyMatch(permissionsText, ["legal", "law", "قانون"])) {
    return "/legal/slots";
  }

  return "/admin";
};

// --- المكون الرئيسي للمصادقة ---
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user, verifiedByBackend } = useSelector(
    (state) => state.auth
  );
  const { theme, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ login: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({ login: "", password: "" });

  // إعادة التوجيه في حال كان المستخدم مكيّش ومفعل الجلسة سابقاً
  if (token && verifiedByBackend) {
    const targetPath = getLoginPath({ user });
    return <Navigate to={targetPath} replace />;
  }

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const nextErrors = {
      login: validateLogin(formData.login),
      password: validatePassword(formData.password),
    };
    setFieldErrors(nextErrors);

    if (nextErrors.login || nextErrors.password) return;

    const result = await dispatch(loginUser(formData));

    if (loginUser.fulfilled.match(result)) {
      // الحصول على المسار الصحيح بناءً على بيانات الـ Payload بالكامل
      const targetPath = getLoginPath(result.payload);
      navigate(targetPath, { replace: true });
    }
  };

  return (
    <main className="platinum-login-page">
      <section className="platinum-login-shell">
        <div className="auth-page-controls">
          <button
            type="button"
            onClick={() => {
              setLanguage(getLanguage() === "ar" ? "en" : "ar");
              window.location.reload();
            }}
          >
            <Globe2 size={16} />
            <span>{getLanguage() === "ar" ? "العربية" : "English"}</span>
          </button>
          <button type="button" onClick={toggleTheme}>
            {theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? t("light_mode") : t("dark_mode")}</span>
          </button>
        </div>

        <div className="login-brand-panel">
          <span className="login-orb login-orb-one" />
          <span className="login-orb login-orb-two" />
          <img src={platinumLogo} alt="Platinum Contracting and Construction" />
          <div className="login-brand-copy">
            <span className="login-eyebrow">PLATINUM PORTAL</span>
            <h1>{t("login_brand_title")}</h1>
            <p>{t("login_brand_desc")}</p>
          </div>
          <div className="login-trust">
            <ShieldCheck size={20} />
            <span>{t("secure_access")}</span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-mobile-logo">
            <img src={platinumLogo} alt="Platinum" />
          </div>
          <span className="login-eyebrow">{t("welcome_back")}</span>
          <h2>{t("login_title")}</h2>
          <p className="login-intro">{t("login_subtitle")}</p>

          <form onSubmit={handleLogin} noValidate>
            <label className="modern-field">
              <span>{t("email")}</span>
              <div className={fieldErrors.login ? "has-error" : ""}>
                <Mail size={19} />
                <input
                  type="email"
                  name="login"
                  value={formData.login}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>
              {fieldErrors.login && <small>{fieldErrors.login}</small>}
            </label>

            <label className="modern-field">
              <span>{t("password")}</span>
              <div className={fieldErrors.password ? "has-error" : ""}>
                <LockKeyhole size={19} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("password_placeholder")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={t("toggle_password")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && <small>{fieldErrors.password}</small>}
            </label>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button className="platinum-login-button" type="submit" disabled={loading}>
              <span>{loading ? t("loading") : t("login")}</span>
              <ArrowLeft size={19} />
            </button>
          </form>
          <p className="login-help">{t("login_help")}</p>
        </div>
      </section>
    </main>
  );
}