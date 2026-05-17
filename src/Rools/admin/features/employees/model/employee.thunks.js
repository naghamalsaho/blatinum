import { createAsyncThunk } from "@reduxjs/toolkit";
import { getEmployeeDepartmentsRequest } from "../api/employee.api";

export const fetchEmployees = createAsyncThunk(
  "employees/fetchAll",
  async (_, thunkAPI) => {
    const result = await getEmployeeDepartmentsRequest();

    if (result.ok) {
      return result.data?.data ?? [];
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);
