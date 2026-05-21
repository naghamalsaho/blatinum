import { createSlice } from "@reduxjs/toolkit";

import {
  fetchProjectEngineers,
  fetchProjectsForEngineer,
  assignEngineerProject,
} from "./engineerProject.thunks";

const initialState = {
  items: [],
  engineerProjects: [],
  loading: false,
  error: null,
};

const projectEngineerSlice = createSlice({
  name: "projectEngineer",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      // ============================
      // FETCH ALL
      // ============================
      .addCase(
        fetchProjectEngineers.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchProjectEngineers.fulfilled,
        (state, action) => {
          state.loading = false;
          state.items = action.payload;
        }
      )

      .addCase(
        fetchProjectEngineers.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ||
            "Failed to fetch data";
        }
      )

      // ============================
      // FETCH ENGINEER PROJECTS
      // ============================
      .addCase(
        fetchProjectsForEngineer.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchProjectsForEngineer.fulfilled,
        (state, action) => {
          state.loading = false;
          state.engineerProjects =
            action.payload;
        }
      )

      .addCase(
        fetchProjectsForEngineer.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ||
            "Failed to fetch engineer projects";
        }
      )

      // ============================
      // ASSIGN
      // ============================
      .addCase(
        assignEngineerProject.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        assignEngineerProject.fulfilled,
        (state) => {
          state.loading = false;
        }
      )

      .addCase(
        assignEngineerProject.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ||
            "Assignment failed";
        }
      );
  },
});

export default projectEngineerSlice.reducer;