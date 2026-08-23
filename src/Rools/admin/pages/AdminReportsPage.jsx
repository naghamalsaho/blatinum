import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Boxes,
  Building2,
  Download,
  FileBarChart,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { getLanguage } from "@/shared/i18n";
import {
  downloadAdminReportPdfRequest,
  downloadInventoryReportPdfRequest,
  getAdminDashboardReportRequest,
  getInventoryDashboardReportRequest,
} from "../features/reports/api/adminReports.api";
import "../features/reports/styles/admin-reports.css";

const COPY = {
  ar: {
    admin: "التقرير الإداري", inventory: "تقرير المخزون", adminDesc: "ملخص شامل لبيانات وإحصائيات النظام.",
    inventoryDesc: "متابعة المستودعات والعناصر وحركة المخزون.", refresh: "تحديث البيانات", download: "تنزيل PDF",
    loading: "جارٍ تحميل التقرير...", empty: "لا توجد بيانات متاحة في التقرير.", retry: "إعادة المحاولة",
    details: "تفاصيل التقرير", records: "السجلات", value: "القيمة", metric: "البيان", downloadError: "تعذر تنزيل ملف PDF.",
  },
  en: {
    admin: "Admin report", inventory: "Inventory report", adminDesc: "A complete summary of system data and statistics.",
    inventoryDesc: "Monitor warehouses, items, and inventory movement.", refresh: "Refresh data", download: "Download PDF",
    loading: "Loading report...", empty: "No report data is available.", retry: "Try again", details: "Report details",
    records: "Records", value: "Value", metric: "Metric", downloadError: "Could not download the PDF file.",
  },
};

const unwrap = (value) => value?.data?.data ?? value?.data ?? value ?? {};
const humanize = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

const scalarEntries = (object, prefix = "") => {
  if (!object || typeof object !== "object" || Array.isArray(object)) return [];
  return Object.entries(object).flatMap(([key, value]) => {
    const label = prefix ? `${prefix} / ${humanize(key)}` : humanize(key);
    if (value === null || typeof value !== "object") return [{ key: `${prefix}.${key}`, label, value }];
    if (Array.isArray(value)) return [{ key: `${prefix}.${key}`, label, value: value.length }];
    return scalarEntries(value, label);
  });
};

const arraySections = (object) => Object.entries(object || {}).filter(([, value]) => Array.isArray(value));

function ReportPanel({ data, loading, error, text, icon: Icon }) {
  const metrics = useMemo(() => scalarEntries(data), [data]);
  const sections = useMemo(() => arraySections(data), [data]);
  if (loading) return <div className="admin-report-state"><RefreshCw className="spin" /><p>{text.loading}</p></div>;
  if (error) return <div className="admin-report-state is-error"><p>{error}</p></div>;
  if (!metrics.length && !sections.length) return <div className="admin-report-state"><Icon /><p>{text.empty}</p></div>;

  return <>
    {metrics.length ? <section className="admin-report-metrics">{metrics.map((item, index) => <article key={item.key}><span>{index % 2 ? <PackageCheck /> : <Icon />}</span><div><small>{item.label}</small><strong>{displayValue(item.value)}</strong></div></article>)}</section> : null}
    {sections.map(([name, rows]) => <section className="admin-report-section" key={name}>
      <header><div><h3>{humanize(name)}</h3><p>{rows.length} {text.records}</p></div><span>{rows.length}</span></header>
      {rows.length ? <div className="admin-report-table-wrap"><table><thead><tr>{Object.keys(rows[0] || {}).slice(0, 8).map((key) => <th key={key}>{humanize(key)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={row?.id ?? rowIndex}>{Object.keys(rows[0] || {}).slice(0, 8).map((key) => <td key={key}>{typeof row?.[key] === "object" ? JSON.stringify(row[key]) : displayValue(row?.[key])}</td>)}</tr>)}</tbody></table></div> : null}
    </section>)}
  </>;
}

ReportPanel.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  text: PropTypes.object.isRequired,
  icon: PropTypes.elementType.isRequired,
};

export default function AdminReportsPage() {
  const language = getLanguage() === "en" ? "en" : "ar";
  const text = COPY[language];
  const [tab, setTab] = useState("admin");
  const [state, setState] = useState({ admin: null, inventory: null, loading: true, error: "" });
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    const [adminResult, inventoryResult] = await Promise.all([getAdminDashboardReportRequest(), getInventoryDashboardReportRequest()]);
    const errors = [!adminResult.ok && adminResult.message, !inventoryResult.ok && inventoryResult.message].filter(Boolean);
    setState({ admin: adminResult.ok ? unwrap(adminResult) : {}, inventory: inventoryResult.ok ? unwrap(inventoryResult) : {}, loading: false, error: errors.join(" • ") });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminDashboardReportRequest(), getInventoryDashboardReportRequest()]).then(([adminResult, inventoryResult]) => {
      if (!active) return;
      const errors = [!adminResult.ok && adminResult.message, !inventoryResult.ok && inventoryResult.message].filter(Boolean);
      setState({ admin: adminResult.ok ? unwrap(adminResult) : {}, inventory: inventoryResult.ok ? unwrap(inventoryResult) : {}, loading: false, error: errors.join(" • ") });
    });
    return () => { active = false; };
  }, []);

  const download = async () => {
    setDownloading(tab); setDownloadError("");
    const result = tab === "admin" ? await downloadAdminReportPdfRequest() : await downloadInventoryReportPdfRequest();
    if (result.ok && result.data instanceof Blob) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement("a");
      link.href = url; link.download = `${tab}-report.pdf`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } else setDownloadError(result.message || text.downloadError);
    setDownloading("");
  };

  const activeData = state[tab];
  return <div className="admin-reports-page">
    <section className="admin-reports-hero"><div className="admin-reports-hero-icon"><FileBarChart /></div><div><span>PLATINUM REPORTS</span><h1>{tab === "admin" ? text.admin : text.inventory}</h1><p>{tab === "admin" ? text.adminDesc : text.inventoryDesc}</p></div><div className="admin-reports-actions"><button type="button" className="ghost" onClick={load} disabled={state.loading}><RefreshCw className={state.loading ? "spin" : ""} />{text.refresh}</button><button type="button" onClick={download} disabled={Boolean(downloading)}><Download />{downloading ? text.loading : text.download}</button></div></section>
    <nav className="admin-report-tabs"><button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}><ShieldCheck />{text.admin}</button><button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}><Boxes />{text.inventory}</button></nav>
    {downloadError ? <p className="admin-report-download-error">{downloadError}</p> : null}
    <ReportPanel data={activeData} loading={state.loading} error={state.error} text={text} icon={tab === "admin" ? Building2 : Boxes} />
  </div>;
}
