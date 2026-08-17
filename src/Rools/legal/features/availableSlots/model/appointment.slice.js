import { createSlice } from "@reduxjs/toolkit";
import { fetchAppointments } from "./availableSlot.thunks";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب الحجوزات";
      });
  },
});

export default appointmentSlice.reducer;