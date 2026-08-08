import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  assignRolesToUserRequest,
  createPermissionRequest,
  createRoleRequest,
  deletePermissionRequest,
  deleteRoleRequest,
  getPermissionsRequest,
  getRolesRequest,
  updatePermissionRequest,
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
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(payload)) return payload;

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
    const result = roleId
      ? await updateRoleRequest(roleId, { name })
      : await createRoleRequest({ name });

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

export const savePermission = createAsyncThunk(
  "rolePermissions/savePermission",
  async ({ permissionId, name, module }, thunkAPI) => {
    const payload = {
      name,
      module,
    };
    const result = permissionId
      ? await updatePermissionRequest(permissionId, payload)
      : await createPermissionRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchPermissions());
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to save permission");
  }
);

export const removePermission = createAsyncThunk(
  "rolePermissions/removePermission",
  async (permissionId, thunkAPI) => {
    const result = await deletePermissionRequest(permissionId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchPermissions());
      await thunkAPI.dispatch(fetchRoles());
      return permissionId;
    }

    return rejectApiError(result, thunkAPI, "Failed to delete permission");
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
