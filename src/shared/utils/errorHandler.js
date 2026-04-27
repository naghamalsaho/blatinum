import { ERROR_MESSAGES } from "../constants/errorMessages";

export const handleApiError = (error) => {
  console.error("[API ERROR RAW]:", error);

  // 1) إذا ما في response → network error
  if (!error.response) {
    return {
      message: ERROR_MESSAGES.NETWORK,
      status: null,
    };
  }

  const { status, data } = error.response;

  console.log("[API ERROR STATUS]:", status);
  console.log("[API ERROR DATA]:", data);

  switch (status) {
    case 400:
      return {
        message: data?.message || ERROR_MESSAGES.VALIDATION,
        status,
      };

    case 401:
      return {
        message: ERROR_MESSAGES.UNAUTHORIZED,
        status,
      };

    case 403:
      return {
        message: ERROR_MESSAGES.FORBIDDEN,
        status,
      };

    case 404:
      return {
        message: ERROR_MESSAGES.NOT_FOUND,
        status,
      };

    case 500:
      return {
        message: ERROR_MESSAGES.SERVER,
        status,
      };

    default:
      return {
        message: data?.message || ERROR_MESSAGES.UNKNOWN,
        status,
      };
  }
};