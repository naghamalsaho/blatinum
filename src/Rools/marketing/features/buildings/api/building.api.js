import { api } from "@/shared/api/crud";

export const buildingApi = {
  getBuildings: () => api.get("/building"),
  getBuildingsByProject: (projectId) => api.get(`/building/byProject/${projectId}`),
   updateBuilding: (id, payload) => api.put(`/building/${id}`, payload),
  deleteBuilding: (id) => api.delete(`/building/${id}`),
  createBuilding: (formData) => api.postForm("/building", formData),
};