import { createSlice } from "@reduxjs/toolkit";
import { loginUser } from "./auth.thunks";

const initialState = {
  user: null,
  token: null,
  permissions: [],
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

        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.permissions = action.payload.permissions || [];

        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem(
          "permissions",
          JSON.stringify(action.payload.permissions || [])
        );

        console.log("[auth.slice] token saved:", action.payload.token);
        console.log("[auth.slice] user saved:", action.payload.user);
        console.log("[auth.slice] permissions saved:", action.payload.permissions);
      })
     .addCase(loginUser.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload || "Login failed";
});
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;