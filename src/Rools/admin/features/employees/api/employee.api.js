import { api } from "@/shared/api/crud";

const EMPLOYEE_DEPARTMENT_ENDPOINT = "/employeeDepartment";

export const getEmployeeDepartmentsRequest = () => {
  return api.get(EMPLOYEE_DEPARTMENT_ENDPOINT);
};
