import { api } from "@/shared/api/crud";

export const getAllOffersRequest = async () => {
  return await api.get("/offer");
};
// 1. حذف عرض
export const deleteOfferRequest = async (id) => {
  return await api.delete(`/offer/${id}`);
};

// 2. تغيير حالة العرض (إرسال status: 0 أو 1 بالـ body)
export const changeOfferStatusRequest = async ({ id, status }) => {
  return await api.put(`/offer/changeStatus/${id}`, { status });
};
export const createOfferRequest = async (payload) => {
  return await api.post("/offer", payload);
};
export const getActiveOffersRequest = async () => {
  return await api.get("/offer/active/read");
};