import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BriefcaseBusiness,
  FileText,
  PencilLine,
  Plus,
  Trash2,
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
  fetchDepartments,
} from "../features/departments/model/department.thunks";

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

const getEmployeeCount = (department) => department.employees?.length || 0;

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
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
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
  const handleCreatePreviewChange = (event) => {
    const { name, value } = event.target;

    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
                  const isSelected = selectedDepartment?.id === department.id;
                  const departmentEmployees = department.employees || [];

                  return (
                    <Fragment key={department.id}>
                      <tr
                        className={isSelected ? "is-selected" : ""}
                        onClick={() => setSelectedDepartment(isSelected ? null : department)}
                      >
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
                              title="Update endpoint pending"
                              disabled
                              onClick={(event) => event.stopPropagation()}
                            >
                              <PencilLine size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn danger"
                              title="Delete endpoint pending"
                              disabled
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isSelected ? (
                        <tr className="department-employees-row">
                          <td colSpan="6">
                            <section className="department-employees-card">
                              <div className="department-employees-header">
                                <div>
                                  <h2>{department.name}</h2>
                                  <span>{departmentEmployees.length} employees</span>
                                </div>
                              </div>

                              {departmentEmployees.length > 0 ? (
                                <div className="employee-grid">
                                  {departmentEmployees.map((item) => {
                                    const account = item.employee?.account || {};
                                    const employeeId =
                                      item.employee?.additional_info?.employee_id || account.id;

                                    return (
                                      <article
                                        className="employee-card"
                                        key={`${department.id}-${employeeId}`}
                                      >
                                        <div className="employee-avatar">
                                          {(account.full_name || "?").slice(0, 1)}
                                        </div>

                                        <div className="employee-copy">
                                          <strong>{account.full_name || "-"}</strong>
                                          <span>{item.position || "staff"}</span>
                                          <small>{account.email || "-"}</small>
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="empty-cell">No employees assigned</div>
                              )}
                            </section>
                          </td>
                        </tr>
                      ) : null}
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
        }}
        title="Create department"
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreate}>
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
    </div>
  );
}
