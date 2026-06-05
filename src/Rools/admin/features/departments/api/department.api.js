import { api } from "@/shared/api/crud";

const DEPARTMENT_ENDPOINT = "/department";
const EMPLOYEE_DEPARTMENT_ENDPOINT = "/employeeDepartment";

export const getDepartmentsRequest = () => {
  return api.get(DEPARTMENT_ENDPOINT);
};

export const getEmployeeDepartmentsRequest = () => {
  return api.get(EMPLOYEE_DEPARTMENT_ENDPOINT);
};

const buildDepartmentFormData = (payload) => {
  const formData = new FormData();

  formData.append("name", String(payload.name || "").trim());

  if (payload.description) {
    formData.append("description", String(payload.description).trim());
  }

  return formData;
};

const appendIfPresent = (formData, key, value) => {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    formData.append(key, String(value).trim());
  }
};

const buildEmployeeDepartmentFormData = (payload) => {
  const formData = new FormData();

  appendIfPresent(formData, "employee_id", payload.employee_id);
  appendIfPresent(formData, "department_id", payload.department_id);
  appendIfPresent(formData, "from_date", payload.from_date);
  appendIfPresent(formData, "to_date", payload.to_date);
  appendIfPresent(formData, "position", payload.position);
  appendIfPresent(formData, "role_id", payload.role_id);

  return formData;
};

export const createDepartmentRequest = (payload) => {
  return api.upload(DEPARTMENT_ENDPOINT, buildDepartmentFormData(payload));
};

export const updateDepartmentRequest = (id, payload) => {
  return api.putForm(`${DEPARTMENT_ENDPOINT}/${id}`, buildDepartmentFormData(payload));
};

export const deleteDepartmentRequest = (id) => {
  return api.delete(`${DEPARTMENT_ENDPOINT}/${id}`);
};

export const getEmployeesByDepartmentRequest = (departmentId) => {
  return api.get(`${EMPLOYEE_DEPARTMENT_ENDPOINT}/empByDepartment/${departmentId}`);
};

export const createEmployeeDepartmentRequest = (payload) => {
  return api.upload(
    `${EMPLOYEE_DEPARTMENT_ENDPOINT}/assign`,
    buildEmployeeDepartmentFormData(payload)
  );
};

export const updateEmployeeDepartmentRequest = (id, payload) => {
  return api.putForm(
    `${EMPLOYEE_DEPARTMENT_ENDPOINT}/${id}`,
    buildEmployeeDepartmentFormData(payload)
  );
};

export const deleteEmployeeDepartmentRequest = (id) => {
  return api.delete(`${EMPLOYEE_DEPARTMENT_ENDPOINT}/${id}`);
};
