import { api } from "@/shared/api/crud";

const ROLE_ENDPOINT = "/role";
const PERMISSION_ENDPOINT = "/permission";

const toFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item);
      });
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return formData;
};

export const getRolesRequest = () => api.get(ROLE_ENDPOINT);

export const createRoleRequest = (payload) => {
  return api.postForm(ROLE_ENDPOINT, toFormData(payload));
};

export const updateRoleRequest = (roleId, payload) => {
  return api.putForm(`${ROLE_ENDPOINT}/${roleId}`, toFormData(payload));
};

export const deleteRoleRequest = (roleId) => api.delete(`${ROLE_ENDPOINT}/${roleId}`);

export const getPermissionsRequest = () => api.get(PERMISSION_ENDPOINT);

export const updateRolePermissionsRequest = (roleId, permissionIds = []) => {
  const payload = toFormData({ permissions: permissionIds });

  return api.postForm(`${ROLE_ENDPOINT}/selectPermission/${roleId}`, payload);
};

export const assignRolesToUserRequest = (userId, roleIds = []) => {
  return api.post(`${ROLE_ENDPOINT}/assignRoles/${userId}`, {
    roles: roleIds.map((roleId) => Number(roleId)),
  });
};
