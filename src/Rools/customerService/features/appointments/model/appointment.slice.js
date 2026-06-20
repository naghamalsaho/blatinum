import { createSlice } from "@reduxjs/toolkit";
import {
  cancelCustomerServiceAppointment,
  completeCustomerServiceAppointment,
  createCustomerServiceAppointment,
  fetchCustomerServiceAppointments,
  updateCustomerServiceAppointment,
} from "./appointment.thunks";

const initialState = {
  items: [],
  links: null,
  meta: null,
  message: "",
  loading: false,
  actionLoading: false,
  error: null,
};

const STATUS_OVERRIDES_KEY = "customerServiceAppointmentStatusOverrides";

const getAppointmentId = (appointment) =>
  appointment?.id ?? appointment?.appointment_id ?? null;

const readStatusOverrides = () => {
  try {
    const value = localStorage.getItem(STATUS_OVERRIDES_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const writeStatusOverride = (id, status) => {
  try {
    const overrides = readStatusOverrides();
    localStorage.setItem(
      STATUS_OVERRIDES_KEY,
      JSON.stringify({
        ...overrides,
        [String(id)]: status,
      })
    );
  } catch {
    // localStorage can fail in restricted browser modes; Redux state still updates.
  }
};

const applyStatusOverrides = (items = []) => {
  const overrides = readStatusOverrides();

  return items.map((appointment) => {
    const id = getAppointmentId(appointment);
    const status = id ? overrides[String(id)] : null;

    if (!status) return appointment;

    return {
      ...appointment,
      status,
      state: status,
    };
  });
};

const markAppointmentStatus = (state, payload) => {
  const targetId = payload?.id;
  const status = payload?.status;

  if (!targetId || !status) return;

  writeStatusOverride(targetId, status);

  state.items = state.items.map((appointment) => {
    if (String(getAppointmentId(appointment)) !== String(targetId)) {
      return appointment;
    }

    return {
      ...appointment,
      status,
      state: status,
    };
  });
};

const appointmentSlice = createSlice({
  name: "customerServiceAppointments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerServiceAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerServiceAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = applyStatusOverrides(action.payload.items);
        state.links = action.payload.links;
        state.meta = action.payload.meta;
        state.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load appointments";
      })
      .addCase(createCustomerServiceAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCustomerServiceAppointment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createCustomerServiceAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to create appointment";
      })
      .addCase(updateCustomerServiceAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateCustomerServiceAppointment.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateCustomerServiceAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to update appointment";
      })
      .addCase(cancelCustomerServiceAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(cancelCustomerServiceAppointment.fulfilled, (state, action) => {
        state.actionLoading = false;
        markAppointmentStatus(state, action.payload);
      })
      .addCase(cancelCustomerServiceAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to cancel appointment";
      })
      .addCase(completeCustomerServiceAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(completeCustomerServiceAppointment.fulfilled, (state, action) => {
        state.actionLoading = false;
        markAppointmentStatus(state, action.payload);
      })
      .addCase(completeCustomerServiceAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to complete appointment";
      });
  },
});

export default appointmentSlice.reducer;
