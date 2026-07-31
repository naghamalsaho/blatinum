import {  useMemo } from "react";
import {  useSelector } from "react-redux";
import {
  DollarSign,
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
  Plus,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import StatusBadge from "@/shared/components/StatusBadge";

// import { fetchPayments } from "../features/payments/model/payment.thunks";
import "../styles/financial-dashboard.css";

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "0 ل.س";
  return `${Number(amount).toLocaleString("ar-SY")} ل.س`;
}

export default function FinancialDashboardPage() {
//   const dispatch = useDispatch();

  const { payments = []} = useSelector(
    (state) => state.payments || state.financialPayments || {}
  );

//   useEffect(() => {
//     dispatch(fetchPayments());
//   }, [dispatch]);

  // إحصائيات سريعة للوحة التحكم
  const stats = useMemo(() => {
    const totalTransactions = payments.length;
    const totalAmount = payments.reduce(
      (sum, item) => sum + Number(item.amount_limit || item.amount || 0),
      0
    );

    return [
      {
        title: "إجمالي التدفقات والسيولة",
        value: formatCurrency(totalAmount),
        icon: DollarSign,
        trend: "+12.5%",
        isUp: true,
      },
      {
        title: "إجمالي المقبوضات",
        value: formatCurrency(totalAmount * 0.65),
        icon: TrendingUp,
        trend: "+8.2%",
        isUp: true,
      },
      {
        title: "إجمالي المدفوعات والمعاملات",
        value: formatCurrency(totalAmount * 0.35),
        icon: TrendingDown,
        trend: "-3.1%",
        isUp: false,
      },
      {
        title: "نشاط طرق الدفع",
        value: `${totalTransactions} طرق مسجلة`,
        icon: CreditCard,
        trend: "مستقر",
        isUp: true,
      },
    ];
  }, [payments]);

  // معاملات وهمية/مثالية للعرض السريع
  const recentTransactions = useMemo(() => {
    if (payments.length > 0) {
      return payments.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title || item.name || `عملية #${item.id}`,
        type: item.type === "cash" ? "نقدي" : "تحويل بنكي",
        amount: item.amount_limit || item.amount || 150000,
        status: item.status === "active" || item.status === 1 ? "مكتملة" : "قيد المراجعة",
        statusType: item.status === "active" || item.status === 1 ? "ok" : "busy",
        date: item.created_at || "اليوم",
        isIncome: true,
      }));
    }

    return [
      {
        id: 101,
        title: "دفعة عقد صيانة هندسية",
        type: "تحويل بنكي",
        amount: 4500000,
        status: "مكتملة",
        statusType: "ok",
        date: "2026-07-27",
        isIncome: true,
      },
      {
        id: 102,
        title: "سداد رسوم استشارات قانونية",
        type: "نقدي (كاش)",
        amount: 850000,
        status: "مكتملة",
        statusType: "ok",
        date: "2026-07-26",
        isIncome: true,
      },
      {
        id: 103,
        title: "شراء مستلزمات مكتبية وتجهيزات",
        type: "شيك مصرفي",
        amount: 320000,
        status: "قيد المراجعة",
        statusType: "busy",
        date: "2026-07-25",
        isIncome: false,
      },
      {
        id: 104,
        title: "تحصيل دفعة مشروع Platinum",
        type: "تحويل بنكي",
        amount: 12000000,
        status: "مكتملة",
        statusType: "ok",
        date: "2026-07-24",
        isIncome: true,
      },
      {
        id: 105,
        title: "مصاريف تشغيلية ودورية",
        type: "نقدي (كاش)",
        amount: 150000,
        status: "ملغاة",
        statusType: "off",
        date: "2026-07-23",
        isIncome: false,
      },
    ];
  }, [payments]);

  return (
    <div className="financial-dashboard-page" dir="rtl">
      {/* 1. الترويسة والترحيب */}
      <section className="financial-dash-header">
        <div className="financial-dash-welcome">
          <h2>لوحة التحكم المالية</h2>
          <p>متابعة الميزانية العامة، التدفقات النقدية، وأحدث المعاملات اليومية</p>
        </div>

        <div className="financial-dash-actions">
          <div className="financial-date-badge">
            <Calendar size={16} />
            <span>اليوم: {new Date().toLocaleDateString("ar-SY")}</span>
          </div>

          <Button type="button" className="financial-primary-btn">
            <Plus size={16} />
            <span>معاملة جديدة</span>
          </Button>
        </div>
      </section>

      {/* 2. شبكة بطاقات الإحصائيات */}
      <section className="financial-dash-stats-grid">
        {stats.map((item, idx) => (
          <div key={idx} className="financial-stat-card-wrap">
            <StatCard
              title={item.title}
              value={item.value}
              icon={item.icon}
            />
            <div className={`financial-stat-trend ${item.isUp ? "up" : "down"}`}>
              {item.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{item.trend} مقارنة بالشهر السابق</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. شبكة المحتوى الرئيسي (جدول العمليات + بطاقات الملخص) */}
      <section className="financial-dash-main-grid">
        {/* جدول أحدث المعاملات */}
        <article className="financial-panel financial-dash-panel">
          <div className="financial-panel-head">
            <div>
              <h3>أحدث المعاملات المالية</h3>
              <p>استعراض آخر العمليات المسجلة في النظام</p>
            </div>
            <Button type="button" className="financial-text-btn">
              عرض الكل
            </Button>
          </div>

          <div className="financial-dash-table-wrap">
            <table className="financial-dash-table">
              <thead>
                <tr>
                  <th>الوصف / البيان</th>
                  <th>طريقة الدفع</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className="financial-tx-title-cell">
                        <div
                          className={`financial-tx-icon ${
                            tx.isIncome ? "income" : "expense"
                          }`}
                        >
                          {tx.isIncome ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownRight size={16} />
                          )}
                        </div>
                        <span className="financial-tx-title">{tx.title}</span>
                      </div>
                    </td>

                    <td>
                      <span className="financial-type-chip">{tx.type}</span>
                    </td>

                    <td
                      className={`financial-amount-cell ${
                        tx.isIncome ? "income" : "expense"
                      }`}
                    >
                      {tx.isIncome ? "+ " : "- "}
                      {formatCurrency(tx.amount)}
                    </td>

                    <td className="financial-date">{tx.date}</td>

                    <td>
                      <StatusBadge status={tx.status} type={tx.statusType} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* جانب الملخص والمؤشرات */}
        <aside className="financial-dash-sidebar">
          {/* بطاقة توزيع السيولة */}
          <div className="financial-panel financial-side-panel">
            <div className="financial-panel-head">
              <h3>ملخص الحسابات</h3>
              <Activity size={18} className="financial-accent-icon" />
            </div>

            <div className="financial-balance-summary">
              <div className="balance-item">
                <div className="balance-info">
                  <span>مصرف سوريا الدولي</span>
                  <strong>45,000,000 ل.س</strong>
                </div>
                <div className="balance-progress">
                  <div className="progress-bar" style={{ width: "70%" }}></div>
                </div>
              </div>

              <div className="balance-item">
                <div className="balance-info">
                  <span>الصندوق الرئيسي (كاش)</span>
                  <strong>12,500,000 ل.س</strong>
                </div>
                <div className="balance-progress">
                  <div className="progress-bar accent" style={{ width: "40%" }}></div>
                </div>
              </div>

              <div className="balance-item">
                <div className="balance-info">
                  <span>حساب الشيكات تحت التحصيل</span>
                  <strong>8,200,000 ل.س</strong>
                </div>
                <div className="balance-progress">
                  <div className="progress-bar warning" style={{ width: "25%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة التنبيهات والمهام المالية */}
          <div className="financial-panel financial-side-panel">
            <div className="financial-panel-head">
              <h3>تنبيهات واستحقاقات</h3>
              <AlertCircle size={18} className="financial-warning-icon" />
            </div>

            <ul className="financial-alerts-list">
              <li>
                <Clock size={16} />
                <div>
                  <strong>استثناء عقد #842</strong>
                  <span>يحتاج موافقة اعتماد مالية</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <div>
                  <strong>مطابقة الحساب الشهرية</strong>
                  <span>تمت المطابقة بنجاح</span>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}