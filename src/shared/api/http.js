import axios from "axios";

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

export const http = axios.create({
  baseURL:
    "https://platinum-back-end.onrender.com/api/v1",
});

http.interceptors.request.use((config) => {
  const token = normalizeStoredToken(localStorage.getItem("token"));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          localStorage.getItem("refreshToken");

        const response = await axios.post(
          "https://platinum-back-end.onrender.com/api/v1/refreshToken",
          {
            refresh_token: refreshToken,
          }
        );

        const newAccessToken =
          response.data?.data?.tokens?.access_token ||
          response.data?.data?.access_token ||
          response.data?.data?.accessToken ||
          response.data?.tokens?.access_token ||
          response.data?.access_token ||
          response.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("Unable to refresh access token");
        }

        localStorage.setItem(
          "token",
          newAccessToken
        );

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return http(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

       

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
