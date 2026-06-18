import { api } from "@/shared/api/crud";

export const soldUnitOwnershipApi = {
  getSoldUnitOwnership: (page = 1) =>
    api.get("/unit/sold/unitOwnership", { page }),

  getClientUnits: (clientId) =>
    api.get(`/unit/sold/clientUnits/${clientId}`),
  
  createSoldUnitOwnership: (id, formData) =>
    api.postForm(`/unit/sale/${id}`, formData),

  updateSoldUnitOwnership: (id, formData) =>
  api.putForm(`/unit/sold/update/${id}`, formData),

  deleteSoldUnitOwnership: (id) =>
    api.delete(`/unit/sold/retrieve/${id}`),
};