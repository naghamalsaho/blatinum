import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createComplaintTypeRequest,
  deleteComplaintRequest,
  deleteComplaintTypeRequest,
  getComplaintsRequest,
  getComplaintTypesRequest,
  updateComplaintStatusRequest,
} from "../api/complaint.api";

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

const extractPagedPayload = (payload) => {
  const data = payload?.data;

  return {
    items: extractList(payload),
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

export const fetchCustomerServiceComplaints = createAsyncThunk(
  "customerServiceComplaints/fetchAll",
  async (_, thunkAPI) => {
    const result = await getComplaintsRequest();

    if (result.ok) {
      return extractPagedPayload(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to load complaints");
  }
);

export const fetchCustomerServiceComplaintTypes = createAsyncThunk(
  "customerServiceComplaints/fetchTypes",
  async (_, thunkAPI) => {
    const result = await getComplaintTypesRequest();

    if (result.ok) {
      return {
        items: extractList(result.data),
        message: result.data?.message || "",
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to load complaint types");
  }
);

export const changeCustomerServiceComplaintStatus = createAsyncThunk(
  "customerServiceComplaints/changeStatus",
  async ({ complaintId, status }, thunkAPI) => {
    const result = await updateComplaintStatusRequest(complaintId, status);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceComplaints());
      return result.data?.data || result.data || { complaintId, status };
    }

    return rejectApiError(result, thunkAPI, "Failed to update complaint status");
  }
);

export const removeCustomerServiceComplaint = createAsyncThunk(
  "customerServiceComplaints/remove",
  async (complaintId, thunkAPI) => {
    const result = await deleteComplaintRequest(complaintId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceComplaints());
      return complaintId;
    }

    return rejectApiError(result, thunkAPI, "Failed to delete complaint");
  }
);

export const createCustomerServiceComplaintType = createAsyncThunk(
  "customerServiceComplaints/createType",
  async (title, thunkAPI) => {
    const result = await createComplaintTypeRequest(title);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceComplaintTypes());
      return result.data?.data || result.data || true;
    }

    return rejectApiError(result, thunkAPI, "Failed to create complaint type");
  }
);

export const removeCustomerServiceComplaintType = createAsyncThunk(
  "customerServiceComplaints/removeType",
  async (typeId, thunkAPI) => {
    const result = await deleteComplaintTypeRequest(typeId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceComplaintTypes());
      return typeId;
    }

    return rejectApiError(result, thunkAPI, "Failed to delete complaint type");
  }
);
