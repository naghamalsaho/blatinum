import {
  Megaphone,
  BadgeDollarSign,
  TicketPercent,
  TrendingUp,
  MousePointerClick,
  Activity,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";

import "../styles/marketing.css";

const stats = [
  {
    title: "الحملات النشطة",
    value: "24",
    icon: Megaphone,
    trend: "+12%",
  },

  {
    title: "الإعلانات الفعالة",
    value: "86",
    icon: BadgeDollarSign,
    trend: "+18%",
  },

  {
    title: "العروض الحالية",
    value: "12",
    icon: TicketPercent,
    trend: "+4%",
  },

  {
    title: "معدل التحويل",
    value: "38%",
    icon: TrendingUp,
    trend: "+9%",
  },
];

const campaigns = [
  {
    id: 1,
    name: "Summer Campaign",
    status: "نشطة",
    reach: "120K",
    clicks: "14K",
    conversion: "22%",
  },

  {
    id: 2,
    name: "Real Estate Promo",
    status: "معلقة",
    reach: "88K",
    clicks: "9K",
    conversion: "17%",
  },

  {
    id: 3,
    name: "VIP Clients",
    status: "نشطة",
    reach: "220K",
    clicks: "28K",
    conversion: "41%",
  },
];

const activities = [
  "تم إطلاق حملة جديدة",
  "تم تعديل عرض موسمي",
  "تم إيقاف إعلان منخفض الأداء",
  "تم رفع معدل التفاعل بنسبة 12%",
];

export default function MarketingDashboardPage() {
  return (
    <div className="marketing-dashboard-page">
      <PageHeader
        title="لوحة التسويق"
        subtitle="إدارة الحملات والإعلانات والتحليلات"
      />

      <section className="marketing-hero">
        <div>
          <p className="marketing-hero-label">
            Marketing Performance Center
          </p>

          <h1>تحكم كامل بأداء الحملات التسويقية</h1>

          <p className="marketing-hero-text">
            راقب الأداء، التفاعل، ونسب التحويل بشكل مباشر
          </p>
        </div>

        <div className="marketing-hero-badge">
          <Activity size={20} />
          <span>+24% نمو هذا الشهر</span>
        </div>
      </section>

      <section className="marketing-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
            trend={item.trend}
          />
        ))}
      </section>

      <section className="marketing-dashboard-grid">
        <div className="marketing-panel">
          <div className="marketing-panel-head">
            <div>
              <h2>أداء الحملات</h2>
              <p>آخر الحملات التسويقية النشطة</p>
            </div>
          </div>

          <div className="marketing-campaigns">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="marketing-campaign-card"
              >
                <div className="marketing-campaign-top">
                  <div>
                    <h3>{campaign.name}</h3>
                    <span>{campaign.status}</span>
                  </div>

                  <div className="marketing-campaign-icon">
                    <MousePointerClick size={18} />
                  </div>
                </div>

                <div className="marketing-campaign-stats">
                  <div>
                    <strong>Reach</strong>
                    <p>{campaign.reach}</p>
                  </div>

                  <div>
                    <strong>Clicks</strong>
                    <p>{campaign.clicks}</p>
                  </div>

                  <div>
                    <strong>Conversion</strong>
                    <p>{campaign.conversion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="marketing-side-panel">
          <div className="marketing-panel">
            <div className="marketing-panel-head">
              <div>
                <h2>النشاطات الأخيرة</h2>
                <p>آخر تحديثات النظام التسويقي</p>
              </div>
            </div>

            <div className="marketing-activity-list">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="marketing-activity-item"
                >
                  <span className="activity-dot" />

                  <p>{activity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="marketing-panel marketing-growth-panel">
            <div className="marketing-growth-circle">
              <span>78%</span>
            </div>

            <div>
              <h3>Campaign Growth</h3>

              <p>
                معدل نمو الحملات والإعلانات خلال آخر 30 يوم
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}