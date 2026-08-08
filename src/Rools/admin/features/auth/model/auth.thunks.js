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
  async (roleId, thunkAPI) => {
    const result = await selectRoleRequest(roleId);
    if (result.ok) return result.data?.data ?? result.data;
    return thunkAPI.rejectWithValue(result.message || "Failed to select workspace");
  }
);
