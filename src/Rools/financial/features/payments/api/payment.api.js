import { api } from "@/shared/api/crud";

// جلب جميع المدفوعات
export const getAllPaymentsRequest = async () => {
  return await api.get("/payment");
};

// 🆕 جلب تتبع كافة دفعات وأقساط عقد معين
export const getPaymentsByContractRequest = async (contractId) => {
  return await api.get(`/payment/showByContract/${contractId}`);
};

// تعديل دفعة باستعمال putForm المخصص لـ FormData
export const updatePaymentRequest = async (id, formData) => {
  return await api.putForm(`/payment/${id}`, formData);
};

// حذف دفعة
export const deletePaymentRequest = async (id) => {
  return await api.delete(`/payment/${id}`);
};

// إنشاء دفعة
export const createPaymentRequest = async (formData) => {
  return await api.postForm("/payment", formData);
};

// 🆕 دالة تسديد دفعة مخصصة/تلقائية لأشهر قادمة للعقد
export const payCustomByContractRequest = async (contractId, formData) => {
  return await api.postForm(`/payment/byContract/${contractId}/custom`, formData);
};