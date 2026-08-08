import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarClock,
  FileText,
  BadgeCheck,
  TrendingUp,
  Activity,
  Clock,
  Building2,
  PieChart as PieChartIcon,
  Loader2,
  ClipboardList,
} from "lucide-react";

// استدعاء دالة الترجمة مباشرة من ملف الـ i18n الخاص بالمشروع
import { t } from "../../../shared/i18n";

// استدعاء الـ Thunks باستخدام المسارات النسبية للمشروع
import { fetchAvailableSlots } from "../features/availableSlots/model/availableSlot.thunks";
import { fetchContracts, fetchOrders } from "../features/contracts/model/contract.thunks";
import { fetchSoldUnitOwnership } from "../features/soldUnits/model/soldUnitOwnership.thunks";

import "../styles/legal.css";

import StatusBadge from "@/shared/components/StatusBadge";

export default function LegalDashboardPage() {
  const dispatch = useDispatch();

  // 1. استخراج الحالات المباشرة من Redux Store
  const { items: slots, loading: slotsLoading } = useSelector((state) => state.availableSlots || { items: [] });
  const { items: contracts, orders, loading: contractsLoading } = useSelector((state) => state.contract || { items: [], orders: [] });
  const { items: soldUnits, loading: soldUnitsLoading } = useSelector((state) => state.soldUnitOwnership || { items: [] });

  // 2. طلب البيانات الحقيقية من السيرفر عند فتح اللوحة
  useEffect(() => {
    dispatch(fetchAvailableSlots());
    dispatch(fetchContracts(1));
    dispatch(fetchOrders());
    dispatch(fetchSoldUnitOwnership(1));
  }, [dispatch]);

  // حالة التحميل العامة
  const isGlobalLoading = slotsLoading || contractsLoading || soldUnitsLoading;

  // 3. استخلاص وتحليل الإحصائيات الحقيقية من البيانات الجاهزة
  const metrics = useMemo(() => {
    const totalSlots = slots?.length || 0;
    const availableSlots = slots?.filter((s) => s.status === "متاح" || s.status === "available" || s.is_available)?.length || 0;
    const closedSlots = slots?.filter((s) => s.status === "مغلق" || s.status === "closed" || !s.is_available)?.length || 0;
    const reservedSlots = totalSlots - (availableSlots + closedSlots);

    const totalContracts = contracts?.length || 0;
    const totalOrders = orders?.length || 0;
    const totalSoldUnits = soldUnits?.length || 0;

    const availablePercent = totalSlots ? Math.round((availableSlots / totalSlots) * 100) : 0;
    const closedPercent = totalSlots ? Math.round((closedSlots / totalSlots) * 100) : 0;
    const reservedPercent = totalSlots ? Math.round((reservedSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      availableSlots,
      closedSlots,
      reservedSlots,
      totalContracts,
      totalOrders,
      totalSoldUnits,
      availablePercent,
      closedPercent,
      reservedPercent,
    };
  }, [slots, contracts, orders, soldUnits]);

  return (
    <div className="legal-page" dir="rtl">
      {/* المؤشر في حالة التحميل */}
      {isGlobalLoading && (
        <div className="legal-loading-banner">
          <Loader2 className="animate-spin" size={18} />
          <span>{t("legal_dashboard.loading_stats")}</span>
        </div>
      )}

      {/* الكاردات العلوية المنسقة والربطية */}
      <div className="legal-top-stats">
        {/* كارد 1: إجمالي السلات */}
        <div className="legal-stat-box">
          <div className="stat-box-top">
            <span className="stat-box-title">{t("legal_dashboard.total_slots")}</span>
            <div className="stat-box-icon">
              <CalendarClock size={20} />
            </div>
          </div>
          <div className="stat-box-value">{metrics.totalSlots}</div>
          <div className="stat-box-note">{t("legal_dashboard.total_slots_note")}</div>
        </div>

        {/* كارد 2: العقود الموثقة */}
        <div className="legal-stat-box">
          <div className="stat-box-top">
            <span className="stat-box-title">{t("legal_dashboard.total_contracts")}</span>
            <div className="stat-box-icon success">
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-box-value">{metrics.totalContracts}</div>
          <div className="stat-box-note success">{t("legal_dashboard.total_contracts_note")}</div>
        </div>

        {/* كارد 3: الطلبات الواردة */}
        <div className="legal-stat-box">
          <div className="stat-box-top">
            <span className="stat-box-title">{t("legal_dashboard.total_orders")}</span>
            <div className="stat-box-icon accent">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="stat-box-value">{metrics.totalOrders}</div>
          <div className="stat-box-note accent">{t("legal_dashboard.total_orders_note")}</div>
        </div>

        {/* كارد 4: الوحدات المباعة والمملوكة */}
        <div className="legal-stat-box">
          <div className="stat-box-top">
            <span className="stat-box-title">{t("legal_dashboard.total_sold_units")}</span>
            <div className="stat-box-icon danger">
              <Building2 size={20} />
            </div>
          </div>
          <div className="stat-box-value">{metrics.totalSoldUnits}</div>
          <div className="stat-box-note">{t("legal_dashboard.sold_units_note")}</div>
        </div>
      </div>

      {/* قسم التحليلات والمخططات */}
      <div className="legal-analytics-grid">
        {/* مخطط توزيع حالة السلات */}
        <div className="legal-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>{t("legal_dashboard.slots_distribution_title")}</h3>
              <p>{t("legal_dashboard.slots_distribution_subtitle")}</p>
            </div>
            <div className="chart-header-badge">
              <PieChartIcon size={16} />
              <span>{t("legal_dashboard.updated_now")}</span>
            </div>
          </div>

          <div className="chart-body-donut">
            <div className="donut-chart-wrapper">
              <svg viewBox="0 0 36 36" className="donut-chart">
                <path
                  className="donut-ring"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="donut-segment available"
                  strokeDasharray={`${metrics.availablePercent}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="donut-center-text">
                <strong>{metrics.availablePercent}%</strong>
                <span>{t("legal_dashboard.available_vacancies")}</span>
              </div>
            </div>

            <div className="chart-legend-list">
              <div className="legend-item">
                <span className="legend-dot available"></span>
                <div className="legend-info">
                  <span className="legend-title">{t("legal_dashboard.available_slots")}</span>
                  <strong>
                    {metrics.availableSlots} {t("legal_dashboard.appointment_unit")} ({metrics.availablePercent}%)
                  </strong>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot reserved"></span>
                <div className="legend-info">
                  <span className="legend-title">{t("legal_dashboard.reserved_slots")}</span>
                  <strong>
                    {metrics.reservedSlots} {t("legal_dashboard.appointment_unit")} ({metrics.reservedPercent}%)
                  </strong>
                </div>
              </div>

              <div className="legend-item">
                <span className="legend-dot closed"></span>
                <div className="legend-info">
                  <span className="legend-title">{t("legal_dashboard.closed_slots")}</span>
                  <strong>
                    {metrics.closedSlots} {t("legal_dashboard.appointment_unit")} ({metrics.closedPercent}%)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* مخطط مؤشرات الإنجاز الجاري */}
        <div className="legal-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>{t("legal_dashboard.workflow_indicators_title")}</h3>
              <p>{t("legal_dashboard.workflow_indicators_subtitle")}</p>
            </div>
            <div className="chart-header-badge success">
              <TrendingUp size={16} />
              <span>{t("legal_dashboard.live_indicators")}</span>
            </div>
          </div>

          <div className="chart-body-bars">
            <div className="bar-metric-group">
              <div className="bar-metric-head">
                <span>
                  <BadgeCheck size={14} /> {t("legal_dashboard.available_slots_rate")}
                </span>
                <strong>{metrics.availablePercent}%</strong>
              </div>
              <div className="legal-progress-track">
                <div
                  className="legal-progress-fill success"
                  style={{ width: `${metrics.availablePercent}%` }}
                ></div>
              </div>
            </div>

            <div className="bar-metric-group">
              <div className="bar-metric-head">
                <span>
                  <FileText size={14} /> {t("legal_dashboard.orders_conversion_rate")}
                </span>
                <strong>
                  {metrics.totalOrders > 0
                    ? Math.round((metrics.totalContracts / metrics.totalOrders) * 100)
                    : 0}%
                </strong>
              </div>
              <div className="legal-progress-track">
                <div
                  className="legal-progress-fill accent"
                  style={{
                    width: `${
                      metrics.totalOrders > 0
                        ? Math.min(100, Math.round((metrics.totalContracts / metrics.totalOrders) * 100))
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="legal-mini-banner">
              <Activity size={18} />
              <span>{t("legal_dashboard.server_slices_note")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* الجداول والمعاينة الحية للبيانات */}
      <div className="legal-summary-grid">
        {/* قائمة العقود الأخيرة */}
        <section className="legal-summary-card">
          <div className="legal-summary-head">
            <div className="head-title-wrap">
              <div className="head-icon-box">
                <FileText size={18} />
              </div>
              <div>
                <h2>{t("legal_dashboard.latest_contracts")}</h2>
                <p>{t("legal_dashboard.latest_contracts_subtitle")}</p>
              </div>
            </div>
            <span className="count-pill">
              {metrics.totalContracts} {t("legal_dashboard.contract_unit")}
            </span>
          </div>

          <div className="legal-preview-list">
            {contracts && contracts.length > 0 ? (
              contracts.slice(0, 4).map((contract, idx) => (
                <div className="preview-row" key={contract.id || idx}>
                  <div className="preview-row-main">
                    <div className="row-time-badge">
                      <Clock size={14} />
                      <span>{contract.created_at || t("legal_dashboard.unspecified_date")}</span>
                    </div>
                    <strong>
                      {t("legal_dashboard.contract_number", { id: contract.id || idx + 1 })}
                    </strong>
                  </div>

                  <StatusBadge
                    status={contract.status || t("legal_dashboard.status_active")}
                    type={contract.status === "approved" || contract.status === "موافق" ? "ok" : "busy"}
                  />
                </div>
              ))
            ) : (
              <div className="empty-state-text">{t("legal_dashboard.no_contracts_found")}</div>
            )}
          </div>
        </section>

        {/* قائمة السلات المتاحة الأخيرة */}
        <section className="legal-summary-card">
          <div className="legal-summary-head">
            <div className="head-title-wrap">
              <div className="head-icon-box">
                <CalendarClock size={18} />
              </div>
              <div>
                <h2>{t("legal_dashboard.latest_available_slots")}</h2>
                <p>{t("legal_dashboard.latest_available_slots_subtitle")}</p>
              </div>
            </div>
            <span className="count-pill">
              {metrics.totalSlots} {t("legal_dashboard.appointment_unit")}
            </span>
          </div>

          <div className="legal-preview-list">
            {slots && slots.length > 0 ? (
              slots.slice(0, 4).map((slot, idx) => (
                <div className="preview-row" key={slot.id || idx}>
                  <div className="preview-row-main">
                    <div className="row-time-badge">
                      <Clock size={14} />
                      <span>{slot.start_time || slot.start } {slot.end_time || slot.end }</span>
                    </div>
                    <strong>{slot.date || slot.day || t("legal_dashboard.slot_appointment")}</strong>
                  </div>

                  <StatusBadge
                    status={
                      slot.status ||
                      (slot.is_available
                        ? t("legal_dashboard.status_available")
                        : t("legal_dashboard.status_closed"))
                    }
                    type={slot.is_available || slot.status === "متاح" ? "ok" : "off"}
                  />
                </div>
              ))
            ) : (
              <div className="empty-state-text">{t("legal_dashboard.no_slots_found")}</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}