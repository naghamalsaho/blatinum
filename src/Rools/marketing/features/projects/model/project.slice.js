import { createSlice } from "@reduxjs/toolkit";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "./project.thunks";

const initialState = {
  projects: [],
  loading: false,
  creating: false,
  updating: false,
  error: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProjectError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(createProject.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) state.projects.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في إضافة المشروع";
      })

      .addCase(updateProject.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.updating = false;
        const updated = action.payload;
        if (!updated) return;

        const index = state.projects.findIndex((item) => item.id === updated.id);
        if (index !== -1) state.projects[index] = updated;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "فشل في تحديث المشروع";
      })

      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حذف المشروع";
      });
  },
});

export const { clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;