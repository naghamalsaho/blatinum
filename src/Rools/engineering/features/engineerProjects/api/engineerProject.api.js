import { api } from "@/shared/api/crud";

export const getAllProjectEngineersRequest = async () => {
  return await api.get("/project-engineer");
};

export const getEngineersAllocatedToProjectRequest = async (projectId) => {
  return await api.get(`/project-engineer/engineersAllocatedToProject/${projectId}`);
};

export const getAllocatedLocationsForEngineerRequest = async (engineerId) => {
  return await api.get(`/project-engineer/allocatedLocations/${engineerId}`);
};

export const assignEngineerProjectRequest = async (payload) => {
  return await api.post("/project-engineer/allocate", payload);
};
export const getEngineersAllocatedToBuildingRequest = async (buildingId) => {
  return await api.get(
    `/project-engineer/engineersAllocatedToBuilding/${buildingId}`
  );
};
export const getAllProjectsRequest = async () => {
  return await api.get("/project");
};

export const getAllBuildingsRequest = async () => {
  return await api.get("/building");
};
export const getAllEngineersRequest = async () => {
  return await api.get("/engineer");
};