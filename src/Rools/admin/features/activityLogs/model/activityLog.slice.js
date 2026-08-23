import { createSlice } from "@reduxjs/toolkit";
import { fetchActivityLog, fetchActivityLogs } from "./activityLog.thunks";

const initialState = {
  records: [],
  meta: {},
  links: {},
  loading: false,
  error: null,
  selected: null,
  detailsLoading: false,
  detailsError: null,
};

const activityLogSlice = createSlice({
  name: "activityLogs",
  initialState,
  reducers: {
    clearSelectedActivityLog(state) {
      state.selected = null;
      state.detailsError = null;
      state.detailsLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.meta = action.payload.meta;
        state.links = action.payload.links;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load activity logs.";
      })
      .addCase(fetchActivityLog.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(fetchActivityLog.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchActivityLog.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload || "Failed to load activity details.";
      });
  },
});

export const { clearSelectedActivityLog } = activityLogSlice.actions;
export default activityLogSlice.reducer;
