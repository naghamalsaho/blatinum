import { createSlice } from "@reduxjs/toolkit";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from "./employee.thunks";

const initialState = {
  items: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionMessage: "",
};

const employeeSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    clearEmployeeActionState: (state) => {
      state.actionLoading = false;
      state.actionError = null;
      state.actionMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load employees";
      })
      .addCase(createEmployee.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionMessage = "";
      })
      .addCase(createEmployee.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionMessage = "Employee created successfully.";
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to create employee";
      })
      .addCase(updateEmployee.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionMessage = "";
      })
      .addCase(updateEmployee.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionMessage = "Employee updated successfully.";
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to update employee";
      })
      .addCase(deleteEmployee.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionMessage = "";
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((item) => {
          const accountId =
            item.employee?.account?.id ||
            item.account?.id ||
            item.user?.id ||
            item.account_id ||
            item.id;
          return String(accountId) !== String(action.payload);
        });
        state.actionMessage = "Employee deleted successfully.";
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Failed to delete employee";
      });
  },
});

export const { clearEmployeeActionState } = employeeSlice.actions;

export default employeeSlice.reducer;
