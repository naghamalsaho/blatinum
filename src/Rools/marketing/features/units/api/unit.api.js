import { api } from "@/shared/api/crud";

export const unitApi = {
  getUnits: () => api.get("/unit"),
  getUnitsByBuilding: (buildingId) =>
    api.get(`/unit/byBuilding/${buildingId}`),
  updateUnit: (id, payload) => api.put(`/unit/${id}`, payload),
  deleteUnit: (id) => api.delete(`/unit/${id}`),
  createUnit: (payload) => api.post("/unit", payload),
};