import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createWarehouseRequest,
  deleteWarehouseRequest,
  getWarehousesRequest,
  updateWarehouseRequest,
} from "../api/warehouse.api";

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");

  if (typeof message === "object") {
    return Object.entries(message)
      .map(([key, value]) => {
        const text = Array.isArray(value)
          ? value.join(" ")
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : value;

        return `${key}: ${text}`;
      })
      .join(" ");
  }

  return String(message);
};

const extractList = (payload) => {
  const candidates = [payload, payload?.data, payload?.data?.data, payload?.result];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;

    for (const key of ["warehouses", "items", "records", "results", "data", "rows"]) {
      if (Array.isArray(candidate[key])) return candidate[key];
    }
  }

  return [];
};

export const fetchWarehouses = createAsyncThunk(
  "warehouses/fetchAll",
  async (_, thunkAPI) => {
    const result = await getWarehousesRequest();

    if (result.ok) {
      return extractList(result.data);
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const createWarehouse = createAsyncThunk(
  "warehouses/create",
  async (payload, thunkAPI) => {
    const result = await createWarehouseRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchWarehouses());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const updateWarehouse = createAsyncThunk(
  "warehouses/update",
  async ({ id, payload }, thunkAPI) => {
    const result = await updateWarehouseRequest(id, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchWarehouses());
      return true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const deleteWarehouse = createAsyncThunk(
  "warehouses/delete",
  async (id, thunkAPI) => {
    const result = await deleteWarehouseRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchWarehouses());
      return true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);
