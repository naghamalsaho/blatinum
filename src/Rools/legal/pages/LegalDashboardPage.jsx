import { useState, useEffect, useMemo } from "react";
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
  Plus,
  Trash2,
  Eye,
  Ban,
} from "lucide-react";

// المكونات والخدمات الموحدة بالمشروع
import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";
import StatusBadge from "@/shared/components/StatusBadge";
import { t } from "../../../shared/i18n";

// Thunks واستدعاء البيانات
import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
} from "../features/availableSlots/model/availableSlot.thunks";
import { fetchContracts, fetchOrders } from "../features/contracts/model/contract.thunks";
import { fetchSoldUnitOwnership } from "../features/soldUnits/model/soldUnitOwnership.thunks";

import "../styles/legal.css";

export default function LegalDashboardPage() {
  const dispatch = useDispatch();

  // 1. استخراج حالات Redux بحذر مع مراعاة الهيكلية الفعلية للـ Slices
  const availableSlotsSlice = useSelector((state) => state.availableSlots || {});
  const contractSlice = useSelector((state) => state.contract || {});
  const soldUnitsSlice = useSelector((state) => state.soldUnitOwnership || {});

  // استخراج المصفوفات بشكل آمن مع الفحوصات
  const slots = useMemo(() => {
    const data = availableSlotsSlice.slots || availableSlotsSlice;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data)) return data;
    return [];
  }, [availableSlotsSlice]);

  const contracts = useMemo(() => {
    if (Array.isArray(contractSlice.items)) return contractSlice.items;
    if (Array.isArray(contractSlice.contracts)) return contractSlice.contracts;
    if (Array.isArray(contractSlice)) return contractSlice;
    return [];
  }, [contractSlice]);

  const orders = useMemo(() => {
    if (Array.isArray(contractSlice.orders)) return contractSlice.orders;
    return [];
  }, [contractSlice]);

  const soldUnits = useMemo(() => {
    if (Array.isArray(soldUnitsSlice.items)) return soldUnitsSlice.items;
    if (Array.isArray(soldUnitsSlice)) return soldUnitsSlice;
    return [];
  }, [soldUnitsSlice]);

  const slotsLoading = availableSlotsSlice.slots?.loading ?? availableSlotsSlice.loading ?? false;
  const contractsLoading = contractSlice.loading ?? false;
  const soldUnitsLoading = soldUnitsSlice.loading ?? false;
  const isGlobalLoading = slotsLoading || contractsLoading || soldUnitsLoading;

  // 2. الحالات المحلية للفلترة، التبويب والمودال
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'contracts' | 'slots'
  const [searchTerm] = useState("");
  const [statusFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSlotData, setNewSlotData] = useState({ date: "", start_time: "", end_time: "" });

  // 3. جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchAvailableSlots());
    dispatch(fetchContracts(1));
    dispatch(fetchOrders());
    dispatch(fetchSoldUnitOwnership(1));
  }, [dispatch]);

  // 4. خريطة الحالات الموحدة لتطابق تصميم StatusBadge
  const STATUS_META = useMemo(
    () => ({
      available: { label: t("legal_slots.status_available") || "متاح", type: "ok" },
      booked: { label: t("legal_slots.status_booked") || "محجوز", type: "busy" },
      cancelled: { label: t("legal_slots.status_cancelled") || "ملغى", type: "off" },
      closed: { label: "مغلق", type: "off" },
      approved: { label: "موافق عليه", type: "ok" },
      pending: { label: "قيد الانتظار", type: "busy" },
      rejected: { label: "مرفوض", type: "off" },
    }),
    []
  );

  // 5. حساب الإحصائيات الحيوية
  const metrics = useMemo(() => {
    const totalSlots = slots.length;
    const availableSlots = slots.filter((s) => s.status === "available" || s.status === "متاح" || s.is_available).length;
    const cancelledSlots = slots.filter((s) => s.status === "cancelled" || s.status === "ملغى" || s.status === "closed").length;
    const bookedSlots = slots.filter((s) => s.status === "booked" || s.status === "محجوز").length;

    const totalContracts = contracts.length;
    const totalOrders = orders.length;
    const totalSoldUnits = soldUnits.length;

    const availablePercent = totalSlots ? Math.round((availableSlots / totalSlots) * 100) : 0;
    const bookedPercent = totalSlots ? Math.round((bookedSlots / totalSlots) * 100) : 0;
    const cancelledPercent = totalSlots ? Math.round((cancelledSlots / totalSlots) * 100) : 0;
    const conversionRate = totalOrders > 0 ? Math.round((totalContracts / totalOrders) * 100) : 0;

    return {
      totalSlots,
      availableSlots,
      cancelledSlots,
      bookedSlots,
      totalContracts,
      totalOrders,
      totalSoldUnits,
      availablePercent,
      bookedPercent,
      cancelledPercent,
      conversionRate,
    };
  }, [slots, contracts, orders, soldUnits]);

  // 6. فلترة العقود
  const filteredContracts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return contracts.filter((c) => {
      const matchSearch = !q || String(c.id).includes(q) || (c.status && c.status.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  // 7. فلترة الفترات/المواعيد
  const filteredSlots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return slots.filter((s) => {
      const matchSearch = !q || String(s.id).includes(q) || (s.date && s.date.includes(q));
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [slots, searchTerm, statusFilter]);

  // إنشاء فترة جديدة عبر المودال
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    const res = await dispatch(createAvailableSlot(newSlotData));
    if (createAvailableSlot.fulfilled.match(res)) {
      setCreateModalOpen(false);
      setNewSlotData({ date: "", start_time: "", end_time: "" });
      dispatch(fetchAvailableSlots());
    }
  };

  // إلغاء الفترة المتاحة
  const handleCancelSlot = async (slot) => {
    if (slot.status === "cancelled") return;
    const ok = window.confirm("هل أنت متأكد من إلغاء هذه الفترة؟");
    if (!ok) return;

    const res = await dispatch(
      updateAvailableSlot({
        id: slot.id,
        payload: { status: "cancelled" },
      })
    );
    if (updateAvailableSlot.fulfilled.match(res)) {
      dispatch(fetchAvailableSlots());
    }
  };

  // حذف الفترة المتاحة
  const handleDeleteSlot = async (id) => {
    const ok = window.confirm(t("legal_slots.confirm_delete") || "هل أنت متأكد من الحذف؟");
    if (!ok) return;

    const res = await dispatch(deleteAvailableSlot(id));
    if (deleteAvailableSlot.fulfilled.match(res)) {
      dispatch(fetchAvailableSlots());
    }
  };

  return (
    <div className="legal-dashboard-wrapper" dir="rtl">
      {/* بنر التحميل العائم */}
      {isGlobalLoading && (
        <div className="legal-loading-banner">
          <Loader2 className="animate-spin" size={18} />
          <span>{t("legal_dashboard.loading_stats") || "جاري تحديث البيانات الإحصائية..."}</span>
        </div>
      )}

      {/* شبكة البطاقات الإحصائية الموحدة (StatCard Grid) */}
      <section className="legal-stats-grid">
        <StatCard
          title={t("legal_dashboard.total_slots") || "إجمالي المواعيد"}
          value={String(metrics.totalSlots)}
          icon={CalendarClock}
        />
        <StatCard
          title={t("legal_dashboard.total_contracts") || "العقود الموثقة"}
          value={String(metrics.totalContracts)}
          icon={FileText}
        />
        <StatCard
          title={t("legal_dashboard.total_orders") || "الطلبات الواردة"}
          value={String(metrics.totalOrders)}
          icon={ClipboardList}
        />
        <StatCard
          title={t("legal_dashboard.total_sold_units") || "الوحدات المباعة"}
          value={String(metrics.totalSoldUnits)}
          icon={Building2}
        />
      </section>

      {/* شريط التبويب السريع للتنقل */}
      <div className="legal-slots-tabs-bar" style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className={`legal-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          النظرة العامة والتحليلات
        </button>
        
      </div>

      {/* محتوى التبويب 1: التحليلات والرسم البياني */}
      {activeTab === "overview" && (
        <>
          <div className="legal-analytics-grid">
            {/* كارد الرسم البياني الدائري */}
            <div className="legal-chart-card">
              <div className="chart-card-header">
                <div>
                  <h3>توزيع حالات المواعيد</h3>
                  <p>نسبة الشغور والحجوزات الحالية في النظام</p>
                </div>
                <div className="chart-header-badge">
                  <PieChartIcon size={16} />
                  <span>محدث الآن</span>
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
                    <span>المواعيد المتاحة</span>
                  </div>
                </div>

                <div className="chart-legend-list">
                  <div className="legend-item">
                    <span className="legend-dot available"></span>
                    <div className="legend-info">
                      <span className="legend-title">المواعيد المتاحة</span>
                      <strong>{metrics.availableSlots} موعد ({metrics.availablePercent}%)</strong>
                    </div>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot reserved"></span>
                    <div className="legend-info">
                      <span className="legend-title">المواعيد المحجوزة</span>
                      <strong>{metrics.bookedSlots} موعد ({metrics.bookedPercent}%)</strong>
                    </div>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot closed"></span>
                    <div className="legend-info">
                      <span className="legend-title">المواعيد الملغاة / المغلقة</span>
                      <strong>{metrics.cancelledSlots} موعد ({metrics.cancelledPercent}%)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* كارد مؤشرات الإنجاز والأشرطة */}
            <div className="legal-chart-card">
              <div className="chart-card-header">
                <div>
                  <h3>مؤشرات الأداء والجودة</h3>
                  <p>معدلات تحويل الطلبات واستغلال الشواغر</p>
                </div>
                <div className="chart-header-badge success">
                  <TrendingUp size={16} />
                  <span>مؤشرات حية</span>
                </div>
              </div>

              <div className="chart-body-bars">
                <div className="bar-metric-group">
                  <div className="bar-metric-head">
                    <span><BadgeCheck size={14} /> نسبة الفترات المتاحة</span>
                    <strong>{metrics.availablePercent}%</strong>
                  </div>
                  <div className="legal-progress-track">
                    <div className="legal-progress-fill success" style={{ width: `${metrics.availablePercent}%` }}></div>
                  </div>
                </div>

                <div className="bar-metric-group">
                  <div className="bar-metric-head">
                    <span><FileText size={14} /> معدل توثيق العقود للطلبات</span>
                    <strong>{metrics.conversionRate}%</strong>
                  </div>
                  <div className="legal-progress-track">
                    <div className="legal-progress-fill accent" style={{ width: `${metrics.conversionRate}%` }}></div>
                  </div>
                </div>

                <div className="legal-mini-banner">
                  <Activity size={18} />
                  <span>يتم مزامنة كافة العمليات مباشرة مع قاعدة البيانات الرئيسية.</span>
                </div>
              </div>
            </div>
          </div>

          {/* شبكة الجداول المعاينة للملخص */}
          <div className="legal-summary-grid">
            <section className="legal-summary-card">
              <div className="legal-summary-head">
                <div className="head-title-wrap">
                  <div className="head-icon-box"><FileText size={18} /></div>
                  <div>
                    <h2>أحدث العقود الموثقة</h2>
                    <p>معاينة فورية لآخر العقود المضافة</p>
                  </div>
                </div>
                <span className="count-pill">{contracts.length} عقد</span>
              </div>

              <div className="legal-preview-list">
                {contracts.length > 0 ? (
                  contracts.slice(0, 3).map((contract, idx) => (
                    <div className="preview-row" key={contract.id || idx}>
                      <div className="preview-row-main">
                        <div className="row-time-badge">
                          <Clock size={14} />
                          <span>{contract.created_at || "تاريخ غير محدد"}</span>
                        </div>
                        <strong>عقد رقم #{contract.id || idx + 1}</strong>
                      </div>
                      <StatusBadge
                        status={contract.status || "نشط"}
                        type={contract.status === "approved" ? "ok" : "busy"}
                      />
                    </div>
                  ))
                ) : (
                  <div className="empty-state-text">لا توجد عقود مسجلة حالياً</div>
                )}
              </div>
            </section>

            <section className="legal-summary-card">
              <div className="legal-summary-head">
                <div className="head-title-wrap">
                  <div className="head-icon-box"><CalendarClock size={18} /></div>
                  <div>
                    <h2>أحدث المواعيد القادمة</h2>
                    <p>المواعيد والشواغر القادمة</p>
                  </div>
                </div>
                <span className="count-pill">{slots.length} موعد</span>
              </div>

              <div className="legal-preview-list">
                {slots.length > 0 ? (
                  slots.slice(0, 3).map((slot, idx) => {
                    const meta = STATUS_META[slot.status] || {
                      label: slot.status || "متاح",
                      type: "ok",
                    };
                    return (
                      <div className="preview-row" key={slot.id || idx}>
                        <div className="preview-row-main">
                          <div className="row-time-badge">
                            <Clock size={14} />
                            <span>{slot.start_time || "09:00"} - {slot.end_time || "10:00"}</span>
                          </div>
                          <strong>{slot.date || "موعد محدد"}</strong>
                        </div>
                        <StatusBadge status={meta.label} type={meta.type} />
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state-text">لا توجد مواعيد مضافة</div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* محتوى التبويب 2: جدول العقود */}
      {activeTab === "contracts" && (
        <TableCard title="جدول العقود الموثقة" count={filteredContracts.length}>
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>رقم العقد</th>
                  <th>نوع العقد</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td><strong>#{contract.id}</strong></td>
                      <td>{contract.type || "عقد توثيق قانوني"}</td>
                      <td>
                        <StatusBadge
                          status={contract.status || "نشط"}
                          type={contract.status === "approved" ? "ok" : "busy"}
                        />
                      </td>
                      <td className="services-date">{contract.created_at || "—"}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-action-btn" title="معاينة">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-cell">لا توجد عقود مطابقة للبند المحدد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* محتوى التبويب 3: جدول المواعيد */}
      {activeTab === "slots" && (
        <TableCard title="جدول المواعيد والفترات" count={filteredSlots.length}>
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>المعرف</th>
                  <th>التاريخ</th>
                  <th>التوقيت</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.length > 0 ? (
                  filteredSlots.map((slot) => {
                    const meta = STATUS_META[slot.status] || {
                      label: slot.status || "متاح",
                      type: "ok",
                    };
                    return (
                      <tr key={slot.id}>
                        <td><strong>#{slot.id}</strong></td>
                        <td>{slot.date || "—"}</td>
                        <td>
                          <span className="services-price">
                            {slot.start_time || "—"} {slot.end_time ? `إلى ${slot.end_time}` : ""}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>
                        <td>
                          <div className="row-actions">
                            {slot.status !== "cancelled" && (
                              <button
                                type="button"
                                className="icon-action-btn danger"
                                onClick={() => handleCancelSlot(slot)}
                                title="إلغاء الفترة"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-cell">لا توجد مواعيد مطابقة للبحث.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* مودال إضافة موعد جديد */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="إضافة موعد / فترة جديدة"
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreateSlot}>
          <Field
            type="date"
            name="date"
            value={newSlotData.date}
            onChange={(e) => setNewSlotData((prev) => ({ ...prev, date: e.target.value }))}
            label="تاريخ الفترة (Date)"
            required
          />

          <div className="modal-grid">
            <Field
              type="time"
              name="start_time"
              value={newSlotData.start_time}
              onChange={(e) => setNewSlotData((prev) => ({ ...prev, start_time: e.target.value }))}
              label="وقت البداية"
              required
            />
            <Field
              type="time"
              name="end_time"
              value={newSlotData.end_time}
              onChange={(e) => setNewSlotData((prev) => ({ ...prev, end_time: e.target.value }))}
              label="وقت النهاية"
              required
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => setCreateModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" className="exact-primary-btn">
              <Plus size={16} />
              <span>حفظ الموعد</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}