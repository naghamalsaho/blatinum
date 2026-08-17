import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllContractExceptionsRequest,
  getContractExceptionByIdRequest,
  createContractExceptionRequest,
  updateContractExceptionRequest,
  reviewContractExceptionRequest,
  deleteContractExceptionRequest,
} from "../api/contractException.api";
import { showError } from "@/shared/store/error/error.slice";
import { handleApiError } from "@/shared/utils/errorHandler";

// 1. Thunk لجلب جميع استثناءات العقود
export const fetchContractExceptions = createAsyncThunk(
  "contractExceptions/fetchContractExceptions",
  async (page = 1, { rejectWithValue, dispatch }) => {
    try {
      const response = await getAllContractExceptionsRequest(page);

      // استخراج القائمة بشكل مرن وسليم من استجابة crud.js
      const rawData = response?.data?.data || response?.data || response;
      const exceptionsList = Array.isArray(rawData) ? rawData : [];

      return {
        items: exceptionsList,
        meta: response?.meta || response?.data?.meta || null,
        links: response?.links || response?.data?.links || null,
      };
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 2. Thunk لجلب تفاصيل استثناء محدد
export const fetchContractExceptionById = createAsyncThunk(
  "contractExceptions/fetchContractExceptionById",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await getContractExceptionByIdRequest(id);
      const singleData = response?.data?.data || response?.data || response;
      return singleData;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 3. Thunk لإنشاء طلب استثناء جديد
export const createContractException = createAsyncThunk(
  "contractExceptions/createContractException",
  async (values, { rejectWithValue, dispatch }) => {
    try {
      const response = await createContractExceptionRequest(values);

      if (response?.ok === false) {
        dispatch(showError(response.message));
        return rejectWithValue(response.message);
      }

      const newException = response?.data?.data || response?.data || response;
      return newException;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 4. Thunk لتحديث طلب الاستثناء
export const updateContractException = createAsyncThunk(
  "contractExceptions/updateContractException",
  async ({ id, values }, { rejectWithValue, dispatch }) => {
    try {
      const response = await updateContractExceptionRequest(id, values);
      const updatedData = response?.data?.data || response?.data || response;
      return updatedData;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 5. Thunk لمراجعة واعتماد/رفض الاستثناء
// 5. Thunk لمراجعة واعتماد/رفض الاستثناء
export const reviewContractException = createAsyncThunk(
  "contractExceptions/reviewContractException",
  async ({ id, status, rejection_reason, review_notes }, { rejectWithValue, dispatch }) => {
    try {
      // تجهيز الـ Body حسب الحالة (rejected يتطلب rejection_reason)
      const payload = {
        status,
        ...(status === "rejected"
          ? { rejection_reason: rejection_reason || review_notes }
          : { review_notes }),
      };

      const response = await reviewContractExceptionRequest(id, payload);
      const updatedData = response?.data?.data || response?.data || response;
      return updatedData;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// 6. Thunk لحذف استثناء عقد
export const deleteContractException = createAsyncThunk(
  "contractExceptions/deleteContractException",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await deleteContractExceptionRequest(id);
      return id; // إرجاع الـ ID ليتم حذفه من الـ state
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);