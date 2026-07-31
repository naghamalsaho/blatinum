import { api } from "@/shared/api/crud";

export const advertisementApi = {
  getAdvertisements: () => api.get("/advertisment"),
  getActiveAdvertisements: () => api.get("/advertisment/activeAdvertisements"),
  createAdvertisement: (formData) => api.postForm("/advertisment", formData),
  deleteAdvertisement: (id) => api.delete(`/unit/${id}`),
  
};