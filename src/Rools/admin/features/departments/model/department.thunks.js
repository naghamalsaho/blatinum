import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createDepartmentRequest,
  getDepartmentsRequest,
} from "../api/department.api";

export const fetchDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (_, thunkAPI) => {
    const result = await getDepartmentsRequest();

    if (result.ok) {
      return result.data?.data ?? [];
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const createDepartment = createAsyncThunk(
  "departments/create",
  async (payload, thunkAPI) => {
    const result = await createDepartmentRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);
