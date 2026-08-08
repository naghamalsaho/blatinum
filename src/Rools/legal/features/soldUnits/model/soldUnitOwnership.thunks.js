import { createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "@/shared/api/http";
import {
  buildThunkHeaders,
  getThunkErrorMessage,
} from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";
import { validateSoldUnitOwnershipForm } from "../validation/soldUnitOwnership.validation";

const extractAttachments = (formData) => {
  const files = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("attachments[") && value instanceof File) {
      files.push(value);
    }
  }

  return files;
};

export const fetchSoldUnitOwnership = createAsyncThunk(
  "soldUnitOwnership/fetchSoldUnitOwnership",
  async (page = 1, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.get("/unit/sold/unitOwnership", {
        params: { page },
        headers: buildThunkHeaders(false),
      });

      return {
        items: response.data?.data || [],
        links: response.data?.links || {},
        meta: response.data?.meta || {},
      };
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في جلب المبيعات");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const fetchClientUnits = createAsyncThunk(
  "soldUnitOwnership/fetchClientUnits",
  async (clientId, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.get(`/unit/sold/clientUnits/${clientId}`, {
        headers: buildThunkHeaders(false),
      });

      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في جلب وحدات العميل"
      );
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const createSoldUnitOwnership = createAsyncThunk(
  "soldUnitOwnership/createSoldUnitOwnership",
  async ({ id, formData }, { rejectWithValue, dispatch }) => {
    try {
      const validationErrors = validateSoldUnitOwnershipForm({
        client_id: formData.get("client_id"),
        purchase_price: formData.get("purchase_price"),
        status: formData.get("status"),
        owned_at: formData.get("owned_at"),
        attachments: extractAttachments(formData),
      });

      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        dispatch(showError(firstError));
        return rejectWithValue(firstError);
      }

      const response = await http.post(`/unit/sale/${id}`, formData, {
        headers: buildThunkHeaders(true),
      });

      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في إضافة المبيع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const updateSoldUnitOwnership = createAsyncThunk(
  "soldUnitOwnership/updateSoldUnitOwnership",
  async ({ id, formData }, { rejectWithValue, dispatch }) => {
    try {
      const validationErrors = validateSoldUnitOwnershipForm({
        client_id: formData.get("client_id"),
        purchase_price: formData.get("purchase_price"),
        status: formData.get("status"),
        owned_at: formData.get("owned_at"),
        attachments: extractAttachments(formData),
      });

      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        dispatch(showError(firstError));
        return rejectWithValue(firstError);
      }

      const response = await http.put(`/unit/sold/update/${id}`, formData, {
        headers: buildThunkHeaders(true),
      });

      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في تعديل المبيع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

export const deleteSoldUnitOwnership = createAsyncThunk(
  "soldUnitOwnership/deleteSoldUnitOwnership",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await http.delete(`/unit/sold/retrieve/${id}`, {
        headers: buildThunkHeaders(false),
      });

      if (!response) {
        return rejectWithValue("فشل في حذف المبيع");
      }

      return id;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في حذف المبيع");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);