import {
  Plus,
  
  UserRound,
  Phone,
  BriefcaseBusiness,
} from "lucide-react";
import { legalEngineers } from "../constants/legalDashboardData";
import "../styles/legal.css";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import StatusBadge from "@/shared/components/StatusBadge";
import Toolbar from "@/shared/components/Toolbar";
import TableCard from "@/shared/components/TableCard";
import ActionButtons from "@/shared/components/ActionButtons";
export default function LegalEngineersPage() {
  const total = legalEngineers.length;
  const active = legalEngineers.filter((e) => e.status === "نشط").length;
  const inactive = total - active;

  return (
    <div className="legal-page">
      <PageHeader
        kicker="القسم القانوني"
        title="Engineers"
        subtitle="إدارة المهندسين المرتبطين بالقسم القانوني وعرض بياناتهم الأساسية."
        action={
          <button type="button" className="primary-action-btn">
            <Plus size={18} />
            <span>إضافة Engineer</span>
          </button>
        }
      />

      <div className="legal-stats-grid">
        <StatCard title="إجمالي المهندسين" value={total} note="السجلات الحالية" icon={UserRound} />
        <StatCard title="نشط" value={active} note="جاهز للعمل" icon={BriefcaseBusiness} />
        <StatCard title="متوقف" value={inactive} note="غير نشط" icon={Phone} />
      </div>

      <Toolbar
        placeholder="ابحث بالاسم أو التخصص..."
        selectOptions={[
          { value: "all", label: "كل الحالات" },
          { value: "active", label: "نشط" },
          { value: "inactive", label: "متوقف" },
        ]}
      />

      <TableCard title="جدول المهندسين" count={total}>
        <table className="legal-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>البريد</th>
              <th>التخصص</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {legalEngineers.map((engineer) => (
              <tr key={engineer.id}>
                <td>{engineer.name}</td>
                <td>{engineer.phone}</td>
                <td>{engineer.email}</td>
                <td>{engineer.specialty}</td>
                <td>
                  <StatusBadge
                    status={engineer.status}
                    type={engineer.status === "نشط" ? "ok" : "off"}
                  />
                </td>
                <td>
                  <ActionButtons />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}