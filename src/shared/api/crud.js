import { http } from "./http";

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

const getToken = () => {
  const token = localStorage.getItem("token");
  return normalizeStoredToken(token);
};

const getLanguage = () => localStorage.getItem("lang") || "en";

const maskToken = (token) => {
  if (!token) return null;
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
};

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

const logRequest = (method, url, headers, payload) => {
  const token = getToken();
  const safeHeaders = {
    ...headers,
    ...(headers.Authorization ? { Authorization: "Bearer <token>" } : {}),
  };

  console.log(`[API ${method}] ${url}`, {
    hasToken: Boolean(token),
    tokenLength: token?.length || 0,
    tokenPreview: maskToken(token),
    authorizationHeader: headers.Authorization ? "Bearer <token>" : "missing",
    headers: safeHeaders,
    payload,
  });
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

const handleApiError = (error) => {
  const status = error?.response?.status || null;

  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.status ||
    error?.message ||
    "Something went wrong";

  const message = stringifyMaybeObject(rawMessage) || "Something went wrong";

  console.error("[API ERROR]", {
    url: error?.config?.url,
    baseURL: error?.config?.baseURL,
    method: error?.config?.method,
    status,
    message: rawMessage,
    response: error?.response?.data,
    sentAuthorization: error?.config?.headers?.Authorization
      ? "Bearer <token>"
      : "missing",
  });

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
      const headers = buildHeaders(false);
      logRequest("GET", url, headers, params);

      const response = await http.get(url, {
        params,
        headers,
      });

      console.log(`[API GET SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  post: async (url, data = {}) => {
    try {
      const headers = buildHeaders(false);
      logRequest("POST", url, headers, data);

      const response = await http.post(url, data, {
        headers,
      });

      console.log(`[API POST SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  postForm: async (url, formData) => {
    try {
      const headers = buildHeaders(true);
      logRequest("POST FORM", url, headers, formData);

      const response = await http.post(url, formData, {
        headers,
      });

      console.log(`[API POST FORM SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  put: async (url, data = {}) => {
    try {
      const headers = buildHeaders(false);
      logRequest("PUT", url, headers, data);

      const response = await http.put(url, data, {
        headers,
      });

      console.log(`[API PUT SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  putForm: async (url, formData) => {
    try {
      const headers = buildHeaders(true);
      logRequest("PUT FORM", url, headers, formData);

      const response = await http.put(url, formData, {
        headers,
      });

      console.log(`[API PUT FORM SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  patch: async (url, data = {}) => {
    try {
      const headers = buildHeaders(false);
      logRequest("PATCH", url, headers, data);

      const response = await http.patch(url, data, {
        headers,
      });

      console.log(`[API PATCH SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async (url) => {
    try {
      const headers = buildHeaders(false);
      logRequest("DELETE", url, headers);

      const response = await http.delete(url, {
        headers,
      });

      console.log(`[API DELETE SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  upload: async (url, formData) => {
    try {
      const headers = buildHeaders(true);
      logRequest("UPLOAD", url, headers, formData);

      const response = await http.post(url, formData, {
        headers,
      });

      console.log(`[API UPLOAD SUCCESS] ${url}`, response.data);
      return normalizeSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};