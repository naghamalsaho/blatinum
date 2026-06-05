import { createAsyncThunk } from "@reduxjs/toolkit";
import { advertisementApi } from "../api/advertisement.api";

export const fetchAdvertisements = createAsyncThunk(
  "advertisements/fetchAdvertisements",
  async (_, { rejectWithValue }) => {
    const response = await advertisementApi.getAdvertisements();

    if (!response.ok) {
      return rejectWithValue(response.message || "فشل في جلب الإعلانات");
    }

    return response.data?.data || [];
  }
);

export const fetchActiveAdvertisements = createAsyncThunk(
  "advertisements/fetchActiveAdvertisements",
  async (_, { rejectWithValue }) => {
    const response = await advertisementApi.getActiveAdvertisements();

    if (!response.ok) {
      return rejectWithValue(response.message || "فشل في جلب الإعلانات النشطة");
    }

    return response.data?.data || [];
  }
);

export const createAdvertisement = createAsyncThunk(
  "advertisements/createAdvertisement",
  async (formData, { rejectWithValue }) => {
    const response = await advertisementApi.createAdvertisement(formData);

    if (!response.ok) {
      return rejectWithValue(response.message || "فشل في إضافة الإعلان");
    }

    return response.data?.data || null;
  }
);

export const deleteAdvertisement = createAsyncThunk(
  "advertisements/deleteAdvertisement",
  async (id, { rejectWithValue }) => {
    const response = await advertisementApi.deleteAdvertisement(id);

    if (!response.ok) {
      return rejectWithValue(response.message || "فشل في حذف الإعلان");
    }

    return id;
  }
);
