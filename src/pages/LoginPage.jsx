import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Field from "../shared/components/Field";
import AuthHero from "../shared/components/AuthHero";
import Button from "../shared/components/Button";
import { loginUser } from "../features/auth/model/auth.thunks";
import { validateLogin, validatePassword } from "../shared/utils/validation";
import "../shared/ui/login.css";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
const navigate = useNavigate();
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

    if (loginError || passwordError) {
      return;
    }

    const result = await dispatch(
      loginUser({
        login: formData.login,
        password: formData.password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      setIsToggled(true);
      if (loginUser.fulfilled.match(result)) {
  navigate("/admin"); // 🔥 تحويل للداشبورد
}
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
              label="Login"
              iconClass="fa-solid fa-user"
              error={fieldErrors.login}
            />

            <Field
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              label="Password"
              iconClass="fa-solid fa-lock"
              error={fieldErrors.password}
            />

            <Button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>

          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </div>

        <AuthHero />
      </div>
    </div>
  );
}