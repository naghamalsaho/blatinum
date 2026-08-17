import { createSlice } from "@reduxjs/toolkit";
import {
  fetchContractExceptions,
  fetchContractExceptionById,
  createContractException,
  updateContractException,
  reviewContractException,
  deleteContractException,
} from "./contractException.thunks";

const initialState = {
  items: [],
  selectedItem: null,
  meta: null,
  links: null,
  loading: false,
  error: null,
};

const contractExceptionSlice = createSlice({
  name: "contractExceptions",
  initialState,
  reducers: {
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchContractExceptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractExceptions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        state.links = action.payload.links;
      })
      .addCase(fetchContractExceptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب قائمة استثناءات العقود";
      })

      // Fetch Single Item
      .addCase(fetchContractExceptionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractExceptionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchContractExceptionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب تفاصيل الاستثناء";
      })

      // Create Item
      .addCase(createContractException.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContractException.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createContractException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في إضافة طلب الاستثناء";
      })

      // Update Item
      .addCase(updateContractException.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContractException.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.id) {
          const index = state.items.findIndex(
            (item) => item.id === action.payload.id
          );
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...action.payload };
          }
        }
      })
      .addCase(updateContractException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في تعديل الاستثناء";
      })

      // Review Item (تحديث حالة الاستثناء والعقد فوراً في الواجهة)
      .addCase(reviewContractException.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewContractException.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.id) {
          const index = state.items.findIndex(
            (item) => item.id === action.payload.id
          );
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...action.payload };
          }
        }
      })
      .addCase(reviewContractException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في اعتماد أو مراجعة الاستثناء";
      })

      // Delete Item
      .addCase(deleteContractException.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContractException.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteContractException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حذف الاستثناء";
      });
  },
});

export const { clearSelectedItem } = contractExceptionSlice.actions;
export default contractExceptionSlice.reducer;