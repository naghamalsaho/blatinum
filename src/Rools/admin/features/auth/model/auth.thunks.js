import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginRequest, selectRoleRequest } from "../api/auth.api";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, thunkAPI) => {
    const result = await loginRequest(payload);

    if (result.ok) {
      return result.data?.data ?? result.data;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const selectRole = createAsyncThunk(
  "auth/selectRole",
  async (role, thunkAPI) => {
    const roleId = typeof role === "object" ? role?.id : role;
    const result = await selectRoleRequest(roleId);
    if (result.ok) {
      const payload = result.data?.data ?? result.data ?? {};
      return {
        ...payload,
        active_role: payload.active_role || role,
      };
    }
    return thunkAPI.rejectWithValue(result.message || "Failed to select workspace");
  }
);
