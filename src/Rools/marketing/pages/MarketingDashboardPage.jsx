import { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Eye,
  TrendingUp,
  Activity,
 
  Percent,
  Home,
  Briefcase,
 
  CalendarDays,
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

import { fetchOffers } from "../features/offer/model/offer.thunks";

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

// function getFirstImage(advertisement) {
//   return (
//     advertisement?.attachments?.find((item) => item.type === "image")?.url ||
//     null
//   );
// }

function formatDate(value) {
  return value ? String(value).split(" ")[0] : "—";
}

function formatPrice(amount) {
  if (!amount && amount !== 0) return "—";
  return Number(amount).toLocaleString("ar-EG") + " ل.س";
}

export default function MarketingDashboardPage() {
  const dispatch = useDispatch();

  // جلب الإعلانات
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

  // جلب العروض
  const offersState = useSelector((state) => state.offers || state.offer || {});
  const offersList = offersState?.items || offersState?.offers || [];
  const offersLoading = offersState?.loading || false;

  // أحدث 3 عروض فقط
  const latestOffers = useMemo(() => {
    return [...offersList].reverse().slice(0, 3);
  }, [offersList]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);

  useEffect(() => {
    dispatch(fetchAdvertisements());
    dispatch(fetchActiveAdvertisements());
    dispatch(fetchOffers());
  }, [dispatch]);

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
        icon: Megaphone,
      },
      {
        title: "الإعلانات النشطة",
        value: String(activeAdvertisements.length),
        icon: Activity,
      },
      {
        title: "مشاهدات هذا الشهر",
        value: totalViews ? totalViews.toLocaleString() : "0",
        icon: Eye,
      },
      {
        title: "معدل التحويل",
        value: `${conversionRate}%`,
        icon: TrendingUp,
      },
    ];
  }, [advertisements, activeAdvertisements.length]);

  const openOfferPreview = (offer) => {
    setPreviewOffer(offer);
    setPreviewOpen(true);
  };

  return (
    <div className="marketing-dashboard-page" dir="rtl">
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
                  <linearGradient id="campaignFill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="var(--dash-accent)" stopOpacity={0.35} offset="5%" />
                    <stop stopColor="var(--dash-accent)" stopOpacity={0} offset="95%" />
                  </linearGradient>

                  <linearGradient id="adsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="var(--dash-accent-strong)" stopOpacity={0.28} offset="5%" />
                    <stop stopColor="var(--dash-accent-strong)" stopOpacity={0} offset="95%" />
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

      {/* قسم أحدث العروض والخصومات بدلاً من المعرض القديم */}
      <section className="marketing-portfolio-section">
        <div className="marketing-panel-head marketing-section-head">
          <div>
            <h2>أحدث العروض والخصومات</h2>
            
          </div>
        </div>

        {offersLoading ? (
          <div className="project-empty-state">جاري تحميل العروض...</div>
        ) : latestOffers.length === 0 ? (
          <div className="project-empty-state">لا توجد عروض متاحة حالياً</div>
        ) : (
          <div className="marketing-portfolio-grid">
            {latestOffers.map((item) => {
              const isService = !!item.item?.name;
              const title = isService
                ? item.item?.name
                : item.item?.unit_number
                ? `شقة رقم ${item.item.unit_number}`
                : "عرض خاص";

              return (
                <article key={item.id} className="marketing-portfolio-card">
                  <div
                    className="marketing-portfolio-hero"
                    style={{
                      background: "var(--dash-shell-glow-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                    }}
                  >
                    {isService ? <Briefcase size={32} /> : <Home size={32} />}
                  </div>

                  <div className="marketing-portfolio-body">
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h3>{title}</h3>
                        <span
                          style={{
                            background: "var(--dash-accent-soft, rgba(230, 81, 0, 0.1))",
                            color: "var(--dash-accent)",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Percent size={11} /> {item.discount_percentage}%خصم
                        </span>
                      </div>

                      <p style={{ marginTop: "6px", fontSize: "13px" }}>
                        {isService
                          ? "خدمة تخصصية"
                          : item.item?.building_id
                          ? `مبنى رقم ${item.item.building_id}`
                          : "وحدة سكنية"}
                      </p>
                    </div>

                    <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "baseline" }}>
                      <span style={{ textDecoration: "line-through", color: "var(--dash-muted)", fontSize: "12px" }}>
                        {formatPrice(item.old_price)}
                      </span>
                      <strong style={{ color: "var(--dash-accent)", fontSize: "15px" }}>
                        {formatPrice(item.new_price)}
                      </strong>
                    </div>

                    <div className="marketing-portfolio-footer" style={{ marginTop: "12px" }}>
                      <span className="marketing-unit-chip" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <CalendarDays size={12} /> ينتهي: {formatDate(item.end_date)}
                      </span>

                      <div className="marketing-row-actions">
                        <button
                          type="button"
                          className="marketing-icon-btn"
                          onClick={() => openOfferPreview(item)}
                          title="معاينة العرض"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* نافذة معاينة العرض */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          previewOffer?.item?.name
            ? `تفاصيل عرض الخدمة (${previewOffer.item.name})`
            : previewOffer?.item?.unit_number
            ? `تفاصيل عرض الوحدة (${previewOffer.item.unit_number})`
            : "معاينة العرض"
        }
        size="lg"
      >
        <div className="marketing-offers-summary-card" style={{ maxWidth: "100%" }}>
          <div className="marketing-offers-summary-head">
            <div>
              <p>{previewOffer?.item?.name ? "نوع العرض: خدمة" : "نوع العرض: عقار"}</p>
              <h3>
                {previewOffer?.item?.name
                  ? previewOffer.item.name
                  : `الوحدة السكنية: ${previewOffer?.item?.unit_number || "-"}`}
              </h3>
            </div>
            <div className="marketing-summary-icon">
              {previewOffer?.item?.name ? <Briefcase size={22} /> : <Home size={22} />}
            </div>
          </div>

          <p style={{ color: "var(--dash-muted)", fontSize: "13px", lineHeight: "1.6", margin: "12px 0" }}>
            {previewOffer?.item?.description || "لا يوجد وصف تفصيلي متوفر لهذا العرض."}
          </p>

          <div className="marketing-offers-summary-metrics" style={{ marginTop: "15px" }}>
            <div>
              <strong>السعر الأصلي</strong>
              {formatPrice(previewOffer?.old_price)}
            </div>

            <div>
              <strong>السعر بعد الخصم</strong>
              {formatPrice(previewOffer?.new_price)}
            </div>

            <div>
              <strong>نسبة الخصم</strong>
              <span>{previewOffer?.discount_percentage || 0}%</span>
            </div>

            <div>
              <strong>تاريخ البداية</strong>
              <span>{formatDate(previewOffer?.start_date)}</span>
            </div>

            <div>
              <strong>تاريخ النهاية</strong>
              <span>{formatDate(previewOffer?.end_date)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}