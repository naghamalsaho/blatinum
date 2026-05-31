import { createSlice } from "@reduxjs/toolkit";
import { createItem, deleteItem, fetchItems, updateItem } from "./item.thunks";

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const itemSlice = createSlice({
  name: "items",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load items";
      })
      .addCase(createItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create item";
      })
      .addCase(updateItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update item";
      })
      .addCase(deleteItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete item";
      });
  },
});

export default itemSlice.reducer;
