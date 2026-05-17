import { createSlice } from "@reduxjs/toolkit";
import {
  createDepartment,
  fetchDepartments,
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
      });
  },
});

export default departmentSlice.reducer;
