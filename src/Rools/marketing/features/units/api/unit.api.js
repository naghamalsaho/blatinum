import { api } from "@/shared/api/crud";

export const unitApi = {
  getUnits: () => api.get("/unit"),
  
  getUnitsByBuilding: (buildingId) =>
    api.get(`/unit/byBuilding/${buildingId}`),

  createUnit: (payload) =>
    payload instanceof FormData
      ? api.postForm("/unit", payload)
      : api.post("/unit", payload),

  updateUnit: (id, payload) =>
    payload instanceof FormData
      ? api.postForm(`/unit/${id}`, payload)
      : api.put(`/unit/${id}`, payload),

  deleteUnit: (id) => api.delete(`/unit/${id}`),
};