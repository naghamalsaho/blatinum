import { createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "@/shared/api/http";
import {
  buildThunkHeaders,
  getThunkErrorMessage,
} from "@/shared/utils/thunkRequest";
import { showError } from "@/shared/store/error/error.slice";
import { validateContractForm } from "../validation/contract.validation";
import { contractApi } from "../api/contract.api";
const extractAttachments = (formData) => {
  const files = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("attachments[") && value instanceof File) {
      files.push(value);
    }
  }

  return files;
};

export const fetchOrders = createAsyncThunk(
  "contract/fetchOrders",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await contractApi.getOrders();

      return response.data?.data || [];
    } catch (error) {
      const normalized = getThunkErrorMessage(
        error,
        "فشل في جلب الطلبات"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);
export const createContract = createAsyncThunk(
  "contract/createContract",
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      // 1. إجراء الفاليديشن بنفس النمط
      const validationErrors = validateContractForm({
        order_id: formData.get("order_id"),
        total_price: formData.get("total_price"),
        down_payment_amount: formData.get("down_payment_amount"),
        installments_count: formData.get("installments_count"),
        attachments: extractAttachments(formData),
      });

      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        dispatch(showError(firstError));
        return rejectWithValue(firstError);
      }

      // 2. إرسال الطلب عبر http مع Multipart Headers
      const response = await http.post("/contract", formData, {
        headers: buildThunkHeaders(true),
      });

      return response.data?.data || null;
    } catch (error) {
      const normalized = getThunkErrorMessage(error, "فشل في إنشاء العقد");
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);
export const fetchContracts = createAsyncThunk(
  "contract/fetchContracts",
  async (page = 1, { rejectWithValue, dispatch }) => {
    try {
      const response = await contractApi.getContracts(page);

      return {
        items: response.data?.data || [],
        links: response.data?.links || {},
        meta: response.data?.meta || {},
      };

    } catch (error) {

      const normalized = getThunkErrorMessage(
        error,
        "فشل في جلب العقود"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);
export const fetchContractById = createAsyncThunk(
  "contract/fetchContractById",
  async (id, { rejectWithValue, dispatch }) => {
    try {

      const response = await contractApi.getContractById(id);

      return response.data?.data || null;

    } catch (error) {

      const normalized = getThunkErrorMessage(
        error,
        "فشل في جلب تفاصيل العقد"
      );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }
  }
);
export const fetchClientContracts = createAsyncThunk(
  "contract/fetchClientContracts",

  async(clientId,{rejectWithValue,dispatch})=>{

    try{

      const response =
        await contractApi.getContractByClient(clientId);

      return response.data?.data || [];

    }catch(error){

      const normalized =
        getThunkErrorMessage(
          error,
          "فشل في جلب عقود العميل"
        );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);
    }

  }
);
export const changeContractStatus = createAsyncThunk(
  "contract/changeContractStatus",

  async ({ id, status }, { rejectWithValue, dispatch }) => {

    try {

      const response =
        await contractApi.changeContractStatus(
          id,
          status
        );

      return response.data?.data || {
        id,
        status,
      };

    } catch (error) {

      const normalized =
        getThunkErrorMessage(
          error,
          "فشل في تعديل حالة العقد"
        );

      dispatch(showError(normalized.message));

      return rejectWithValue(normalized.message);

    }

  }
);