import { createAsyncThunk } from "@reduxjs/toolkit";
import { serviceApi } from "../api/service.api";
import { showError } from "@/shared/store/error/error.slice";
import { handleApiError } from "@/shared/utils/errorHandler";
import {
  validateServiceCreate,
  validateServiceUpdate,
  getFirstValidationMessage,
} from "../validation/service.validation";

const extractValue = (input, key) => {
  if (!input) return "";

  if (input instanceof FormData) {
    const value = input.get(key);
    return value === null || value === undefined ? "" : value;
  }

  return input[key] ?? "";
};

const normalizeCreatePayload = (formData) => ({
  name: extractValue(formData, "name"),
  description: extractValue(formData, "description"),
  price: extractValue(formData, "price"),
});

export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await serviceApi.getServices();
      return response.data?.data || [];
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createService = createAsyncThunk(
  "services/createService",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const values = normalizeCreatePayload(formData);
      const errors = validateServiceCreate(values);
      const message = getFirstValidationMessage(errors);

      if (message) {
        dispatch(showError(message));
        return rejectWithValue(message);
      }

      const response = await serviceApi.createService(formData);
      return response.data?.data || null;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const updateService = createAsyncThunk(
  "services/updateService",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const errors = validateServiceUpdate(payload);
      const message = getFirstValidationMessage(errors);

      if (message) {
        dispatch(showError(message));
        return rejectWithValue(message);
      }

      const sanitizedPayload = {};

      if (payload?.name !== undefined && String(payload.name).trim() !== "") {
        sanitizedPayload.name = String(payload.name).trim();
      }

      if (
        payload?.description !== undefined &&
        String(payload.description).trim() !== ""
      ) {
        sanitizedPayload.description = String(payload.description).trim();
      }

      if (payload?.price !== undefined && String(payload.price).trim() !== "") {
        sanitizedPayload.price = Number(payload.price);
      }

      const response = await serviceApi.updateService(id, sanitizedPayload);
      return response.data?.data || null;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteService = createAsyncThunk(
  "services/deleteService",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await serviceApi.deleteService(id);
      return id;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);