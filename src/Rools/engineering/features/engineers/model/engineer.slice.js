import { createSlice } from "@reduxjs/toolkit";
import {
  fetchEngineers,
  createEngineer,
  deleteEngineer,
} from "./engineer.thunks";

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const engineerSlice = createSlice({
  name: "engineers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEngineers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEngineers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEngineers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load engineers";
      })

      .addCase(createEngineer.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createEngineer.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createEngineer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create engineer";
      })

      .addCase(deleteEngineer.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteEngineer.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteEngineer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete engineer";
      });
  },
});

export default engineerSlice.reducer;