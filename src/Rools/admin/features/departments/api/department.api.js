import { api } from "@/shared/api/crud";

const DEPARTMENT_ENDPOINT = "/department";

export const getDepartmentsRequest = () => {
  return api.get(DEPARTMENT_ENDPOINT);
};

const buildDepartmentFormData = (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);

  if (payload.description) {
    formData.append("description", payload.description);
  }

  return formData;
};

export const createDepartmentRequest = (payload) => {
  return api.upload(DEPARTMENT_ENDPOINT, buildDepartmentFormData(payload));
};
