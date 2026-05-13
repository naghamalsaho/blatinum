import {
  CalendarClock,
  Users2,
  BadgeCheck,
  CircleSlash2,
} from "lucide-react";
import { legalSlots, legalEngineers } from "../constants/legalDashboardData";
import "../styles/legal.css";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import StatusBadge from "@/shared/components/StatusBadge";
export default function LegalDashboardPage() {
  const totalSlots = legalSlots.length;
  const availableSlots = legalSlots.filter((s) => s.status === "متاح").length;
  const closedSlots = legalSlots.filter((s) => s.status === "مغلق").length;
  const totalEngineers = legalEngineers.length;

  return (
    <div className="legal-page">
      <PageHeader
        kicker="القسم القانوني"
        title="لوحة القسم القانوني"
        subtitle="نظرة عامة على السلات المتاحة والمهندسين المرتبطين بالقسم القانوني."
      />

      <div className="legal-stats-grid">
        <StatCard key="total-slots" title="إجمالي السلات" value={totalSlots} note="كل المواعيد" icon={CalendarClock} />
        <StatCard key="available-slots" title="السلات المتاحة" value={availableSlots} note="جاهزة للحجز" icon={BadgeCheck} />
        <StatCard key="closed-slots" title="السلات المغلقة" value={closedSlots} note="غير متاحة" icon={CircleSlash2} />
        <StatCard key="engineers" title="المهندسون" value={totalEngineers} note="ضمن القسم" icon={Users2} />
      </div>

      <div className="legal-summary-grid">
        <section className="legal-summary-card">
          <div className="legal-summary-head">
            <h2>Available Slots</h2>
            <span>{totalSlots} سجل</span>
          </div>

          <div className="legal-preview-list">
            {legalSlots.slice(0, 3).map((slot) => (
              <div className="preview-row" key={slot.id}>
                <div>
                  <strong>{slot.date}</strong>
                  <p>
                    {slot.start} - {slot.end}
                  </p>
                </div>
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
              </div>
            ))}
          </div>
        </section>

        <section className="legal-summary-card">
          <div className="legal-summary-head">
            <h2>Engineers</h2>
            <span>{totalEngineers} سجل</span>
          </div>

          <div className="legal-preview-list">
            {legalEngineers.slice(0, 3).map((eng) => (
              <div className="preview-row" key={eng.id}>
                <div>
                  <strong>{eng.name}</strong>
                  <p>{eng.specialty}</p>
                </div>
                <StatusBadge
                  status={eng.status}
                  type={eng.status === "نشط" ? "ok" : "off"}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}