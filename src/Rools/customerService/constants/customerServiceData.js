import { getLanguage } from "@/shared/i18n";

export const customerServiceClients = [
  {
    id: "CL-1001",
    name: "Fatima Al-Nour",
    email: "fatima.nour@example.com",
    phone: "+31 6 1000 1101",
    status: "active",
    source: "Website",
    lastContact: "2026-06-15",
  },
  {
    id: "CL-1002",
    name: "Omar Haddad",
    email: "omar.haddad@example.com",
    phone: "+31 6 1000 1102",
    status: "new",
    source: "Campaign",
    lastContact: "2026-06-16",
  },
  {
    id: "CL-1003",
    name: "Maya Karim",
    email: "maya.karim@example.com",
    phone: "+31 6 1000 1103",
    status: "follow_up",
    source: "Referral",
    lastContact: "2026-06-14",
  },
  {
    id: "CL-1004",
    name: "Yousef Salem",
    email: "yousef.salem@example.com",
    phone: "+31 6 1000 1104",
    status: "inactive",
    source: "Office",
    lastContact: "2026-06-10",
  },
];

export const customerServiceAppointments = [
  {
    id: "AP-2001",
    client: "Omar Haddad",
    date: "2026-06-18",
    time: "10:30",
    type: "Project visit",
    status: "scheduled",
    assignee: "Fatima El-Amin",
  },
  {
    id: "AP-2002",
    client: "Maya Karim",
    date: "2026-06-18",
    time: "13:00",
    type: "Sales call",
    status: "confirmed",
    assignee: "Fatima El-Amin",
  },
  {
    id: "AP-2003",
    client: "Fatima Al-Nour",
    date: "2026-06-19",
    time: "09:15",
    type: "Document follow-up",
    status: "pending",
    assignee: "Fatima El-Amin",
  },
  {
    id: "AP-2004",
    client: "Yousef Salem",
    date: "2026-06-17",
    time: "16:00",
    type: "Support call",
    status: "completed",
    assignee: "Fatima El-Amin",
  },
];

export const customerServiceOrders = [
  {
    id: "OR-3001",
    client: "Fatima Al-Nour",
    project: "Palm Tower",
    unit: "A-1204",
    status: "open",
    priority: "high",
    updatedAt: "2026-06-16",
  },
  {
    id: "OR-3002",
    client: "Omar Haddad",
    project: "Sea Front",
    unit: "B-0802",
    status: "in_review",
    priority: "medium",
    updatedAt: "2026-06-15",
  },
  {
    id: "OR-3003",
    client: "Maya Karim",
    project: "Rose Residence",
    unit: "C-0311",
    status: "waiting_client",
    priority: "medium",
    updatedAt: "2026-06-14",
  },
  {
    id: "OR-3004",
    client: "Yousef Salem",
    project: "Palm Tower",
    unit: "A-0901",
    status: "closed",
    priority: "low",
    updatedAt: "2026-06-12",
  },
];

const STATUS_LABELS = {
  ar: {
    active: "نشط",
    accepted: "مقبول",
    available: "متاح",
    canceled: "ملغي",
    cancelled: "ملغي",
    closed: "مغلق",
    completed: "مكتمل",
    done: "منجز",
    high: "عالية",
    in_review: "قيد المراجعة",
    initially_accepted: "مقبول مبدئياً",
    low: "منخفضة",
    married: "متزوج",
    medium: "متوسطة",
    open: "مفتوح",
    pending: "قيد الانتظار",
    rejected: "مرفوض",
    reserved: "محجوز",
    resolved: "تم الحل",
    scheduled: "مجدول",
    single: "أعزب",
    unavailable: "غير متاح",
    unverified: "غير موثق",
    verified: "موثق",
    vip: "VIP",
  },
  en: {
    active: "Active",
    accepted: "Accepted",
    available: "Available",
    canceled: "Canceled",
    cancelled: "Cancelled",
    closed: "Closed",
    completed: "Completed",
    done: "Done",
    high: "High",
    in_review: "In Review",
    initially_accepted: "Initially Accepted",
    low: "Low",
    married: "Married",
    medium: "Medium",
    open: "Open",
    pending: "Pending",
    rejected: "Rejected",
    reserved: "Reserved",
    resolved: "Resolved",
    scheduled: "Scheduled",
    single: "Single",
    unavailable: "Unavailable",
    unverified: "Unverified",
    verified: "Verified",
    vip: "VIP",
  },
};

export const formatStatus = (status) => {
  const normalized = String(status || "-").trim().toLowerCase();
  const lang = getLanguage() === "en" ? "en" : "ar";
  if (STATUS_LABELS[lang][normalized]) return STATUS_LABELS[lang][normalized];

  return String(status || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};
