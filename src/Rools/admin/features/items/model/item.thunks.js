import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createItemRequest,
  deleteItemRequest,
  getItemsRequest,
  updateItemRequest,
} from "../api/item.api";

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

export const fetchItems = createAsyncThunk(
  "items/fetchAll",
  async (_, thunkAPI) => {
    const result = await getItemsRequest();

    if (result.ok) {
      return result.data?.data ?? [];
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const createItem = createAsyncThunk(
  "items/create",
  async (payload, thunkAPI) => {
    const result = await createItemRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchItems());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const updateItem = createAsyncThunk(
  "items/update",
  async ({ id, payload }, thunkAPI) => {
    const result = await updateItemRequest(id, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchItems());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const deleteItem = createAsyncThunk(
  "items/delete",
  async (id, thunkAPI) => {
    const result = await deleteItemRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchItems());
      return true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);
