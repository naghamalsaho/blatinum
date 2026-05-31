import { createSlice } from "@reduxjs/toolkit";
import {
  createDepartment,
  createEmployeeDepartment,
  deleteDepartment,
  deleteEmployeeDepartment,
  fetchDepartments,
  updateDepartment,
  updateEmployeeDepartment,
} from "./department.thunks";

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const departmentSlice = createSlice({
  name: "departments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load departments";
      })
      .addCase(createDepartment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create department";
      })
      .addCase(updateDepartment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update department";
      })
      .addCase(deleteDepartment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete department";
      })
      .addCase(createEmployeeDepartment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createEmployeeDepartment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createEmployeeDepartment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to assign employee";
      })
      .addCase(updateEmployeeDepartment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateEmployeeDepartment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateEmployeeDepartment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update employee assignment";
      })
      .addCase(deleteEmployeeDepartment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteEmployeeDepartment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteEmployeeDepartment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to remove employee assignment";
      });
  },
});

export default departmentSlice.reducer;
