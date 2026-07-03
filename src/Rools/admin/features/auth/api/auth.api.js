import { api } from "../../../../../shared/api/crud";

export const AUTH_ENDPOINTS = {
  login: "/login",
  logout: "/logout",
};

export const loginRequest = (payload) => {
  return api.post(AUTH_ENDPOINTS.login, payload);
};

export const logoutRequest = () => {
  return api.post(AUTH_ENDPOINTS.logout);
};
