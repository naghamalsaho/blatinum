import { createSlice } from "@reduxjs/toolkit";
import { loginUser } from "./auth.thunks";

const readJsonStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeToken = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value.replace(/^Bearer\s+/i, "").trim();
  }

  if (typeof value === "object") {
    return normalizeToken(
      value.token ||
        value.access_token ||
        value.accessToken ||
        value.plainTextToken ||
        value.plain_text_token ||
        value.auth_token ||
        value.value
    );
  }

  return null;
};

const getAuthToken = (payload = {}) =>
  normalizeToken(
    payload.tokens?.access_token ||
      payload.tokens?.accessToken ||
      payload.access_token ||
      payload.accessToken ||
      payload.token ||
      payload.user?.token ||
      payload.user?.access_token ||
      payload.user?.accessToken ||
      payload.data?.tokens?.access_token ||
      payload.data?.tokens?.accessToken ||
      payload.data?.access_token ||
      payload.data?.accessToken ||
      payload.data?.token
  );

const getRefreshToken = (payload = {}) =>
  normalizeToken(
    payload.tokens?.refresh_token ||
      payload.tokens?.refreshToken ||
      payload.refresh_token ||
      payload.refreshToken ||
      payload.data?.tokens?.refresh_token ||
      payload.data?.tokens?.refreshToken ||
      payload.data?.refresh_token ||
      payload.data?.refreshToken
  );

const getAuthUser = (payload = {}) => payload.user || payload.data?.user || null;

const getAuthPermissions = (payload = {}) =>
  payload.permissions || payload.data?.permissions || [];

const initialState = {
  user: readJsonStorage("user", null),
  token: normalizeToken(localStorage.getItem("token")),
  refreshToken: normalizeToken(localStorage.getItem("refreshToken")),
  permissions: readJsonStorage("permissions", []),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      console.log("[auth.slice] logout called");

      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.permissions = [];
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        console.log("[auth.slice] login pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("[auth.slice] login fulfilled payload:", action.payload);

        const token = getAuthToken(action.payload);
        const refreshToken = getRefreshToken(action.payload);
        const user = getAuthUser(action.payload);
        const permissions = getAuthPermissions(action.payload);

        console.log("[auth.slice] extracted auth:", {
          hasToken: Boolean(token),
          tokenLength: token?.length || 0,
          hasRefreshToken: Boolean(refreshToken),
          refreshTokenLength: refreshToken?.length || 0,
          user,
          permissions,
        });

        state.loading = false;
        state.user = user;
        state.token = token;
        state.refreshToken = refreshToken;
        state.permissions = permissions;

        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }

        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        } else {
          localStorage.removeItem("refreshToken");
        }

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("permissions", JSON.stringify(permissions));

        console.log("[auth.slice] token saved:", token);
        console.log("[auth.slice] refreshToken saved:", refreshToken);
        console.log("[auth.slice] user saved:", user);
        console.log("[auth.slice] permissions saved:", permissions);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;