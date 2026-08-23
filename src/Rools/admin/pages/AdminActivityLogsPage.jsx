import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  FileClock,
  ListChecks,
  PencilLine,
  PlusCircle,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";

import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import Toolbar from "@/shared/components/Toolbar";
import { getDirection, getLanguage } from "@/shared/i18n";
import { clearSelectedActivityLog } from "../features/activityLogs/model/activityLog.slice";
import {
  fetchActivityLog,
  fetchActivityLogs,
} from "../features/activityLogs/model/activityLog.thunks";
import "../features/activityLogs/styles/activity-logs.css";

const PAGE_SIZE = 15;

const COPY = {
  en: {
    title: "System activity",
    subtitle: "A readable audit trail of important operations across the system.",
    search: "Search by model, operation, actor, record or date...",
    all: "All operations",
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    restored: "Restored",
    operation: "Operation",
    resource: "Resource",
    record: "Record",
    actor: "Performed by",
    summary: "Change summary",
    date: "Date & time",
    actions: "Actions",
    details: "View details",
    noRecords: "No activity records found.",
    loading: "Loading activity logs...",
    loadError: "Could not load the activity log.",
    system: "System",
    unknown: "Unknown actor",
    fieldsChanged: "fields changed",
    recordCreated: "New record created",
    recordDeleted: "Record deleted",
    noDetails: "No field details returned by the API",
    showing: "Showing",
    of: "of",
    previous: "Previous",
    next: "Next",
    detailsTitle: "Activity details",
    detailsSubtitle: "Complete audit information and field-level changes.",
    overview: "Operation overview",
    changes: "Data changes",
    field: "Field",
    oldValue: "Previous value",
    newValue: "New value",
    createdValues: "Values at creation",
    deletedValues: "Values before deletion",
    value: "Value",
    retry: "Try again",
    refresh: "Refresh",
    total: "Total activities",
    totalNote: "Audit records from API",
    createdCount: "Created",
    updatedCount: "Updated",
    deletedCount: "Deleted",
    currentPageNote: "On the current page",
  },
  ar: {
    title: "سجل نشاطات النظام",
    subtitle: "سجل تدقيق واضح لكل العمليات المهمة التي تحدث ضمن النظام.",
    search: "ابحث بالموديل أو العملية أو المنفذ أو رقم السجل أو التاريخ...",
    all: "كل العمليات",
    created: "إنشاء",
    updated: "تعديل",
    deleted: "حذف",
    restored: "استعادة",
    operation: "العملية",
    resource: "القسم المتأثر",
    record: "السجل",
    actor: "منفذ العملية",
    summary: "ملخص التغيير",
    date: "التاريخ والوقت",
    actions: "الإجراءات",
    details: "عرض التفاصيل",
    noRecords: "لا توجد نشاطات مطابقة.",
    loading: "جار تحميل سجل النشاطات...",
    loadError: "تعذر تحميل سجل النشاطات.",
    system: "النظام",
    unknown: "منفذ غير معروف",
    fieldsChanged: "حقول تم تعديلها",
    recordCreated: "تم إنشاء سجل جديد",
    recordDeleted: "تم حذف السجل",
    noDetails: "لم يرجع الـAPI تفاصيل للحقول",
    showing: "عرض",
    of: "من أصل",
    previous: "السابق",
    next: "التالي",
    detailsTitle: "تفاصيل النشاط",
    detailsSubtitle: "معلومات العملية كاملة ومقارنة التغييرات على مستوى الحقول.",
    overview: "ملخص العملية",
    changes: "تغييرات البيانات",
    field: "الحقل",
    oldValue: "القيمة السابقة",
    newValue: "القيمة الجديدة",
    createdValues: "القيم عند الإنشاء",
    deletedValues: "القيم قبل الحذف",
    value: "القيمة",
    retry: "إعادة المحاولة",
    refresh: "تحديث",
    total: "إجمالي النشاطات",
    totalNote: "سجلات التدقيق من الـAPI",
    createdCount: "عمليات الإنشاء",
    updatedCount: "عمليات التعديل",
    deletedCount: "عمليات الحذف",
    currentPageNote: "ضمن الصفحة الحالية",
  },
};

const FIELD_LABELS = {
  id: ["ID", "المعرّف"], building_id: ["Building", "المبنى"], unit_number: ["Unit number", "رقم الوحدة"],
  floor: ["Floor", "الطابق"], rooms_count: ["Rooms", "عدد الغرف"], area: ["Area", "المساحة"],
  type: ["Type", "النوع"], price: ["Price", "السعر"], description: ["Description", "الوصف"],
  status: ["Status", "الحالة"], created_at: ["Created at", "تاريخ الإنشاء"], updated_at: ["Updated at", "آخر تحديث"],
  deleted_at: ["Deleted at", "تاريخ الحذف"], start_date: ["Start date", "تاريخ البداية"], end_date: ["End date", "تاريخ النهاية"],
};

const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const changesObject = (value) => (isPlainObject(value) ? value : {});

const getChanges = (log = {}) => {
  const root = changesObject(log.attribute_changes);
  return {
    next: changesObject(root.attributes),
    old: changesObject(root.old),
  };
};

const actorName = (causer, text) => {
  if (!causer) return text.unknown;
  if (typeof causer === "string") return causer.toLowerCase() === "system" ? text.system : causer;
  return causer.full_name || causer.name || causer.email || `#${causer.id || "—"}`;
};

const formatKey = (key, language) => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key][language === "ar" ? 1 : 0];
  return String(key).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const looksLikeDate = (key, value) =>
  /(?:_at|_date)$/.test(key) && typeof value === "string" && !Number.isNaN(Date.parse(value));

const formatDate = (value, language, withTime = true) => {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-GB", {
    year: "numeric", month: "short", day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
};

const formatValue = (value, key, language) => {
  if (value === null || value === undefined || value === "") return "—";
  if (looksLikeDate(key, value)) return formatDate(value, language);
  if (language === "ar" && key === "status") {
    const statusLabels = {
      pending: "قيد الانتظار",
      initially_accepted: "مقبول مبدئيًا",
      accepted: "مقبول",
      rejected: "مرفوض",
      completed: "مكتمل",
      cancelled: "ملغي",
      canceled: "ملغي",
      active: "نشط",
      inactive: "غير نشط",
    };
    const normalized = String(value).toLowerCase();
    if (statusLabels[normalized]) return statusLabels[normalized];
  }
  if (typeof value === "boolean") return language === "ar" ? (value ? "نعم" : "لا") : (value ? "Yes" : "No");
  if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join("، ") : "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const operationLabel = (operation, text) => text[operation] || String(operation || "—").replaceAll("_", " ");

const summaryFor = (log, text) => {
  const { next, old } = getChanges(log);
  const count = new Set([...Object.keys(next), ...Object.keys(old)]).size;
  if (log.description === "created") return count ? `${text.recordCreated} · ${count}` : text.recordCreated;
  if (log.description === "deleted") return text.recordDeleted;
  if (count) return `${count} ${text.fieldsChanged}`;
  return text.noDetails;
};

function ValueBlock({ value, name, language }) {
  const formatted = formatValue(value, name, language);
  return typeof value === "object" && value !== null
    ? <pre className="activity-json-value">{formatted}</pre>
    : <span className={value === null || value === undefined || value === "" ? "activity-empty-value" : ""}>{formatted}</span>;
}

function ChangesTable({ log, text, language }) {
  const { next, old } = getChanges(log);
  const keys = [...new Set([...Object.keys(old), ...Object.keys(next)])];
  if (!keys.length) return <div className="activity-no-changes"><Database size={25} /><p>{text.noDetails}</p></div>;

  const compare = log.description === "updated" || (Object.keys(old).length > 0 && Object.keys(next).length > 0);
  return (
    <div className={`activity-changes-wrap ${compare ? "is-comparison" : "is-snapshot"}`}>
      <table className="activity-changes-table">
        <thead><tr><th>{text.field}</th>{compare ? <th>{text.oldValue}</th> : null}<th>{compare ? text.newValue : text.value}</th></tr></thead>
        <tbody>{keys.map((key) => <tr key={key}>
          <td><strong>{formatKey(key, language)}</strong><small>{key}</small></td>
          {compare ? <td className="old"><ValueBlock value={old[key]} name={key} language={language} /></td> : null}
          <td className={compare ? "new" : ""}><ValueBlock value={Object.hasOwn(next, key) ? next[key] : old[key]} name={key} language={language} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export default function AdminActivityLogsPage() {
  const dispatch = useDispatch();
  const state = useSelector((store) => store.activityLogs || {});
  const { records = [], meta = {}, loading, error, selected, detailsLoading, detailsError } = state;
  const language = getLanguage();
  const text = COPY[language] || COPY.en;
  const dir = getDirection(language);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [operation, setOperation] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => { dispatch(fetchActivityLogs({ page, perPage: PAGE_SIZE })); }, [dispatch, page]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((log) => {
      const matchesOperation = operation === "all" || log.description === operation;
      const haystack = [log.id, log.description, log.subject_type, log.subject_id, actorName(log.causer, text), log.created_at, summaryFor(log, text)].join(" ").toLowerCase();
      return matchesOperation && (!query || haystack.includes(query));
    });
  }, [records, search, operation, text]);

  const openDetails = (log) => {
    setDetailsOpen(true);
    dispatch(clearSelectedActivityLog());
    dispatch(fetchActivityLog(log.id));
  };
  const closeDetails = () => { setDetailsOpen(false); dispatch(clearSelectedActivityLog()); };
  const total = Number(meta.total ?? records.length);
  const currentPage = Number(meta.current_page ?? page);
  const lastPage = Math.max(1, Number(meta.last_page ?? 1));
  const from = Number(meta.from ?? (records.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0));
  const to = Number(meta.to ?? Math.min(currentPage * PAGE_SIZE, total));
  const operationCounts = records.reduce((counts, log) => {
    const key = log.description;
    if (Object.hasOwn(counts, key)) counts[key] += 1;
    return counts;
  }, { created: 0, updated: 0, deleted: 0 });
  const filterOptions = [
    { value: "all", label: text.all, dotClass: "operation-dot-all" },
    { value: "created", label: text.created, dotClass: "operation-dot-created" },
    { value: "updated", label: text.updated, dotClass: "operation-dot-updated" },
    { value: "deleted", label: text.deleted, dotClass: "operation-dot-deleted" },
    { value: "restored", label: text.restored, dotClass: "operation-dot-restored" },
  ];

  return (
    <div className="activity-logs-page" dir={dir}>
      <section className="activity-stats-grid">
        <StatCard title={text.total} value={total} note={text.totalNote} icon={ListChecks} />
        <StatCard title={text.createdCount} value={operationCounts.created} note={text.currentPageNote} icon={PlusCircle} />
        <StatCard title={text.updatedCount} value={operationCounts.updated} note={text.currentPageNote} icon={PencilLine} />
        <StatCard title={text.deletedCount} value={operationCounts.deleted} note={text.currentPageNote} icon={Trash2} />
      </section>

      <Toolbar
        placeholder={text.search}
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={operation}
        onFilterChange={setOperation}
        selectOptions={filterOptions}
        action={
          <button type="button" className="activity-refresh-btn" onClick={() => dispatch(fetchActivityLogs({ page, perPage: PAGE_SIZE }))} disabled={loading}>
            <RefreshCw size={17} className={loading ? "spin" : ""} />
            <span>{text.refresh}</span>
          </button>
        }
      />

      <section className="activity-table-card">
        <header><div><h2>{text.title}</h2><p>{total} records</p></div><span><Activity size={16} />{from}–{to}</span></header>
        {loading ? <div className="activity-state"><RefreshCw className="spin" /><p>{text.loading}</p></div> : null}
        {!loading && error ? <div className="activity-state error"><p>{error || text.loadError}</p><button onClick={() => dispatch(fetchActivityLogs({ page, perPage: PAGE_SIZE }))}>{text.retry}</button></div> : null}
        {!loading && !error ? <div className="activity-table-scroll"><table className="activity-table"><thead><tr>
          <th>{text.operation}</th><th>{text.resource}</th><th>{text.record}</th><th>{text.actor}</th><th>{text.summary}</th><th>{text.date}</th><th>{text.actions}</th>
        </tr></thead><tbody>
          {filtered.map((log) => <tr key={log.id}>
            <td><span className={`activity-operation op-${log.description || "other"}`}>{operationLabel(log.description, text)}</span></td>
            <td><span className="activity-resource"><Database size={16} /><strong>{log.subject_type || "—"}</strong></span></td>
            <td><span className="activity-record-id">#{log.subject_id ?? "—"}</span><small>Log #{log.id}</small></td>
            <td><span className="activity-actor"><UserRound size={16} />{actorName(log.causer, text)}</span></td>
            <td><span className="activity-summary">{summaryFor(log, text)}</span></td>
            <td><span className="activity-date"><Clock3 size={15} />{formatDate(log.created_at, language)}</span></td>
            <td><button type="button" className="activity-view-btn" onClick={() => openDetails(log)} title={text.details}><Eye size={17} /><span>{text.details}</span></button></td>
          </tr>)}
          {!filtered.length ? <tr><td colSpan="7"><div className="activity-state compact"><FileClock size={28} /><p>{text.noRecords}</p></div></td></tr> : null}
        </tbody></table></div> : null}
        <footer className="activity-pagination"><span>{text.showing} {from}–{to} {text.of} {total}</span><div>
          <button disabled={currentPage <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>{dir === "rtl" ? <ChevronRight /> : <ChevronLeft />}<span>{text.previous}</span></button>
          <span className="activity-page-number">{currentPage} / {lastPage}</span>
          <button disabled={currentPage >= lastPage || loading} onClick={() => setPage((value) => Math.min(lastPage, value + 1))}><span>{text.next}</span>{dir === "rtl" ? <ChevronLeft /> : <ChevronRight />}</button>
        </div></footer>
      </section>

      <Modal open={detailsOpen} onClose={closeDetails} title={text.detailsTitle} description={text.detailsSubtitle} size="xl" className="activity-details-modal">
        {detailsLoading ? <div className="activity-state"><RefreshCw className="spin" /><p>{text.loading}</p></div> : null}
        {!detailsLoading && detailsError ? <div className="activity-state error"><p>{detailsError}</p></div> : null}
        {!detailsLoading && selected ? <div className="activity-details">
          <section className="activity-detail-overview"><h3><span><Activity size={18} /></span>{text.overview}</h3><div className="activity-detail-grid">
            <article className="tone-operation"><span className="activity-detail-card-icon"><Activity /></span><small>{text.operation}</small><strong className={`op-text-${selected.description}`}>{operationLabel(selected.description, text)}</strong></article>
            <article className="tone-resource"><span className="activity-detail-card-icon"><Database /></span><small>{text.resource}</small><strong>{selected.subject_type || "—"} #{selected.subject_id ?? "—"}</strong></article>
            <article className="tone-actor"><span className="activity-detail-card-icon"><UserRound /></span><small>{text.actor}</small><strong>{actorName(selected.causer, text)}</strong></article>
            <article className="tone-date"><span className="activity-detail-card-icon"><Clock3 /></span><small>{text.date}</small><strong>{formatDate(selected.created_at, language)}</strong></article>
          </div></section>
          <section className="activity-detail-changes"><div className="activity-detail-section-head"><div className="activity-detail-section-title"><span><Database size={19} /></span><div><h3>{selected.description === "created" ? text.createdValues : selected.description === "deleted" ? text.deletedValues : text.changes}</h3><p>{summaryFor(selected, text)}</p></div></div><span>Log #{selected.id}</span></div><ChangesTable log={selected} text={text} language={language} /></section>
        </div> : null}
      </Modal>
    </div>
  );
}
