import { BarChart3, FileText, Download, CalendarDays } from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import StatusBadge from "@/shared/components/StatusBadge";

import { engineeringReports } from "../constants/engineeringDashboardData";

import "../styles/engineering.css";

const REPORT_META = {
  ready: { label: "جاهز", type: "ok" },
  draft: { label: "مسودة", type: "busy" },
};

export default function EngineeringReportsPage() {
  return (
    <div className="engineering-page">
      <PageHeader
        kicker="Reports"
        title="Read all"
        subtitle="تقارير القسم الهندسي وإحصاء الأداء."
      />

      <div className="engineering-stats-grid">
        <StatCard title="التقارير" value={engineeringReports.length} note="متاحة الآن" icon={FileText} />
        <StatCard title="جاهز" value={engineeringReports.filter((r) => r.status === "ready").length} note="جاهزة للتحميل" icon={Download} />
        <StatCard title="مسودات" value={engineeringReports.filter((r) => r.status === "draft").length} note="قيد الإعداد" icon={BarChart3} />
        <StatCard title="التاريخ" value="Weekly" note="ملخص دوري" icon={CalendarDays} />
      </div>

      <TableCard title="قائمة التقارير" count={engineeringReports.length}>
        <table className="engineering-table">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>النوع</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {engineeringReports.map((report) => {
              const meta = REPORT_META[report.status] || { label: report.status, type: "off" };

              return (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>{report.type}</td>
                  <td>{report.date}</td>
                  <td>
                    <StatusBadge status={meta.label} type={meta.type} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-action-btn">
                        <Download size={16} />
                      </button>
                    </div>
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