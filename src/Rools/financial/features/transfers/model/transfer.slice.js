import { createSlice } from "@reduxjs/toolkit";
import {
  fetchTransfers,
  fetchTransferSummary,
  fetchTransferById,
  cancelTransfer,
  createTransfer,
  updateTransfer,
  deleteTransfer,
} from "./transfer.thunks";

const initialState = {
  items: [],
  summary: {
    total_receipts: 0,
    total_payments: 0,
    net_balance: 0,
  },
  selectedTransferDetails: null,
  loadingDetails: false,
  loading: false,
  error: null,
};

const transferSlice = createSlice({
  name: "transfer",
  initialState,
  reducers: {
    clearSelectedDetails: (state) => {
      state.selectedTransferDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transfers
      .addCase(fetchTransfers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransfers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransfers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب قائمة التحويلات المالية";
      })

      // Fetch Summary
      .addCase(fetchTransferSummary.fulfilled, (state, action) => {
        if (action.payload) {
          state.summary = action.payload;
        }
      })

      // Fetch Transfer By ID
      .addCase(fetchTransferById.pending, (state) => {
        state.loadingDetails = true;
      })
      .addCase(fetchTransferById.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.selectedTransferDetails = action.payload;
      })
      .addCase(fetchTransferById.rejected, (state) => {
        state.loadingDetails = false;
      })

      // Cancel Transfer (مزامنة فورية للجدول)
      .addCase(cancelTransfer.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.items[index] = updated;
        }
      })

      // Create Transfer
      .addCase(createTransfer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransfer.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createTransfer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في إضافة التحويل المالي";
      })

      // Update Transfer
      .addCase(updateTransfer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransfer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTransfer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في تعديل التحويل المالي";
      })

      // Delete Transfer
      .addCase(deleteTransfer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransfer.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteTransfer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حذف التحويل المالي";
      });
  },
});

export const { clearSelectedDetails } = transferSlice.actions;
export default transferSlice.reducer;