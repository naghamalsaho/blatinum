import axios from "axios";

export const http = axios.create({
  baseURL:
    "https://platinum-back-end.onrender.com/api/v1",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

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
            refreshToken,
          }
        );

        const newAccessToken =
          response.data.data.accessToken;

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