import { api } from "@/shared/api/crud";

// جلب جميع استثناءات العقود (مع دعم Pagination)
export const getAllContractExceptionsRequest = async (page = 1) => {
  return await api.get(`/contract-exceptions?page=${page}`);
};

// جلب تفاصيل استثناء عقد محدد بواسطة ID
export const getContractExceptionByIdRequest = async (id) => {
  return await api.get(`/contract-exceptions/${id}`);
};

// إنشاء طلب استثناء عقد جديد
export const createContractExceptionRequest = async (data) => {
  return await api.post("/contract-exceptions", data);
};

// تعديل استثناء عقد
export const updateContractExceptionRequest = async (id, data) => {
  return await api.put(`/contract-exceptions/${id}`, data);
};

// مراجعة/اعتماد/رفض الاستثناء (POST حسب الـ Postman)
export const reviewContractExceptionRequest = async (id, data) => {
  return await api.post(`/contract-exceptions/${id}/review`, data);
};

// حذف استثناء عقد
export const deleteContractExceptionRequest = async (id) => {
  return await api.delete(`/contract-exceptions/${id}`);
};