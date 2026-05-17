import { useState } from "react";
import { Users2, FolderKanban } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import StatusBadge from "@/shared/components/StatusBadge";
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";
import Button from "@/shared/components/Button";

import { engineeringEngineers, engineeringProjects } from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

const PROJECT_META = {
  active: { label: "نشط", type: "ok" },
  paused: { label: "متوقف", type: "busy" },
  completed: { label: "منجز", type: "off" },
};

export default function EngineeringProjectsForEngineerPage() {
  const [selectedEngineer, setSelectedEngineer] = useState(engineeringEngineers[0]?.name || "");

  const engineerProjects = engineeringProjects.filter(
    (_, index) => index < 2
  );

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Engineering Project"
        title="Read projects for eng"
        subtitle="عرض المشاريع الخاصة بمهندس محدد."
      />

      <div className="engineering-stats-grid">
        <StatCard title="المهندسون" value={engineeringEngineers.length} note="قائمة النظام" icon={Users2} />
        <StatCard title="المشاريع" value={engineeringProjects.length} note="مرتبطة بالمهندس" icon={FolderKanban} />
      </div>

      <div className="engineering-form-card">
        <div className="engineering-summary-head">
          <h2>اختيار المهندس</h2>
          <span>عرض المشاريع المرتبطة</span>
        </div>

        <div className="engineering-form-grid">
          <Field
            type="text"
            name="engineer"
            value={selectedEngineer}
            onChange={(e) => setSelectedEngineer(e.target.value)}
            label="Engineer Name"
            iconClass="fa-solid fa-user"
            error=""
          />
        </div>

        <div className="modal-actions">
          <Button type="button" className="primary-action-btn">
            عرض المشاريع
          </Button>
        </div>
      </div>

      <TableCard title={`Projects for ${selectedEngineer}`} count={engineerProjects.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>المشروع</th>
              <th>العميل</th>
              <th>القائد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {engineerProjects.map((project) => {
              const meta = PROJECT_META[project.status] || { label: project.status, type: "off" };

              return (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.client}</td>
                  <td>{project.leadEngineer}</td>
                  <td>
                    <StatusBadge status={meta.label} type={meta.type} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}