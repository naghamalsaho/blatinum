import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  Gift,
  Headphones,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { t } from "@/shared/i18n";
import {
  customerServiceAppointments,
  customerServiceClients,
  customerServiceOrders,
  formatStatus,
} from "../constants/customerServiceData";
import "@/pages/dashboard.css";
import "../styles/customer-service.css";

const COLORS = ["#078db8", "#5478a3", "#d09a42", "#2e9b86"];

export default function CustomerServiceDashboardPage() {
  const openOrders = customerServiceOrders.filter((order) => order.status !== "closed").length;
  const completedAppointments = customerServiceAppointments.filter((item) => item.status === "completed").length;
  const stats = [
    { label: t("stats_clients"), value: customerServiceClients.length, note: t("customer_records"), icon: UsersRound, to: "/customer-service/clients", tone: "blue" },
    { label: t("stats_appointments"), value: customerServiceAppointments.length, note: `${completedAppointments} ${t("completed")}`, icon: CalendarCheck, to: "/customer-service/appointments", tone: "cyan" },
    { label: t("stats_orders"), value: customerServiceOrders.length, note: `${openOrders} ${t("need_follow_up")}`, icon: ClipboardCheck, to: "/customer-service/orders", tone: "violet" },
    { label: t("response_rate"), value: "94%", note: t("service_performance"), icon: Headphones, to: "/customer-service/chat", tone: "green" },
  ];
  const trend = [
    { name: "Mon", requests: 8, resolved: 4 }, { name: "Tue", requests: 12, resolved: 8 },
    { name: "Wed", requests: 10, resolved: 7 }, { name: "Thu", requests: 16, resolved: 11 },
    { name: "Fri", requests: 14, resolved: 12 }, { name: "Sat", requests: 19, resolved: 15 },
    { name: "Sun", requests: 22, resolved: 18 },
  ];
  const mix = [
    { name: t("clients"), value: customerServiceClients.length },
    { name: t("appointments"), value: customerServiceAppointments.length },
    { name: t("orders"), value: Math.max(openOrders, 1) },
    { name: t("resolved"), value: Math.max(completedAppointments, 1) },
  ];

  return (
    <div className="admin-dashboard customer-service-dashboard">
      <section className="admin-metrics">
        {stats.map(({ icon: Icon, ...stat }, index) => (
          <Link className={`admin-metric-card tone-${stat.tone}`} to={stat.to} key={stat.label} style={{ "--delay": `${index * 70}ms` }}>
            <span className="admin-metric-icon"><Icon size={22} /></span>
            <span className="admin-metric-copy"><small>{stat.label}</small><strong>{stat.value}</strong><span><TrendingUp size={13} />{stat.note}</span></span>
            <ArrowUpRight className="admin-metric-arrow" size={17} />
          </Link>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-activity-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Headphones size={14} /> {t("service_pulse")}</span><h2>{t("customer_activity")}</h2><p>{t("requests_resolutions_week")}</p></div><span className="admin-live-pill"><i /> {t("live")}</span></header>
          <div className="admin-chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}><defs><linearGradient id="csRequests" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#078db8" stopOpacity={0.32}/><stop offset="1" stopColor="#078db8" stopOpacity={0}/></linearGradient><linearGradient id="csResolved" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2e9b86" stopOpacity={0.23}/><stop offset="1" stopColor="#2e9b86" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="4 8" vertical={false} stroke="var(--dash-line)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:"var(--dash-muted)",fontSize:11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill:"var(--dash-muted)",fontSize:11 }}/><Tooltip contentStyle={{background:"var(--dash-surface)",border:"1px solid var(--dash-line)",borderRadius:10}}/><Area type="monotone" dataKey="requests" stroke="#078db8" strokeWidth={3} fill="url(#csRequests)" animationDuration={1300}/><Area type="monotone" dataKey="resolved" stroke="#2e9b86" strokeWidth={2} fill="url(#csResolved)" animationDuration={1600}/></AreaChart></ResponsiveContainer></div>
          <footer className="admin-chart-legend"><span><i className="activity"/>{t("requests")}</span><span><i className="cs-resolved"/>{t("resolved")}</span></footer>
        </article>

        <article className="admin-panel admin-distribution-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Sparkles size={14}/> {t("workload")}</span><h2>{t("service_mix")}</h2><p>{t("service_distribution")}</p></div></header>
          <div className="admin-donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mix} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="84%" paddingAngle={5} stroke="none" animationDuration={1400}>{mix.map((item,index)=><Cell key={item.name} fill={COLORS[index]}/>)}</Pie><Tooltip contentStyle={{background:"var(--dash-surface)",border:"1px solid var(--dash-line)",borderRadius:10}}/></PieChart></ResponsiveContainer><div className="admin-donut-center"><strong>{mix.reduce((sum,item)=>sum+item.value,0)}</strong><span>{t("records")}</span></div></div>
          <div className="admin-donut-legend">{mix.map((item,index)=><span key={item.name}><i style={{background:COLORS[index]}}/>{item.name}<strong>{item.value}</strong></span>)}</div>
        </article>

        <article className="admin-panel admin-recent-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Clock3 size={14}/> {t("recently_added")}</span><h2>{t("service_orders")}</h2><p>{t("latest_attention_requests")}</p></div><Link to="/customer-service/orders">{t("view_all")} <ArrowUpRight size={14}/></Link></header>
          <div className="cs-dashboard-orders">{customerServiceOrders.slice(0,4).map((order)=><div className="cs-dashboard-order" key={order.id}><span className="cs-order-icon"><ClipboardCheck size={17}/></span><span><strong>{order.client}</strong><small>{order.project} · {order.unit}</small></span><span className={`customer-service-pill ${order.status}`}>{formatStatus(order.status)}</span></div>)}</div>
        </article>

        <article className="admin-panel admin-quick-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Sparkles size={14}/> {t("quick_actions")}</span><h2>{t("service_workspace")}</h2><p>{t("daily_operations")}</p></div></header>
          <div className="admin-quick-grid"><Link to="/customer-service/complaints"><ShieldAlert/><span><strong>{t("complaints")}</strong><small>{t("review_customer_issues")}</small></span></Link><Link to="/customer-service/appointments"><CalendarCheck/><span><strong>{t("appointments")}</strong><small>{t("manage_schedule")}</small></span></Link><Link to="/customer-service/chat"><MessageCircle/><span><strong>{t("live_chat")}</strong><small>{t("open_conversations")}</small></span></Link><Link to="/customer-service/lottery"><Gift/><span><strong>{t("lottery")}</strong><small>{t("manage_active_rounds")}</small></span></Link></div>
        </article>
      </section>
    </div>
  );
}
