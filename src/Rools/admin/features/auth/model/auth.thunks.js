import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginRequest } from "../api/auth.api";

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