import { useState } from "react";
import { Save, PencilLine } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import Field from "@/shared/components/Field";
import Button from "@/shared/components/Button";
import StatCard from "@/shared/components/StatCard";

import "../styles/engineering.css";

export default function EngineeringProjectsUpdatePage() {
  const [formData, setFormData] = useState({
    engineer: "Amira Khalil",
    project: "Platinum Tower",
    role: "Supervisor",
    notes: "Update assignment details",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Engineering Project"
        title="Update"
        subtitle="تعديل الإسناد الحالي وتحديث بيانات المشروع أو المهندس."
        action={
          <button type="button" className="primary-action-btn">
            <PencilLine size={18} />
            <span>تعديل</span>
          </button>
        }
      />

      <div className="engineering-stats-grid">
        <StatCard title="وضع التحرير" value="Edit Mode" note="بيانات محمّلة مسبقًا" icon={Save} />
        <StatCard title="الهدف" value="Update Assignment" note="تعديل سريع وآمن" icon={PencilLine} />
      </div>

      <div className="engineering-form-card">
        <div className="engineering-summary-head">
          <h2>تحديث الإسناد</h2>
          <span>بيانات جاهزة للتعديل</span>
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
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}