import { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Eye,
 
  TrendingUp,
  CalendarDays,
  Activity,
  Sparkles,
  ArrowUpRight,
  MousePointerClick,
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

import { useDispatch, useSelector } from "react-redux";

import StatCard from "@/shared/components/StatCard";

import Modal from "@/shared/components/Modal";


import {
  fetchAdvertisements,
  fetchActiveAdvertisements,
} from "../features/advertisements/model/advertisement.thunks";

import "../styles/marketing.css";

const adsFallback = [
  {
    id: "AD-001",
    title: "عرض موسم الصيف - برج النخيل",
    type: "إعلان",
    status: "active",
    views: "1,240",
    clicks: "87",
    date: "2024-01-10",
    starts_at: "2024-01-10",
    ends_at: "2024-02-10",
    duration_days: 30,
    description: "عرض موسمي مميز على برج النخيل.",
    attachments: [],
  },
  {
    id: "AD-002",
    title: "خصم 10% على الشقق المتبقية",
    type: "عرض ترويجي",
    status: "active",
    views: "890",
    clicks: "62",
    date: "2024-01-12",
    starts_at: "2024-01-12",
    ends_at: "2024-02-12",
    duration_days: 30,
    description: "خصم خاص لفترة محدودة.",
    attachments: [],
  },
  {
    id: "AD-003",
    title: "مشروع واجهة البحر - الإطلاق",
    type: "إعلان",
    status: "draft",
    views: "0",
    clicks: "0",
    date: "2024-01-14",
    starts_at: "2024-01-14",
    ends_at: "2024-02-14",
    duration_days: 30,
    description: "إعلان إطلاق المشروع الجديد.",
    attachments: [],
  },
  {
    id: "AD-004",
    title: "عرض دفعة الحجز المريحة",
    type: "عرض ترويجي",
    status: "scheduled",
    views: "430",
    clicks: "25",
    date: "2024-01-18",
    starts_at: "2024-01-18",
    ends_at: "2024-02-18",
    duration_days: 30,
    description: "عرض دفعة حجز مرنة.",
    attachments: [],
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

const MONTH_LABELS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const STATUS_COLORS = [
  "var(--dash-accent)",
  "var(--dash-accent-strong)",
  "var(--dash-muted)",
  "var(--dash-shell-glow-1)",
];

function isAdvertisementActive(advertisement) {
  if (typeof advertisement?.status === "boolean") return advertisement.status;
  if (typeof advertisement?.is_active === "boolean") return advertisement.is_active;
  if (advertisement?.status === "active") return true;
  if (advertisement?.status === 1 || advertisement?.status === "1") return true;
  return false;
}

function getAdStatus(ad) {
  const raw = ad?.status;

  if (raw === true || raw === 1 || raw === "1" || raw === "active") return "active";
  if (raw === false || raw === 0 || raw === "0" || raw === "draft") return "draft";
  if (raw === "scheduled") return "scheduled";
  if (raw === "review" || raw === "pending") return "pending";

  return "draft";
}

function getSafeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAdMonthKey(ad) {
  const date =
    getSafeDate(ad?.created_at) ||
    getSafeDate(ad?.starts_at) ||
    getSafeDate(ad?.date);

  if (!date) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getFirstImage(advertisement) {
  return (
    advertisement?.attachments?.find((item) => item.type === "image")?.url ||
    null
  );
}

function formatDate(value) {
  return value || "—";
}

export default function MarketingDashboardPage() {
  const dispatch = useDispatch();

  const adsState = useSelector((state) => state.advertisements || {});
  const liveAdvertisements =
    adsState.advertisements ||
    adsState.items ||
    adsState.data ||
    [];

  const activeAdvertisementsFromStore =
    adsState.activeAdvertisements ||
    adsState.activeItems ||
    [];

  const advertisements =
    liveAdvertisements.length > 0 ? liveAdvertisements : adsFallback;

  const activeAdvertisements =
    activeAdvertisementsFromStore.length > 0
      ? activeAdvertisementsFromStore
      : advertisements.filter(isAdvertisementActive);

  
  

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAdvertisement, setPreviewAdvertisement] = useState(null);

 
  useEffect(() => {
    dispatch(fetchAdvertisements());
    dispatch(fetchActiveAdvertisements());
  }, [dispatch]);

  const latestActiveAd = useMemo(() => {
    return activeAdvertisements[0] || null;
  }, [activeAdvertisements]);

  const performanceData = useMemo(() => {
    const result = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

      const adsInMonth = advertisements.filter((ad) => {
        const adKey = getAdMonthKey(ad);
        return adKey === monthKey;
      });

      result.push({
        key: monthKey,
        name: MONTH_LABELS_AR[monthIndex],
        campaigns: adsInMonth.length,
        ads: adsInMonth.filter((ad) => getAdStatus(ad) === "active").length,
      });
    }

    return result;
  }, [advertisements]);

  const distributionData = useMemo(() => {
    const active = advertisements.filter((ad) => getAdStatus(ad) === "active").length;
    
    const draft = advertisements.filter((ad) => getAdStatus(ad) === "draft").length;
   

    return [
      { name: "نشط", value: active, count: active },
      
      { name: "مسودة", value: draft, count: draft },
     
    ];
  }, [advertisements]);

  const stats = useMemo(() => {
    const totalViews = advertisements.reduce(
      (sum, ad) => sum + Number(ad.views || ad.view_count || 0),
      0
    );

    const totalClicks = advertisements.reduce(
      (sum, ad) => sum + Number(ad.clicks || ad.click_count || 0),
      0
    );

    const conversionRate =
      totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

    return [
      {
        title: "إجمالي الإعلانات",
        value: String(advertisements.length),
        note: "كل الإعلانات المسجلة",
        icon: Megaphone,
      },
      {
        title: "الإعلانات النشطة",
        value: String(activeAdvertisements.length),
        note: "تعمل حاليًا",
        icon: Activity,
      },
      {
        title: "مشاهدات هذا الشهر",
        value: totalViews ? totalViews.toLocaleString() : "0",
        note: "حسب البيانات المتوفرة",
        icon: Eye,
      },
      {
        title: "معدل التحويل",
        value: `${conversionRate}%`,
        note: "النقرات ÷ المشاهدات",
        icon: TrendingUp,
      },
    ];
  }, [advertisements, activeAdvertisements.length]);

 

  const openImagePreview = (advertisement) => {
    setPreviewAdvertisement(advertisement);
    setPreviewOpen(true);
  };



  return (
    <div className="marketing-dashboard-page">
      

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
              {activeAdvertisements.length} إعلان نشط
            </span>
          </div>
        </div>

        <div className="marketing-hero-card">
          <div className="marketing-hero-card-head">
            <div>
              <p>أحدث إعلان نشط</p>
              <h3>{latestActiveAd?.title || "لا يوجد إعلان نشط"}</h3>
            </div>

            <div className="marketing-hero-icon">
              <MousePointerClick size={20} />
            </div>
          </div>

          <div className="marketing-summary-action-area">
            {latestActiveAd ? (
              <button
                type="button"
                className="marketing-view-dialog-btn"
                onClick={() => openImagePreview(latestActiveAd)}
                title="عرض التفاصيل"
              >
                <Eye size={18} />
                <span>عرض تفاصيل الإعلان</span>
              </button>
            ) : (
              <div className="marketing-summary-preview-empty">
                <Megaphone size={24} />
              </div>
            )}
          </div>

          <div className="marketing-hero-metrics">
            <div>
              <strong>البداية</strong>
              <span>{formatDate(latestActiveAd?.starts_at)}</span>
            </div>
            <div>
              <strong>النهاية</strong>
              <span>{formatDate(latestActiveAd?.ends_at)}</span>
            </div>
            <div>
              <strong>المدة</strong>
              <span>{latestActiveAd?.duration_days || "—"} يوم</span>
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
             <AreaChart
  data={performanceData}
  margin={{ top: 10, right: 18, left: 0, bottom: 24 }}
>
                <defs>
                  <linearGradient
                    id="campaignFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--dash-accent)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--dash-accent)"
                      stopOpacity={0}
                    />
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

                <CartesianGrid strokeDasharray="4 4" stroke="var(--dash-line)" />

                <XAxis
                  dataKey="name"
                  stroke="var(--dash-muted)"
                  tick={{ dy: 8 }}
                  tickMargin={10}
                  minTickGap={18}
                  interval={0}
                />

                <YAxis
                  stroke="var(--dash-muted)"
                  width={45}
                  tick={{ dx: -8 }}
                  tickMargin={10}
                  allowDecimals={false}
                  domain={[0, "dataMax + 2"]}
                />

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
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                <Area
                  type="monotone"
                  dataKey="ads"
                  stroke="var(--dash-accent-strong)"
                  fill="url(#adsFill)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
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
                <Tooltip
                  contentStyle={{
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-line)",
                    borderRadius: "16px",
                    color: "var(--dash-text)",
                  }}
                />
                <Pie
                  data={distributionData}
                  dataKey="count"
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
                <strong>
                  {item.count} ({item.value}%)
                </strong>
              </div>
            ))}
          </div>
        </article>
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
                  <span className="marketing-unit-chip">{item.units} وحدة</span>

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
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewAdvertisement?.title || "معاينة الإعلان"}
        description="عرض الصورة والوصف الكامل"
        size="lg"
      >
        <div className="marketing-preview-modal">
          {getFirstImage(previewAdvertisement) ? (
            <div className="marketing-image-preview">
              <img
                src={getFirstImage(previewAdvertisement)}
                alt={previewAdvertisement?.title || "preview"}
              />
            </div>
          ) : (
            <div className="marketing-summary-preview-empty">
              <Megaphone size={28} />
            </div>
          )}

          <div className="marketing-preview-details">
            <h3>{previewAdvertisement?.title || "-"}</h3>
            <p>{previewAdvertisement?.description || "لا يوجد وصف."}</p>

            <div className="marketing-hero-metrics">
              <div>
                <strong>البداية</strong>
                <span>{formatDate(previewAdvertisement?.starts_at)}</span>
              </div>

              <div>
                <strong>النهاية</strong>
                <span>{formatDate(previewAdvertisement?.ends_at)}</span>
              </div>

              <div>
                <strong>المدة</strong>
                <span>{previewAdvertisement?.duration_days || "—"} يوم</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}