import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  deactivateCustomerServiceClientRequest,
  getCustomerServiceClientsRequest,
} from "../api/client.api";

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

export const fetchCustomerServiceClients = createAsyncThunk(
  "customerServiceClients/fetchAll",
  async (_, thunkAPI) => {
    const result = await getCustomerServiceClientsRequest();

    if (result.ok) {
      return {
        items: extractList(result.data),
        message: result.data?.message || "",
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to load clients");
  }
);

export const deactivateCustomerServiceClient = createAsyncThunk(
  "customerServiceClients/deactivate",
  async (clientId, thunkAPI) => {
    const result = await deactivateCustomerServiceClientRequest(clientId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceClients());
      return true;
    }

    return rejectApiError(result, thunkAPI, "Failed to deactivate client");
  }
);
