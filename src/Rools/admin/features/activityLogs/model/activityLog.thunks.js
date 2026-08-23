import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getActivityLogRequest,
  getActivityLogsRequest,
} from "../api/activityLog.api";

const errorMessage = (result, fallback) => {
  if (result?.status === 401) return "Unauthorized. Please login again.";
  return result?.message || fallback;
};

export const fetchActivityLogs = createAsyncThunk(
  "activityLogs/fetchAll",
  async (params = {}, thunkAPI) => {
    const result = await getActivityLogsRequest(params);
    if (!result.ok) {
      return thunkAPI.rejectWithValue(errorMessage(result, "Failed to load activity logs."));
    }

    const payload = result.data || {};
    return {
      records: Array.isArray(payload.data) ? payload.data : [],
      meta: payload.meta || {},
      links: payload.links || {},
    };
  }
);

export const fetchActivityLog = createAsyncThunk(
  "activityLogs/fetchOne",
  async (logId, thunkAPI) => {
    const result = await getActivityLogRequest(logId);
    if (!result.ok) {
      return thunkAPI.rejectWithValue(errorMessage(result, "Failed to load activity details."));
    }

    return result.data?.data ?? result.data ?? null;
  }
);
