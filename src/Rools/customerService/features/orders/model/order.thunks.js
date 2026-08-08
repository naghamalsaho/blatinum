import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addCustomerServiceOrderNoteRequest,
  changeCustomerServiceOrderStatusRequest,
  deleteCustomerServiceOrderNoteRequest,
  getClientSolutionOrdersRequest,
  getClientUnitOrdersRequest,
  getCustomerServiceOrderRequest,
  getCustomerServiceOrdersRequest,
  transferCustomerServiceOrderRequest,
  updateCustomerServiceOrderNoteRequest,
} from "../api/order.api";

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

const extractPagedPayload = (payload) => {
  const data = payload?.data;
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    items,
    links: payload?.links || data?.links || null,
    meta: payload?.meta || data?.meta || null,
    message: payload?.message || data?.message || "",
  };
};

const rejectApiError = (result, thunkAPI, fallback) => {
  if (result.status === 401) {
    return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
  }

  return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message) || fallback);
};

export const fetchCustomerServiceOrders = createAsyncThunk(
  "customerServiceOrders/fetchAll",
  async (_, thunkAPI) => {
    const result = await getCustomerServiceOrdersRequest();

    if (result.ok) {
      return extractPagedPayload(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to load orders");
  }
);

export const fetchCustomerServiceClientOrders = createAsyncThunk(
  "customerServiceOrders/fetchClientOrders",
  async (clientId, thunkAPI) => {
    const [unitResult, solutionResult] = await Promise.all([
      getClientUnitOrdersRequest(clientId),
      getClientSolutionOrdersRequest(clientId),
    ]);

    const errors = [
      !unitResult.ok ? unitResult.message || "Failed to load unit orders" : "",
      !solutionResult.ok ? solutionResult.message || "Failed to load service orders" : "",
    ].filter(Boolean);

    if (errors.length > 0) {
      return thunkAPI.rejectWithValue(errors.join("\n"));
    }

    return {
      clientId,
      unitOrders: extractPagedPayload(unitResult.data),
      solutionOrders: extractPagedPayload(solutionResult.data),
    };
  }
);

export const fetchCustomerServiceOrder = createAsyncThunk(
  "customerServiceOrders/fetchOne",
  async (orderId, thunkAPI) => {
    const result = await getCustomerServiceOrderRequest(orderId);

    if (result.ok) {
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to load order");
  }
);

export const transferCustomerServiceOrder = createAsyncThunk(
  "customerServiceOrders/transfer",
  async ({ orderId, departmentId, status, note }, thunkAPI) => {
    const result = await transferCustomerServiceOrderRequest(orderId, {
      departmentId,
      status,
      note,
    });

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceOrders());
      await thunkAPI.dispatch(fetchCustomerServiceOrder(orderId));
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to transfer order");
  }
);

export const changeCustomerServiceOrderStatus = createAsyncThunk(
  "customerServiceOrders/changeStatus",
  async ({ orderId, status }, thunkAPI) => {
    const result = await changeCustomerServiceOrderStatusRequest(orderId, status);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceOrders());
      await thunkAPI.dispatch(fetchCustomerServiceOrder(orderId));
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to change order status");
  }
);

export const addCustomerServiceOrderNote = createAsyncThunk(
  "customerServiceOrders/addNote",
  async ({ orderId, note }, thunkAPI) => {
    const result = await addCustomerServiceOrderNoteRequest(orderId, note);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceOrders());
      await thunkAPI.dispatch(fetchCustomerServiceOrder(orderId));
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to add note");
  }
);

export const updateCustomerServiceOrderNote = createAsyncThunk(
  "customerServiceOrders/updateNote",
  async ({ noteId, note, orderId }, thunkAPI) => {
    const result = await updateCustomerServiceOrderNoteRequest(noteId, note);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceOrders());
      if (orderId) {
        await thunkAPI.dispatch(fetchCustomerServiceOrder(orderId));
      }
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to update note");
  }
);

export const deleteCustomerServiceOrderNote = createAsyncThunk(
  "customerServiceOrders/deleteNote",
  async ({ noteId, orderId }, thunkAPI) => {
    const result = await deleteCustomerServiceOrderNoteRequest(noteId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceOrders());
      if (orderId) {
        await thunkAPI.dispatch(fetchCustomerServiceOrder(orderId));
      }
      return result.data?.data || result.data;
    }

    return rejectApiError(result, thunkAPI, "Failed to delete note");
  }
);
