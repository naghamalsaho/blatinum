import { api } from "@/shared/api/crud";

export const locationApi = {
  getLocations: () => api.get("/location"),
   createLocation: (payload) => api.post("/location", payload),
   updateLocation: (id, payload) => api.put(`/location/${id}`, payload),
   deleteLocation: (id) => api.delete(`/location/${id}`),
};