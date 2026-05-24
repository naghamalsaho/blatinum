import { createSlice } from "@reduxjs/toolkit";

import {
  fetchProjectEngineers,
  fetchEngineersAllocatedToProject,
  fetchAllocatedLocationsForEngineer,
  assignEngineerProject,
} from "./engineerProject.thunks";

const initialState = {
  items: [],
  projectEngineers: [],
  allocatedLocations: [],
  loading: false,
  error: null,
};

const projectEngineerSlice = createSlice({
  name: "projectEngineer",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectEngineers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectEngineers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjectEngineers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch data";
      })

      .addCase(fetchEngineersAllocatedToProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEngineersAllocatedToProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projectEngineers = action.payload;
      })
      .addCase(fetchEngineersAllocatedToProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch project engineers";
      })

      .addCase(fetchAllocatedLocationsForEngineer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllocatedLocationsForEngineer.fulfilled, (state, action) => {
        state.loading = false;
        state.allocatedLocations = action.payload;
      })
      .addCase(fetchAllocatedLocationsForEngineer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch allocated locations";
      })

      .addCase(assignEngineerProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignEngineerProject.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(assignEngineerProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Assignment failed";
      });
  },
});

export default projectEngineerSlice.reducer;