import { createSlice } from "@reduxjs/toolkit";

import {
  fetchProjectEngineers,
  fetchEngineersAllocatedToProject,
  fetchAllocatedLocationsForEngineer,
  assignEngineerProject,
  fetchAllProjects, // 🆕
  fetchAllBuildings, // 🆕
} from "./engineerProject.thunks";

const initialState = {
  items: [],
  projectEngineers: [],
  allocatedLocations: [],
  projects: [], // 🆕 لتخزين مشاريع النظام
  buildings: [], // 🆕 لتخزين أبنية النظام
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
      })

      // 🆕 معالجة راوت المشاريع العام
      .addCase(fetchAllProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchAllProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch projects";
      })

      // 🆕 معالجة راوت الأبنية العام
      .addCase(fetchAllBuildings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBuildings.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings = action.payload;
      })
      .addCase(fetchAllBuildings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch buildings";
      });
  },
});

export default projectEngineerSlice.reducer;