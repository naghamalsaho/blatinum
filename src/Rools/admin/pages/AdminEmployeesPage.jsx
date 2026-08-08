import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BriefcaseBusiness,
  Crown,
  Mail,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import { t } from "@/shared/i18n";
import { clearEmployeeActionState } from "../features/employees/model/employee.slice";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from "../features/employees/model/employee.thunks";
import { fetchDepartments } from "../features/departments/model/department.thunks";
import { fetchRoles } from "../features/roles/model/role.thunks";

import "../features/employees/styles/employees.css";

const EMPTY_EMPLOYEE_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  gender: "male",
  password: "",
  password_confirmation: "",
  department_id: "",
  position: "staff",
  from_date: new Date().toISOString().slice(0, 10),
  role_id: "",
};

const getAccount = (item) => item?.employee?.account || item?.account || item?.user || item || {};
const getEmployeeInfo = (item) =>
  item?.employee?.additional_info || item?.additional_info || item?.employee || item || {};
const getEmployeeId = (item) =>
  getEmployeeInfo(item).employee_id || item?.employee_id || item?.employee?.id || item?.id;
// Employee > Account endpoints operate on the account record id. The
// employee_id inside additional_info is used by department assignments only.
const getEmployeeAccountId = (item) =>
  getAccount(item)?.id || item?.account_id || item?.employee?.account_id || item?.id;
const getDepartment = (item) => item?.department || {};
const getLocalizedName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[localStorage.getItem("lang") || "en"] || value.en || value.ar || "";
};
const getRoleName = (role) =>
  typeof role === "string" ? role : role?.name || role?.title || "";

const getEmployeeKey = (item) => {
  const account = getAccount(item);
  return getEmployeeAccountId(item) || getEmployeeId(item) || account.email;
};

const getEmployeeName = (item) => {
  const account = getAccount(item);
  const fullName = account.full_name || item.full_name;

  if (fullName) return fullName;

  return [account.first_name || item.first_name, account.last_name || item.last_name]
    .filter(Boolean)
    .join(" ") || "-";
};

const splitFullName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" "),
  };
};

const getEmployeeDepartments = (item) => {
  if (Array.isArray(item.departments)) return item.departments;
  if (item.department || item.position || item.from_date) return [item];
  return [];
};

const groupEmployeeRecords = (items) => {
  const grouped = new Map();

  items.forEach((item) => {
    const key = getEmployeeKey(item);

    if (!key) return;

    const current = grouped.get(key);
    const departments = [
      ...(current?.departments || []),
      ...getEmployeeDepartments(item),
    ];

    grouped.set(key, {
      ...(current || item),
      departments,
    });
  });

  return Array.from(grouped.values());
};

const buildEditForm = (employee) => {
  const account = getAccount(employee);
  const splitName = splitFullName(account.full_name || employee.full_name);

  return {
    ...EMPTY_EMPLOYEE_FORM,
    first_name: account.first_name || employee?.first_name || splitName.first_name,
    last_name: account.last_name || employee?.last_name || splitName.last_name,
    email: account.email || employee?.email || "",
    phone: account.phone || employee?.phone || "",
    address: account.address || employee?.address || "",
    gender: getEmployeeInfo(employee).gender || employee?.gender || "male",
  };
};

export default function AdminEmployeesPage() {
  const dispatch = useDispatch();
  const {
    items: employees = [],
    loading,
    error,
    actionLoading,
    actionError,
    actionMessage,
  } = useSelector((state) => state.employees || {});
  const departmentOptions = useSelector((state) => state.departments?.items || []);
  const roleOptions = useSelector((state) => state.rolePermissions?.roles?.items || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState("create");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(EMPTY_EMPLOYEE_FORM);
  const [formError, setFormError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const positionOptions = [
    { value: "all", label: t("all"), dotClass: "" },
    { value: "manager", label: t("managers"), dotClass: "ok" },
    { value: "supervisor", label: t("supervisors"), dotClass: "busy" },
    { value: "staff", label: t("staff"), dotClass: "" },
  ];

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchRoles());
  }, [dispatch]);

  const groupedEmployees = useMemo(
    () => groupEmployeeRecords(employees),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return groupedEmployees.filter((item) => {
      const account = getAccount(item);
      const info = getEmployeeInfo(item);
      const roles = (account.roles || []).map(getRoleName).filter(Boolean);
      const departments = item.departments || [];
      const positions = departments.map((entry) => entry.position || "staff");
      const searchableText = [
        account.id,
        getEmployeeId(item),
        getEmployeeName(item),
        account.email,
        account.phone,
        account.address,
        info.gender,
        ...departments.map((entry) => getLocalizedName(getDepartment(entry).name)),
        ...positions,
        ...roles,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesPosition =
        positionFilter === "all" ||
        positions.includes(positionFilter) ||
        (positionFilter === "staff" && positions.length === 0);

      return matchesSearch && matchesPosition;
    });
  }, [groupedEmployees, searchTerm, positionFilter]);

  const total = groupedEmployees.length;
  const managers = groupedEmployees.filter((item) =>
    item.departments?.some((entry) => entry.position === "manager")
  ).length;
  const supervisors = groupedEmployees.filter((item) =>
    item.departments?.some((entry) => entry.position === "supervisor")
  ).length;
  const departmentsCount = new Set(
    employees.map((item) => getDepartment(item).id).filter(Boolean)
  ).size;

  const openCreateEmployee = () => {
    setEmployeeModalMode("create");
    setSelectedEmployee(null);
    setEmployeeForm(EMPTY_EMPLOYEE_FORM);
    setFormError("");
    dispatch(clearEmployeeActionState());
    setEmployeeModalOpen(true);
  };

  const openEditEmployee = (employee) => {
    setEmployeeModalMode("edit");
    setSelectedEmployee(employee);
    setEmployeeForm(buildEditForm(employee));
    setFormError("");
    dispatch(clearEmployeeActionState());
    setEmployeeModalOpen(true);
  };

  const closeEmployeeModal = () => {
    setEmployeeModalOpen(false);
    setSelectedEmployee(null);
    setEmployeeForm(EMPTY_EMPLOYEE_FORM);
    setFormError("");
    dispatch(clearEmployeeActionState());
  };

  const openDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    dispatch(clearEmployeeActionState());
    setDeleteModalOpen(true);
  };

  const closeDeleteEmployee = () => {
    setDeleteModalOpen(false);
    setSelectedEmployee(null);
    dispatch(clearEmployeeActionState());
  };

  const updateEmployeeFormField = (field, value) => {
    setEmployeeForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitEmployeeForm = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!employeeForm.first_name || !employeeForm.last_name || !employeeForm.email) {
      setFormError("First name, last name, and email are required.");
      return;
    }

    if (employeeModalMode === "create" && !employeeForm.password) {
      setFormError("Password is required when creating an employee.");
      return;
    }

    if (
      employeeForm.password ||
      employeeForm.password_confirmation ||
      employeeModalMode === "create"
    ) {
      if (employeeForm.password !== employeeForm.password_confirmation) {
        setFormError("Password confirmation does not match.");
        return;
      }
    }

    const payload = { ...employeeForm };

    if (employeeModalMode === "edit" && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }

    const result =
      employeeModalMode === "create"
        ? await dispatch(createEmployee(payload))
        : await dispatch(
            updateEmployee({
              employeeId: getEmployeeAccountId(selectedEmployee),
              payload,
            })
          );

    const succeeded =
      createEmployee.fulfilled.match(result) || updateEmployee.fulfilled.match(result);

    if (succeeded) {
      await dispatch(fetchEmployees());
      closeEmployeeModal();
    }
  };

  const submitDeleteEmployee = async (event) => {
    event.preventDefault();

    const employeeId = getEmployeeAccountId(selectedEmployee);
    if (!employeeId) return;

    const result = await dispatch(deleteEmployee(employeeId));

    if (deleteEmployee.fulfilled.match(result)) {
      await dispatch(fetchEmployees());
      closeDeleteEmployee();
    }
  };

  return (
    <div className="employees-page">
      <div className="legal-stats-grid">
        <StatCard title={t("total")} value={total} note={t("employees_total_note")} icon={UsersRound} />
        <StatCard title={t("managers")} value={managers} note={t("department_leads")} icon={Crown} />
        <StatCard title={t("supervisors")} value={supervisors} note={t("team_oversight")} icon={ShieldCheck} />
        <StatCard title={t("departments")} value={departmentsCount} note={t("departments_count_note")} icon={BriefcaseBusiness} />
      </div>

      <Toolbar
        placeholder={t("search_employees")}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={positionFilter}
        onFilterChange={setPositionFilter}
        selectOptions={positionOptions}
        action={
          <Button
            type="button"
            className="primary-action-btn employee-create-btn"
            onClick={openCreateEmployee}
          >
            <Plus size={17} />
            Create Employee
          </Button>
        }
      />

      <TableCard title={t("employee_list")} count={filteredEmployees.length}>
        {loading ? (
          <div className="table-state">{t("loading_employees")}</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>{t("employee")}</th>
                <th>{t("email")}</th>
                <th>{t("phone")}</th>
                <th>{t("departments")}</th>
                <th>{t("positions")}</th>
                <th>{t("roles")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((item) => {
                  const account = getAccount(item);
                  const employeeId = getEmployeeId(item) || account.id;
                  const roles = (account.roles || []).map(getRoleName).filter(Boolean);
                  const departments = item.departments || [];
                  const positions = [
                    ...new Set(departments.map((entry) => entry.position || "staff")),
                  ];

                  return (
                    <tr key={getEmployeeKey(item)}>
                      <td data-label={t("employee")}>
                        <div className="employee-name-cell">
                          <span className="employee-table-avatar" aria-hidden="true">
                            {getEmployeeName(item).charAt(0)}
                          </span>
                          <span className="employee-name-copy">
                            <strong>{getEmployeeName(item)}</strong>
                            <small>Employee #{employeeId || "-"}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label={t("email")}>
                        <span className="employee-muted">
                          <Mail size={13} /> {account.email || "-"}
                        </span>
                      </td>
                      <td data-label={t("phone")}>{account.phone || "-"}</td>
                      <td data-label={t("departments")}>
                        <div className="employee-departments">
                          {departments.length > 0 ? (
                            departments.map((entry) => {
                              const department = getDepartment(entry);
                              const position = entry.position || "staff";

                              return (
                                <span
                                  className="employee-department-pill"
                                  key={`${employeeId}-${department.id || department.name}-${position}`}
                                >
                                  <strong>{getLocalizedName(department.name) || "-"}</strong>
                                  <small>{t(position) || position}</small>
                                </span>
                              );
                            })
                          ) : (
                            <span className="employee-muted">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td data-label={t("positions")}>
                        <div className="employee-roles">
                          {positions.length > 0 ? (
                            positions.map((position) => (
                              <span
                                className={`employee-position ${position}`}
                                key={`${employeeId}-${position}`}
                              >
                                {t(position) || position}
                              </span>
                            ))
                          ) : (
                            <span className="employee-muted">Staff</span>
                          )}
                        </div>
                      </td>
                      <td data-label={t("roles")}>
                        <div className="employee-roles">
                          {roles.length > 0 ? (
                            roles.map((role) => (
                              <span className="employee-role-pill" key={role}>
                                {role.replaceAll("_", " ")}
                              </span>
                            ))
                          ) : (
                            <span className="employee-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td data-label={t("actions")}>
                        <div className="employee-action-buttons">
                          <button
                            type="button"
                            className="employee-icon-action"
                            onClick={() => openEditEmployee(item)}
                            aria-label={`Edit ${getEmployeeName(item)}`}
                          >
                            <PencilLine size={16} />
                          </button>
                          <button
                            type="button"
                            className="employee-icon-action danger"
                            onClick={() => openDeleteEmployee(item)}
                            aria-label={`Delete ${getEmployeeName(item)}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    {t("no_employees_found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={employeeModalOpen}
        onClose={closeEmployeeModal}
        title={employeeModalMode === "create" ? "Create employee" : "Update employee"}
        description={
          employeeModalMode === "create"
            ? "Create an employee account from the Employee > Account API."
            : `Employee #${getEmployeeId(selectedEmployee) || "-"}`
        }
        size="lg"
      >
        <form className="employee-form" onSubmit={submitEmployeeForm}>
          <div className="employee-form-grid">
            <label>
              <span>First name</span>
              <input
                value={employeeForm.first_name}
                onChange={(event) => updateEmployeeFormField("first_name", event.target.value)}
                placeholder="First name"
              />
            </label>
            <label>
              <span>Last name</span>
              <input
                value={employeeForm.last_name}
                onChange={(event) => updateEmployeeFormField("last_name", event.target.value)}
                placeholder="Last name"
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={employeeForm.email}
                onChange={(event) => updateEmployeeFormField("email", event.target.value)}
                placeholder="employee@example.com"
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={employeeForm.phone}
                onChange={(event) => updateEmployeeFormField("phone", event.target.value)}
                placeholder="+31 6 ..."
              />
            </label>
            <label className="employee-form-wide">
              <span>Address</span>
              <input
                value={employeeForm.address}
                onChange={(event) => updateEmployeeFormField("address", event.target.value)}
                placeholder="Address"
              />
            </label>
            <label>
              <span>Gender</span>
              <select
                value={employeeForm.gender}
                onChange={(event) => updateEmployeeFormField("gender", event.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={employeeForm.password}
                onChange={(event) => updateEmployeeFormField("password", event.target.value)}
                placeholder={employeeModalMode === "edit" ? "Leave empty to keep current" : "Password"}
              />
            </label>
            <label>
              <span>Confirm password</span>
              <input
                type="password"
                value={employeeForm.password_confirmation}
                onChange={(event) =>
                  updateEmployeeFormField("password_confirmation", event.target.value)
                }
                placeholder="Confirm password"
              />
            </label>
            {employeeModalMode === "create" ? (
              <>
                <label>
                  <span>{t("department")}</span>
                  <select
                    value={employeeForm.department_id}
                    onChange={(event) => updateEmployeeFormField("department_id", event.target.value)}
                  >
                    <option value="">{t("select_department")}</option>
                    {departmentOptions.map((entry) => {
                      const department = entry?.department || entry;
                      return <option key={department.id} value={department.id}>{getLocalizedName(department.name) || `#${department.id}`}</option>;
                    })}
                  </select>
                </label>
                <label>
                  <span>{t("position")}</span>
                  <select value={employeeForm.position} onChange={(event) => updateEmployeeFormField("position", event.target.value)}>
                    <option value="staff">{t("staff")}</option>
                    <option value="manager">{t("manager")}</option>
                    <option value="supervisor">{t("supervisor")}</option>
                  </select>
                </label>
                <label>
                  <span>{t("from_date")}</span>
                  <input type="date" value={employeeForm.from_date} onChange={(event) => updateEmployeeFormField("from_date", event.target.value)} />
                </label>
                <label>
                  <span>{t("role")}</span>
                  <select value={employeeForm.role_id} onChange={(event) => updateEmployeeFormField("role_id", event.target.value)}>
                    <option value="">{t("select_role")}</option>
                    {roleOptions.map((role) => <option key={role.id} value={role.id}>{getRoleName(role) || `#${role.id}`}</option>)}
                  </select>
                </label>
              </>
            ) : null}
          </div>

          {formError ? <p className="employee-form-error">{formError}</p> : null}
          {actionError ? <p className="employee-form-error">{actionError}</p> : null}
          {actionMessage ? <p className="employee-form-success">{actionMessage}</p> : null}

          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={closeEmployeeModal}>
              Cancel
            </Button>
            <Button type="submit" className="primary-action-btn" disabled={actionLoading}>
              {actionLoading
                ? "Saving..."
                : employeeModalMode === "create"
                  ? "Create Employee"
                  : "Update Employee"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={closeDeleteEmployee}
        title="Delete employee"
        description={`Employee #${getEmployeeId(selectedEmployee) || "-"}`}
        size="sm"
      >
        <form className="employee-delete-form" onSubmit={submitDeleteEmployee}>
          <p>
            Are you sure you want to delete{" "}
            <strong>{selectedEmployee ? getEmployeeName(selectedEmployee) : "this employee"}</strong>?
          </p>
          {actionError ? <p className="employee-form-error">{actionError}</p> : null}
          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={closeDeleteEmployee}>
              Cancel
            </Button>
            <Button type="submit" className="employee-danger-btn" disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
