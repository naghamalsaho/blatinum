import { useState } from "react";
import { Plus, Users2, Trash2, PencilLine } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import StatusBadge from "@/shared/components/StatusBadge";
import Button from "@/shared/components/Button";
import Field from "@/shared/components/Field";
import Modal from "@/shared/components/Modal";

import { engineeringEngineers } from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

export default function EngineeringEngineersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEngineers = engineeringEngineers.filter((engineer) => {
    const q = searchTerm.trim().toLowerCase();
    const searchable = [
      engineer.name,
      engineer.email,
      engineer.phone,
      engineer.specialty,
      engineer.status,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !q || searchable.includes(q);
    const matchesStatus = statusFilter === "all" || engineer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Engineer"
        title="Read all"
        subtitle="إدارة المهندسين داخل القسم الهندسي."
        action={
          <button type="button" className="primary-action-btn" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            <span>Create Engineer</span>
          </button>
        }
      />

      <div className="engineering-stats-grid">
        <StatCard title="المهندسون" value={engineeringEngineers.length} note="إجمالي السجلات" icon={Users2} />
        <StatCard title="نشط" value={engineeringEngineers.filter((e) => e.status === "active").length} note="جاهز للعمل" icon={Users2} />
      </div>

      <Toolbar
        placeholder="ابحث بالاسم أو البريد..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={[
          { value: "all", label: "كل الحالات", dotClass: "" },
          { value: "active", label: "نشط", dotClass: "ok" },
          { value: "inactive", label: "متوقف", dotClass: "busy" },
        ]}
      />

      <TableCard title="جدول المهندسين" count={filteredEngineers.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الهاتف</th>
              <th>التخصص</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredEngineers.map((engineer) => (
              <tr key={engineer.id}>
                <td>{engineer.name}</td>
                <td>{engineer.email}</td>
                <td>{engineer.phone}</td>
                <td>{engineer.specialty}</td>
                <td>
                  <StatusBadge
                    status={engineer.status === "active" ? "نشط" : "متوقف"}
                    type={engineer.status === "active" ? "ok" : "busy"}
                  />
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="icon-action-btn">
                      <PencilLine size={16} />
                    </button>
                    <button type="button" className="icon-action-btn danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Engineer"
        description="إضافة مهندس جديد للقسم الهندسي."
        size="md"
      >
        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <div className="modal-grid">
            <Field type="text" name="name" value="" onChange={() => {}} label="Name" iconClass="fa-solid fa-user" error="" />
            <Field type="text" name="email" value="" onChange={() => {}} label="Email" iconClass="fa-solid fa-envelope" error="" />
            <Field type="text" name="phone" value="" onChange={() => {}} label="Phone" iconClass="fa-solid fa-phone" error="" />
            <Field type="text" name="specialty" value="" onChange={() => {}} label="Specialty" iconClass="fa-solid fa-helmet-safety" error="" />
          </div>

          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={() => setCreateOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="primary-action-btn">
              حفظ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}