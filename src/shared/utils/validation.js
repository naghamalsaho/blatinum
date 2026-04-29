export const validateLogin = (value) => {
  const trimmed = value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  if (!trimmed) {
    return "Login is required";
  }

  if (!emailRegex.test(trimmed) && !phoneRegex.test(trimmed)) {
    return "Login must be a valid email or 10-digit number";
  }

  return "";
};

export const validatePassword = (value) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Password is required";
  }

  if (trimmed.length < 4) {
    return "Password must be at least 4 characters";
  }

  return "";
};