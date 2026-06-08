import { api } from "@/shared/api/crud";

export const projectApi = {
  getProjects: () => api.get("/project"),
   createProject: (formData) => api.postForm("/project", formData),
    updateProject: (id, payload) => api.put(`/project/${id}`, payload),
  deleteProject: (id) => api.delete(`/project/${id}`),
   
};