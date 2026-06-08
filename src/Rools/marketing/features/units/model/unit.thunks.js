import { createAsyncThunk } from "@reduxjs/toolkit";
import { unitApi } from "../api/unit.api";
import { getThunkErrorMessage } from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";

export const fetchUnits = createAsyncThunk(
  "units/fetchUnits",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await unitApi.getUnits();
      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب الوحدات");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const fetchUnitsByBuilding = createAsyncThunk(
  "units/fetchUnitsByBuilding",
  async (buildingId, { rejectWithValue, dispatch }) => {
    try {
      const response = await unitApi.getUnitsByBuilding(buildingId);
      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب وحدات البناء");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createUnit = createAsyncThunk(
  "units/createUnit",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await unitApi.createUnit(payload);
      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في إضافة الوحدة");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const updateUnit = createAsyncThunk(
  "units/updateUnit",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await unitApi.updateUnit(id, payload);
      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في تحديث الوحدة");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteUnit = createAsyncThunk(
  "units/deleteUnit",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await unitApi.deleteUnit(id);
      return id;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في حذف الوحدة");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);