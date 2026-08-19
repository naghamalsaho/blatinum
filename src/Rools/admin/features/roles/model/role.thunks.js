import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  assignRolesToUserRequest,
  createRoleRequest,
  deleteRoleRequest,
  getPermissionsRequest,
  getRolesRequest,
  updateRolePermissionsRequest,
  updateRoleRequest,
} from "../api/role.api";

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");

  if (typeof message === "object") {
    return Object.entries(message)
      .map(([key, value]) => {
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        return `${key}: ${text}`;
      })
      .join(" ");
  }

  return String(message);
};

const extractList = (payload) => {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.result, payload?.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;

    for (const key of [
      "roles",
      "permissions",
      "items",
      "records",
      "results",
      "data",
      "list",
      "rows",
    ]) {
      if (Array.isArray(candidate[key])) return candidate[key];
    }
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
};

const rejectApiError = (result, thunkAPI, fallback) => {
  if (result.status === 401) {
    return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
  }

  return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message) || fallback);
};

export const fetchRoles = createAsyncThunk("rolePermissions/fetchRoles", async (_, thunkAPI) => {
  const result = await getRolesRequest();

  if (result.ok) {
    return {
      items: extractList(result.data),
      message: result.data?.message || "",
    };
  }

  return rejectApiError(result, thunkAPI, "Failed to load roles");
});

export const fetchPermissions = createAsyncThunk(
  "rolePermissions/fetchPermissions",
  async (_, thunkAPI) => {
    const result = await getPermissionsRequest();

    if (result.ok) {
      return {
        items: extractList(result.data),
        message: result.data?.message || "",
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to load permissions");
  }
);

export const saveRole = createAsyncThunk(
  "rolePermissions/saveRole",
  async ({ roleId, name }, thunkAPI) => {
    const payload = { name, guard_name: "web" };
    const result = roleId
      ? await updateRoleRequest(roleId, payload)
      : await createRoleRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchRoles());
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to save role");
  }
);

export const removeRole = createAsyncThunk(
  "rolePermissions/removeRole",
  async (roleId, thunkAPI) => {
    const result = await deleteRoleRequest(roleId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchRoles());
      return roleId;
    }

    return rejectApiError(result, thunkAPI, "Failed to delete role");
  }
);

export const saveRolePermissions = createAsyncThunk(
  "rolePermissions/saveRolePermissions",
  async ({ roleId, permissionIds }, thunkAPI) => {
    const result = await updateRolePermissionsRequest(roleId, permissionIds);

    if (result.ok) {
      await thunkAPI.dispatch(fetchRoles());
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to update role permissions");
  }
);

export const assignRolesToUser = createAsyncThunk(
  "rolePermissions/assignRolesToUser",
  async ({ userId, roleIds }, thunkAPI) => {
    const result = await assignRolesToUserRequest(userId, roleIds);

    if (result.ok) {
      await thunkAPI.dispatch(fetchRoles());
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to assign roles");
  }
);
