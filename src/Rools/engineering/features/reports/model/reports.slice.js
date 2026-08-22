import { createSlice } from "@reduxjs/toolkit";
import {
  fetchReports,
  createReport,
  deleteReport,
} from "./reports.thunks";

const initialState = {
  items: [],
  meta: null,
  links: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data ?? [];
        state.meta = action.payload?.meta ?? null;
        state.links = action.payload?.links ?? null;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load reports";
      })

      .addCase(createReport.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create report";
      })

      .addCase(deleteReport.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete report";
      });
  },
});

export default reportsSlice.reducer;