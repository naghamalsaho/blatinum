import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllTransfersRequest,
  getTransferByIdRequest,
  getTransferSummaryRequest,
  cancelTransferRequest,
  createTransferRequest,
  updateTransferRequest,
  deleteTransferRequest,
} from "../api/transfer.api";
import { showError } from "@/shared/store/error/error.slice";
import { handleApiError } from "@/shared/utils/errorHandler";

// 1. جلب التحويلات المالية
export const fetchTransfers = createAsyncThunk(
  "transfer/fetchTransfers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await getAllTransfersRequest();
      const rawData = response.data?.data || response.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 2. جلب ملخص الحركة المالية (Summary)
export const fetchTransferSummary = createAsyncThunk(
  "transfer/fetchTransferSummary",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await getTransferSummaryRequest();
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 3. جلب تفاصيل معاملة واحدة برقم ID
export const fetchTransferById = createAsyncThunk(
  "transfer/fetchTransferById",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await getTransferByIdRequest(id);
      return response.data?.data || response.data;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 4. إلغاء معاملة مالية (Cancel)
export const cancelTransfer = createAsyncThunk(
  "transfer/cancelTransfer",
  async ({ id, reason }, { rejectWithValue, dispatch }) => {
    try {
      const response = await cancelTransferRequest(id, reason);
      const updatedTransfer = response.data?.data || response.data;
      
      // إعاده جلب ملخص الأرقام فور الإلغاء
      dispatch(fetchTransferSummary());
      return updatedTransfer;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 5. إنشاء تحويل مالي جديد
export const createTransfer = createAsyncThunk(
  "transfer/createTransfer",
  async ({ values, files = [] }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();

      if (values.voucher_number) formData.append("voucher_number", values.voucher_number);
      formData.append("type", values.type || "receipt");
      if (values.amount) formData.append("amount", values.amount);
      if (values.currency) formData.append("currency", values.currency || "USD");
      if (values.exchange_rate) formData.append("exchange_rate", values.exchange_rate);
      if (values.category) formData.append("category", values.category);
      if (values.payment_method) formData.append("payment_method", values.payment_method);
      if (values.status) formData.append("status", values.status || "posted");
      if (values.description) formData.append("description", values.description);

      if (values.party_id) formData.append("party_id", values.party_id);
      if (values.party_type) formData.append("party_type", values.party_type);
      if (values.project_id) formData.append("project_id", values.project_id);
      if (values.warehouse_id) formData.append("warehouse_id", values.warehouse_id);

      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await createTransferRequest(formData);
      const newTransfer = response.data?.data || response.data;
      dispatch(fetchTransferSummary());
      return newTransfer;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 6. تعديل تحويل مالي
export const updateTransfer = createAsyncThunk(
  "transfer/updateTransfer",
  async ({ id, values, files = [] }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();
      if (values.amount) formData.append("amount", values.amount);
      if (values.status) formData.append("status", values.status);
      if (values.payment_method) formData.append("payment_method", values.payment_method);
      if (values.description) formData.append("description", values.description);

      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await updateTransferRequest(id, formData);
      const updatedData = response.data?.data || response.data;
      dispatch(fetchTransferSummary());
      return updatedData;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 7. حذف تحويل مالي
export const deleteTransfer = createAsyncThunk(
  "transfer/deleteTransfer",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await deleteTransferRequest(id);
      dispatch(fetchTransferSummary());
      return id;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);