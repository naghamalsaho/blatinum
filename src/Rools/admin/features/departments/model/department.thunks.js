import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createDepartmentRequest,
  createEmployeeDepartmentRequest,
  deleteDepartmentRequest,
  deleteEmployeeDepartmentRequest,
  getEmployeeDepartmentsRequest,
  getEmployeesByDepartmentRequest,
  getDepartmentsRequest,
  updateDepartmentRequest,
  updateEmployeeDepartmentRequest,
} from "../api/department.api";

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");

  if (typeof message === "object") {
    return Object.entries(message)
      .map(([key, value]) => {
        const text = Array.isArray(value)
          ? value.join(" ")
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : value;

        return `${key}: ${text}`;
      })
      .join(" ");
  }

  return String(message);
};

const getAssignmentEmployeeId = (assignment) => {
  const account = assignment?.employee?.account || {};
  return assignment?.employee?.additional_info?.employee_id || account.id || "";
};

const getAssignmentDepartmentId = (assignment, fallbackDepartmentId = "") => {
  return assignment?.department?.id || fallbackDepartmentId || "";
};

const getAssignmentMergeKey = (assignment, fallbackDepartmentId = "") => {
  return [
    getAssignmentDepartmentId(assignment, fallbackDepartmentId),
    getAssignmentEmployeeId(assignment),
    assignment?.position || "",
    assignment?.from_date || "",
    assignment?.to_date || "",
  ]
    .map((part) => String(part ?? "").trim().toLowerCase())
    .join("|");
};

const mergeEmployeeDepartmentIds = (departments, employeeDepartments) => {
  if (!employeeDepartments.length) return departments;

  const assignmentsByKey = new Map();

  employeeDepartments.forEach((assignment) => {
    const key = getAssignmentMergeKey(assignment);

    if (key && assignment?.id) {
      assignmentsByKey.set(key, assignment);
    }
  });

  return departments.map((department) => ({
    ...department,
    employees: (department.employees || []).map((assignment) => {
      const matchedAssignment = assignmentsByKey.get(
        getAssignmentMergeKey(assignment, department.id)
      );

      return matchedAssignment?.id
        ? {
            ...assignment,
            id: matchedAssignment.id,
            department: matchedAssignment.department || assignment.department,
          }
        : assignment;
    }),
  }));
};

const extractList = (payload) => {
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(payload)) return payload;

  return [];
};

const extractDepartmentsFromAssignments = (assignments = []) => {
  const departments = new Map();

  assignments.forEach((assignment) => {
    const department = assignment?.department;
    const id = department?.id || assignment?.department_id;

    if (!id || departments.has(String(id))) return;

    departments.set(String(id), {
      id,
      name: department?.name || `Department #${id}`,
      description: department?.description || "Department from employee assignments",
      employees: [],
    });
  });

  return Array.from(departments.values());
};

export const fetchDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (_, thunkAPI) => {
    const result = await getDepartmentsRequest();

    if (result.ok) {
      const departments = extractList(result.data);
      const employeeDepartmentsResult = await getEmployeeDepartmentsRequest();

      if (employeeDepartmentsResult.ok) {
        return mergeEmployeeDepartmentIds(
          departments,
          extractList(employeeDepartmentsResult.data)
        );
      }

      return departments;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    const employeeDepartmentsResult = await getEmployeeDepartmentsRequest();
    if (employeeDepartmentsResult.ok) {
      const fallbackDepartments = extractDepartmentsFromAssignments(
        extractList(employeeDepartmentsResult.data)
      );

      if (fallbackDepartments.length > 0) {
        return fallbackDepartments;
      }
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const createDepartment = createAsyncThunk(
  "departments/create",
  async (payload, thunkAPI) => {
    const result = await createDepartmentRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const updateDepartment = createAsyncThunk(
  "departments/update",
  async ({ id, payload }, thunkAPI) => {
    const result = await updateDepartmentRequest(id, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const deleteDepartment = createAsyncThunk(
  "departments/delete",
  async (id, thunkAPI) => {
    const result = await deleteDepartmentRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const updateEmployeeDepartment = createAsyncThunk(
  "departments/updateEmployeeDepartment",
  async ({ id, payload }, thunkAPI) => {
    const result = await updateEmployeeDepartmentRequest(id, payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const createEmployeeDepartment = createAsyncThunk(
  "departments/createEmployeeDepartment",
  async (payload, thunkAPI) => {
    const result = await createEmployeeDepartmentRequest(payload);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return result.data?.data ?? true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const fetchEmployeesByDepartment = createAsyncThunk(
  "departments/fetchEmployeesByDepartment",
  async (departmentId, thunkAPI) => {
    const result = await getEmployeesByDepartmentRequest(departmentId);

    if (result.ok) {
      return result.data?.data ?? [];
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);

export const deleteEmployeeDepartment = createAsyncThunk(
  "departments/deleteEmployeeDepartment",
  async (id, thunkAPI) => {
    const result = await deleteEmployeeDepartmentRequest(id);

    if (result.ok) {
      await thunkAPI.dispatch(fetchDepartments());
      return true;
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message));
  }
);
