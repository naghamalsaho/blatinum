import { createSlice } from "@reduxjs/toolkit";
import {
  assignRolesToUser,
  fetchPermissions,
  fetchRoles,
  removePermission,
  removeRole,
  savePermission,
  saveRole,
  saveRolePermissions,
} from "./role.thunks";

const initialState = {
  roles: {
    items: [],
    loading: false,
    error: null,
    message: "",
  },
  permissions: {
    items: [],
    loading: false,
    error: null,
    message: "",
  },
  actionLoading: false,
  actionError: null,
  actionMessage: "",
};

const roleSlice = createSlice({
  name: "rolePermissions",
  initialState,
  reducers: {
    clearRolePermissionActionState: (state) => {
      state.actionError = null;
      state.actionMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.roles.loading = true;
        state.roles.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles.loading = false;
        state.roles.items = action.payload.items;
        state.roles.message = action.payload.message;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.roles.loading = false;
        state.roles.error = action.payload || "Failed to load roles";
      })
      .addCase(fetchPermissions.pending, (state) => {
        state.permissions.loading = true;
        state.permissions.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions.loading = false;
        state.permissions.items = action.payload.items;
        state.permissions.message = action.payload.message;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.permissions.loading = false;
        state.permissions.error = action.payload || "Failed to load permissions";
      })
      .addMatcher(
        (action) =>
          [
            saveRole.pending.type,
            removeRole.pending.type,
            savePermission.pending.type,
            removePermission.pending.type,
            saveRolePermissions.pending.type,
            assignRolesToUser.pending.type,
          ].includes(action.type),
        (state) => {
          state.actionLoading = true;
          state.actionError = null;
          state.actionMessage = "";
        }
      )
      .addMatcher(
        (action) =>
          [
            saveRole.fulfilled.type,
            removeRole.fulfilled.type,
            savePermission.fulfilled.type,
            removePermission.fulfilled.type,
            saveRolePermissions.fulfilled.type,
            assignRolesToUser.fulfilled.type,
          ].includes(action.type),
        (state) => {
          state.actionLoading = false;
          state.actionMessage = "Saved successfully";
        }
      )
      .addMatcher(
        (action) =>
          [
            saveRole.rejected.type,
            removeRole.rejected.type,
            savePermission.rejected.type,
            removePermission.rejected.type,
            saveRolePermissions.rejected.type,
            assignRolesToUser.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.actionLoading = false;
          state.actionError = action.payload || "Action failed";
        }
      );
  },
});

export const { clearRolePermissionActionState } = roleSlice.actions;

export default roleSlice.reducer;
