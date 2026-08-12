import { api } from "@/shared/api/crud";

// 1. جلب جميع التحويلات / سندات القبض
export const getAllTransfersRequest = async () => {
  return await api.get("/sales/transactions?type=receipt");
};

// 2. جلب معاملة مالية واحدة بالـ ID
export const getTransferByIdRequest = async (id) => {
  return await api.get(`/sales/transactions/${id}`);
};

// 3. جلب ملخص الأحجام المالية (Summary)
export const getTransferSummaryRequest = async () => {
  return await api.get("/sales/transactions/summary");
};

// 4. إلغاء معاملة مالية مع سبب الإلغاء (Cancel)
export const cancelTransferRequest = async (id, reason) => {
  return await api.postForm(`/sales/transactions/${id}/cancel`, { reason });
};

// 5. إنشاء تحويل مالي جديد
export const createTransferRequest = async (formData) => {
  return await api.postForm("/sales/transactions", formData);
};

// 6. تعديل تحويل مالي
export const updateTransferRequest = async (id, formData) => {
  return await api.putForm(`/sales/transactions/${id}`, formData);
};

// 7. حذف تحويل مالي
export const deleteTransferRequest = async (id) => {
  return await api.delete(`/sales/transactions/${id}`);
};