import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllPaymentsRequest,
  getPaymentsByContractRequest,
  deletePaymentRequest,
  updatePaymentRequest,
  createPaymentRequest,
  payCustomByContractRequest,
  changePaymentStatusRequest
} from "../api/payment.api";
import { showError } from "@/shared/store/error/error.slice";
import { handleApiError } from "@/shared/utils/errorHandler";

export const fetchPayments = createAsyncThunk(
  "payment/fetchPayments",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await getAllPaymentsRequest();
      const rawData = response.data?.data || response.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 🆕 Thunk لجلب دفعات عقد محدد للتتبع
export const fetchPaymentsByContract = createAsyncThunk(
  "payment/fetchPaymentsByContract",
  async (contractId, { rejectWithValue, dispatch }) => {
    try {
      const response = await getPaymentsByContractRequest(contractId);
      const rawData = response.data?.data || response.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const updatePayment = createAsyncThunk(
  "payment/updatePayment",
  async ({ id, values, files = [] }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();

      if (values.payment_date) formData.append("payment_date", values.payment_date);
      if (values.payment_type) formData.append("payment_type", values.payment_type);
      if (values.payment_method) formData.append("payment_method", values.payment_method);
      if (values.status) formData.append("status", values.status);

      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await updatePaymentRequest(id, formData);
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deletePayment = createAsyncThunk(
  "payment/deletePayment",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await deletePaymentRequest(id);
      return id;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createPayment = createAsyncThunk(
  "payment/createPayment",
  async ({ values, files = [] }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();

      if (values.client_id) formData.append("client_id", values.client_id);
      if (values.contract_id) formData.append("contract_id", values.contract_id);
      if (values.amount) formData.append("amount", values.amount);
      if (values.payment_date) formData.append("payment_date", values.payment_date);
      if (values.payment_type) formData.append("payment_type", values.payment_type);
      if (values.payment_method) formData.append("payment_method", values.payment_method);
      if (values.status) formData.append("status", values.status);

      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await createPaymentRequest(formData);

      if (!response.ok) {
        dispatch(showError(response.message));
        return rejectWithValue(response.message);
      }

      return response.data?.data || response.data;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);
export const payCustomByContract = createAsyncThunk(
  "payment/payCustomByContract",
  async ({ contractId, values, files = [] }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();

      if (values.amount) formData.append("amount", values.amount);
      if (values.payment_method) formData.append("payment_method", values.payment_method);

      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await payCustomByContractRequest(contractId, formData);

      if (response?.data?.status === false) {
        dispatch(showError(response.data.message));
        return rejectWithValue(response.data.message);
      }

      return response.data?.data || response.data;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);
export const changePaymentStatus = createAsyncThunk(
  "payment/changePaymentStatus",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      const response = await changePaymentStatusRequest(id, status);
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);