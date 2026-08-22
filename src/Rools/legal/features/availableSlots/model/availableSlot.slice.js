import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
  fetchAppointments,
  fetchOrderDetails,
} from "./availableSlot.thunks";

const initialState = {
  slots: { items: [], loading: false, error: null },
  appointments: { items: [], loading: false, error: null },
  orderDetails: { data: null, loading: false, error: null },
  actionLoading: false,
};

const availableSlotSlice = createSlice({
  name: "availableSlots",
  initialState,
  reducers: {
    clearOrderDetails: (state) => {
      state.orderDetails = { data: null, loading: false, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      // 🎯 جلب الفترات المتاحة (Slots)
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.slots.loading = true;
        state.slots.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.slots.loading = false;
        state.slots.items = action.payload;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.slots.loading = false;
        state.slots.error = action.payload || "Failed to load available slots";
      })

      // 🎯 جلب الحجوزات (Appointments)
      .addCase(fetchAppointments.pending, (state) => {
        state.appointments.loading = true;
        state.appointments.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.appointments.loading = false;
        state.appointments.items = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.appointments.loading = false;
        state.appointments.error = action.payload || "Failed to load appointments";
      })

      // 🎯 إدارة العمليات (إضافة/تحديث/حذف)
      .addCase(createAvailableSlot.pending, (state) => { state.actionLoading = true; })
      .addCase(createAvailableSlot.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(createAvailableSlot.rejected, (state) => { state.actionLoading = false; })

      .addCase(updateAvailableSlot.pending, (state) => { state.actionLoading = true; })
      .addCase(updateAvailableSlot.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(updateAvailableSlot.rejected, (state) => { state.actionLoading = false; })

      .addCase(deleteAvailableSlot.pending, (state) => { state.actionLoading = true; })
      .addCase(deleteAvailableSlot.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(deleteAvailableSlot.rejected, (state) => { state.actionLoading = false; })

      // 🎯 جلب تفاصيل طلب محدد
      .addCase(fetchOrderDetails.pending, (state) => {
        state.orderDetails.loading = true;
        state.orderDetails.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.orderDetails.loading = false;
        state.orderDetails.data = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.orderDetails.loading = false;
        state.orderDetails.error = action.payload || "فشل في جلب تفاصيل الطلب";
      });
  },
});

export const { clearOrderDetails } = availableSlotSlice.actions;
export default availableSlotSlice.reducer;