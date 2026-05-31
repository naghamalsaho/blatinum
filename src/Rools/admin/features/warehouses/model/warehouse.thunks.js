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

export const fetchWarehouses = createAsyncThunk(
  "warehouses/fetchAll",
  async (_, thunkAPI) => {
    console.log("[fetchWarehouses] localStorage token:", {
      hasToken: Boolean(localStorage.getItem("token")),
      tokenLength: localStorage.getItem("token")?.length || 0,
      tokenPreview: localStorage.getItem("token")
        ? `${localStorage.getItem("token").slice(0, 8)}...${localStorage
            .getItem("token")
            .slice(-6)}`
        : null,
    });

    const result = await getWarehousesRequest();

    console.log("[fetchWarehouses] api result:", result);

    if (result.ok) {
      return result.data?.data ?? [];
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
    console.log("[createWarehouse] request:", payload);

    const result = await createWarehouseRequest(payload);

    console.log("[createWarehouse] api result:", result);

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
    console.log("[updateWarehouse] request:", { id, payload });

    const result = await updateWarehouseRequest(id, payload);

    console.log("[updateWarehouse] api result:", result);

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
    console.log("[deleteWarehouse] request:", { id });

    const result = await deleteWarehouseRequest(id);

    console.log("[deleteWarehouse] api result:", result);

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
