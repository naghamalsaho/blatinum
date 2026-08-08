import { api } from "@/shared/api/crud";

// جلب جميع المدفوعات
export const getAllPaymentsRequest = async () => {
  return await api.get("/payment");
};

// تعديل دفعة باستعمال putForm المخصص لـ FormData
export const updatePaymentRequest = async (id, formData) => {
  return await api.putForm(`/payment/${id}`, formData);
};

// حذف دفعة
export const deletePaymentRequest = async (id) => {
  return await api.delete(`/payment/${id}`);
};
export const createPaymentRequest = async (formData) => {
  return await api.postForm("/payment", formData);
};