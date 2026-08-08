import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  cancelCustomerServiceLotteryRequest,
  createCustomerServiceLotteryRequest,
  drawCustomerServiceLotteryWinnerRequest,
  getCustomerServiceLotteriesRequest,
  getCustomerServiceLotteryRequest,
  updateCustomerServiceLotteryRequest,
} from "../api/lottery.api";

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");

  if (typeof message === "object") {
    return Object.entries(message)
      .map(([key, value]) => {
        const text = Array.isArray(value)
          ? value.join(" ")
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : value;

        return `${key}: ${text}`;
      })
      .join(" ");
  }

  return String(message);
};

const extractList = (payload) => {
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(payload)) return payload;

  return [];
};

const extractPagedPayload = (payload) => {
  const data = payload?.data;

  return {
    items: extractList(payload),
    links: payload?.links || data?.links || null,
    meta: payload?.meta || data?.meta || null,
    message: payload?.message || data?.message || "",
  };
};

const extractSingle = (payload) => payload?.data?.data || payload?.data || payload || null;

const rejectApiError = (result, thunkAPI, fallback) => {
  if (result.status === 401) {
    return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
  }

  const validationDetails = normalizeErrorMessage(
    result.data?.errors || result.data?.error || result.data?.data?.errors
  );
  const primaryMessage = normalizeErrorMessage(result.data?.message || result.message);
  const message = [primaryMessage, validationDetails]
    .filter((value, index, values) => value && value !== "Something went wrong" && values.indexOf(value) === index)
    .join(" — ");

  return thunkAPI.rejectWithValue(message || fallback);
};

export const fetchCustomerServiceLotteries = createAsyncThunk(
  "customerServiceLotteries/fetchAll",
  async (_, thunkAPI) => {
    const result = await getCustomerServiceLotteriesRequest();

    if (result.ok) {
      return extractPagedPayload(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to load lotteries");
  }
);

export const fetchCustomerServiceLottery = createAsyncThunk(
  "customerServiceLotteries/fetchOne",
  async (lotteryId, thunkAPI) => {
    const result = await getCustomerServiceLotteryRequest(lotteryId);

    if (result.ok) {
      return {
        item: extractSingle(result.data),
        message: result.data?.message || "",
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to load lottery");
  }
);

export const createCustomerServiceLottery = createAsyncThunk(
  "customerServiceLotteries/create",
  async (payload, thunkAPI) => {
    const result = await createCustomerServiceLotteryRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceLotteries());
      return extractSingle(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to create lottery");
  }
);

export const updateCustomerServiceLottery = createAsyncThunk(
  "customerServiceLotteries/update",
  async ({ lotteryId, payload }, thunkAPI) => {
    const result = await updateCustomerServiceLotteryRequest(lotteryId, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceLotteries());
      await thunkAPI.dispatch(fetchCustomerServiceLottery(lotteryId));
      return extractSingle(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to update lottery");
  }
);

export const cancelCustomerServiceLottery = createAsyncThunk(
  "customerServiceLotteries/cancel",
  async (lotteryId, thunkAPI) => {
    const result = await cancelCustomerServiceLotteryRequest(lotteryId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceLotteries());
      await thunkAPI.dispatch(fetchCustomerServiceLottery(lotteryId));
      return extractSingle(result.data) || { lotteryId };
    }

    return rejectApiError(result, thunkAPI, "Failed to cancel lottery");
  }
);

export const drawCustomerServiceLotteryWinner = createAsyncThunk(
  "customerServiceLotteries/drawWinner",
  async (lotteryId, thunkAPI) => {
    const result = await drawCustomerServiceLotteryWinnerRequest(lotteryId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceLotteries());
      await thunkAPI.dispatch(fetchCustomerServiceLottery(lotteryId));
      return extractSingle(result.data) || { lotteryId };
    }

    return rejectApiError(result, thunkAPI, "Failed to draw winner");
  }
);
