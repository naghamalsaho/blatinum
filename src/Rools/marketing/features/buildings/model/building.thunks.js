import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildingApi } from "../api/building.api";
import { getThunkErrorMessage } from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";

export const fetchBuildings = createAsyncThunk(
  "buildings/fetchBuildings",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await buildingApi.getBuildings();
      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب الأبنية");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const fetchBuildingsByProject = createAsyncThunk(
  "buildings/fetchBuildingsByProject",
  async (projectId, { rejectWithValue, dispatch }) => {
    try {
      const response = await buildingApi.getBuildingsByProject(projectId);
      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب أبنية المشروع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createBuilding = createAsyncThunk(
  "buildings/createBuilding",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await buildingApi.createBuilding(formData);
      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في إضافة البناء");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const updateBuilding = createAsyncThunk(
  "buildings/updateBuilding",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await buildingApi.updateBuilding(id, payload);
      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في تحديث البناء");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteBuilding = createAsyncThunk(
  "buildings/deleteBuilding",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await buildingApi.deleteBuilding(id);
      return id;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في حذف البناء");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);