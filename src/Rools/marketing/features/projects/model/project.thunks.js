import { createAsyncThunk } from "@reduxjs/toolkit";
import { projectApi } from "../api/project.api";
import { getThunkErrorMessage } from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await projectApi.getProjects();
      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب المشاريع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const response = await projectApi.createProject(formData);
      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في إضافة المشروع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await projectApi.updateProject(id, payload);
      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في تحديث المشروع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await projectApi.deleteProject(id);
      return id;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في حذف المشروع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);