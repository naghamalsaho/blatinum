import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
} from "./availableSlot.thunks";

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const availableSlotSlice = createSlice({
  name: "availableSlots",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load available slots";
      })

      .addCase(createAvailableSlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAvailableSlot.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createAvailableSlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create available slot";
      })

      .addCase(updateAvailableSlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAvailableSlot.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateAvailableSlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update available slot";
      })

      .addCase(deleteAvailableSlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAvailableSlot.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteAvailableSlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete available slot";
      });
  },
});

export default availableSlotSlice.reducer;