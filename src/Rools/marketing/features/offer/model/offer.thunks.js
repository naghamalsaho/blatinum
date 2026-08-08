import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllOffersRequest ,
    deleteOfferRequest,
  changeOfferStatusRequest,
  createOfferRequest,
  getActiveOffersRequest
} from "../api/offer.api";
import { showError } from "@/shared/store/error/error.slice";
import { handleApiError } from "@/shared/utils/errorHandler";

export const fetchOffers = createAsyncThunk(
  "offers/fetchOffers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // 👈 الاستدقاء الصحيح للدالة مباشرة
      const response = await getAllOffersRequest();

      // فحص مرن يضمن استخراج المصفوفة
      const rawData = response.data?.data || response.data || response;
      const offersList = Array.isArray(rawData) ? rawData : [];

      return offersList;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);
export const deleteOffer = createAsyncThunk(
  "offers/deleteOffer",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await deleteOfferRequest(id);
      return id; // إرجاع المعرف لحذفه من الـ Store
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);

// Thunk لتعديل حالة العرض
export const changeOfferStatus = createAsyncThunk(
  "offers/changeOfferStatus",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      const response = await changeOfferStatusRequest({ id, status });
      const updatedOffer = response.data?.data || response.data;
      return updatedOffer; // إرجاع العرض التكيفي المعدل
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);
export const createOffer = createAsyncThunk(
  "offers/createOffer",
  async (offerData, { rejectWithValue, dispatch }) => {
    try {
      const response = await createOfferRequest(offerData);
      const newOffer = response.data?.data || response.data;
      return newOffer;
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);
export const fetchActiveOffers = createAsyncThunk(
  "offers/fetchActiveOffers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await getActiveOffersRequest();
      const rawData = response.data?.data || response.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error) {
      const normalized = handleApiError(error);
      dispatch(showError(normalized.message));
      return rejectWithValue(normalized.message);
    }
  }
);