import { http } from "./http";

const getToken = () => localStorage.getItem("token");
const getLanguage = () => localStorage.getItem("lang") || "en";

const buildHeaders = (isMultipart = false) => {
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

const handleApiError = (error) => {
  const status = error?.response?.status || null;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.status ||
    error?.message ||
    "Something went wrong";

  return {
    ok: false,
    status,
    message,
    data: null,
  };
};

const normalizeSuccess = (response) => ({
  ok: true,
  status: response.status,
  message: response.data?.message || "Success",
  data: response.data,
});

export const api = {
  get: async (url, params = {}) => {
    try {
      const response = await http.get(url, {
        params,
        headers: buildHeaders(false),
      });
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  post: async (url, data = {}) => {
    try {
      const response = await http.post(url, data, {
        headers: buildHeaders(false),
      });
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  put: async (url, data = {}) => {
    try {
      const response = await http.put(url, data, {
        headers: buildHeaders(false),
      });
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  patch: async (url, data = {}) => {
    try {
      const response = await http.patch(url, data, {
        headers: buildHeaders(false),
      });
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async (url) => {
    try {
      const response = await http.delete(url, {
        headers: buildHeaders(false),
      });
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  upload: async (url, formData) => {
    try {
      const token = getToken();

      const response = await http.post(url, formData, {
        headers: {
          Accept: "application/json",
          "Accept-Language": getLanguage(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data",
        },
      });

      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};