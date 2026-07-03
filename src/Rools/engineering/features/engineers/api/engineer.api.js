import { api } from "@/shared/api/crud";

export const getEngineersRequest = () => {
  return api.get("/engineer");
};

export const createEngineerRequest = (payload) => {
  return api.post("/engineer", payload);
};

export const deleteEngineerRequest = (id) => {
  return api.delete(`/engineer/${id}`);
};
export const getAllocatedLocationsRequest = (engineerId) => {
  return api.get(`/project-engineer/allocatedLocations/${engineerId}`);
};