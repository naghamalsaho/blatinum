import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createEmployeeRequest,
  deleteEmployeeRequest,
  getEmployeesRequest,
  updateEmployeeRequest,
} from "../api/employee.api";

const extractCollection = (response) => {
  const payload = response.data?.data ?? response.data ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

const rejectEmployeeRequest = (result, thunkAPI, fallbackMessage) => {
  if (result.status === 401) {
    return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
  }

  return thunkAPI.rejectWithValue(result.message || fallbackMessage);
};

export const fetchEmployees = createAsyncThunk(
  "employees/fetchAll",
  async (_, thunkAPI) => {
    const result = await getEmployeesRequest();

    if (result.ok) {
      return extractCollection(result);
    }

    return rejectEmployeeRequest(result, thunkAPI, "Failed to load employees");
  }
);

export const createEmployee = createAsyncThunk(
  "employees/create",
  async (payload, thunkAPI) => {
    const result = await createEmployeeRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchEmployees());
      return result.data?.data ?? result.data;
    }

    return rejectEmployeeRequest(result, thunkAPI, "Failed to create employee");
  }
);

export const updateEmployee = createAsyncThunk(
  "employees/update",
  async ({ employeeId, payload }, thunkAPI) => {
    const result = await updateEmployeeRequest(employeeId, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchEmployees());
      return result.data?.data ?? result.data;
    }

    return rejectEmployeeRequest(result, thunkAPI, "Failed to update employee");
  }
);

export const deleteEmployee = createAsyncThunk(
  "employees/delete",
  async (employeeId, thunkAPI) => {
    const result = await deleteEmployeeRequest(employeeId);

    if (result.ok) {
      return employeeId;
    }

    return rejectEmployeeRequest(result, thunkAPI, "Failed to delete employee");
  }
);
