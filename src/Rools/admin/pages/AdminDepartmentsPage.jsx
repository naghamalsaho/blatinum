import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BriefcaseBusiness,
  Eye,
  FileText,
  PencilLine,
  Plus,
  Trash2,
  UserPlus,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Field from "@/shared/components/Field";
import Modal from "@/shared/components/Modal";
import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import {
  createDepartment,
  createEmployeeDepartment,
  deleteDepartment,
  deleteEmployeeDepartment,
  fetchEmployeesByDepartment,
  fetchDepartments,
  updateDepartment,
  updateEmployeeDepartment,
} from "../features/departments/model/department.thunks";
import { getEmployeeDepartmentsRequest } from "../features/departments/api/department.api";

import "../features/departments/styles/departments.css";

const FILTER_OPTIONS = [
  {
    value: "all",
    label: "All",
    dotClass: "",
  },
  {
    value: "staffed",
    label: "Staffed",
    dotClass: "ok",
  },
  {
    value: "empty",
    label: "Empty",
    dotClass: "off",
  },
];

const POSITION_OPTIONS = ["staff", "supervisor", "manager"];
const ROLE_ID_BY_POSITION = {
  manager: "1",
  supervisor: "2",
  staff: "3",
};

const getEmployeeCount = (department) => department.employees?.length || 0;

const getRoleIdForPosition = (position) => ROLE_ID_BY_POSITION[position] || "";

const getAssignmentEmployeeId = (assignment) => {
  const account = assignment?.employee?.account || {};
  return assignment?.employee?.additional_info?.employee_id || account.id || "";
};

const normalizeAssignmentValue = (value) => String(value ?? "").trim().toLowerCase();

const getAssignmentDepartmentId = (assignment, fallbackDepartment) => {
  return assignment?.department?.id || fallbackDepartment?.id || fallbackDepartment || "";
};

const isMatchingEmployeeDepartment = (candidate, assignment, department) => {
  const sameDepartment =
    normalizeAssignmentValue(getAssignmentDepartmentId(candidate)) ===
    normalizeAssignmentValue(getAssignmentDepartmentId(assignment, department));
  const sameEmployee =
    normalizeAssignmentValue(getAssignmentEmployeeId(candidate)) ===
    normalizeAssignmentValue(getAssignmentEmployeeId(assignment));
  const samePosition =
    !candidate?.position ||
    !assignment?.position ||
    normalizeAssignmentValue(candidate.position) === normalizeAssignmentValue(assignment.position);
  const sameFromDate =
    !candidate?.from_date ||
    !assignment?.from_date ||
    normalizeAssignmentValue(candidate.from_date) === normalizeAssignmentValue(assignment.from_date);
  const sameToDate =
    normalizeAssignmentValue(candidate?.to_date) === normalizeAssignmentValue(assignment?.to_date);

  return sameDepartment && sameEmployee && samePosition && sameFromDate && sameToDate;
};

const getAssignmentRelationId = (assignment) => {
  return (
    assignment?.id ||
    assignment?.employee_department_id ||
    assignment?.department_employee_id ||
    assignment?.assignment_id ||
    assignment?.pivot?.id ||
    assignment?.employeeDepartment?.id ||
    assignment?.employee_department?.id ||
    ""
  );
};

const getStrictAssignmentRelationId = (assignment) => {
  return (
    assignment?.id ||
    assignment?.employee_department_id ||
    assignment?.department_employee_id ||
    assignment?.assignment_id ||
    assignment?.pivot?.id ||
    assignment?.employeeDepartment?.id ||
    assignment?.employee_department?.id ||
    ""
  );
};

const formatRoleName = (role) => {
  return String(role || "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
};

const validateAssignmentForm = (values, { requireRoleId = false } = {}) => {
  const errors = {};

  if (!values.employee_id) {
    errors.employee_id = "Employee is required.";
  }

  if (!POSITION_OPTIONS.includes(values.position)) {
    errors.position = "Position is required.";
  }

  if (!values.from_date) {
    errors.from_date = "From date is required.";
  }

  if (values.from_date && values.to_date && values.to_date < values.from_date) {
    errors.to_date = "To date must be after from date.";
  }

  if (requireRoleId) {
    const roleId = String(values.role_id || "").trim();

    if (!roleId) {
      errors.role_id = "Role ID is required.";
    } else if (!/^\d+$/.test(roleId) || Number(roleId) <= 0) {
      errors.role_id = "Role ID must be a positive number.";
    }
  }

  return errors;
};

const isSameAssignment = (left, right) => {
  if (!left || !right) return false;

  const leftRelationId = getStrictAssignmentRelationId(left);
  const rightRelationId = getStrictAssignmentRelationId(right);
  const leftEmployeeId = getAssignmentEmployeeId(left);
  const rightEmployeeId = getAssignmentEmployeeId(right);

  return (
    (leftRelationId && rightRelationId && String(leftRelationId) === String(rightRelationId)) ||
    (leftEmployeeId && rightEmployeeId && String(leftEmployeeId) === String(rightEmployeeId))
  );
};

const getAssignmentCacheKey = (department, assignment) => {
  const departmentId = department?.id || assignment?.department?.id || "department";
  const relationId = getStrictAssignmentRelationId(assignment);
  const employeeId = getAssignmentEmployeeId(assignment);

  return `${departmentId}:${relationId || employeeId || "assignment"}`;
};

const getLeadName = (department) => {
  const lead =
    department.employees?.find((item) => item.position === "manager") ||
    department.employees?.find((item) => item.position === "supervisor") ||
    department.employees?.[0];

  return lead?.employee?.account?.full_name || "-";
};

export default function AdminDepartmentsPage() {
  const dispatch = useDispatch();
  const {
    items: departments = [],
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.departments || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [employeeDetailsOpen, setEmployeeDetailsOpen] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignmentEditOpen, setAssignmentEditOpen] = useState(false);
  const [assignmentDeleteOpen, setAssignmentDeleteOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [employeeDetailsLoading, setEmployeeDetailsLoading] = useState(false);
  const [employeeDetailsError, setEmployeeDetailsError] = useState("");
  const [recentAssignmentByKey, setRecentAssignmentByKey] = useState({});
  const [formError, setFormError] = useState("");
  const [assignmentFormErrors, setAssignmentFormErrors] = useState({});
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [assignmentFormData, setAssignmentFormData] = useState({
    employee_id: "",
    position: "staff",
    from_date: "",
    to_date: "",
    role_id: getRoleIdForPosition("staff"),
  });

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const filteredDepartments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return departments.filter((department) => {
      const employeeCount = getEmployeeCount(department);
      const searchableText = [
        department.id,
        department.name,
        department.description,
        department.created_at,
        getLeadName(department),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesFilter =
        staffFilter === "all" ||
        (staffFilter === "staffed" && employeeCount > 0) ||
        (staffFilter === "empty" && employeeCount === 0);

      return matchesSearch && matchesFilter;
    });
  }, [departments, searchTerm, staffFilter]);

  const total = departments.length;
  const staffed = departments.filter((department) => getEmployeeCount(department) > 0).length;
  const empty = total - staffed;
  const employees = departments.reduce(
    (sum, department) => sum + getEmployeeCount(department),
    0
  );
  const employeeOptions = useMemo(() => {
    const employeesById = new Map();

    departments.forEach((department) => {
      (department.employees || []).forEach((item) => {
        const account = item.employee?.account || {};
        const employeeId = item.employee?.additional_info?.employee_id || account.id;

        if (employeeId) {
          employeesById.set(String(employeeId), {
            id: employeeId,
            name: account.full_name || `Employee #${employeeId}`,
            email: account.email || "",
          });
        }
      });
    });

    return Array.from(employeesById.values());
  }, [departments]);

  const visibleDepartment = useMemo(() => {
    if (!activeDepartment?.id) return activeDepartment;

    return (
      departments.find((department) => department.id === activeDepartment.id) ||
      activeDepartment
    );
  }, [departments, activeDepartment]);

  const handleCreatePreviewChange = (event) => {
    const { name, value } = event.target;

    setFormError("");
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormError("");
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssignmentChange = (event) => {
    const { name, value } = event.target;
    const nextRoleId = name === "position" ? getRoleIdForPosition(value) : undefined;

    setFormError("");
    setAssignmentFormErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "position" ? { role_id: "" } : {}),
    }));
    setAssignmentFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "position" ? { role_id: nextRoleId } : {}),
    }));
  };

  const openEmployeesModal = (department) => {
    setActiveDepartment(department);
    setEmployeesOpen(true);
  };

  const closeEmployeesModal = () => {
    setEmployeesOpen(false);
    setActiveDepartment(null);
  };

  const openEmployeeDetailsModal = async (department, assignment) => {
    const cacheKey = getAssignmentCacheKey(department, assignment);
    const cachedAssignment = recentAssignmentByKey[cacheKey];

    setActiveDepartment(department);
    setEmployeeDetails(cachedAssignment || assignment);
    setEmployeeDetailsError("");
    setEmployeeDetailsOpen(true);
    setEmployeeDetailsLoading(true);

    const result = await dispatch(fetchEmployeesByDepartment(department.id));

    if (fetchEmployeesByDepartment.fulfilled.match(result)) {
      const freshAssignment =
        cachedAssignment ||
        result.payload.find((item) => isSameAssignment(item, assignment)) ||
        assignment;

      setEmployeeDetails(freshAssignment);
    } else {
      setEmployeeDetailsError(result.payload || "Failed to load employee details.");
    }

    setEmployeeDetailsLoading(false);
  };

  const closeEmployeeDetailsModal = () => {
    setEmployeeDetailsOpen(false);
    setEmployeeDetails(null);
    setEmployeeDetailsError("");
    setEmployeeDetailsLoading(false);
    setEmployeesOpen(Boolean(activeDepartment));
  };

  const openEditModal = (department) => {
    setActiveDepartment(department);
    setFormData({
      name: department.name || "",
      description: department.description || "",
    });
    setFormError("");
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setActiveDepartment(null);
    setFormData({
      name: "",
      description: "",
    });
    setFormError("");
  };

  const openDeleteModal = (department) => {
    setActiveDepartment(department);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setActiveDepartment(null);
  };

  const openAssignModal = (department) => {
    setActiveDepartment(department);
    setEmployeesOpen(false);
    setFormError("");
    setAssignmentFormErrors({});
    setAssignmentFormData({
      employee_id: "",
      position: "staff",
      from_date: "",
      to_date: "",
      role_id: getRoleIdForPosition("staff"),
    });
    setAssignOpen(true);
  };

  const closeAssignModal = () => {
    setAssignOpen(false);
    setActiveDepartment(null);
    setFormError("");
    setAssignmentFormErrors({});
    setAssignmentFormData({
      employee_id: "",
      position: "staff",
      from_date: "",
      to_date: "",
      role_id: getRoleIdForPosition("staff"),
    });
  };

  const openAssignmentEditModal = (department, assignment) => {
    const employeeId = getAssignmentEmployeeId(assignment);

    setActiveDepartment(department);
    setEmployeesOpen(false);
    setSelectedAssignment(assignment);
    setFormError("");
    setAssignmentFormErrors({});
    setAssignmentFormData({
      employee_id: employeeId ? String(employeeId) : "",
      position: assignment.position || "staff",
      from_date: assignment.from_date || "",
      to_date: assignment.to_date || "",
      role_id: getRoleIdForPosition(assignment.position || "staff"),
    });
    setAssignmentEditOpen(true);
  };

  const closeAssignmentEditModal = () => {
    setAssignmentEditOpen(false);
    setActiveDepartment(null);
    setSelectedAssignment(null);
    setFormError("");
    setAssignmentFormErrors({});
    setAssignmentFormData({
      employee_id: "",
      position: "staff",
      from_date: "",
      to_date: "",
      role_id: getRoleIdForPosition("staff"),
    });
  };

  const openAssignmentDeleteModal = (department, assignment) => {
    const relationId = getAssignmentRelationId(assignment);

    setActiveDepartment(department);
    setEmployeesOpen(false);
    setSelectedAssignment(assignment);
    setFormError(
      relationId
        ? ""
        : "This employee cannot be removed yet because the API response is missing the employee-department ID."
    );
    setAssignmentFormErrors({});
    setAssignmentDeleteOpen(true);
  };

  const closeAssignmentDeleteModal = () => {
    setAssignmentDeleteOpen(false);
    setActiveDepartment(null);
    setSelectedAssignment(null);
    setFormError("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const result = await dispatch(
      createDepartment({
        name: createFormData.name,
        description: createFormData.description,
      })
    );

    if (createDepartment.fulfilled.match(result)) {
      setCreateOpen(false);
      setCreateFormData({
        name: "",
        description: "",
      });
      setFormError("");
    } else {
      setFormError(result.payload || "Failed to create department.");
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!activeDepartment) return;

    const result = await dispatch(
      updateDepartment({
        id: activeDepartment.id,
        payload: {
          name: formData.name,
          description: formData.description,
        },
      })
    );

    if (updateDepartment.fulfilled.match(result)) {
      closeEditModal();
    } else {
      setFormError(result.payload || "Failed to update department.");
    }
  };

  const handleDelete = async () => {
    if (!activeDepartment) return;

    const result = await dispatch(deleteDepartment(activeDepartment.id));

    if (deleteDepartment.fulfilled.match(result)) {
      closeDeleteModal();
    }
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();

    if (!activeDepartment) return;

    const errors = validateAssignmentForm(assignmentFormData, { requireRoleId: true });

    if (Object.keys(errors).length) {
      setAssignmentFormErrors(errors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const result = await dispatch(
      createEmployeeDepartment({
        employee_id: assignmentFormData.employee_id,
        department_id: activeDepartment.id,
        position: assignmentFormData.position,
        from_date: assignmentFormData.from_date,
        to_date: assignmentFormData.to_date,
        role_id: assignmentFormData.role_id,
      })
    );

    if (createEmployeeDepartment.fulfilled.match(result)) {
      setAssignOpen(false);
      setFormError("");
      setAssignmentFormData({
        employee_id: "",
        position: "staff",
        from_date: "",
        to_date: "",
        role_id: getRoleIdForPosition("staff"),
      });
      setEmployeesOpen(true);
    } else {
      setFormError(result.payload || "Failed to assign employee.");
    }
  };

  const handleUpdateAssignment = async (event) => {
    event.preventDefault();

    const assignmentId = getAssignmentRelationId(selectedAssignment);

    if (!assignmentId || !activeDepartment) {
      setFormError("This assignment cannot be updated because the API response is missing the employee-department ID.");
      return;
    }

    const errors = validateAssignmentForm(assignmentFormData);

    if (Object.keys(errors).length) {
      setAssignmentFormErrors(errors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const result = await dispatch(
      updateEmployeeDepartment({
        id: assignmentId,
        payload: {
          employee_id: assignmentFormData.employee_id,
          department_id: activeDepartment.id,
          from_date: assignmentFormData.from_date,
          to_date: assignmentFormData.to_date,
          position: assignmentFormData.position,
        },
      })
    );

    if (updateEmployeeDepartment.fulfilled.match(result)) {
      const updatedAssignment = result.payload && result.payload !== true
        ? result.payload
        : {
            ...selectedAssignment,
            position: assignmentFormData.position,
            from_date: assignmentFormData.from_date,
            to_date: assignmentFormData.to_date || null,
          };
      const selectedKey = getAssignmentCacheKey(activeDepartment, selectedAssignment);
      const updatedKey = getAssignmentCacheKey(activeDepartment, updatedAssignment);

      setRecentAssignmentByKey((prev) => ({
        ...prev,
        [selectedKey]: updatedAssignment,
        [updatedKey]: updatedAssignment,
      }));
      setAssignmentEditOpen(false);
      setSelectedAssignment(null);
      setFormError("");
      setAssignmentFormData({
        employee_id: "",
        position: "staff",
        from_date: "",
        to_date: "",
        role_id: getRoleIdForPosition("staff"),
      });
      setEmployeesOpen(true);
    } else {
      setFormError(result.payload || "Failed to update employee assignment.");
    }
  };

  const handleDeleteAssignment = async () => {
    let assignmentId = getAssignmentRelationId(selectedAssignment);

    if (!activeDepartment || !selectedAssignment) {
      setFormError("Missing employee assignment.");
      return;
    }

    if (!assignmentId) {
      const result = await getEmployeeDepartmentsRequest();

      if (!result.ok) {
        setFormError(result.message || "Failed to load employee assignments.");
        return;
      }

      const matchedAssignment = (result.data?.data || []).find((item) =>
        isMatchingEmployeeDepartment(item, selectedAssignment, activeDepartment)
      );

      assignmentId = getAssignmentRelationId(matchedAssignment);
    }

    if (!assignmentId) {
      setFormError("This employee cannot be removed yet because the employee-department ID was not found.");
      return;
    }

    const result = await dispatch(deleteEmployeeDepartment(assignmentId));

    if (deleteEmployeeDepartment.fulfilled.match(result)) {
      setAssignmentDeleteOpen(false);
      setSelectedAssignment(null);
      setFormError("");
      setEmployeesOpen(true);
    } else {
      setFormError(result.payload || "Failed to remove employee assignment.");
    }
  };

  return (
    <div className="department-page" dir="ltr">
      <PageHeader
        title="Departments"
        action={
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} />
            <span>New department</span>
          </button>
        }
      />

      <div className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Departments" icon={BriefcaseBusiness} />
        <StatCard title="Staffed" value={staffed} note="Active teams" icon={UserRoundCheck} />
        <StatCard title="Empty" value={empty} note="No staff" icon={FileText} />
        <StatCard title="Employees" value={employees} note="Assigned" icon={UsersRound} />
      </div>

      <Toolbar
        placeholder="Search departments..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={staffFilter}
        onFilterChange={setStaffFilter}
        selectOptions={FILTER_OPTIONS}
      />

      <TableCard title="Department List" count={filteredDepartments.length}>
        {loading ? (
          <div className="table-state">Loading departments...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Employees</th>
                <th>Lead</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((department) => {
                  return (
                    <Fragment key={department.id}>
                      <tr>
                        <td data-label="ID">{department.id}</td>
                        <td data-label="Name">
                          <strong className="department-name">{department.name || "-"}</strong>
                        </td>
                        <td data-label="Description">
                          <span className="department-description">
                            {department.description || "-"}
                          </span>
                        </td>
                        <td data-label="Employees">{getEmployeeCount(department)}</td>
                        <td data-label="Lead">{getLeadName(department)}</td>
                        <td data-label="Actions">
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="View employees"
                              onClick={() => openEmployeesModal(department)}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn"
                              title="Update department"
                              onClick={() => openEditModal(department)}
                            >
                              <PencilLine size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn danger"
                              title="Delete department"
                              onClick={() => openDeleteModal(department)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No departments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFormData({
            name: "",
            description: "",
          });
          setFormError("");
        }}
        title="Create department"
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreate}>
          {formError ? <div className="form-alert">{formError}</div> : null}

          <div className="modal-grid">
            <Field
              name="name"
              value={createFormData.name}
              onChange={handleCreatePreviewChange}
              label="Name"
              iconClass="fa-solid fa-building-user"
            />

            <Field
              name="description"
              value={createFormData.description}
              onChange={handleCreatePreviewChange}
              label="Description"
              iconClass="fa-solid fa-align-left"
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                setCreateFormData({
                  name: "",
                  description: "",
                });
                setFormError("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        onClose={closeEditModal}
        title="Update department"
        size="md"
      >
        <form className="modal-form" onSubmit={handleUpdate}>
          {formError ? <div className="form-alert">{formError}</div> : null}

          <div className="modal-grid">
            <Field
              name="name"
              value={formData.name}
              onChange={handleChange}
              label="Name"
              iconClass="fa-solid fa-building-user"
            />

            <Field
              name="description"
              value={formData.description}
              onChange={handleChange}
              label="Description"
              iconClass="fa-solid fa-align-left"
              required={false}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeEditModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={closeDeleteModal}
        title="Delete department"
        size="sm"
      >
        <div className="modal-form">
          <p className="department-delete-copy">
            {activeDepartment
              ? `Delete ${activeDepartment.name || `department #${activeDepartment.id}`}?`
              : "Delete this department?"}
          </p>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeDeleteModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={employeesOpen}
        onClose={closeEmployeesModal}
        title="Department employees"
        description={
          visibleDepartment
            ? `${visibleDepartment.name || `Department #${visibleDepartment.id}`} - ${
                getEmployeeCount(visibleDepartment)
              } employees`
            : undefined
        }
        size="lg"
      >
        <section className="department-employees-card in-modal">
          <div className="department-employees-header">
            <div>
              <h2>{visibleDepartment?.name || "Department"}</h2>
              <span>{getEmployeeCount(visibleDepartment || {})} employees assigned</span>
            </div>

            <button
              type="button"
              className="primary-action-btn"
              onClick={() => visibleDepartment && openAssignModal(visibleDepartment)}
            >
              <UserPlus size={16} />
              <span>Assign employee</span>
            </button>
          </div>

          {visibleDepartment?.employees?.length ? (
            <div className="employee-grid">
              {visibleDepartment.employees.map((item, index) => {
                const account = item.employee?.account || {};
                const employeeId = getAssignmentEmployeeId(item);
                const assignmentId = getAssignmentRelationId(item);
                const displayName = account.full_name || `Employee #${employeeId || "-"}`;
                const employeeKey = [
                  visibleDepartment.id,
                  assignmentId || employeeId || "employee",
                  item.from_date || "from",
                  item.to_date || "current",
                  index,
                ].join("-");

                return (
                  <article className="employee-card" key={employeeKey}>
                    <div className="employee-avatar">{displayName.slice(0, 1)}</div>

                    <div className="employee-copy">
                      <strong>{displayName}</strong>
                      <span>{item.position || "staff"}</span>
                      <small>{account.email || "-"}</small>
                      <small>{account.phone || "No phone"}</small>
                    </div>

                    <div className="employee-card-actions">
                      <button
                        type="button"
                        className="icon-action-btn"
                        title="View employee details"
                        onClick={() => openEmployeeDetailsModal(visibleDepartment, item)}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn"
                        title="Update assignment"
                        onClick={() => openAssignmentEditModal(visibleDepartment, item)}
                      >
                        <PencilLine size={15} />
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn danger"
                        title="Remove from department"
                        onClick={() => openAssignmentDeleteModal(visibleDepartment, item)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-cell">No employees assigned</div>
          )}
        </section>
      </Modal>

      <Modal
        open={employeeDetailsOpen}
        onClose={closeEmployeeDetailsModal}
        title="Employee details"
        description={
          activeDepartment
            ? `Department: ${activeDepartment.name || `#${activeDepartment.id}`}`
            : undefined
        }
        size="md"
      >
        <section className="employee-details-panel">
          {employeeDetailsLoading ? (
            <div className="table-state">Loading employee details...</div>
          ) : employeeDetailsError ? (
            <div className="table-state is-error">{employeeDetailsError}</div>
          ) : employeeDetails ? (
            (() => {
              const account = employeeDetails.employee?.account || {};
              const roles = account.roles?.length ? account.roles.map(formatRoleName) : [];

              return (
                <article className="employee-id-card">
                  <div className="employee-id-card__portrait">
                    <div className="employee-avatar large">
                      {(account.full_name || "?").slice(0, 1)}
                    </div>
                  </div>

                  <div className="employee-id-card__divider" />

                  <div className="employee-id-card__content">
                    <div className="employee-id-card__title">
                      <h3>{account.full_name || "-"}</h3>
                      <span>{employeeDetails.position || "staff"}</span>
                    </div>

                    <ul className="employee-id-card__facts">
                      <li>{activeDepartment?.name || "No department"}</li>
                      <li>{account.email || "No email"}</li>
                      <li>{account.phone || "No phone"}</li>
                      <li>{employeeDetails.from_date || "-"} to {employeeDetails.to_date || "Current"}</li>
                    </ul>

                    <div className="employee-id-card__chips" aria-label="Employee identifiers">
                      <span>ID {getAssignmentEmployeeId(employeeDetails) || "-"}</span>
                      <span>Account {account.id || "-"}</span>
                      <span>{account.type || "employee"}</span>
                      {roles.length ? (
                        <span className="role-chip">Account roles: {roles.join(", ")}</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })()
          ) : (
            <div className="empty-cell">No employee selected</div>
          )}
        </section>
      </Modal>

      <Modal
        open={assignOpen}
        onClose={closeAssignModal}
        title="Assign employee"
        description={
          activeDepartment
            ? `Department: ${activeDepartment.name || `#${activeDepartment.id}`}`
            : undefined
        }
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreateAssignment}>
          {formError ? <div className="form-alert">{formError}</div> : null}

          <div className="modal-grid">
            <div className="field-group">
              <div className="field-wrapper">
                <select
                  name="employee_id"
                  required
                  value={assignmentFormData.employee_id}
                  onChange={handleAssignmentChange}
                >
                  <option value="">Select employee</option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={String(employee.id)}>
                      {employee.email
                        ? `#${employee.id} - ${employee.name} - ${employee.email}`
                        : `#${employee.id} - ${employee.name}`}
                    </option>
                  ))}
                </select>
                <label>Employee</label>
                <i className="fa-solid fa-user"></i>
              </div>
              {assignmentFormErrors.employee_id ? (
                <p className="field-error">{assignmentFormErrors.employee_id}</p>
              ) : null}
            </div>

            <div className="field-group">
              <div className="field-wrapper">
                <select
                  name="position"
                  required
                  value={assignmentFormData.position}
                  onChange={handleAssignmentChange}
                >
                  {POSITION_OPTIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                <label>Position</label>
                <i className="fa-solid fa-id-badge"></i>
              </div>
              {assignmentFormErrors.position ? (
                <p className="field-error">{assignmentFormErrors.position}</p>
              ) : null}
            </div>

            <Field
              type="date"
              name="from_date"
              value={assignmentFormData.from_date}
              onChange={handleAssignmentChange}
              label="From date"
              iconClass="fa-solid fa-calendar-day"
              error={assignmentFormErrors.from_date}
            />

            <Field
              type="date"
              name="to_date"
              value={assignmentFormData.to_date}
              onChange={handleAssignmentChange}
              label="To date"
              iconClass="fa-solid fa-calendar-check"
              required={false}
              error={assignmentFormErrors.to_date}
            />

            <Field
              name="role_id"
              value={assignmentFormData.role_id}
              onChange={handleAssignmentChange}
              label="Role ID"
              iconClass="fa-solid fa-user-shield"
              error={assignmentFormErrors.role_id}
              readOnly
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeAssignModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={assignmentEditOpen}
        onClose={closeAssignmentEditModal}
        title="Update assignment"
        description={
          activeDepartment
            ? `Department: ${activeDepartment.name || `#${activeDepartment.id}`}`
            : undefined
        }
        size="md"
      >
        <form className="modal-form" onSubmit={handleUpdateAssignment}>
          {formError ? <div className="form-alert">{formError}</div> : null}

          <div className="modal-grid">
            <Field
              name="employee_id"
              value={assignmentFormData.employee_id}
              onChange={handleAssignmentChange}
              label="Employee ID"
              iconClass="fa-solid fa-user"
              required={false}
            />

            <div className="field-group">
              <div className="field-wrapper">
                <select
                  name="position"
                  required
                  value={assignmentFormData.position}
                  onChange={handleAssignmentChange}
                >
                  {POSITION_OPTIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                <label>Position</label>
                <i className="fa-solid fa-id-badge"></i>
              </div>
            </div>

            <Field
              type="date"
              name="from_date"
              value={assignmentFormData.from_date}
              onChange={handleAssignmentChange}
              label="From date"
              iconClass="fa-solid fa-calendar-day"
            />

            <Field
              type="date"
              name="to_date"
              value={assignmentFormData.to_date}
              onChange={handleAssignmentChange}
              label="To date"
              iconClass="fa-solid fa-calendar-check"
              required={false}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeAssignmentEditModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={assignmentDeleteOpen}
        onClose={closeAssignmentDeleteModal}
        title="Remove employee"
        size="sm"
      >
        <div className="modal-form">
          {formError ? <div className="form-alert">{formError}</div> : null}

          <p className="department-delete-copy">
            {selectedAssignment
              ? `Remove ${selectedAssignment.employee?.account?.full_name || "this employee"} from ${
                  activeDepartment?.name || "this department"
                }?`
              : "Remove this employee from the department?"}
          </p>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeAssignmentDeleteModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleDeleteAssignment}
              disabled={actionLoading || !getAssignmentRelationId(selectedAssignment)}
            >
              {actionLoading ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
