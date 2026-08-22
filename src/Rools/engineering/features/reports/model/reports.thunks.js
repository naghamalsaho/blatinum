import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getReportsRequest,
  createReportRequest,
  deleteReportRequest,
} from "../api/reports.api";

export const fetchReports = createAsyncThunk(
  "reports/fetchAll",
  async (page = 1, thunkAPI) => {
    console.log("[fetchReports] request -> GET /construction-report");

    const result = await getReportsRequest(page);

    console.log("[fetchReports] response:", result);

    if (result.ok) {
      return result.data;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const createReport = createAsyncThunk(
  "reports/create",
  async (payload, thunkAPI) => {
    console.log("[createReport] request body:", payload);

    const result = await createReportRequest(payload);

    console.log("[createReport] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchReports());
      return result.data?.data ?? true;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const deleteReport = createAsyncThunk(
  "reports/delete",
  async (id, thunkAPI) => {
    console.log("[deleteReport] request id:", id);

    const result = await deleteReportRequest(id);

    console.log("[deleteReport] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchReports());
      return id;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);