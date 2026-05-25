import { useMemo, useState } from "react";
import {
  Megaphone,
  Tag,
  Eye,
  
  Plus,
  TrendingUp,
  Image as ImageIcon,
  CalendarDays,
  Activity,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import Field from "@/shared/components/Field";

import "../styles/marketing.css";

const stats = [
  {
    title: "إجمالي الإعلانات",
    value: "12",
    note: "كل الإعلانات المسجلة",
    icon: Megaphone,
  },
  {
    title: "الإعلانات النشطة",
    value: "8",
    note: "تعمل حاليًا",
    icon: Activity,
  },
  {
    title: "مشاهدات هذا الشهر",
    value: "15.4K",
    note: "أداء جيد خلال 30 يوم",
    icon: Eye,
  },
  {
    title: "معدل التحويل",
    value: "6.8%",
    note: "نمو مستمر",
    icon: TrendingUp,
  },
];

const ads = [
  {
    id: "AD-001",
    title: "عرض موسم الصيف - برج النخيل",
    type: "إعلان",
    status: "active",
    views: "1,240",
    clicks: "87",
    date: "2024-01-10",
  },
  {
    id: "AD-002",
    title: "خصم 10% على الشقق المتبقية",
    type: "عرض ترويجي",
    status: "active",
    views: "890",
    clicks: "62",
    date: "2024-01-12",
  },
  {
    id: "AD-003",
    title: "مشروع واجهة البحر - الإطلاق",
    type: "إعلان",
    status: "draft",
    views: "0",
    clicks: "0",
    date: "2024-01-14",
  },
  {
    id: "AD-004",
    title: "عرض دفعة الحجز المريحة",
    type: "عرض ترويجي",
    status: "scheduled",
    views: "430",
    clicks: "25",
    date: "2024-01-18",
  },
];

const portfolio = [
  {
    id: "PRT-001",
    name: "برج النخيل",
    type: "مشروع سكني",
    units: 48,
    year: "2023",
    image: "🏗️",
  },
  {
    id: "PRT-002",
    name: "واجهة البحر",
    type: "مشروع فاخر",
    units: 32,
    year: "2022",
    image: "🌊",
  },
  {
    id: "PRT-003",
    name: "الروضة ريزيدنس",
    type: "مشروع متوسط",
    units: 64,
    year: "2021",
    image: "🌿",
  },
];

const performanceData = [
  { name: "أغسطس", campaigns: 34, ads: 20 },
  { name: "سبتمبر", campaigns: 44, ads: 28 },
  { name: "أكتوبر", campaigns: 41, ads: 22 },
  { name: "نوفمبر", campaigns: 57, ads: 35 },
  { name: "ديسمبر", campaigns: 61, ads: 39 },
  { name: "يناير", campaigns: 72, ads: 48 },
];

const distributionData = [
  { name: "نشط", value: 42 },
  { name: "مجدول", value: 28 },
  { name: "مسودة", value: 18 },
  { name: "تحت المراجعة", value: 12 },
];

const ACTIVITY = [
  "تم إطلاق حملة جديدة على برج النخيل",
  "تم تعديل عرض الخصم الموسمي",
  "تم أرشفة إعلان منخفض الأداء",
  "تم رفع معدل التفاعل بنسبة 12%",
];

const STATUS_COLORS = [
  "var(--dash-accent)",
  "var(--dash-accent-strong)",
  "var(--dash-muted)",
  "var(--dash-shell-glow-1)",
];

function getStatusLabel(status) {
  if (status === "active") return "نشط";
  if (status === "draft") return "مسودة";
  if (status === "scheduled") return "مجدول";
  return status || "-";
}

export default function MarketingDashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState("ad");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    type: "إعلان",
    status: "active",
    views: "0",
    clicks: "0",
    date: "",
    budget: "",
  });

  const filteredAds = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return ads.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const searchable = [
        item.title,
        item.type,
        item.status,
        item.views,
        item.clicks,
        item.date,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [searchTerm, statusFilter]);

  const openCreateModal = (type = "ad") => {
    setCreateType(type);
    setCreateOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCreateOpen(false);
  };

  return (
    <div className="marketing-dashboard-page">
      <PageHeader
        kicker="قسم التسويق"
        title="لوحة التسويق"
        subtitle="إدارة الإعلانات والعروض والتحليلات من مكان واحد"
        action={
          <div className="marketing-header-actions">
            <Button
              type="button"
              className="marketing-secondary-btn"
              onClick={() => openCreateModal("offer")}
            >
              <Plus size={18} />
              <span>عرض جديد</span>
            </Button>

            <Button
              type="button"
              className="marketing-primary-btn"
              onClick={() => openCreateModal("ad")}
            >
              <Sparkles size={18} />
              <span>إعلان جديد</span>
            </Button>
          </div>
        }
      />

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="marketing-hero-kicker">Marketing Performance Center</p>
          <h1>تحكم كامل بالإعلانات والعروض مع قراءة فورية للأداء</h1>
          <p className="marketing-hero-text">
            لوحة تسويق واضحة وسريعة تعرض لك أهم الحملات، توزيع الحالة، ونسب
            التفاعل بطريقة حديثة ومناسبة لنظامك الداكن.
          </p>

          <div className="marketing-hero-chips">
            <span className="marketing-chip">
              <CalendarDays size={14} />
              آخر تحديث: اليوم
            </span>
            <span className="marketing-chip">
              <ArrowUpRight size={14} />
              +24% نمو هذا الشهر
            </span>
          </div>
        </div>

        <div className="marketing-hero-card">
          <div className="marketing-hero-card-head">
            <div>
              <p>أداء الحملة الحالية</p>
              <h3>78%</h3>
            </div>
            <div className="marketing-hero-icon">
              <Activity size={20} />
            </div>
          </div>

          <div className="marketing-hero-metrics">
            <div>
              <strong>الطلبات</strong>
              <span>1,240</span>
            </div>
            <div>
              <strong>الضغطات</strong>
              <span>84</span>
            </div>
            <div>
              <strong>المشاهدات</strong>
              <span>3.2M</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            note={item.note}
            icon={item.icon}
          />
        ))}
      </section>

      <section className="marketing-analytics-grid">
        <article className="marketing-panel marketing-chart-panel">
          <div className="marketing-panel-head">
            <div>
              <h2>نشاط النظام</h2>
              <p>آخر 6 أشهر</p>
            </div>
          </div>

          <div className="marketing-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient
                    id="campaignFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="var(--dash-accent)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--dash-accent)" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="adsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--dash-accent-strong)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dash-accent-strong)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--dash-line)"
                />
                <XAxis dataKey="name" stroke="var(--dash-muted)" />
                <YAxis stroke="var(--dash-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-line)",
                    borderRadius: "16px",
                    color: "var(--dash-text)",
                  }}
                  labelStyle={{ color: "var(--dash-text)" }}
                />
                <Area
                  type="monotone"
                  dataKey="campaigns"
                  stroke="var(--dash-accent)"
                  fill="url(#campaignFill)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="ads"
                  stroke="var(--dash-accent-strong)"
                  fill="url(#adsFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="marketing-panel marketing-donut-panel">
          <div className="marketing-panel-head">
            <div>
              <h2>حالة الإعلانات</h2>
              <p>توزيع سريع حسب الحالة</p>
            </div>
          </div>

          <div className="marketing-donut-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={4}
                >
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="marketing-donut-legend">
            {distributionData.map((item, index) => (
              <div key={item.name} className="marketing-legend-item">
                <span
                  className="marketing-legend-dot"
                  style={{ background: STATUS_COLORS[index % STATUS_COLORS.length] }}
                />
                <span>{item.name}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="marketing-main-grid">
        <article className="marketing-panel">
          <div className="marketing-panel-head">
            <div>
              <h2>الإعلانات والعروض</h2>
              <p>قائمة الإدارة السريعة مع إجراءات مباشرة</p>
            </div>

            <Button
              type="button"
              className="marketing-secondary-btn"
              onClick={() => openCreateModal("ad")}
            >
              <Plus size={16} />
              <span>إعلان جديد</span>
            </Button>
          </div>

          <div className="marketing-toolbar">
            <div className="marketing-search">
              <input
                type="text"
                placeholder="ابحث بعنوان الإعلان أو نوعه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="marketing-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
            </select>
          </div>

          <div className="marketing-table-wrap">
            <table className="marketing-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>المشاهدات</th>
                  <th>النقرات</th>
                  <th>تاريخ النشر</th>
                  <th>إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredAds.map((item) => (
                  <tr key={item.id}>
                    <td className="marketing-primary-td">{item.title}</td>

                    <td>
                      <span className="marketing-type-chip">
                        <Tag size={12} />
                        {item.type}
                      </span>
                    </td>

                    <td>
                      <span className={`marketing-status-pill ${item.status}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>

                    <td className="marketing-metric marketing-metric--views">
                      {item.views}
                    </td>

                    <td className="marketing-metric marketing-metric--clicks">
                      {item.clicks}
                    </td>

                    <td className="marketing-date">{item.date}</td>

                    <td>
                      <div className="marketing-row-actions">
                        <button type="button" className="marketing-icon-btn">
                          <Eye size={14} />
                        </button>
                        <button type="button" className="marketing-icon-btn">
                          <Sparkles size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="marketing-side-column">
          <article className="marketing-panel">
            <div className="marketing-panel-head">
              <div>
                <h2>آخر الإشعارات</h2>
                <p>تحديثات مباشرة للنشاط التسويقي</p>
              </div>
            </div>

            <div className="marketing-activity-list">
              {ACTIVITY.map((item) => (
                <div key={item} className="marketing-activity-item">
                  <span className="activity-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="marketing-panel marketing-settings-panel">
            <div className="marketing-panel-head">
              <div>
                <h2>اختصارات سريعة</h2>
                <p>الوصول المباشر لأهم العمليات</p>
              </div>
            </div>

            <div className="marketing-quick-actions">
              <Button
                type="button"
                className="marketing-secondary-btn marketing-full-btn"
                onClick={() => openCreateModal("offer")}
              >
                <Plus size={16} />
                <span>إنشاء عرض</span>
              </Button>

              <Button
                type="button"
                className="marketing-secondary-btn marketing-full-btn"
                onClick={() => openCreateModal("ad")}
              >
                <ImageIcon size={16} />
                <span>إعلان بوسائط</span>
              </Button>
            </div>
          </article>
        </aside>
      </section>

      <section className="marketing-portfolio-section">
        <div className="marketing-panel-head marketing-section-head">
          <div>
            <h2>معرض الأعمال</h2>
            <p>المشاريع التي يمكن الترويج لها في الحملات التسويقية</p>
          </div>
        </div>

        <div className="marketing-portfolio-grid">
          {portfolio.map((item) => (
            <article key={item.id} className="marketing-portfolio-card">
              <div className="marketing-portfolio-hero">{item.image}</div>

              <div className="marketing-portfolio-body">
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.type} · {item.year}
                  </p>
                </div>

                <div className="marketing-portfolio-footer">
                  <span className="marketing-unit-chip">
                    {item.units} وحدة
                  </span>

                  <div className="marketing-row-actions">
                    <button type="button" className="marketing-icon-btn">
                      <Eye size={13} />
                    </button>
                    <button type="button" className="marketing-icon-btn">
                      <Sparkles size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={createType === "ad" ? "إعلان جديد" : "عرض جديد"}
        description="أدخل البيانات الأساسية ثم احفظ التغييرات."
        size="lg"
      >
        <form className="marketing-modal-form" onSubmit={handleSubmit}>
          <div className="marketing-modal-grid">
            <Field
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              label="العنوان"
              iconClass="fa-solid fa-heading"
              error=""
            />

            <Field
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              label="النوع"
              iconClass="fa-solid fa-tag"
              error=""
            />

            <Field
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              label="تاريخ النشر"
              iconClass="fa-solid fa-calendar"
              error=""
            />

            <Field
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              label="الميزانية"
              iconClass="fa-solid fa-coins"
              error=""
            />
          </div>

          <div className="marketing-modal-grid marketing-modal-grid--single">
            <Field
              type="text"
              name="views"
              value={formData.views}
              onChange={handleChange}
              label="المشاهدات"
              iconClass="fa-solid fa-eye"
              error=""
            />

            <Field
              type="text"
              name="clicks"
              value={formData.clicks}
              onChange={handleChange}
              label="النقرات"
              iconClass="fa-solid fa-hand-pointer"
              error=""
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="marketing-secondary-btn"
              onClick={() => setCreateOpen(false)}
            >
              إلغاء
            </Button>

            <Button type="submit" className="marketing-primary-btn">
              <Plus size={16} />
              <span>حفظ</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}