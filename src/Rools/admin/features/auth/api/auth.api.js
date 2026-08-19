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
  const formData = new FormData();
  formData.append("role_id", roleId);
  return api.postForm(AUTH_ENDPOINTS.selectRole, formData);
};
