import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
  fetchAppointments,
  fetchDepartmentOrders,
} from "./availableSlot.thunks";

const initialState = {
  slots: { items: [], loading: false, error: null },
  appointments: { items: [], loading: false, error: null },
  departmentOrders: { items: [], loading: false, error: null },
  actionLoading: false,
};

const availableSlotSlice = createSlice({
  name: "availableSlots",
  initialState,
  reducers: {},
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

      // 🎯 إضافة فترة متاحة
      .addCase(createAvailableSlot.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createAvailableSlot.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createAvailableSlot.rejected, (state) => {
        state.actionLoading = false;
      })

      // 🎯 تحديث فترة متاحة
      .addCase(updateAvailableSlot.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAvailableSlot.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateAvailableSlot.rejected, (state) => {
        state.actionLoading = false;
      })

      // 🎯 حذف فترة متاحة
      .addCase(deleteAvailableSlot.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteAvailableSlot.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteAvailableSlot.rejected, (state) => {
        state.actionLoading = false;
      })

      // 🎯 جلب طلبات القسم
      .addCase(fetchDepartmentOrders.pending, (state) => {
        state.departmentOrders.loading = true;
        state.departmentOrders.error = null;
      })
      .addCase(fetchDepartmentOrders.fulfilled, (state, action) => {
        state.departmentOrders.loading = false;
        state.departmentOrders.items = action.payload;
      })
      .addCase(fetchDepartmentOrders.rejected, (state, action) => {
        state.departmentOrders.loading = false;
        state.departmentOrders.error = action.payload || "فشل في جلب طلبات القسم";
      });
  },
});

export default availableSlotSlice.reducer;