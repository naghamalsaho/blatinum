import { api } from "@/shared/api/crud";

const FAQ_ENDPOINT = "/faqs";

const toFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return formData;
};

export const getFaqTreeRequest = () => api.get(`${FAQ_ENDPOINT}/admin/tree`);
export const createFaqRequest = (payload) => api.postForm(FAQ_ENDPOINT, toFormData(payload));
export const updateFaqRequest = (id, payload) => api.putForm(`${FAQ_ENDPOINT}/${id}`, toFormData(payload));
export const deleteFaqRequest = (id) => api.delete(`${FAQ_ENDPOINT}/${id}`);
