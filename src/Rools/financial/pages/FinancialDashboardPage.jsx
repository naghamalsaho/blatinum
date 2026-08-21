import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TrendingUp,
  TrendingDown,
  
  BarChart3,
  PieChart,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Percent,
  Calculator,
  ShieldCheck,
  Activity,
 
  Layers
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";

import {
  fetchTransfers,
  fetchTransferSummary,
} from "../features/transfers/model/transfer.thunks";

import "../styles/financial-dashboard.css";

function formatCurrency(amount, currency = "USD") {
  const numeric = Number(amount || 0);
  if (currency === "USD") return `$${numeric.toLocaleString("en-US")}`;
  return `${numeric.toLocaleString("ar-SY")} ${currency}`;
}

const CATEGORY_LABELS = {
  down_payment: "دفعة أولى",
  installment: "أقساط شهريّة",
  rent: "إيجارات",
  warehouse_purchase: "مشتريات وتجهيزات",
};

export default function FinancialDashboardPage() {
  const dispatch = useDispatch();

  // Redux State
  const {
    items: transfers = [],
    summary = { total_receipts: 0, total_payments: 0, net_balance: 0 },
  
  } = useSelector((state) => state.transfers || state.financialTransfers || {});

  useEffect(() => {
    dispatch(fetchTransfers());
    dispatch(fetchTransferSummary());
  }, [dispatch]);

  // 1. شبكة المؤشرات المالية الرئيسية (6 بطاقات KPIs)
  const stats = useMemo(() => {
    const totalCount = transfers.length || 0;
    const totalVolume = summary.total_receipts + summary.total_payments;
    const collectionRate = totalVolume > 0 
      ? Math.round((summary.total_receipts / totalVolume) * 100) 
      : 0;
    const avgTransaction = totalCount > 0 ? Math.round(totalVolume / totalCount) : 0;
    const pendingTransfers = transfers.filter(t => t.status === 'pending');
    const pendingAmount = pendingTransfers.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    return [
      {
        title: "صافي السيولة والرصيد",
        value: formatCurrency(summary.net_balance),
        icon: Wallet,
        highlight: summary.net_balance >= 0 ? "positive" : "negative"
      },
      {
        title: "إجمالي المقبوضات",
        value: formatCurrency(summary.total_receipts),
        icon: TrendingUp,
      },
      {
        title: "إجمالي المدفوعات",
        value: formatCurrency(summary.total_payments),
        icon: TrendingDown,
      },
      {
        title: "معدل التحصيل المالي",
        value: `${collectionRate}%`,
        icon: Percent,
      },
      {
        title: "متوسط قيمة المعاملات",
        value: formatCurrency(avgTransaction),
        icon: Calculator,
      },
      {
        title: "معاملات قيد الانتظار",
        value: formatCurrency(pendingAmount),
        icon: Activity,
      },
    ];
  }, [summary, transfers]);

  // 2. تحليل الرسوم البيانية والتوزيعات
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

  // 3. نسبة الأمان والاستقرار المالي
  const totalVolume = summary.total_receipts + summary.total_payments;
  const receiptsPercentage = totalVolume > 0 ? Math.round((summary.total_receipts / totalVolume) * 100) : 50;
  const paymentsPercentage = totalVolume > 0 ? Math.round((summary.total_payments / totalVolume) * 100) : 50;

  return (
    <div className="financial-dashboard-page" dir="rtl">
      
      {/* 1. شبكة البطاقات الإحصائية الرئيسية */}
      <section className="legal-stats-grid">
        {stats.map((item, idx) => (
          <StatCard
            key={idx}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>

      {/* 2. شبكة التحليلات والرسوم البيانية المتقدمة */}
      <section className="financial-dash-charts-grid">
        
        {/* اللوحة الأولى: التدفقات المالية النقدية (Inflow vs Outflow) */}
        <article className="chart-panel-card">
          <div className="chart-panel-head">
            <div>
              <h3>
                <BarChart3 size={18} style={{ color: "var(--dash-accent)" }} />{" "}
                تحليل نسبة التدفقات المالية
              </h3>
              <p>مقارنة شاملة بين نسبة الواردات والصادارات المالية</p>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div className="flow-bar-item">
              <div className="flow-bar-info">
                <span>
                  <ArrowDownCircle size={16} color="#10b981" /> المقبوضات (الواردات)
                </span>
                <strong>{formatCurrency(summary.total_receipts)} ({receiptsPercentage}%)</strong>
              </div>
              <div className="flow-progress-track">
                <div
                  className="flow-progress-fill success"
                  style={{ width: `${receiptsPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flow-bar-item" style={{ marginTop: "18px" }}>
              <div className="flow-bar-info">
                <span>
                  <ArrowUpCircle size={16} color="#ef4444" /> المدفوعات (المصروفات)
                </span>
                <strong>{formatCurrency(summary.total_payments)} ({paymentsPercentage}%)</strong>
              </div>
              <div className="flow-progress-track">
                <div
                  className="flow-progress-fill danger"
                  style={{ width: `${paymentsPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </article>

        {/* اللوحة الثانية: الدونات شارت لتوزيع المبالغ حسب التصنيف */}
        <article className="chart-panel-card">
          <div className="chart-panel-head">
            <div>
              <h3>
                <PieChart size={18} style={{ color: "var(--dash-accent)" }} />{" "}
                توزيع السيولة حسب البنود
              </h3>
              <p>نسب توزيع الأموال الموزعة على الأقساط والدفعات والإيجارات</p>
            </div>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="table-state">لا توجد بيانات كافية للتوزيع</div>
          ) : (
            <div className="donut-and-legend">
              <div className="svg-donut-wrapper">
                <svg viewBox="0 0 36 36" className="donut-svg">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="var(--dash-line)"
                    strokeWidth="3.8"
                  />
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
                <div className="donut-center-text">البنود</div>
              </div>

              <div className="chart-legend-list">
                {categoryChartData.map((item) => (
                  <div key={item.key} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="legend-label">{item.label}</span>
                    <strong className="legend-value">{item.percentage}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* اللوحة الثالثة: تفاصيل المبالغ بالتصنيف (Category Breakdown Progress) */}
        <article className="chart-panel-card">
          <div className="chart-panel-head">
            <div>
              <h3>
                <Layers size={18} style={{ color: "var(--dash-accent)" }} />{" "}
                تفاصيل أحجام المبالغ حسب التصنيف
              </h3>
              <p>القيمة المالية الفعلية لكل فئة من فئات التعاملات</p>
            </div>
          </div>

          <div className="category-breakdown-list" style={{ marginTop: "12px" }}>
            {categoryChartData.length === 0 ? (
              <div className="table-state">لا توجد بيانات متاحة</div>
            ) : (
              categoryChartData.map((cat) => (
                <div key={cat.key} className="cat-breakdown-item">
                  <div className="cat-breakdown-head">
                    <span className="cat-title">{cat.label}</span>
                    <span className="cat-amount">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="flow-progress-track" style={{ height: "6px" }}>
                    <div
                      className="flow-progress-fill"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* اللوحة الرابعة: ملخص الاستقرار المالي والسيولة النقدية */}
        <article className="chart-panel-card">
          <div className="chart-panel-head">
            <div>
              <h3>
                <ShieldCheck size={18} style={{ color: "var(--dash-accent)" }} />{" "}
                مؤشر الاستقرار والسلامة المالية
              </h3>
              <p>نظرة عامة على صحة الصندوق والتدفقات المالية</p>
            </div>
          </div>

          <div className="health-indicators-wrapper">
            <div className="health-metric-box">
              <div className="metric-info">
                <span>تغطية المقبوضات للمصروفات</span>
                <strong className={summary.total_receipts >= summary.total_payments ? "text-success" : "text-danger"}>
                  {summary.total_payments > 0 
                    ? `${(summary.total_receipts / summary.total_payments).toFixed(2)}x`
                    : "ممتاز"}
                </strong>
              </div>
              <p className="metric-desc">
                {summary.total_receipts >= summary.total_payments
                  ? "المقبوضات تغطي جميع المدفوعات والمصروفات الحالية بنجاح."
                  : "تنبيه: حجم المدفوعات أعلى من المقبوضات الحالية."}
              </p>
            </div>

            <div className="health-metric-box">
              <div className="metric-info">
                <span>إجمالي الحركات المنجزة</span>
                <strong>{transfers.length} معاملة</strong>
              </div>
              <p className="metric-desc">
                عدد الحركات المالية الموثقة والمقيدة في النظام حتى الآن.
              </p>
            </div>
          </div>
        </article>

      </section>
    </div>
  );
}