import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  cancelAppointmentRequest,
  completeAppointmentRequest,
  createAppointmentRequest,
  getAppointmentsRequest,
  updateAppointmentRequest,
} from "../api/appointment.api";

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

const extractAppointmentPayload = (payload) => {
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

export const fetchCustomerServiceAppointments = createAsyncThunk(
  "customerServiceAppointments/fetchAll",
  async (_, thunkAPI) => {
    const result = await getAppointmentsRequest();

    if (result.ok) {
      return extractAppointmentPayload(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to load appointments");
  }
);

export const createCustomerServiceAppointment = createAsyncThunk(
  "customerServiceAppointments/create",
  async (payload, thunkAPI) => {
    const result = await createAppointmentRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceAppointments());
      return result.data?.data ?? true;
    }

    return rejectApiError(result, thunkAPI, "Failed to create appointment");
  }
);

export const updateCustomerServiceAppointment = createAsyncThunk(
  "customerServiceAppointments/update",
  async ({ id, payload }, thunkAPI) => {
    const result = await updateAppointmentRequest(id, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceAppointments());
      return result.data?.data ?? true;
    }

    return rejectApiError(result, thunkAPI, "Failed to update appointment");
  }
);

export const cancelCustomerServiceAppointment = createAsyncThunk(
  "customerServiceAppointments/cancel",
  async (id, thunkAPI) => {
    const result = await cancelAppointmentRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceAppointments());
      return { id, status: "cancelled" };
    }

    return rejectApiError(result, thunkAPI, "Failed to cancel appointment");
  }
);

export const completeCustomerServiceAppointment = createAsyncThunk(
  "customerServiceAppointments/complete",
  async (id, thunkAPI) => {
    const result = await completeAppointmentRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceAppointments());
      return { id, status: "done" };
    }

    return rejectApiError(result, thunkAPI, "Failed to complete appointment");
  }
);
