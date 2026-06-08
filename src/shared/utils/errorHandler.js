import { ERROR_MESSAGES } from "../constants/errorMessages";

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

const getBackendMessage = (data) => {
  return stringifyMaybeObject(
    data?.message ||
      data?.error ||
      data?.errors ||
      data?.detail ||
      data?.exception
  );
};

export const handleApiError = (error) => {
  console.error("[API ERROR RAW]:", error);

  if (!error.response) {
    return {
      message: ERROR_MESSAGES.NETWORK,
      status: null,
    };
  }

  const { status, data } = error.response;
  const backendMessage = getBackendMessage(data);

  console.log("[API ERROR STATUS]:", status);
  console.log("[API ERROR DATA]:", data);

  // رسالة خاصة لأخطاء الربط بين الجداول
  if (
    backendMessage?.includes("projects_location_id_foreign") ||
    backendMessage?.includes("Restrict violation")
  ) {
    return {
      message:
        "لا يمكن حذف الموقع لأنه مستخدم داخل مشروع. غيّري موقع المشروع أولاً ثم أعيدي المحاولة.",
      status,
    };
  }

  switch (status) {
    case 400:
      return {
        message: backendMessage || ERROR_MESSAGES.VALIDATION,
        status,
      };

    case 401:
      return {
        message: backendMessage || ERROR_MESSAGES.UNAUTHORIZED,
        status,
      };

    case 403:
      return {
        message: backendMessage || ERROR_MESSAGES.FORBIDDEN,
        status,
      };

    case 404:
      return {
        message: backendMessage || ERROR_MESSAGES.NOT_FOUND,
        status,
      };

    case 500:
      return {
        message: backendMessage || ERROR_MESSAGES.SERVER,
        status,
      };

    default:
      return {
        message: backendMessage || ERROR_MESSAGES.UNKNOWN,
        status,
      };
  }
};