import { createSlice } from "@reduxjs/toolkit";
import { loginUser, selectRole } from "./auth.thunks";
import { extractAvailableRoles } from "@/shared/auth/workspaces";

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

const flattenPermissionList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenPermissionList(item));
  if (typeof value !== "object") return [value];

  if (Array.isArray(value.permissions)) return value.permissions.flatMap((item) => flattenPermissionList(item));
  if (Array.isArray(value.data)) return value.data.flatMap((item) => flattenPermissionList(item));

  return [value];
};

const getAuthPermissions = (payload = {}) => {
  const candidates = [
    payload.permissions,
    payload.data?.permissions,
    payload.permission,
    payload.data?.permission,
    payload.active_role?.permissions,
    payload.data?.active_role?.permissions,
    payload.roles?.permissions,
    payload.data?.roles?.permissions,
    payload.data,
  ];

  const flatPermissions = candidates
    .flatMap((candidate) => flattenPermissionList(candidate))
    .filter((permission) => permission && typeof permission === "object");

  if (flatPermissions.length) return flatPermissions;

  const rawPermissions = payload.permissions || payload.data?.permissions || [];
  return Array.isArray(rawPermissions) ? rawPermissions : [];
};
const getAvailableRoles = (payload = {}) => extractAvailableRoles(payload);
const getActiveRole = (payload = {}) =>
  payload.active_role || payload.data?.active_role || null;

const initialState = {
  user: readJsonStorage("user", null),
  token: normalizeToken(localStorage.getItem("token")),
  refreshToken: normalizeToken(localStorage.getItem("refreshToken")),
  permissions: readJsonStorage("permissions", []),
  availableRoles: readJsonStorage("availableRoles", []),
  activeRole: readJsonStorage("activeRole", null),
  verifiedByBackend: sessionStorage.getItem("authVerified") === "true",
  loading: false,
  roleSelecting: false,
  roleError: null,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    activateAssignedRole(state, action) {
      state.activeRole = action.payload;
      state.roleError = null;
      localStorage.setItem("activeRole", JSON.stringify(action.payload));
    },
    logout(state) {
      console.log("[auth.slice] logout called");

      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.permissions = [];
      state.availableRoles = [];
      state.activeRole = null;
      state.roleSelecting = false;
      state.roleError = null;
      state.verifiedByBackend = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("availableRoles");
      localStorage.removeItem("activeRole");
      sessionStorage.removeItem("authVerified");
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
        const availableRoles = getAvailableRoles(action.payload);

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
        state.permissions = [];
        state.availableRoles = availableRoles;
        state.activeRole = null;
        state.verifiedByBackend = true;
        sessionStorage.setItem("authVerified", "true");

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
        localStorage.setItem("permissions", JSON.stringify([]));
        localStorage.setItem("availableRoles", JSON.stringify(availableRoles));
        localStorage.removeItem("activeRole");

        console.log("[auth.slice] token saved:", token);
        console.log("[auth.slice] refreshToken saved:", refreshToken);
        console.log("[auth.slice] user saved:", user);
        console.log("[auth.slice] permissions saved:", permissions);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.verifiedByBackend = false;
        sessionStorage.removeItem("authVerified");
        state.error = action.payload || "Login failed";
      })
      .addCase(selectRole.pending, (state) => {
        state.roleSelecting = true;
        state.roleError = null;
      })
      .addCase(selectRole.fulfilled, (state, action) => {
        const activeRole = getActiveRole(action.payload);
        const permissions = getAuthPermissions(action.payload);
        const token = getAuthToken(action.payload);
        const refreshToken = getRefreshToken(action.payload);
        state.roleSelecting = false;
        state.activeRole = activeRole;
        state.permissions = permissions;
        if (token) {
          state.token = token;
          localStorage.setItem("token", token);
        }
        if (refreshToken) {
          state.refreshToken = refreshToken;
          localStorage.setItem("refreshToken", refreshToken);
        }
        localStorage.setItem("activeRole", JSON.stringify(activeRole));
        localStorage.setItem("permissions", JSON.stringify(permissions));
      })
      .addCase(selectRole.rejected, (state, action) => {
        state.roleSelecting = false;
        state.roleError = action.payload || "Failed to select workspace";
      });
  },
});

export const { activateAssignedRole, logout } = authSlice.actions;
export default authSlice.reducer;
