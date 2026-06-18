import { createSlice } from "@reduxjs/toolkit";
import {
  fetchSoldUnitOwnership,
  fetchClientUnits,
  createSoldUnitOwnership,
  updateSoldUnitOwnership,
  deleteSoldUnitOwnership,
} from "./soldUnitOwnership.thunks";

const initialState = {
  items: [],
  links: {},
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  },
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  clientUnitsLoading: false,
  clientUnits: [],
  error: null,
  clientUnitsError: null,
};

const soldUnitOwnershipSlice = createSlice({
  name: "soldUnitOwnership",
  initialState,
  reducers: {
    clearSoldUnitOwnershipError(state) {
      state.error = null;
    },
    clearClientUnitsError(state) {
      state.clientUnitsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSoldUnitOwnership.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSoldUnitOwnership.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.links = action.payload.links || {};
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchSoldUnitOwnership.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(fetchClientUnits.pending, (state) => {
        state.clientUnitsLoading = true;
        state.clientUnitsError = null;
      })
      .addCase(fetchClientUnits.fulfilled, (state, action) => {
        state.clientUnitsLoading = false;
        state.clientUnits = action.payload || [];
      })
      .addCase(fetchClientUnits.rejected, (state, action) => {
        state.clientUnitsLoading = false;
        state.clientUnitsError = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(createSoldUnitOwnership.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createSoldUnitOwnership.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createSoldUnitOwnership.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في إضافة المبيع";
      })

      .addCase(updateSoldUnitOwnership.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateSoldUnitOwnership.fulfilled, (state) => {
        state.updating = false;
      })
      .addCase(updateSoldUnitOwnership.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "فشل في التحديث";
      })

      .addCase(deleteSoldUnitOwnership.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSoldUnitOwnership.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteSoldUnitOwnership.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "فشل في الحذف";
      });
  },
});

export const { clearSoldUnitOwnershipError, clearClientUnitsError } =
  soldUnitOwnershipSlice.actions;

export default soldUnitOwnershipSlice.reducer;