import { createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "@/shared/api/http";
import {
  buildThunkHeaders,
  getThunkErrorMessage,
} from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";

export const fetchLocations = createAsyncThunk(
  "locations/fetchLocations",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.get("/location", {
        headers: buildThunkHeaders(false),
      });

      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في جلب المواقع"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);

export const createLocation = createAsyncThunk(
  "locations/createLocation",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.post("/location", payload, {
        headers: buildThunkHeaders(false),
      });

      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في إضافة الموقع"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);

export const updateLocation = createAsyncThunk(
  "locations/updateLocation",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.put(
        `/location/${id}`,
        payload,
        {
          headers: buildThunkHeaders(false),
        }
      );

      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في تحديث الموقع"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteLocation = createAsyncThunk(
  "locations/deleteLocation",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await http.delete(`/location/${id}`, {
        headers: buildThunkHeaders(false),
      });

      return id;
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في حذف الموقع"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);