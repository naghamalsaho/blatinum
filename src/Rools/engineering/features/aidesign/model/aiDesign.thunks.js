import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  generateDesignFromTextRequest,
  generateDesignFromImageRequest,
  togglePublishDesignRequest,
} from "../api/aiDesign.api";
import { getThunkErrorMessage } from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";

export const generateDesignFromText = createAsyncThunk(
  "aiDesign/generateFromText",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await generateDesignFromTextRequest(payload);
      if (response && typeof response.ok === "boolean") {
        if (response.ok) return response.data;
        const msg = response.message || "فشل في توليد التصميم من النص";
        dispatch(showError(msg));
        return rejectWithValue(msg);
      }
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في توليد التصميم من النص");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const generateDesignFromImage = createAsyncThunk(
  "aiDesign/generateFromImage",
  async (formDataPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await generateDesignFromImageRequest(formDataPayload);
      if (response && typeof response.ok === "boolean") {
        if (response.ok) return response.data;
        const msg = response.message || "فشل في توليد التصميم من الصورة";
        dispatch(showError(msg));
        return rejectWithValue(msg);
      }
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في توليد التصميم من الصورة");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const togglePublishDesign = createAsyncThunk(
  "aiDesign/togglePublish",
  async (designId, { rejectWithValue, dispatch }) => {
    try {
      const response = await togglePublishDesignRequest(designId);
      if (response && typeof response.ok === "boolean") {
        if (response.ok) return response.data;
        const msg = response.message || "فشل في تغيير حالة اعتماد التصميم";
        dispatch(showError(msg));
        return rejectWithValue(msg);
      }
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في تغيير حالة اعتماد التصميم");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);