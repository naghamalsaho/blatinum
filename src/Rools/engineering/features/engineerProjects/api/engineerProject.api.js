import { api } from "@/shared/api/crud";

export const getAllProjectEngineersRequest = async () => {
  return await api.get("/project-engineer");
};

export const getProjectsForEngineerRequest = async (engineerId) => {
  return await api.get(`/project-engineer/engProjects/${engineerId}`);
};

export const assignEngineerProjectRequest = async (payload) => {
  return await api.post("/project-engineer/assign", payload);
};