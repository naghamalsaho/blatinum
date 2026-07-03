import { createSlice } from "@reduxjs/toolkit";
import {
  fetchEngineers,
  createEngineer,
  deleteEngineer,
  fetchAllocatedLocations, // استيراد الـ Thunk الجديد
} from "./engineer.thunks";

const initialState = {
  items: [],
  selectedAllocations: [], // لتخزين مواقع المهندس المحدد حالياً
  loading: false,
  allocationsLoading: false, // تحميل خاص بمواقع المهندس
  actionLoading: false,
  error: null,
};

const engineerSlice = createSlice({
  name: "engineers",
  initialState,
  reducers: {
    // رديوسر اختياري لتفريغ البيانات عند إغلاق المودال
    clearSelectedAllocations: (state) => {
      state.selectedAllocations = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEngineers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEngineers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEngineers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load engineers";
      })

      .addCase(createEngineer.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createEngineer.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createEngineer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create engineer";
      })

      .addCase(deleteEngineer.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteEngineer.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteEngineer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete engineer";
      })

      // معالجة حالات جلب المواقع المسندة للمهندس
      .addCase(fetchAllocatedLocations.pending, (state) => {
        state.allocationsLoading = true;
        state.error = null;
      })
      .addCase(fetchAllocatedLocations.fulfilled, (state, action) => {
        state.allocationsLoading = false;
        state.selectedAllocations = action.payload;
      })
      .addCase(fetchAllocatedLocations.rejected, (state, action) => {
        state.allocationsLoading = false;
        state.error = action.payload || "Failed to load allocated locations";
      });
  },
});

export const { clearSelectedAllocations } = engineerSlice.actions;
export default engineerSlice.reducer;