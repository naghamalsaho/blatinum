import { createSlice } from "@reduxjs/toolkit";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
} from "./service.thunks";

const initialState = {
  services: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
};

const serviceSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    clearServiceError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب الخدمات";
      })

      .addCase(createService.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          state.services.unshift(action.payload);
        }
      })
      .addCase(createService.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في إضافة الخدمة";
      })

      .addCase(updateService.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.updating = false;
        if (!action.payload) return;

        const updated = action.payload;
        const index = state.services.findIndex((item) => item.id === updated.id);

        if (index !== -1) {
          state.services[index] = updated;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "فشل في تعديل الخدمة";
      })

      .addCase(deleteService.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.deleting = false;
        state.services = state.services.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "فشل في حذف الخدمة";
      });
  },
});

export const { clearServiceError } = serviceSlice.actions;
export default serviceSlice.reducer;