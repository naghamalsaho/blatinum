const DANGEROUS_PATTERNS = [
  /(\bor\b\s+1\s*=\s*1)/i,
  /(\b1\s*=\s*1\b)/i,
  /(\b1\s+or\s+1\b)/i,
  /(\band\b\s+1\s*=\s*1)/i,

  /(union\s+select)/i,
  /(select\s+.+\s+from)/i,
  /(insert\s+into)/i,
  /(update\s+.+\s+set)/i,
  /(delete\s+from)/i,
  /(drop\s+table)/i,
  /(truncate\s+table)/i,

  /(--)/,
  /(\/\*)/,
  /(\*\/)/,

  /(<script)/i,
  /(script>)/i,
  /(javascript:)/i,
  /(onerror=)/i,
  /(onload=)/i,

  /[<>{}[\];`\\]/,
];

const toText = (value) => String(value ?? "").trim();

export const containsMaliciousContent = (value) => {
  const text = toText(value);
  if (!text) return false;

  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(text));
};

export const validateLogin = (value) => {
  const trimmed = toText(value);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  if (!trimmed) {
    return "Login is required";
  }

  if (containsMaliciousContent(trimmed)) {
    return "Login contains invalid characters";
  }

  if (!emailRegex.test(trimmed) && !phoneRegex.test(trimmed)) {
    return "Login must be a valid email or 10-digit number";
  }

  return "";
};

export const validatePassword = (value) => {
  const trimmed = toText(value);

  if (!trimmed) {
    return "Password is required";
  }

  if (trimmed.length < 4) {
    return "Password must be at least 4 characters";
  }

  return "";
};

export const validateRequiredText = (
  value,
  fieldName,
  minLength = 2,
  maxLength = 255
) => {
  const trimmed = toText(value);

  if (!trimmed) {
    return `${fieldName} مطلوب`;
  }

  if (containsMaliciousContent(trimmed)) {
    return `${fieldName} يحتوي على نص غير مسموح`;
  }

  if (trimmed.length < minLength) {
    return `${fieldName} يجب أن يكون على الأقل ${minLength} أحرف`;
  }

  if (trimmed.length > maxLength) {
    return `${fieldName} طويل جداً`;
  }

  return "";
};

export const validateOptionalText = (
  value,
  fieldName,
  maxLength = 500
) => {
  const trimmed = toText(value);

  if (!trimmed) return "";

  if (containsMaliciousContent(trimmed)) {
    return `${fieldName} يحتوي على نص غير مسموح`;
  }

  if (trimmed.length > maxLength) {
    return `${fieldName} طويل جداً`;
  }

  return "";
};

export const validateSelect = (value, fieldName) => {
  const trimmed = toText(value);

  if (!trimmed) {
    return `${fieldName} مطلوب`;
  }

  if (containsMaliciousContent(trimmed)) {
    return `${fieldName} غير صالح`;
  }

  return "";
};

export const validateDate = (value, fieldName) => {
  const trimmed = toText(value);

  if (!trimmed) {
    return `${fieldName} مطلوب`;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return `${fieldName} غير صالح`;
  }

  return "";
};

export const validatePositiveNumber = (
  value,
  fieldName,
  options = {}
) => {
  const normalizedOptions =
    typeof options === "number"
      ? { min: options, allowZero: true, max: null }
      : {
          min: 0,
          allowZero: true,
          max: null,
          ...options,
        };

  const { min, allowZero, max } = normalizedOptions;
  const trimmed = toText(value);

  if (!trimmed) {
    return `${fieldName} مطلوب`;
  }

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return `${fieldName} يجب أن يكون رقماً`;
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return `${fieldName} غير صالح`;
  }

  if (!allowZero && num === 0) {
    return `${fieldName} يجب أن يكون أكبر من صفر`;
  }

  if (num < min) {
    return `${fieldName} يجب أن يكون على الأقل ${min}`;
  }

  if (max !== null && num > max) {
    return `${fieldName} يجب ألا يتجاوز ${max}`;
  }

  return "";
};

export const validateLatitude = (value) => {
  const trimmed = toText(value);

  if (!trimmed) return "خط العرض مطلوب";
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return "خط العرض يجب أن يكون رقماً";

  const num = Number(trimmed);
  if (num < -90 || num > 90) {
    return "خط العرض يجب أن يكون بين -90 و 90";
  }

  return "";
};

export const validateLongitude = (value) => {
  const trimmed = toText(value);

  if (!trimmed) return "خط الطول مطلوب";
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return "خط الطول يجب أن يكون رقماً";

  const num = Number(trimmed);
  if (num < -180 || num > 180) {
    return "خط الطول يجب أن يكون بين -180 و 180";
  }

  return "";
};

export const validateFile = (
  file,
  fieldName = "الملف",
  options = {}
) => {
  const { required = false, maxSizeMB = 10 } = options;

  if (!file) {
    return required ? `${fieldName} مطلوب` : "";
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

  if (!allowedTypes.includes(file.type)) {
    return `${fieldName} يجب أن يكون JPG أو PNG أو WEBP`;
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return `${fieldName} يجب ألا يتجاوز ${maxSizeMB}MB`;
  }

  return "";
};