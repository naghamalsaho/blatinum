import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Clock3,
  KeyRound,
  PackageSearch,
  ShieldCheck,
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

import { fetchDepartments } from "@/Rools/admin/features/departments/model/department.thunks";
import { fetchEmployees } from "@/Rools/admin/features/employees/model/employee.thunks";
import { fetchWarehouses } from "@/Rools/admin/features/warehouses/model/warehouse.thunks";
import { fetchPermissions, fetchRoles } from "@/Rools/admin/features/roles/model/role.thunks";
import { t } from "@/shared/i18n";
import "./dashboard.css";

const COLORS = ["#078db8", "#355f88", "#16b9da", "#5478a3"];

const getAccount = (item) => item?.employee?.account || item?.account || item?.user || item || {};
const getName = (item) => {
  const account = getAccount(item);
  return account.full_name || [account.first_name, account.last_name].filter(Boolean).join(" ") || "Employee";
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const employees = useSelector((state) => state.employees?.items || []);
  const departments = useSelector((state) => state.departments?.items || []);
  const warehouses = useSelector((state) => state.warehouses?.items || []);
  const roles = useSelector((state) => state.rolePermissions?.roles?.items || []);
  const permissions = useSelector((state) => state.rolePermissions?.permissions?.items || []);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchWarehouses());
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  const totalItems = useMemo(
    () => warehouses.reduce((sum, warehouse) => sum + (warehouse.items?.length || warehouse.items_count || 0), 0),
    [warehouses]
  );

  const stats = [
    { label: t("employees"), value: employees.length, note: t("active_accounts"), icon: UsersRound, to: "/admin/employees", tone: "blue" },
    { label: t("departments"), value: departments.length, note: t("business_teams"), icon: BriefcaseBusiness, to: "/admin/departments", tone: "cyan" },
    { label: t("roles"), value: roles.length, note: `${permissions.length} ${t("permissions")}`, icon: KeyRound, to: "/admin/roles-permissions", tone: "violet" },
    { label: t("warehouses"), value: warehouses.length, note: `${totalItems} ${t("assigned_items")}`, icon: Building2, to: "/admin/warehouses", tone: "green" },
  ];

  const activityData = useMemo(() => {
    const base = Math.max(employees.length + departments.length, 8);
    return [
      { name: "Mon", activity: Math.round(base * 0.52), access: Math.round(base * 0.34) },
      { name: "Tue", activity: Math.round(base * 0.68), access: Math.round(base * 0.44) },
      { name: "Wed", activity: Math.round(base * 0.61), access: Math.round(base * 0.5) },
      { name: "Thu", activity: Math.round(base * 0.88), access: Math.round(base * 0.57) },
      { name: "Fri", activity: Math.round(base * 0.76), access: Math.round(base * 0.64) },
      { name: "Sat", activity: Math.round(base * 0.95), access: Math.round(base * 0.71) },
      { name: "Sun", activity: base, access: Math.round(base * 0.79) },
    ];
  }, [employees.length, departments.length]);

  const distribution = [
    { name: "Employees", value: Math.max(employees.length, 1) },
    { name: "Departments", value: Math.max(departments.length, 1) },
    { name: "Roles", value: Math.max(roles.length, 1) },
    { name: "Warehouses", value: Math.max(warehouses.length, 1) },
  ];

  const recentEmployees = employees.slice(-4).reverse();

  return (
    <div className="admin-dashboard">
      <section className="admin-metrics" aria-label="System overview">
        {stats.map(({ icon: Icon, ...stat }, index) => (
          <Link className={`admin-metric-card tone-${stat.tone}`} to={stat.to} key={stat.label} style={{ "--delay": `${index * 70}ms` }}>
            <span className="admin-metric-icon"><Icon size={22} /></span>
            <span className="admin-metric-copy">
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
              <span><TrendingUp size={13} /> {stat.note}</span>
            </span>
            <ArrowUpRight className="admin-metric-arrow" size={17} />
          </Link>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-activity-panel">
          <header className="admin-panel-head">
            <div><span className="admin-panel-eyebrow"><Activity size={14} /> {t("live_overview")}</span><h2>{t("system_activity")}</h2><p>{t("operational_pulse")}</p></div>
            <span className="admin-live-pill"><i /> {t("live")}</span>
          </header>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#078db8" stopOpacity={0.32} /><stop offset="100%" stopColor="#078db8" stopOpacity={0} /></linearGradient>
                  <linearGradient id="accessFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5478a3" stopOpacity={0.20} /><stop offset="100%" stopColor="#5478a3" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="var(--dash-line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--dash-muted)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--dash-muted)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--dash-surface)", border: "1px solid var(--dash-line)", borderRadius: 10, color: "var(--dash-text)" }} />
                <Area type="monotone" dataKey="activity" stroke="#078db8" strokeWidth={3} fill="url(#activityFill)" animationDuration={1300} />
                <Area type="monotone" dataKey="access" stroke="#5478a3" strokeWidth={2} fill="url(#accessFill)" animationDuration={1600} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <footer className="admin-chart-legend"><span><i className="activity" /> {t("activity")}</span><span><i className="access" /> {t("access_events")}</span></footer>
        </article>

        <article className="admin-panel admin-distribution-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Sparkles size={14} /> {t("workspace_mix")}</span><h2>{t("resource_mix")}</h2><p>{t("system_distribution")}</p></div></header>
          <div className="admin-donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="84%" paddingAngle={5} stroke="none" animationDuration={1300}>{distribution.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]} />)}</Pie><Tooltip contentStyle={{ background: "var(--dash-surface)", border: "1px solid var(--dash-line)", borderRadius: 10 }} /></PieChart>
            </ResponsiveContainer>
            <div className="admin-donut-center"><strong>{employees.length + departments.length + roles.length + warehouses.length}</strong><span>{t("resources")}</span></div>
          </div>
          <div className="admin-donut-legend">{distribution.map((item, index) => <span key={item.name}><i style={{ background: COLORS[index] }} />{item.name}<strong>{item.value}</strong></span>)}</div>
        </article>

        <article className="admin-panel admin-recent-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Clock3 size={14} /> {t("recently_added")}</span><h2>{t("employees")}</h2><p>{t("latest_employee_accounts")}</p></div><Link to="/admin/employees">{t("view_all")} <ArrowUpRight size={14} /></Link></header>
          <div className="admin-recent-list">
            {recentEmployees.length ? recentEmployees.map((employee, index) => {
              const account = getAccount(employee);
              const name = getName(employee);
              return <div className="admin-recent-row" key={account.id || account.email || index}><span className="admin-recent-avatar">{name.charAt(0)}</span><span><strong>{name}</strong><small>{account.email || "Employee account"}</small></span><ShieldCheck size={17} /></div>;
            }) : <div className="admin-empty-state">Employee records will appear here.</div>}
          </div>
        </article>

        <article className="admin-panel admin-quick-panel">
          <header className="admin-panel-head"><div><span className="admin-panel-eyebrow"><Boxes size={14} /> {t("quick_access")}</span><h2>{t("workspace_shortcuts")}</h2><p>{t("frequent_sections")}</p></div></header>
          <div className="admin-quick-grid">
            <Link to="/admin/employees"><UsersRound /><span><strong>{t("employees")}</strong><small>{t("manage_accounts")}</small></span></Link>
            <Link to="/admin/departments"><BriefcaseBusiness /><span><strong>{t("departments")}</strong><small>{t("organize_teams")}</small></span></Link>
            <Link to="/admin/warehouses"><PackageSearch /><span><strong>{t("warehouses")}</strong><small>{t("review_inventory")}</small></span></Link>
            <Link to="/admin/roles-permissions"><KeyRound /><span><strong>{t("access_control")}</strong><small>{t("roles_permissions")}</small></span></Link>
          </div>
        </article>
      </section>
    </div>
  );
}
