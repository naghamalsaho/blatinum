import { FolderKanban, Users2,  } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Toolbar from "@/shared/components/Toolbar";
import StatusBadge from "@/shared/components/StatusBadge";
import TableCard from "@/shared/components/TableCard";

import { engineeringProjects } from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

const PROJECT_META = {
  active: { label: "نشط", type: "ok" },
  paused: { label: "متوقف", type: "busy" },
  completed: { label: "منجز", type: "off" },
};

export default function EngineeringProjectsWithEngineersPage() {
  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Engineering Project"
        title="Read projects with engs"
        subtitle="عرض المشاريع مع المهندسين المرتبطين بها."
      />

      <div className="engineering-stats-grid">
        <StatCard title="المشاريع" value={engineeringProjects.length} note="كل المشاريع" icon={FolderKanban} />
        <StatCard title="المهندسون" value={engineeringProjects.reduce((sum, p) => sum + p.engineerCount, 0)} note="إجمالي الروابط" icon={Users2} />
      </div>

      <Toolbar
        placeholder="ابحث باسم المشروع..."
        searchValue=""
        onSearchChange={() => {}}
        filterValue="all"
        onFilterChange={() => {}}
        selectOptions={[
          { value: "all", label: "كل الحالات", dotClass: "" },
          { value: "active", label: "نشط", dotClass: "ok" },
          { value: "paused", label: "متوقف", dotClass: "busy" },
          { value: "completed", label: "منجز", dotClass: "off" },
        ]}
      />

      <TableCard title="المشاريع مع المهندسين" count={engineeringProjects.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>المشروع</th>
              <th>العميل</th>
              <th>القائد</th>
              <th>عدد المهندسين</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {engineeringProjects.map((project) => {
              const meta = PROJECT_META[project.status] || { label: project.status, type: "off" };

              return (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.client}</td>
                  <td>{project.leadEngineer}</td>
                  <td>{project.engineerCount}</td>
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