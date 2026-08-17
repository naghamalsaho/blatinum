import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAvailableSlotsRequest,
  createAvailableSlotRequest,
  updateAvailableSlotRequest,
  deleteAvailableSlotRequest,
  getAppointmentsRequest,
} from "../api/availableSlot";

export const fetchAvailableSlots = createAsyncThunk(
  "availableSlots/fetchAll",
  async (_, thunkAPI) => {
    const result = await getAvailableSlotsRequest();

    console.log("[fetchAvailableSlots] response:", result);

    if (result.ok) {
      console.log("[fetchAvailableSlots] data:", result.data?.data ?? []);
      return result.data?.data ?? [];
    }

    console.error("[fetchAvailableSlots] error:", result.message);
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const createAvailableSlot = createAsyncThunk(
  "availableSlots/create",
  async (payload, thunkAPI) => {
    console.log("[createAvailableSlot] payload:", payload);

    const result = await createAvailableSlotRequest(payload);

    console.log("[createAvailableSlot] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchAvailableSlots());
      return true;
    }

    console.error("[createAvailableSlot] error:", result.message);
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const updateAvailableSlot = createAsyncThunk(
  "availableSlots/update",
  async ({ id, payload }, thunkAPI) => {
    console.log("[updateAvailableSlot] id:", id);
    console.log("[updateAvailableSlot] payload:", payload);

    const result = await updateAvailableSlotRequest(id, payload);

    console.log("[updateAvailableSlot] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchAvailableSlots());
      return true;
    }

    console.error("[updateAvailableSlot] error:", result.message);
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const deleteAvailableSlot = createAsyncThunk(
  "availableSlots/delete",
  async (id, thunkAPI) => {
    console.log("[deleteAvailableSlot] id:", id);

    const result = await deleteAvailableSlotRequest(id);

    console.log("[deleteAvailableSlot] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchAvailableSlots());
      return true;
    }

    console.error("[deleteAvailableSlot] error:", result.message);
    return thunkAPI.rejectWithValue(result.message);
  }
);
export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAll",
  async (params, thunkAPI) => {
    const result = await getAppointmentsRequest(params);

    console.log("[fetchAppointments] response:", result);

    if (result.ok) {
      // إرجاع مصفوفة الحجوزات الموجودة داخل data
      return result.data?.data ?? [];
    }

    console.error("[fetchAppointments] error:", result.message);
    return thunkAPI.rejectWithValue(result.message);
  }
);