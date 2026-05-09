import {
  Plus,
  
  CalendarDays,
  Clock3,
  BadgeCheck,
  CircleSlash2,
} from "lucide-react";
import { legalSlots } from "../constants/legalDashboardData";
import "../styles/legal.css";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import StatusBadge from "@/shared/components/StatusBadge";
import Toolbar from "@/shared/components/Toolbar";
import TableCard from "@/shared/components/TableCard";
import ActionButtons from "@/shared/components/ActionButtons";
export default function LegalAvailableSlotsPage() {
  const total = legalSlots.length;
  const available = legalSlots.filter((s) => s.status === "متاح").length;
  const booked = legalSlots.filter((s) => s.status === "محجوز").length;
  const closed = legalSlots.filter((s) => s.status === "مغلق").length;

  return (
    <div className="legal-page">
      <PageHeader
        kicker="القسم القانوني"
        title="Available Slots"
        subtitle="إدارة المواعيد المتاحة للقسم القانوني مع التحكم بالحالة والسعة."
        action={
          <button type="button" className="primary-action-btn">
            <Plus size={18} />
            <span>إضافة Slot</span>
          </button>
        }
      />

      <div className="legal-stats-grid">
        <StatCard title="إجمالي السلات" value={total} note="كل المواعيد" icon={CalendarDays} />
        <StatCard title="المتاح" value={available} note="جاهز للحجز" icon={BadgeCheck} />
        <StatCard title="محجوز" value={booked} note="مواعيد ممتلئة" icon={Clock3} />
        <StatCard title="مغلق" value={closed} note="غير متاح" icon={CircleSlash2} />
      </div>

      <Toolbar
        placeholder="ابحث بالتاريخ أو الحالة..."
        selectOptions={[
          { value: "all", label: "كل الحالات" },
          { value: "available", label: "متاح" },
          { value: "booked", label: "محجوز" },
          { value: "closed", label: "مغلق" },
        ]}
      />

      <TableCard title="جدول السلات" count={total}>
        <table className="legal-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البداية</th>
              <th>النهاية</th>
              <th>السعة</th>
              <th>المحجوز</th>
              <th>الحالة</th>
              <th>ملاحظات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {legalSlots.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.date}</td>
                <td>{slot.start}</td>
                <td>{slot.end}</td>
                <td>{slot.capacity}</td>
                <td>{slot.booked}</td>
                <td>
                  <StatusBadge
                    status={slot.status}
                    type={
                      slot.status === "متاح"
                        ? "ok"
                        : slot.status === "محجوز"
                        ? "busy"
                        : "off"
                    }
                  />
                </td>
                <td>{slot.note}</td>
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