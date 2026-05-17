import { Users2, FolderKanban } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import StatusBadge from "@/shared/components/StatusBadge";

import { engineeringProjects, engineeringEngineers } from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

export default function EngineeringProjectEngineersPage() {
  const selectedProject = engineeringProjects[0];

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Engineering Project"
        title="Get eng in project"
        subtitle="عرض المهندسين داخل مشروع محدد."
      />

      <div className="engineering-stats-grid">
        <StatCard title="المشاريع" value={engineeringProjects.length} note="اختيار مشروع" icon={FolderKanban} />
        <StatCard title="المهندسون" value={engineeringEngineers.length} note="مرتبطون بالمشروع" icon={Users2} />
      </div>

      <div className="engineering-summary-card">
        <div className="engineering-summary-head">
          <h2>{selectedProject.name}</h2>
          <span>{selectedProject.client}</span>
        </div>

        <div className="engineering-preview-list">
          <div className="preview-row">
            <div>
              <strong>القائد</strong>
              <p>{selectedProject.leadEngineer}</p>
            </div>
            <StatusBadge status="نشط" type="ok" />
          </div>
        </div>
      </div>

      <TableCard title="مهندسو المشروع" count={engineeringEngineers.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الهاتف</th>
              <th>التخصص</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {engineeringEngineers.map((engineer) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}