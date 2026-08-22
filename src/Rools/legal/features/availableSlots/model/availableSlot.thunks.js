import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAvailableSlotsRequest,
  createAvailableSlotRequest,
  updateAvailableSlotRequest,
  deleteAvailableSlotRequest,
  getAppointmentsRequest,
  getOrderDetailsRequest,
} from "../api/availableSlot";

export const fetchAvailableSlots = createAsyncThunk(
  "availableSlots/fetchAll",
  async (_, thunkAPI) => {
    const result = await getAvailableSlotsRequest();

    if (result.ok) {
      return result.data?.data ?? [];
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const createAvailableSlot = createAsyncThunk(
  "availableSlots/create",
  async (payload, thunkAPI) => {
    const result = await createAvailableSlotRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchAvailableSlots());
      return true;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const updateAvailableSlot = createAsyncThunk(
  "availableSlots/update",
  async ({ id, payload }, thunkAPI) => {
    const result = await updateAvailableSlotRequest(id, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchAvailableSlots());
      return true;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const deleteAvailableSlot = createAsyncThunk(
  "availableSlots/delete",
  async (id, thunkAPI) => {
    const result = await deleteAvailableSlotRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchAvailableSlots());
      return true;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAll",
  async (params, thunkAPI) => {
    const result = await getAppointmentsRequest(params);

    if (result.ok) {
      return result.data?.data ?? [];
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

// 🎯 Thunk لجلب تفاصيل الطلب
export const fetchOrderDetails = createAsyncThunk(
  "orders/fetchDetails",
  async (orderId, thunkAPI) => {
    const result = await getOrderDetailsRequest(orderId);

    if (result.ok) {
      return result.data?.data ?? null;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);