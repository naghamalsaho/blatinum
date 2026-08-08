import { api } from "@/shared/api/crud";

const EMPLOYEE_ENDPOINT = "/employee";
const EMPLOYEE_DEPARTMENT_ENDPOINT = "/employeeDepartment";

const appendIfPresent = (formData, key, value) => {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    formData.append(key, value);
  }
};

const buildEmployeeFormData = (payload = {}) => {
  const formData = new FormData();

  appendIfPresent(formData, "first_name", payload.first_name);
  appendIfPresent(formData, "last_name", payload.last_name);
  appendIfPresent(formData, "email", payload.email);
  appendIfPresent(formData, "phone", payload.phone);
  appendIfPresent(formData, "address", payload.address);
  appendIfPresent(formData, "gender", payload.gender);
  appendIfPresent(formData, "password", payload.password);
  appendIfPresent(formData, "password_confirmation", payload.password_confirmation);
  if (payload.department_id) {
    appendIfPresent(formData, "department_id", payload.department_id);
    appendIfPresent(formData, "position", payload.position);
    appendIfPresent(formData, "from_date", payload.from_date);
  }
  appendIfPresent(formData, "role_id", payload.role_id);

  return formData;
};

export const getEmployeesRequest = () => {
  return api.get(EMPLOYEE_ENDPOINT);
};

export const createEmployeeRequest = (payload) => {
  return api.upload(EMPLOYEE_ENDPOINT, buildEmployeeFormData(payload));
};

export const updateEmployeeRequest = (employeeId, payload) => {
  return api.putForm(`${EMPLOYEE_ENDPOINT}/${employeeId}`, buildEmployeeFormData(payload));
};

export const deleteEmployeeRequest = (employeeId) => {
  return api.delete(`${EMPLOYEE_ENDPOINT}/${employeeId}`);
};

export const getEmployeeDepartmentsRequest = () => {
  return api.get(EMPLOYEE_DEPARTMENT_ENDPOINT);
};
