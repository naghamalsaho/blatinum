import { api } from "@/shared/api/crud";

export const getReportsRequest = (page = 1) => {
  return api.get(`/construction-report?page=${page}`);
};

export const createReportRequest = (payload) => {
  return api.post("/construction-report", payload);
};

export const deleteReportRequest = (id) => {
  return api.delete(`/construction-report/${id}`);
};