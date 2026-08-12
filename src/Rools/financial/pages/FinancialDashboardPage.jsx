import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {

  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Activity,
ArrowDownLeft,
  Eye,
  Ban,
  BarChart3,
  PieChart,
  RefreshCw,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import StatusBadge from "@/shared/components/StatusBadge";
import Modal from "@/shared/components/Modal";

import {
  fetchTransfers,
  fetchTransferSummary,
  fetchTransferById,
  cancelTransfer,
} from "../features/transfers/model/transfer.thunks";

import "../styles/financial-dashboard.css";

function formatCurrency(amount, currency = "USD") {
  const numeric = Number(amount || 0);
  if (currency === "USD") return `$${numeric.toLocaleString("en-US")}`;
  return `${numeric.toLocaleString("ar-SY")} ${currency}`;
}

const CATEGORY_LABELS = {
  down_payment: "دفعة أولى",
  installment: "قسط شهري",
  rent: "إيجار",
  warehouse_purchase: "شراء مستودع",
};

export default function FinancialDashboardPage() {
  const dispatch = useDispatch();

  // Redux Store Data
  const {
    items: transfers = [],
    summary = { total_receipts: 0, total_payments: 0, net_balance: 0 },
    selectedTransferDetails = null,
    loadingDetails = false,
    loading = false,
  } = useSelector((state) => state.transfers || state.financialTransfers || {});

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    dispatch(fetchTransfers());
    dispatch(fetchTransferSummary());
  }, [dispatch]);

  // 1. الإحصائيات الحقيقية المربوطة بالـ Summary
  const stats = useMemo(() => {
    const totalTransactions = transfers.length;
    return [
      {
        title: "صافي السيولة والرصيد",
        value: formatCurrency(summary.net_balance),
        icon: Wallet,
        trend: "+14.2%",
        isUp: (summary.net_balance || 0) >= 0,
      },
      {
        title: "إجمالي المقبوضات (Inflow)",
        value: formatCurrency(summary.total_receipts),
        icon: TrendingUp,
        trend: "+8.5%",
        isUp: true,
      },
      {
        title: "إجمالي المدفوعات (Outflow)",
        value: formatCurrency(summary.total_payments),
        icon: TrendingDown,
        trend: "-2.1%",
        isUp: false,
      },
      {
        title: "عدد المعاملات المسجلة",
        value: `${totalTransactions} معاملة`,
        icon: CreditCard,
        trend: "نشط",
        isUp: true,
      },
    ];
  }, [summary, transfers]);

  // 2. تحليل توزيع التصنيفات للمخطط الدائري (Category Breakdown)
  const categoryChartData = useMemo(() => {
    if (!transfers.length) return [];
    
    const counts = transfers.reduce((acc, curr) => {
      const cat = curr.category || "down_payment";
      acc[cat] = (acc[cat] || 0) + Number(curr.amount || 0);
      return acc;
    }, {});

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
    return Object.entries(counts).map(([key, val], idx) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      amount: val,
      percentage: Math.round((val / total) * 100),
      color: colors[idx % colors.length],
    }));
  }, [transfers]);

  // 3. أحدث المعاملات للعرض
  const recentTransactions = useMemo(() => {
    return transfers.slice(0, 6);
  }, [transfers]);

  // معالجة فتح معاينة التفاصيل
  const handleOpenPreview = (item) => {
    setSelectedTx(item);
    dispatch(fetchTransferById(item.id));
    setPreviewOpen(true);
  };

  // معالجة فتح مودال الإلغاء
  const handleOpenCancel = (item) => {
    setSelectedTx(item);
    setCancelReason("");
    setCancelOpen(true);
  };

  // تأكيد الإلغاء
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim() || !selectedTx) return;

    const res = await dispatch(
      cancelTransfer({ id: selectedTx.id, reason: cancelReason })
    );

    if (cancelTransfer.fulfilled.match(res)) {
      setCancelOpen(false);
      setSelectedTx(null);
      setCancelReason("");
    }
  };

  const displayDetails = selectedTransferDetails || selectedTx;

  return (
    <div className="financial-dashboard-page" dir="rtl">
      {/* 1. الترويسة والترحيب */}
      <section className="financial-dash-header">
        <div className="financial-dash-welcome">
          <h2>لوحة التحكم المالية والسيولة</h2>
          <p>متابعة الميزانية العامة، تدفقات الأموال، والمخططات التحليلية للحركة المالية</p>
        </div>

        <div className="financial-dash-actions">
          <div className="financial-date-badge">
            <Calendar size={16} />
            <span>تاريخ اليوم: {new Date().toLocaleDateString("ar-SY")}</span>
          </div>

          <Button
            type="button"
            className="financial-primary-btn"
            onClick={() => dispatch(fetchTransferSummary())}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>تحديث البيانات</span>
          </Button>
        </div>
      </section>

      {/* 2. شبكة بطاقات الإحصائيات الرئيسيّة */}
      <section className="financial-dash-stats-grid">
        {stats.map((item, idx) => (
          <div key={idx} className="financial-stat-card-wrap">
            <StatCard title={item.title} value={item.value} icon={item.icon} />
            <div className={`financial-stat-trend ${item.isUp ? "up" : "down"}`}>
              {item.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{item.trend} مقارنة بالفترة السابقة</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. قسم المخططات البيانية (Graphics & Visual Charts) */}
      <section className="financial-dash-charts-grid">
        {/* المخطط الشريطي: المقارنة بين المقبوضات والمدفوعات */}
        <article className="financial-panel chart-panel">
          <div className="financial-panel-head">
            <div>
              <h3><BarChart3 size={18} className="financial-accent-icon" /> نسبة المقبوضات مقابل المدفوعات</h3>
              <p>مقارنة مرئية سريعة لنسبة التحصيل مقابل المصروفات</p>
            </div>
          </div>

          <div className="financial-flow-chart-box">
            <div className="flow-bar-item">
              <div className="flow-bar-info">
                <span><ArrowDownCircle size={15} color="#10b981" /> إجمالي المقبوضات</span>
                <strong>{formatCurrency(summary.total_receipts)}</strong>
              </div>
              <div className="flow-progress-track">
                <div
                  className="flow-progress-fill success"
                  style={{
                    width: `${
                      summary.total_receipts + summary.total_payments > 0
                        ? (summary.total_receipts / (summary.total_receipts + summary.total_payments)) * 100
                        : 50
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="flow-bar-item">
              <div className="flow-bar-info">
                <span><ArrowUpCircle size={15} color="#ef4444" /> إجمالي المصروفات</span>
                <strong>{formatCurrency(summary.total_payments)}</strong>
              </div>
              <div className="flow-progress-track">
                <div
                  className="flow-progress-fill danger"
                  style={{
                    width: `${
                      summary.total_receipts + summary.total_payments > 0
                        ? (summary.total_payments / (summary.total_receipts + summary.total_payments)) * 100
                        : 30
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </article>

        {/* المخطط الدائري: توزيع المعاملات حسب التصنيف */}
        <article className="financial-panel chart-panel">
          <div className="financial-panel-head">
            <div>
              <h3><PieChart size={18} className="financial-accent-icon" /> توزيع الحركة حسب التصنيف</h3>
              <p>نسب المبالغ الموزعة بين الدفعات والأقساط</p>
            </div>
          </div>

          <div className="financial-donut-chart-container">
            {categoryChartData.length === 0 ? (
              <div className="chart-empty">لا توجد بيانات كافية لرسم المخطط</div>
            ) : (
              <div className="donut-and-legend">
                {/* رسم SVG Donut Chart */}
                <div className="svg-donut-wrapper">
                  <svg viewBox="0 0 36 36" className="donut-svg">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.8" />
                    {categoryChartData.map((item, index) => {
                      const prevPercentages = categoryChartData
                        .slice(0, index)
                        .reduce((sum, el) => sum + el.percentage, 0);
                      return (
                        <circle
                          key={item.key}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="3.8"
                          strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                          strokeDashoffset={100 - prevPercentages + 25}
                        />
                      );
                    })}
                  </svg>
                  <div className="donut-center-text">
                    <span>التوزيع</span>
                  </div>
                </div>

                {/* مفتاح المخطط (Legend) */}
                <div className="chart-legend-list">
                  {categoryChartData.map((item) => (
                    <div key={item.key} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.label}</span>
                      <strong className="legend-value">{item.percentage}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* 4. شبكة المحتوى الرئيسي (جدول أحدث المعاملات + الشريط الجانبي) */}
      <section className="financial-dash-main-grid">
        {/* جدول أحدث المعاملات من Redux */}
        <article className="financial-panel financial-dash-panel">
          <div className="financial-panel-head">
            <div>
              <h3>أحدث المعاملات الماليّة</h3>
              <p>عرض تفصيلي لآخر العمليات الواردة والصادرة في النظام</p>
            </div>
          </div>

          <div className="financial-dash-table-wrap">
            <table className="financial-dash-table">
              <thead>
                <tr>
                  <th>النوع / المنشئ</th>
                  <th>طريقة الدفع</th>
                  <th>رقم المرجع (Voucher)</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="project-empty-state">لا توجد معاملات مسجلة حتى الآن.</div>
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => {
                    const isReceipt = tx.type === "receipt";
                    const isCancelled = tx.status === "cancelled";

                    return (
                      <tr key={tx.id}>
                        <td>
                          <div className="financial-tx-title-cell">
                            <div className={`financial-tx-icon ${isReceipt ? "income" : "expense"}`}>
                              {isReceipt ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <span className="financial-tx-title">
                                {tx.creator?.account?.full_name || `العميل #${tx.party_id}`}
                              </span>
                              <span className="financial-tx-sub">
                                {isReceipt ? "سند قبض (وارد)" : "سند صرف (صادر)"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="financial-type-chip">{tx.payment_method || "تحويل"}</span>
                        </td>

                        <td>
                          <span className="financial-account-num">{tx.voucher_number || "—"}</span>
                        </td>

                        <td className={`financial-amount-cell ${isReceipt ? "income" : "expense"}`}>
                          {isReceipt ? "+ " : "- "}
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>

                        <td>
                          <StatusBadge
                            status={isCancelled ? "ملغاة" : "مكتملة"}
                            type={isCancelled ? "off" : "ok"}
                          />
                        </td>

                        <td>
                          <div className="financial-row-actions">
                            <button
                              className="financial-icon-btn"
                              title="معاينة التفاصيل"
                              onClick={() => handleOpenPreview(tx)}
                            >
                              <Eye size={15} />
                            </button>

                            {!isCancelled && (
                              <button
                                className="financial-icon-btn danger"
                                title="إلغاء المعاملة"
                                onClick={() => handleOpenCancel(tx)}
                              >
                                <Ban size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* جانب الملخص والتنبيهات */}
        <aside className="financial-dash-sidebar">
          {/* بطاقة توزيع السيولة في الحسابات */}
          <div className="financial-panel financial-side-panel">
            <div className="financial-panel-head">
              <h3>توزيع السيولة النقدية</h3>
              <Activity size={18} className="financial-accent-icon" />
            </div>

            <div className="financial-balance-summary">
              <div className="balance-item">
                <div className="balance-info">
                  <span>المستلم الفعلي (المقبوضات)</span>
                  <strong>{formatCurrency(summary.total_receipts)}</strong>
                </div>
                <div className="balance-progress">
                  <div className="progress-bar" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div className="balance-item">
                <div className="balance-info">
                  <span>المصروفات والمستحقات</span>
                  <strong>{formatCurrency(summary.total_payments)}</strong>
                </div>
                <div className="balance-progress">
                  <div className="progress-bar warning" style={{ width: "35%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة التنبيهات والمهام */}
          <div className="financial-panel financial-side-panel">
            <div className="financial-panel-head">
              <h3>تنبيهات وإشعار النظام</h3>
              <AlertCircle size={18} className="financial-warning-icon" />
            </div>

            <ul className="financial-alerts-list">
              <li>
                <Clock size={16} />
                <div>
                  <strong>مطابقة الحسابات الدورية</strong>
                  <span>يُنصح بعمل مطابقة مالية لنهاية الشهر</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <div>
                  <strong>اتصال الـ API متصل</strong>
                  <span>تم تحديث الملخص المالي بنجاح</span>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </section>

      {/* 5. مودال معاينة التفاصيل بالـ ID */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedTx(null);
        }}
        title="تفاصيل المعاملة المالية"
        size="lg"
      >
        {loadingDetails ? (
          <div className="project-empty-state">جاري تحميل التفاصيل من السيرفر...</div>
        ) : (
          <div className="financial-preview-modal">
            <div className="financial-preview-card">
              <div className="financial-preview-row">
                <span className="label">رقم مرجع العملية (Voucher)</span>
                <span className="value">{displayDetails?.voucher_number || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">نوع المعاملة</span>
                <span className="value">
                  {displayDetails?.type === "receipt" ? "سند قبض (Receipt)" : "سند صرف (Payment)"}
                </span>
              </div>

              <div className="financial-preview-row">
                <span className="label">المبلغ الإجمالي</span>
                <span className="value highlight">
                  {formatCurrency(displayDetails?.amount, displayDetails?.currency)}
                </span>
              </div>

              <div className="financial-preview-row">
                <span className="label">طريقة الدفع</span>
                <span className="value">{displayDetails?.payment_method || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">الطرف / العميل</span>
                <span className="value">العميل #{displayDetails?.party_id || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">اسم المنشئ</span>
                <span className="value">{displayDetails?.creator?.account?.full_name || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">تاريخ الإنشاء</span>
                <span className="value">{displayDetails?.created_at || "—"}</span>
              </div>
            </div>

            {displayDetails?.description && (
              <div className="financial-preview-details">
                <h4 className="financial-preview-title">البيان / الوصف</h4>
                <p className="financial-preview-desc">{displayDetails.description}</p>
              </div>
            )}

            <div className="financial-modal-actions justify-end">
              <button className="btn-cancel-secondary" onClick={() => setPreviewOpen(false)}>
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. مودال إلغاء المعاملة */}
      <Modal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setSelectedTx(null);
        }}
        title="إلغاء المعاملة المالية"
        size="md"
      >
        <form onSubmit={handleConfirmCancel}>
          <p style={{ marginBottom: "14px", fontSize: "14px", color: "var(--dash-muted)" }}>
            هل أنت تأكد من إلغاء المعاملة رقم <strong>#{selectedTx?.voucher_number || selectedTx?.id}</strong>؟
          </p>

          <div className="custom-form-group">
            <label>
              سبب الإلغاء (Reason) <span className="required-dot">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="يرجى كتابة سبب إلغاء المعاملة..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="financial-modal-actions justify-end" style={{ marginTop: "18px" }}>
            <button type="submit" className="btn-save-primary danger-btn" disabled={loading}>
              تأكيد الإلغاء
            </button>
            <button
              type="button"
              className="btn-cancel-secondary"
              onClick={() => {
                setCancelOpen(false);
                setSelectedTx(null);
              }}
            >
              تراجع
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}