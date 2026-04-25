import { useState } from "react";
import LoginForm from "../shared/components/LoginForm";
import AuthHero from "../shared/components/AuthHero";
import Button from "../shared/components/Button";
import "../shared/ui/login.css";

export default function LoginPage() {
  const [isToggled, setIsToggled] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();

    console.log("LOGIN DATA:", formData);

    setIsToggled(true);
  };

  return (
    <div className="login-page-wrapper">
      <div className={`auth-wrapper ${isToggled ? "toggled" : ""}`}>
        <div className="background-shape"></div>

        <div className="credentials-panel">
          <form onSubmit={handleLogin}>
            <LoginForm
              formData={formData}
              onChange={handleChange}
            />

            <Button type="submit" className="submit-button">
              Login
            </Button>
          </form>
        </div>

        <AuthHero />
      </div>
    </div>
  );
}