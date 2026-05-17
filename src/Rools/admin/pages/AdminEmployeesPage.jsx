import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BriefcaseBusiness,
  Crown,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import { fetchEmployees } from "../features/employees/model/employee.thunks";

import "../features/employees/styles/employees.css";

const POSITION_OPTIONS = [
  {
    value: "all",
    label: "All",
    dotClass: "",
  },
  {
    value: "manager",
    label: "Managers",
    dotClass: "ok",
  },
  {
    value: "supervisor",
    label: "Supervisors",
    dotClass: "busy",
  },
  {
    value: "staff",
    label: "Staff",
    dotClass: "",
  },
];

const getAccount = (item) => item.employee?.account || {};
const getEmployeeId = (item) => item.employee?.additional_info?.employee_id;
const getDepartment = (item) => item.department || {};

const getEmployeeKey = (item) => {
  const account = getAccount(item);
  return getEmployeeId(item) || account.id || account.email;
};

const groupEmployeeDepartments = (items) => {
  const grouped = new Map();

  items.forEach((item) => {
    const key = getEmployeeKey(item);

    if (!key) {
      return;
    }

    const current = grouped.get(key);
    const departments = current?.departments || [];

    grouped.set(key, {
      ...(current || item),
      departments: [...departments, item],
    });
  });

  return Array.from(grouped.values());
};

export default function AdminEmployeesPage() {
  const dispatch = useDispatch();
  const {
    items: employees = [],
    loading,
    error,
  } = useSelector((state) => state.employees || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const groupedEmployees = useMemo(
    () => groupEmployeeDepartments(employees),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return groupedEmployees.filter((item) => {
      const account = getAccount(item);
      const roles = account.roles || [];
      const departments = item.departments || [];
      const positions = departments.map((entry) => entry.position || "staff");
      const searchableText = [
        account.id,
        getEmployeeId(item),
        account.full_name,
        account.email,
        account.phone,
        account.address,
        ...departments.map((entry) => getDepartment(entry).name),
        ...positions,
        ...roles,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesPosition =
        positionFilter === "all" || positions.includes(positionFilter);

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

  return (
    <div className="employees-page" dir="ltr">
      <PageHeader title="Employees" />

      <div className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Employees" icon={UsersRound} />
        <StatCard title="Managers" value={managers} note="Department leads" icon={Crown} />
        <StatCard title="Supervisors" value={supervisors} note="Team oversight" icon={ShieldCheck} />
        <StatCard title="Departments" value={departmentsCount} note="Assigned teams" icon={BriefcaseBusiness} />
      </div>

      <Toolbar
        placeholder="Search employees..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={positionFilter}
        onFilterChange={setPositionFilter}
        selectOptions={POSITION_OPTIONS}
      />

      <TableCard title="Employee List" count={filteredEmployees.length}>
        {loading ? (
          <div className="table-state">Loading employees...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Departments</th>
                <th>Positions</th>
                <th>Roles</th>
                <th>From</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((item) => {
                  const account = getAccount(item);
                  const employeeId = getEmployeeId(item) || account.id;
                  const roles = account.roles || [];
                  const departments = item.departments || [];
                  const positions = [
                    ...new Set(departments.map((entry) => entry.position || "staff")),
                  ];
                  const fromDates = departments
                    .map((entry) => entry.from_date)
                    .filter(Boolean);

                  return (
                    <tr key={getEmployeeKey(item)}>
                      <td data-label="Employee">
                        <div className="employee-name-cell">
                          <strong>{account.full_name || "-"}</strong>
                          <span>#{employeeId || "-"}</span>
                        </div>
                      </td>
                      <td data-label="Email">
                        <span className="employee-muted">
                          <Mail size={13} /> {account.email || "-"}
                        </span>
                      </td>
                      <td data-label="Phone">{account.phone || "-"}</td>
                      <td data-label="Departments">
                        <div className="employee-departments">
                          {departments.length > 0 ? (
                            departments.map((entry) => {
                              const department = getDepartment(entry);
                              const position = entry.position || "staff";

                              return (
                                <span
                                  className="employee-department-pill"
                                  key={`${employeeId}-${department.id}-${position}`}
                                >
                                  <strong>{department.name || "-"}</strong>
                                  <small>{position}</small>
                                </span>
                              );
                            })
                          ) : (
                            <span className="employee-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Positions">
                        <div className="employee-roles">
                          {positions.length > 0 ? (
                            positions.map((position) => (
                              <span
                                className={`employee-position ${position}`}
                                key={`${employeeId}-${position}`}
                              >
                                {position}
                              </span>
                            ))
                          ) : (
                            <span className="employee-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Roles">
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
                      <td data-label="From">{fromDates[0] || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
