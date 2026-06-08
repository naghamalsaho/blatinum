import { ERROR_MESSAGES } from "@/shared/constants/errorMessages";

const normalizeStoredToken = (value) => {
  if (
    !value ||
    value === "undefined" ||
    value === "null" ||
    value === "[object Object]"
  ) {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmedValue);
      return normalizeStoredToken(
        parsed.token ||
          parsed.access_token ||
          parsed.accessToken ||
          parsed.plainTextToken ||
          parsed.plain_text_token ||
          parsed.auth_token ||
          parsed.value
      );
    } catch {
      return null;
    }
  }

  return trimmedValue.replace(/^Bearer\s+/i, "").trim();
};

export const getToken = () => {
  const token = localStorage.getItem("token");
  return normalizeStoredToken(token);
};

export const getLanguage = () => localStorage.getItem("lang") || "en";

export const buildThunkHeaders = (isMultipart = false) => {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    "Accept-Language": getLanguage(),
  };

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const stringifyMaybeObject = (value) => {
  if (typeof value === "string") return value;
  if (!value) return null;

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyMaybeObject(item))
      .filter(Boolean)
      .join(" ، ");
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, val]) => `${key}: ${stringifyMaybeObject(val)}`)
      .filter(Boolean);

    return entries.length ? entries.join(" | ") : JSON.stringify(value);
  }

  return String(value);
};

export const getThunkErrorMessage = (error, fallback = ERROR_MESSAGES.UNKNOWN) => {
  const status = error?.response?.status ?? error?.status ?? null;
  const data = error?.response?.data ?? error?.data ?? null;

  const backendMessage = stringifyMaybeObject(
    data?.message ||
      data?.error ||
      data?.errors ||
      data?.detail ||
      data?.exception
  );

  if (
    backendMessage?.includes("Restrict violation") ||
    backendMessage?.includes("projects_location_id_foreign")
  ) {
    return {
      message:
        "لا يمكن حذف الموقع لأنه مستخدم داخل مشروع. غيّري موقع المشروع أولاً ثم أعيدي المحاولة.",
      status,
    };
  }

  switch (status) {
    case 400:
      return { message: backendMessage || ERROR_MESSAGES.VALIDATION, status };
    case 401:
      return { message: backendMessage || ERROR_MESSAGES.UNAUTHORIZED, status };
    case 403:
      return { message: backendMessage || ERROR_MESSAGES.FORBIDDEN, status };
    case 404:
      return { message: backendMessage || ERROR_MESSAGES.NOT_FOUND, status };
    case 500:
      return { message: backendMessage || ERROR_MESSAGES.SERVER, status };
    default:
      return { message: backendMessage || fallback, status };
  }
};