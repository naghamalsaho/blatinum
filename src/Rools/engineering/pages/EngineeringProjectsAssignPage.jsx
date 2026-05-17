import { useState } from "react";
import { Plus, Save, Users2, FolderKanban, AlertCircle } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import Button from "@/shared/components/Button";
import Field from "@/shared/components/Field";
import StatusBadge from "@/shared/components/StatusBadge";

import {
  engineeringEngineers,
  engineeringProjects,
  engineeringAssignments,
} from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

const ASSIGN_STATUS = {
  active: { label: "نشط", type: "ok" },
  completed: { label: "منجز", type: "off" },
};

export default function EngineeringProjectsAssignPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    engineer: "",
    project: "",
    role: "",
    notes: "",
  });

  const filteredAssignments = engineeringAssignments.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    const searchable = [item.engineer, item.project, item.role, item.status]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !q || searchable.includes(q);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData({
      engineer: "",
      project: "",
      role: "",
      notes: "",
    });
  };

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Engineering Project"
        title="Assign"
        subtitle="إسناد مهندس إلى مشروع مع تحديد الدور والملاحظات."
        action={
          <button type="button" className="primary-action-btn">
            <Plus size={18} />
            <span>إسناد جديد</span>
          </button>
        }
      />

      <div className="engineering-stats-grid">
        <StatCard title="المهندسون" value={engineeringEngineers.length} note="جاهزون للإسناد" icon={Users2} />
        <StatCard title="المشاريع" value={engineeringProjects.length} note="متاحة حاليًا" icon={FolderKanban} />
        <StatCard title="الإسنادات" value={engineeringAssignments.length} note="قائمة كاملة" icon={Save} />
        <StatCard title="تنبيه" value={2} note="مهام بحاجة مراجعة" icon={AlertCircle} />
      </div>

      <div className="engineering-form-card">
        <div className="engineering-summary-head">
          <h2>نموذج الإسناد</h2>
          <span>إضافة/تحضير Assign</span>
        </div>

        <form className="engineering-form" onSubmit={handleSubmit}>
          <div className="engineering-form-grid">
            <Field
              type="text"
              name="engineer"
              value={formData.engineer}
              onChange={handleChange}
              label="Engineer Name"
              iconClass="fa-solid fa-user"
              error=""
            />
            <Field
              type="text"
              name="project"
              value={formData.project}
              onChange={handleChange}
              label="Project Name"
              iconClass="fa-solid fa-folder"
              error=""
            />
            <Field
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Role"
              iconClass="fa-solid fa-briefcase"
              error=""
            />
            <Field
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              label="Notes"
              iconClass="fa-solid fa-note-sticky"
              error=""
            />
          </div>

          <div className="modal-actions">
            <Button type="submit" className="primary-action-btn">
              حفظ الإسناد
            </Button>
          </div>
        </form>
      </div>

      <Toolbar
        placeholder="ابحث بالمهندس أو المشروع..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={[
          { value: "all", label: "كل الحالات", dotClass: "" },
          { value: "active", label: "نشط", dotClass: "ok" },
          { value: "completed", label: "منجز", dotClass: "off" },
        ]}
      />

      <TableCard title="الإسنادات الحالية" count={filteredAssignments.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>المهندس</th>
              <th>المشروع</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>تاريخ الإسناد</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((item) => {
              const meta = ASSIGN_STATUS[item.status] || { label: item.status, type: "off" };

              return (
                <tr key={item.id}>
                  <td>{item.engineer}</td>
                  <td>{item.project}</td>
                  <td>{item.role}</td>
                  <td>
                    <StatusBadge status={meta.label} type={meta.type} />
                  </td>
                  <td>{item.assignedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}