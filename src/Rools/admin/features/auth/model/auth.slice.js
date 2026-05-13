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
    payload.token ||
      payload.access_token ||
      payload.accessToken ||
      payload.plainTextToken ||
      payload.plain_text_token ||
      payload.auth_token ||
      payload.user?.token ||
      payload.user?.access_token ||
      payload.user?.accessToken ||
      payload.user?.plainTextToken ||
      payload.user?.plain_text_token ||
      payload.user?.auth_token ||
      payload.data?.token ||
      payload.data?.access_token ||
      payload.data?.accessToken ||
      payload.data?.plainTextToken ||
      payload.data?.plain_text_token ||
      payload.data?.auth_token
  );

const getAuthUser = (payload = {}) => payload.user || payload.data?.user || null;

const getAuthPermissions = (payload = {}) =>
  payload.permissions || payload.user?.permissions || payload.data?.permissions || [];

const initialState = {
  user: readJsonStorage("user", null),
  token: localStorage.getItem("token"),
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
      state.permissions = [];
      state.error = null;

      localStorage.removeItem("token");
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
        const user = getAuthUser(action.payload);
        const permissions = getAuthPermissions(action.payload);

        console.log("[auth.slice] extracted auth:", {
          payloadKeys: action.payload ? Object.keys(action.payload) : [],
          hasToken: Boolean(token),
          tokenLength: token?.length || 0,
          tokenType: typeof token,
          user,
          permissions,
        });

        state.loading = false;
        state.user = user;
        state.token = token;
        state.permissions = permissions;

        if (token) {
          localStorage.setItem("token", token);
        } else {
          localStorage.removeItem("token");
        }

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("permissions", JSON.stringify(permissions));

        console.log("[auth.slice] token saved:", token);
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
