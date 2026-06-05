import { useState } from "react";
import {
  Building2,
  Building,
  Home,

  Plus,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import Field from "@/shared/components/Field";
import ActionButtons from "@/shared/components/ActionButtons";

import "../styles/marketing-projects.css";

export default function MarketingProjectsPage() {
  const [openProjectModal, setOpenProjectModal] = useState(false);

  const projects = [
    {
      id: 1,
      name: "برج الأندلس",
      city: "دمشق",
      buildings: 4,
      units: 120,
      status: "نشط",
    },
    {
      id: 2,
      name: "مجمع الياسمين",
      city: "حلب",
      buildings: 2,
      units: 70,
      status: "قيد التنفيذ",
    },
  ];

  return (
    <div className="projects-page">

      <PageHeader
        kicker="Marketing Department"
        title="إدارة المشاريع والخدمات"
        subtitle="إدارة المشاريع والأبنية والوحدات والخدمات العقارية"
        action={
          <Button
            className="projects-primary-btn"
            onClick={() => setOpenProjectModal(true)}
          >
            <Plus size={18} />
            مشروع جديد
          </Button>
        }
      />

      <section className="projects-stats">
        <StatCard
          title="المشاريع"
          value="24"
          note="إجمالي المشاريع"
          icon={Building2}
        />

        <StatCard
          title="الأبنية"
          value="68"
          note="ضمن المشاريع"
          icon={Building}
        />

        <StatCard
          title="الوحدات"
          value="420"
          note="وحدات عقارية"
          icon={Home}
        />

      
      </section>

      <section className="projects-cards">
        <div className="project-card">
          <Building2 size={28} />
          <h3>المشاريع</h3>
          <p>إدارة جميع المشاريع العقارية</p>
        </div>

        <div className="project-card">
          <Building size={28} />
          <h3>الأبنية</h3>
          <p>متابعة الأبنية التابعة للمشاريع</p>
        </div>

        <div className="project-card">
          <Home size={28} />
          <h3>الوحدات</h3>
          <p>إدارة الشقق والمكاتب والمحلات</p>
        </div>

      
      </section>

      <TableCard
        title="المشاريع"
        count={projects.length}
      >
        <table className="projects-table">
          <thead>
            <tr>
              <th>المشروع</th>
              <th>المدينة</th>
              <th>الأبنية</th>
              <th>الوحدات</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.city}</td>
                <td>{project.buildings}</td>
                <td>{project.units}</td>

                <td>
                  <span className="status-badge">
                    {project.status}
                  </span>
                </td>

                <td>
                  <ActionButtons />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <Modal
        open={openProjectModal}
        title="إضافة مشروع"
        description="إضافة مشروع عقاري جديد"
        onClose={() => setOpenProjectModal(false)}
        footer={
          <Button className="projects-primary-btn">
            حفظ المشروع
          </Button>
        }
      >
        <div className="project-form">
          <Field
            name="name"
            label="اسم المشروع"
            value=""
            onChange={() => {}}
            iconClass=""
          />

          <Field
            name="city"
            label="المدينة"
            value=""
            onChange={() => {}}
            iconClass=""
          />
        </div>
      </Modal>

    </div>
  );
}