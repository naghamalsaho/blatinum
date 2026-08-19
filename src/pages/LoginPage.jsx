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

import {
  loginUser,
  selectRole,
} from "@/Rools/admin/features/auth/model/auth.thunks";

import { activateAssignedRole } from "@/Rools/admin/features/auth/model/auth.slice";

import {
  validateLogin,
  validatePassword,
} from "@/shared/utils/validation";

import {
  extractAvailableRoles,
  getWorkspaceForRole,
  getAssignedWorkspaces,
} from "@/shared/auth/workspaces";

import platinumLogo from "@/assets/platinum-logo-clean.png";
import { getLanguage, setLanguage, t } from "@/shared/i18n";
import { useTheme } from "@/shared/theme/useTheme";
import "@/shared/ui/login.css";


// ======================================================
// منطق استخراج ومطابقة الأدوار والمسارات
// ======================================================

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();


const collectUserText = (user = {}, availableRoles = []) => {
  const rolesText = availableRoles
    .map((r) =>
      typeof r === "string"
        ? r
        : r.name || r.slug || r.role || ""
    )
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


const hasAnyMatch = (value, words) =>
  words.some((word) => value.includes(word));


// ======================================================
// تحديد المسار المناسب بعد تسجيل الدخول
// ======================================================

const getLoginPath = (payload = {}) => {
  const user =
    payload.user ||
    payload.data?.user ||
    {};

  const permissions =
    payload.permissions ||
    payload.user?.permissions ||
    payload.data?.permissions ||
    [];

  const availableRoles =
    payload.available_roles ||
    payload.data?.available_roles ||
    [];

  // ------------------------------------------------------
  // إذا كان لدى المستخدم أكثر من Workspace
  // ------------------------------------------------------

  try {
    const assigned = getAssignedWorkspaces(user);

    if (assigned && assigned.length > 1) {
      return "/choose-workspace";
    }
  } catch (error) {
    console.warn(
      "Workspaces resolution fallback:",
      error
    );
  }


  // ------------------------------------------------------
  // التحقق حسب بيانات المستخدم والـ Roles
  // ------------------------------------------------------

  const userText = collectUserText(
    user,
    availableRoles
  );


  // Engineering
  if (
    hasAnyMatch(userText, [
      "engineering",
      "engineer",
      "engineering_staff",
      "هندسة",
    ])
  ) {
    return "/engineering";
  }


  // Finance
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


  // Customer Service
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


  // Marketing
  if (
    hasAnyMatch(userText, [
      "marketing_staff",
      "marketing",
      "marketer",
      "تسويق",
    ])
  ) {
    return "/marketing";
  }


  // Legal
  if (
    hasAnyMatch(userText, [
      "legal",
      "law",
      "قانون",
    ])
  ) {
    return "/legal/slots";
  }


  // Admin
  if (
    hasAnyMatch(userText, [
      "admin",
      "administrator",
      "مدير",
    ])
  ) {
    return "/admin";
  }


  // ------------------------------------------------------
  // التحقق حسب Permissions
  // ------------------------------------------------------

  const permissionsText = permissions
    .map((permission) =>
      typeof permission === "string"
        ? permission
        : permission?.name ||
          permission?.key ||
          permission?.slug ||
          ""
    )
    .map(normalizeText)
    .join(" ");


  // Engineering permissions
  if (
    hasAnyMatch(permissionsText, [
      "engineering",
      "engineer",
      "engineering_staff",
      "هندسة",
    ])
  ) {
    return "/engineering";
  }


  // Finance permissions
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


  // Customer Service permissions
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


  // Legal permissions
  if (
    hasAnyMatch(permissionsText, [
      "legal",
      "law",
      "قانون",
    ])
  ) {
    return "/legal/slots";
  }


  // fallback
  return "/admin";
};


// ======================================================
// Login Page
// ======================================================

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    loading,
    error,
    token,
    user,
    activeRole,
    verifiedByBackend,
  } = useSelector((state) => state.auth);

  const {
    theme,
    toggleTheme,
  } = useTheme();


  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] =
    useState({
      login: "",
      password: "",
    });

  const [fieldErrors, setFieldErrors] =
    useState({
      login: "",
      password: "",
    });


  // ======================================================
  // إذا كان المستخدم مسجل دخول مسبقاً
  // ======================================================

  if (token && verifiedByBackend) {

    // أولاً نحاول الاعتماد على activeRole
    if (activeRole) {
      const workspace =
        getWorkspaceForRole(activeRole);

      if (workspace?.path) {
        return (
          <Navigate
            to={workspace.path}
            replace
          />
        );
      }
    }

    // fallback على المنطق القديم
    const targetPath =
      getLoginPath({ user });

    return (
      <Navigate
        to={targetPath}
        replace
      />
    );
  }


  // ======================================================
  // تغيير الحقول
  // ======================================================

  const handleChange = ({
    target: { name, value },
  }) => {

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }
  };


  // ======================================================
  // تسجيل الدخول
  // ======================================================

  const handleLogin = async (event) => {
    event.preventDefault();


    // ------------------------------
    // Validation
    // ------------------------------

    const nextErrors = {
      login: validateLogin(
        formData.login
      ),
      password: validatePassword(
        formData.password
      ),
    };

    setFieldErrors(nextErrors);


    if (
      nextErrors.login ||
      nextErrors.password
    ) {
      return;
    }


    // ------------------------------
    // Login API
    // ------------------------------

    const result =
      await dispatch(
        loginUser(formData)
      );


    // إذا فشل تسجيل الدخول
    if (
      !loginUser.fulfilled.match(result)
    ) {
      return;
    }


    // ------------------------------
    // استخراج الـ Payload
    // ------------------------------

    const payload =
      result.payload?.data ||
      result.payload ||
      {};


    const roles =
      extractAvailableRoles(payload);


    // ====================================================
    // أكثر من Role
    // ====================================================

    if (roles.length > 1) {
      navigate(
        "/choose-workspace",
        { replace: true }
      );

      return;
    }


    // ====================================================
    // Role واحدة فقط
    // ====================================================

    if (roles.length === 1) {
      const selectedRole =
        roles[0];

      const workspace =
        getWorkspaceForRole(
          selectedRole
        );


      // ------------------------------------------
      // Role ليس لها ID
      // ------------------------------------------

      if (selectedRole.id == null) {

        dispatch(
          activateAssignedRole(
            selectedRole
          )
        );

        const fallbackPath =
          getLoginPath(
            result.payload
          );

        navigate(
          workspace?.path ||
            fallbackPath,
          { replace: true }
        );

        return;
      }


      // ------------------------------------------
      // Role لها ID → Select Role API
      // ------------------------------------------

      const roleResult =
        await dispatch(
          selectRole(
            selectedRole
          )
        );


      if (
        !selectRole.fulfilled.match(
          roleResult
        )
      ) {
        return;
      }


      const fallbackPath =
        getLoginPath(
          result.payload
        );


      navigate(
        workspace?.path ||
          fallbackPath,
        { replace: true }
      );

      return;
    }


    // ====================================================
    // إذا لم نستطع استخراج Roles
    // نستخدم المنطق القديم
    // ====================================================

    const targetPath =
      getLoginPath(
        result.payload
      );

    navigate(
      targetPath,
      { replace: true }
    );
  };


  // ======================================================
  // UI
  // ======================================================

  return (
    <main className="platinum-login-page">

      <section className="platinum-login-shell">

        {/* ============================= */}
        {/* Language + Theme */}
        {/* ============================= */}

        <div className="auth-page-controls">

          <button
            type="button"
            onClick={() => {
              setLanguage(
                getLanguage() === "ar"
                  ? "en"
                  : "ar"
              );

              window.location.reload();
            }}
          >
            <Globe2 size={16} />

            <span>
              {getLanguage() === "ar"
                ? "العربية"
                : "English"}
            </span>
          </button>


          <button
            type="button"
            onClick={toggleTheme}
          >
            {theme === "dark"
              ? (
                <SunMedium size={16} />
              )
              : (
                <Moon size={16} />
              )
            }

            <span>
              {theme === "dark"
                ? t("light_mode")
                : t("dark_mode")}
            </span>
          </button>

        </div>


        {/* ============================= */}
        {/* Brand Panel */}
        {/* ============================= */}

        <div className="login-brand-panel">

          <span className="login-orb login-orb-one" />

          <span className="login-orb login-orb-two" />


          <img
            src={platinumLogo}
            alt="Platinum Contracting and Construction"
          />


          <div className="login-brand-copy">

            <span className="login-eyebrow">
              PLATINUM PORTAL
            </span>

            <h1>
              {t("login_brand_title")}
            </h1>

            <p>
              {t("login_brand_desc")}
            </p>

          </div>


          <div className="login-trust">

            <ShieldCheck size={20} />

            <span>
              {t("secure_access")}
            </span>

          </div>

        </div>


        {/* ============================= */}
        {/* Login Form */}
        {/* ============================= */}

        <div className="login-form-panel">

          <div className="login-mobile-logo">

            <img
              src={platinumLogo}
              alt="Platinum"
            />

          </div>


          <span className="login-eyebrow">
            {t("welcome_back")}
          </span>


          <h2>
            {t("login_title")}
          </h2>


          <p className="login-intro">
            {t("login_subtitle")}
          </p>


          <form
            onSubmit={handleLogin}
            noValidate
          >

            {/* ========================= */}
            {/* Email */}
            {/* ========================= */}

            <label className="modern-field">

              <span>
                {t("email")}
              </span>


              <div
                className={
                  fieldErrors.login
                    ? "has-error"
                    : ""
                }
              >

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


              {fieldErrors.login && (
                <small>
                  {fieldErrors.login}
                </small>
              )}

            </label>


            {/* ========================= */}
            {/* Password */}
            {/* ========================= */}

            <label className="modern-field">

              <span>
                {t("password")}
              </span>


              <div
                className={
                  fieldErrors.password
                    ? "has-error"
                    : ""
                }
              >

                <LockKeyhole size={19} />


                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    t(
                      "password_placeholder"
                    )
                  }
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  aria-label={
                    t(
                      "toggle_password"
                    )
                  }
                >

                  {showPassword
                    ? (
                      <EyeOff
                        size={18}
                      />
                    )
                    : (
                      <Eye
                        size={18}
                      />
                    )
                  }

                </button>

              </div>


              {fieldErrors.password && (
                <small>
                  {
                    fieldErrors.password
                  }
                </small>
              )}

            </label>


            {/* ========================= */}
            {/* Backend Error */}
            {/* ========================= */}

            {error && (
              <div
                className="login-error"
                role="alert"
              >
                {error}
              </div>
            )}


            {/* ========================= */}
            {/* Login Button */}
            {/* ========================= */}

            <button
              className="platinum-login-button"
              type="submit"
              disabled={loading}
            >

              <span>
                {loading
                  ? t("loading")
                  : t("login")}
              </span>

              <ArrowLeft size={19} />

            </button>

          </form>


          <p className="login-help">
            {t("login_help")}
          </p>

        </div>

      </section>

    </main>
  );
}