import { http } from "@/shared/api/http";

export const serviceApi = {
  getServices: () => http.get("/solution"),
  createService: (formData) => http.post("/solution", formData),
  updateService: (id, payload) => http.put(`/solution/${id}`, payload),
  deleteService: (id) => http.delete(`/solution/${id}`),
};