import { createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "@/shared/api/http";
import {
  buildThunkHeaders,
  getThunkErrorMessage,
} from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";
import { validateAdvertisementForm } from "../validation/advertisement.validation";

export const fetchAdvertisements = createAsyncThunk(
  "advertisements/fetchAdvertisements",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.get("/advertisment", {
        headers: buildThunkHeaders(false),
      });

      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب الإعلانات");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const fetchActiveAdvertisements = createAsyncThunk(
  "advertisements/fetchActiveAdvertisements",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.get("/advertisment/activeAdvertisements", {
        headers: buildThunkHeaders(false),
      });

      // معالجة مرنة للبيانات القادمة من Postman
      const responseData = response.data?.data ?? response.data;
      
      if (Array.isArray(responseData)) {
        return responseData;
      }
      return responseData ? [responseData] : [];
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في جلب الإعلانات النشطة"
      );
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createAdvertisement = createAsyncThunk(
  "advertisements/createAdvertisement",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const validationErrors = validateAdvertisementForm({
        title: formData.get("title"),
        description: formData.get("description"),
        status: formData.get("status"),
        duration_days: formData.get("duration_days"),
        attachmentFile:
          formData.get("attachments[0]") || formData.get("attachments[0][file]"),
      });

      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        dispatch(showError(firstError));
        return rejectWithValue(firstError);
      }

      const response = await http.post("/advertisment", formData, {
        headers: buildThunkHeaders(true),
      });

      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في إضافة الإعلان");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteAdvertisement = createAsyncThunk(
  "advertisements/deleteAdvertisement",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await http.delete(`/advertisment/${id}`, {
        headers: buildThunkHeaders(false),
      });

      return id;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في حذف الإعلان");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);