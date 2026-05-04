import { api } from "../../../../../shared/api/crud";

export const AUTH_ENDPOINTS = {
  login: "/login",
};

export const loginRequest = (payload) => {
  return api.post(AUTH_ENDPOINTS.login, payload);
};