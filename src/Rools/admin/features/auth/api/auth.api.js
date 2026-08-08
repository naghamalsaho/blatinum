import { api } from "../../../../../shared/api/crud";

export const AUTH_ENDPOINTS = {
  login: "/login",
  logout: "/logout",
  selectRole: "/select-role",
};

export const loginRequest = (payload) => {
  return api.post(AUTH_ENDPOINTS.login, payload);
};

export const logoutRequest = () => {
  return api.post(AUTH_ENDPOINTS.logout);
};

export const selectRoleRequest = (roleId) => {
  return api.post(AUTH_ENDPOINTS.selectRole, { role_id: roleId });
};
