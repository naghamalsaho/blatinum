import { createSlice } from "@reduxjs/toolkit";
import {
  createWarehouse,
  deleteWarehouse,
  fetchWarehouses,
  updateWarehouse,
} from "./warehouse.thunks";

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const warehouseSlice = createSlice({
  name: "warehouses",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load warehouses";
      })
      .addCase(createWarehouse.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createWarehouse.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createWarehouse.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create warehouse";
      })
      .addCase(updateWarehouse.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateWarehouse.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateWarehouse.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update warehouse";
      })
      .addCase(deleteWarehouse.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteWarehouse.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteWarehouse.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete warehouse";
      });
  },
});

export default warehouseSlice.reducer;
