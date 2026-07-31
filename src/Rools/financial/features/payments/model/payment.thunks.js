import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllPaymentsRequest,deletePaymentRequest,updatePaymentRequest,createPaymentRequest } from "../api/payment.api";
import { showError } from "@/shared/store/error/error.slice";
import { handleApiError } from "@/shared/utils/errorHandler";

export const fetchPayments = createAsyncThunk(
  "payment/fetchPayments",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await getAllPaymentsRequest();

      // لاستخراج القائمة بشكل مرن وسليم من data
      const rawData = response.data?.data || response.data || response;
      const paymentsList = Array.isArray(rawData) ? rawData : [];

      return paymentsList;
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

      // إضافة الحقول النصية
      if (values.payment_date) formData.append("payment_date", values.payment_date);
      if (values.payment_type) formData.append("payment_type", values.payment_type);
      if (values.payment_method) formData.append("payment_method", values.payment_method);
      if (values.status) formData.append("status", values.status);

      // تمرير الملفات المتعددة بصيغة attachments[i][file] مثل البوست مان
      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await updatePaymentRequest(id, formData);
      const updatedData = response.data?.data || response.data;

      return updatedData;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// Thunk لحذف الدفعة
export const deletePayment = createAsyncThunk(
  "payment/deletePayment",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await deletePaymentRequest(id);
      return id; // نرجع الـ id ليتم حذفه من الـ state
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

      // إضافة جميع الحقول النصية المطلوبة
      if (values.client_id) formData.append("client_id", values.client_id);
      if (values.contract_id) formData.append("contract_id", values.contract_id); // 👈 إضافة contract_id هنا
      if (values.amount) formData.append("amount", values.amount);
      if (values.payment_date) formData.append("payment_date", values.payment_date);
      if (values.payment_type) formData.append("payment_type", values.payment_type);
      if (values.payment_method) formData.append("payment_method", values.payment_method);
      if (values.status) formData.append("status", values.status);

      // إضافة المرفقات
      files.forEach((file, index) => {
        formData.append(`attachments[${index}][file]`, file);
      });

      const response = await createPaymentRequest(formData);

      if (!response.ok) {
        dispatch(showError(response.message));
        return rejectWithValue(response.message);
      }

      const newPayment = response.data?.data || response.data;
      return newPayment;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);