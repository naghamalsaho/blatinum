import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Field from "../shared/components/Field";
import AuthHero from "../shared/components/AuthHero";
import Button from "../shared/components/Button";
import { loginUser } from "../features/auth/model/auth.thunks";
import "../shared/ui/login.css";

export default function LoginPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [isToggled, setIsToggled] = useState(false);
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log("[LoginPage] input changed:", name, value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    console.log("[LoginPage] submit clicked");
    console.log("[LoginPage] formData before dispatch:", formData);

    const result = await dispatch(
      loginUser({
        login: formData.login,
        password: formData.password,
      })
    );

    console.log("[LoginPage] dispatch result:", result);

    if (loginUser.fulfilled.match(result)) {
      console.log("[LoginPage] login succeeded");
      setIsToggled(true);
    } else {
      console.log("[LoginPage] login failed");
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
            />

            <Field
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              label="Password"
              iconClass="fa-solid fa-lock"
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