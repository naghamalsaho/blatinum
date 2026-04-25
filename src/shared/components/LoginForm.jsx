import PropTypes from "prop-types";

export default function LoginForm({
  title = "Login",
  usernameLabel = "Username",
  passwordLabel = "Password",
  formData,
  onChange,
  switchText = "Don't have an account?",
  switchLinkText = "Sign up",
  onSwitchClick,
}) {
  return (
    <>
      <h2>{title}</h2>

      <div className="field-wrapper">
        <input
          type="text"
          name="username"
          required
          value={formData.username}
          onChange={onChange}
        />
        <label>{usernameLabel}</label>
        <i className="fa-solid fa-user"></i>
      </div>

      <div className="field-wrapper">
        <input
          type="password"
          name="password"
          required
          value={formData.password}
          onChange={onChange}
        />
        <label>{passwordLabel}</label>
        <i className="fa-solid fa-lock"></i>
      </div>

      <div className="switch-link">
        {switchText}{" "}
        <button type="button" onClick={onSwitchClick}>
          {switchLinkText}
        </button>
      </div>
    </>
  );
}

LoginForm.propTypes = {
  title: PropTypes.string,
  usernameLabel: PropTypes.string,
  passwordLabel: PropTypes.string,
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  switchText: PropTypes.string,
  switchLinkText: PropTypes.string,
  onSwitchClick: PropTypes.func,
};