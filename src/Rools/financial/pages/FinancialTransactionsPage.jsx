import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  ArrowUpRight,
  DollarSign,
  RefreshCw,
  X,
  Upload,
  FileText,
  Ban,
  Send,
  SlidersHorizontal,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

import {
  fetchTransfers,
  fetchTransferSummary,
  fetchTransferById,
  cancelTransfer,
  createTransfer,
  updateTransfer,
} from "../features/transfers/model/transfer.thunks";

import { fetchCustomerServiceClients } from "../../customerService/features/clients/model/client.thunks";
import { fetchProjects } from "../../marketing/features/projects/model/project.thunks";

import "../styles/financial-transfers.css";

const STATUS_META = {
  posted: { label: "مكتملة", type: "ok" },
  completed: { label: "مكتملة", type: "ok" },
  pending: { label: "قيد الانتظار", type: "busy" },
  cancelled: { label: "ملغاة", type: "off" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "posted", label: "المكتملة (Posted)" },
  { id: "pending", label: "قيد الانتظار" },
  { id: "cancelled", label: "الملغاة" },
];

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status || "—", type: "off" };
}

function formatPaymentMethod(method) {
  switch (method) {
    case "bank_transfer":
      return "تحويل بنكي";
    case "cash":
      return "نقدي (كاش)";
    case "western_union":
      return "ويسترن يونيون";
    case "e_wallet":
      return "محفظة إلكترونية";
    default:
      return method || "—";
  }
}

export default function FinancialTransfersPage() {
  const dispatch = useDispatch();

  const {
    items: transfers = [],
    summary = {},
    selectedTransferDetails = null,
    loadingDetails = false,
    loading = false,
    error = null,
  } = useSelector((state) => state.transfers || state.financialTransfers || {});

  const clients = useSelector(
    (state) => state.customerServiceClients?.items || []
  );
  const projects = useSelector(
    (state) => state.projects?.projects || []
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [cancelOpen, setCancelOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 🎯 تم تعيين النوع افتراضياً كـ payment (سند صرف)
  const [formData, setFormData] = useState({
    voucher_number: "",
    type: "payment",
    amount: "",
    currency: "USD",
    exchange_rate: "13200",
    category: "down_payment",
    payment_method: "bank_transfer",
    status: "posted",
    description: "",
    party_id: "",
    party_type: "App\\Models\\Client\\Client",
    project_id: "",
    warehouse_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchTransfers());
    dispatch(fetchTransferSummary());
    dispatch(fetchCustomerServiceClients());
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      voucher_number: "",
      type: "payment", // 🎯 ثابت كـ سند صرف
      amount: "",
      currency: "USD",
      exchange_rate: "13200",
      category: "down_payment",
      payment_method: "bank_transfer",
      status: "posted",
      description: "",
      party_id: "",
      party_type: "App\\Models\\Client\\Client",
      project_id: "",
      warehouse_id: "",
    });
    setSelectedFiles([]);
    setFormErrors({});
    setSelectedTransfer(null);
  };

  const openPreviewModal = (item) => {
    setSelectedTransfer(item);
    dispatch(fetchTransferById(item.id));
    setPreviewOpen(true);
  };

  const openCancelModal = (item) => {
    setItemToCancel(item);
    setCancelReason("");
    setCancelOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    const result = await dispatch(
      cancelTransfer({ id: itemToCancel.id, reason: cancelReason })
    );

    if (cancelTransfer.fulfilled.match(result)) {
      setCancelOpen(false);
      setItemToCancel(null);
      setCancelReason("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount) {
      setFormErrors({ amount: "المبلغ مطلوب" });
      return;
    }

    // التأكد من إرسال نوع المعاملة كـ payment دائماً
    const payloadValues = {
      ...formData,
      type: "payment",
    };

    if (createOpen) {
      const result = await dispatch(
        createTransfer({ values: payloadValues, files: selectedFiles })
      );
      if (createTransfer.fulfilled.match(result)) {
        setCreateOpen(false);
        resetForm();
      }
    } else if (editOpen && selectedTransfer) {
      const result = await dispatch(
        updateTransfer({
          id: selectedTransfer.id,
          values: payloadValues,
          files: selectedFiles,
        })
      );
      if (updateTransfer.fulfilled.match(result)) {
        setEditOpen(false);
        resetForm();
      }
    }
  };

  const stats = useMemo(() => [
    {
      title: "إجمالي المصروفات",
      value: `$${(summary.total_payments || 0).toLocaleString()}`,
      icon: RefreshCw,
    },
    {
      title: "صافي الرصيد",
      value: `$${(summary.net_balance || 0).toLocaleString()}`,
      icon: DollarSign,
    },
  ], [summary]);

  const filteredTransfers = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return transfers.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const voucherNum = item.voucher_number || "";
      const description = item.description || "";
      const creatorName = item.creator?.account?.full_name || "";
      const amountStr = String(item.amount || "");

      const searchable = [voucherNum, description, creatorName, amountStr]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [transfers, searchTerm, statusFilter]);

  const displayDetails = selectedTransferDetails || selectedTransfer;

  return (
    <div className="financial-exceptions-page" dir="rtl">
      {/* 1. شبكة البطاقات الإحصائية الموحدة */}
      <section className="legal-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>

      {/* 2. شريط الأدوات الموحد */}
      <div className="exact-toolbar-card" dir="rtl">
        <button
          type="button"
          className="exact-primary-btn"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus size={18} />
          <span>إجراء سند صرف جديد</span>
        </button>

        <div className="exact-select-wrapper">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="exact-select-chevron" />
        </div>

        <div className="exact-filter-label">
          <SlidersHorizontal size={16} />
          <span>تصفية</span>
        </div>

        <div className="exact-search-field">
          <input
            type="text"
            placeholder="ابحث برقم المرجع، الوصف، أو المنشئ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* 3. بطاقة الجدول */}
      <TableCard
        title="سجل سندات الصرف والتحويلات المالية"
        count={filteredTransfers.length}
      >
        {loading ? (
          <div className="table-state">جاري تحميل البيانات...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>المنشئ / الطرف</th>
                  <th>طريقة التحويل</th>
                  <th>رقم المرجع (Voucher)</th>
                  <th>المبلغ</th>
                  <th>تاريخ التحويل</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      لا توجد سندات صرف مطابقة لخيارات البحث والحالة.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((item) => {
                    const meta = getStatusMeta(item.status);
                    const creatorName =
                      item.creator?.account?.full_name || "النظام الرئيسي";

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="services-item-cell">
                            <div className="services-thumb-placeholder">
                              <ArrowUpRight size={18} style={{ color: "#ef4444" }} />
                            </div>
                            <div className="services-item-info">
                              <strong>{creatorName}</strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="services-date">
                            {formatPaymentMethod(item.payment_method)} • (صادرة)
                          </span>
                        </td>

                        <td>
                          <strong>{item.voucher_number || "—"}</strong>
                        </td>

                        <td>
                          <strong style={{ color: "var(--dash-accent)" }}>
                            ${Number(item.amount).toLocaleString()} {item.currency}
                          </strong>
                        </td>

                        <td className="services-date">
                          {item.created_at?.split(" ")[0] || "—"}
                        </td>

                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="معاينة التفاصيل"
                              onClick={() => openPreviewModal(item)}
                            >
                              <Eye size={16} />
                            </button>

                            {item.status !== "cancelled" && (
                              <button
                                type="button"
                                className="icon-action-btn danger"
                                title="إلغاء المعاملة"
                                onClick={() => openCancelModal(item)}
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* 4. مودال إضافة وتعديل سند الصرف */}
      <Modal
        open={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          resetForm();
        }}
        title={editOpen ? `تعديل سند الصرف #${selectedTransfer?.id}` : "إضافة سند صرف جديد"}
        size="md"
      >
        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* 🎯 تم حصر خيارات نوع المعاملة بسند صرف فقط */}
          <div className="field-group">
            <label className="field-label">نوع المعاملة</label>
            <div className="exact-select-wrapper" style={{ width: "100%" }}>
              <select style={{ width: "100%" }} name="type" value="payment" disabled>
                <option value="payment">سند صرف (Payment)</option>
              </select>
              <ChevronDown size={16} className="exact-select-chevron" />
            </div>
          </div>

          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">
                المبلغ (Amount) <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                className="financial-textarea"
                style={{ minHeight: "42px", height: "42px", padding: "0 14px" }}
                placeholder="50000"
                value={formData.amount}
                onChange={handleChange}
                required
              />
              <ErrorMessage message={formErrors.amount} />
            </div>

            <div className="field-group">
              <label className="field-label">العملة</label>
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select style={{ width: "100%" }} name="currency" value={formData.currency} onChange={handleChange}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SYP">SYP (ل.س)</option>
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>
          </div>

          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">سعر الصرف (Exchange Rate)</label>
              <input
                type="number"
                name="exchange_rate"
                className="financial-textarea"
                style={{ minHeight: "42px", height: "42px", padding: "0 14px" }}
                placeholder="13200"
                value={formData.exchange_rate}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label className="field-label">التصنيف (Category)</label>
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select style={{ width: "100%" }} name="category" value={formData.category} onChange={handleChange}>
                  <option value="down_payment">دفعة أولى (Down Payment)</option>
                  <option value="installment">قسط (Installment)</option>
                  <option value="rent">إيجار (Rent)</option>
                  <option value="warehouse_purchase">شراء مستودع (Warehouse Purchase)</option>
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>
          </div>

          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">طريقة الدفع (Payment Method)</label>
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select style={{ width: "100%" }} name="payment_method" value={formData.payment_method} onChange={handleChange}>
                  <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                  <option value="cash">نقدي (Cash)</option>
                  <option value="check">شيك (Check)</option>
                  <option value="card">بطاقة دائنة (Card)</option>
                  <option value="western_union">ويسترن يونيون (Western Union)</option>
                  <option value="e_wallet">محفظة إلكترونية (E-Wallet)</option>
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">اختر العميل / الطرف (Party)</label>
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select
                  style={{ width: "100%" }}
                  name="party_id"
                  value={formData.party_id}
                  onChange={handleChange}
                >
                  <option value="">-- اختر العميل --</option>
                  {clients.map((client) => {
                    const cId =
                      client.additional_info?.client_id ||
                      client.account?.id ||
                      client.id;
                    const name =
                      client.account?.full_name || `عميل #${cId}`;
                    return (
                      <option key={cId} value={cId}>
                        {name}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">اختر المشروع (Project - اختياري)</label>
            <div className="exact-select-wrapper" style={{ width: "100%" }}>
              <select
                style={{ width: "100%" }}
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
              >
                <option value="">-- اختر المشروع --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name || project.title || `مشروع #${project.id}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="exact-select-chevron" />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">وصف السند (Description)</label>
            <textarea
              name="description"
              className="financial-textarea"
              placeholder="صرف دفعة صيانة للموقع..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="field-group">
            <label className="field-label">المرفقات (إيصالات / صور)</label>
            <input
              type="file"
              multiple
              id="file-input-transfer"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-input-transfer"
              className="ghost-filter-btn"
              style={{ cursor: "pointer", width: "fit-content" }}
            >
              <Upload size={16} />
              <span>اختر الملفات...</span>
            </label>

            {selectedFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="services-date" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--dash-surface)", padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--dash-line)" }}>
                    <FileText size={14} />
                    {file.name}
                    <X size={14} style={{ cursor: "pointer", marginRight: "4px" }} onClick={() => removeFile(idx)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                setEditOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </button>
            <button type="submit" className="exact-primary-btn" disabled={loading}>
              <Send size={16} />
              <span>{loading ? "جاري الحفظ..." : editOpen ? "تحديث السند" : "حفظ السند"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. مودال إلغاء المعاملة */}
      <Modal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setItemToCancel(null);
        }}
        title="إلغاء سند الصرف"
        size="md"
      >
        <form className="modal-form" onSubmit={handleConfirmCancel}>
          <p style={{ marginBottom: "8px", fontSize: "14px", color: "var(--dash-muted)" }}>
            هل أنت تأكد من إلغاء سند الصرف رقم <strong>#{itemToCancel?.voucher_number || itemToCancel?.id}</strong>؟
          </p>

          <div className="field-group">
            <label className="field-label">
              سبب الإلغاء (Reason) <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              required
              className="financial-textarea"
              placeholder="يرجى كتابة سبب الإلغاء..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCancelOpen(false);
                setItemToCancel(null);
              }}
            >
              تراجع
            </button>
            <button
              type="submit"
              className="exact-primary-btn"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderColor: "#ef4444" }}
              disabled={loading}
            >
              تأكيد الإلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. مودال معاينة التفاصيل المباشرة */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedTransfer(null);
        }}
        title="تفاصيل سند الصرف"
        size="md"
      >
        {loadingDetails ? (
          <div className="table-state">جاري تحميل بيانات المعاملة من السيرفر...</div>
        ) : (
          <div className="financial-preview-modal">
            <div className="financial-preview-card">
              <div className="financial-preview-row">
                <span className="label">رقم مرجع العملية (Voucher):</span>
                <span className="value">{displayDetails?.voucher_number || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">الطرف المستلم / العميل:</span>
                <span className="value">العميل {displayDetails?.party_id || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">المبلغ الإجمالي:</span>
                <span className="value" style={{ color: "var(--dash-accent)", fontWeight: 800 }}>
                  ${Number(displayDetails?.amount || 0).toLocaleString()} {displayDetails?.currency}
                </span>
              </div>

              <div className="financial-preview-row">
                <span className="label">طريقة التحويل:</span>
                <span className="value">{formatPaymentMethod(displayDetails?.payment_method)}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">اسم المنشئ:</span>
                <span className="value">{displayDetails?.creator?.account?.full_name || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">التاريخ:</span>
                <span className="value">{displayDetails?.created_at || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">الحالة الحالية:</span>
                <span className="value">
                  <StatusBadge
                    status={getStatusMeta(displayDetails?.status).label}
                    type={getStatusMeta(displayDetails?.status).type}
                  />
                </span>
              </div>
            </div>

            {displayDetails?.description && (
              <div className="financial-preview-details">
                <h4 className="financial-preview-title">البيان / الوصف:</h4>
                <p className="financial-preview-desc">{displayDetails.description}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="ghost-filter-btn"
                onClick={() => setPreviewOpen(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}