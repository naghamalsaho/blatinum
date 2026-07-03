import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Field from "@/shared/components/Field";
import AuthHero from "@/shared/components/AuthHero";
import Button from "@/shared/components/Button";
import { loginUser } from "@/Rools/admin/features/auth/model/auth.thunks";
import { validateLogin, validatePassword } from "@/shared/utils/validation";
import { t } from "@/shared/i18n";
import "@/shared/ui/login.css";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const collectUserText = (user = {}) =>
  [
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
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

const hasAnyMatch = (value, words) => words.some((word) => value.includes(word));

const getLoginPath = (payload = {}) => {
  const user = payload.user || payload.data?.user || {};
  const permissions =
    payload.permissions ||
    payload.user?.permissions ||
    payload.data?.permissions ||
    [];

  const userText = collectUserText(user);

  if (hasAnyMatch(userText, ["engineering", "engineer", "engineering_staff", "هندسة"])) {
    return "/engineering";
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

  if (hasAnyMatch(userText, ["legal", "law", "قانون"])) {
    return "/legal/slots";
  }

  if (hasAnyMatch(userText, ["admin", "administrator", "مدير"])) {
    return "/admin";
  }
if (
  hasAnyMatch(userText, [
    "customer_service_staff",
    "customer service",
    "خدمة العملاء",
  ])
) {
  return "/customer-service";
}
  const permissionsText = permissions
    .map((permission) =>
      typeof permission === "string"
        ? permission
        : permission?.name || permission?.key || permission?.slug || ""
    )
    .map(normalizeText)
    .join(" ");

  if (hasAnyMatch(permissionsText, ["engineering", "engineer", "engineering_staff", "هندسة"])) {
    return "/engineering";
  }

  if (
    hasAnyMatch(permissionsText, [
      "read.client",
      "create.client",
      "read.appointment",
      "create.appointment",
      "read.order",
      "update.order",
    ])
  ) {
    return "/customer-service";
  }

  if (hasAnyMatch(permissionsText, ["legal", "law", "قانون"])) {
    return "/legal/slots";
  }
if (
  hasAnyMatch(permissionsText, [
    "customer_service_staff",
    "client",
    "appointment",
  ])
) {
  return "/customer-service";
}
  return "/admin";
  
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [isToggled, setIsToggled] = useState(false);
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    login: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "login") {
      setFieldErrors((prev) => ({
        ...prev,
        login: validateLogin(value),
      }));
    }

    if (name === "password") {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const loginError = validateLogin(formData.login);
    const passwordError = validatePassword(formData.password);

    setFieldErrors({
      login: loginError,
      password: passwordError,
    });

    if (loginError || passwordError) return;

    const result = await dispatch(
      loginUser({
        login: formData.login,
        password: formData.password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      setIsToggled(true);

      setTimeout(() => {
        navigate(getLoginPath(result.payload));
      }, 2200);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className={`auth-wrapper ${isToggled ? "toggled" : ""}`}>
        <div className="background-shape"></div>

        <div className="credentials-panel">
          <form onSubmit={handleLogin}>
            <Field
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              label={t("login")}
              iconClass="fa-solid fa-user"
              error={fieldErrors.login}
            />

            <Field
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              label={t("password")}
              iconClass="fa-solid fa-lock"
              error={fieldErrors.password}
            />

            <Button type="submit" className="submit-button" disabled={loading}>
              {loading ? t("loading") : t("login")}
            </Button>
          </form>

          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>

        <AuthHero />
      </div>
    </div>
  );
}
