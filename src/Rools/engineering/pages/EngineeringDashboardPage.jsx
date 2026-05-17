import {
  Users2,
  FolderKanban,
  BriefcaseBusiness,
  
  CircleCheckBig,
  
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import StatusBadge from "@/shared/components/StatusBadge";

import {
  engineeringEngineers,
  engineeringProjects,
  engineeringAssignments,
} from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

const STATUS_META = {
  active: { label: "نشط", type: "ok" },
  paused: { label: "متوقف", type: "busy" },
  completed: { label: "منجز", type: "off" },
  draft: { label: "مسودة", type: "off" },
};

export default function EngineeringDashboardPage() {
  const totalEngineers = engineeringEngineers.length;
  const activeProjects = engineeringProjects.filter((p) => p.status === "active").length;
  const completedProjects = engineeringProjects.filter((p) => p.status === "completed").length;
  const activeAssignments = engineeringAssignments.filter((a) => a.status === "active").length;

  return (
    <div className="engineering-page">
      <PageHeader
        kicker="القسم الهندسي"
        title="لوحة القسم الهندسي"
        subtitle="نظرة عامة على المهندسين، المشاريع، الإسنادات، وحالة العمل الحالية."
      />

      <div className="engineering-stats-grid">
        <StatCard title="المهندسون" value={totalEngineers} note="إجمالي السجلات" icon={Users2} />
        <StatCard title="المشاريع النشطة" value={activeProjects} note="قيد التنفيذ" icon={FolderKanban} />
        <StatCard title="الإسنادات" value={activeAssignments} note="مرتبطة حاليًا" icon={BriefcaseBusiness} />
        <StatCard title="المشاريع المنجزة" value={completedProjects} note="تم تسليمها" icon={CircleCheckBig} />
      </div>

      <div className="engineering-summary-grid">
        <section className="engineering-summary-card">
          <div className="engineering-summary-head">
            <h2>آخر الإسنادات</h2>
            <span>{engineeringAssignments.length} سجل</span>
          </div>

          <div className="engineering-preview-list">
            {engineeringAssignments.slice(0, 3).map((item) => {
              const meta = STATUS_META[item.status] || { label: item.status, type: "off" };

              return (
                <div className="preview-row" key={item.id}>
                  <div>
                    <strong>{item.engineer}</strong>
                    <p>{item.project} • {item.role}</p>
                  </div>
                  <StatusBadge status={meta.label} type={meta.type} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="engineering-summary-card">
          <div className="engineering-summary-head">
            <h2>المشاريع الحديثة</h2>
            <span>{engineeringProjects.length} سجل</span>
          </div>

          <div className="engineering-preview-list">
            {engineeringProjects.slice(0, 3).map((project) => {
              const meta = STATUS_META[project.status] || { label: project.status, type: "off" };

              return (
                <div className="preview-row" key={project.id}>
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.client} • {project.engineerCount} مهندسين</p>
                  </div>
                  <StatusBadge status={meta.label} type={meta.type} />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <TableCard title="ملخص سريع" count={engineeringProjects.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>المشروع</th>
              <th>القائد</th>
              <th>النسبة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {engineeringProjects.map((project) => {
              const meta = STATUS_META[project.status] || { label: project.status, type: "off" };

              return (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.leadEngineer}</td>
                  <td>{project.progress}%</td>
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