import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  ChevronDown,
  Eye,

  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  RefreshCw,
  X,
  Upload,
  FileText,
  Filter,
  Ban,
  Send,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Modal from "@/shared/components/Modal";
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

// 1️⃣ استيراد Thunks الخاصة بالعملاء والمشاريع
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
  const statusDropdownRef = useRef(null);

  // Redux Store State الخاصة بالتحويلات
  const {
    items: transfers = [],
    summary = {},
    selectedTransferDetails = null,
    loadingDetails = false,
    loading = false,
    error = null,
  } = useSelector((state) => state.transfers || state.financialTransfers || {});

  // 2️⃣ جلب قائمة العملاء والمشاريع من الـ Redux Store
  const clients = useSelector(
    (state) => state.customerServiceClients?.items || []
  );
  const projects = useSelector(
    (state) => state.projects?.projects || []
  );

  // Modals & States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Cancel Modal State
  const [cancelOpen, setCancelOpen] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    voucher_number: "",
    type: "receipt", // receipt | payment
    amount: "",
    currency: "USD",
    exchange_rate: "13200",
    category: "down_payment", // installment | down_payment | rent | warehouse_purchase
    payment_method: "bank_transfer", // cash | bank_transfer | check | card
    status: "posted",
    description: "",
    party_id: "",
    party_type: "App\\Models\\Client\\Client",
    project_id: "",
    warehouse_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // 3️⃣ استدعاء البيانات عند الفتح
  useEffect(() => {
    dispatch(fetchTransfers());
    dispatch(fetchTransferSummary());
    dispatch(fetchCustomerServiceClients());
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      type: "receipt",
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

    if (createOpen) {
      const result = await dispatch(
        createTransfer({ values: formData, files: selectedFiles })
      );
      if (createTransfer.fulfilled.match(result)) {
        setCreateOpen(false);
        resetForm();
      }
    } else if (editOpen && selectedTransfer) {
      const result = await dispatch(
        updateTransfer({
          id: selectedTransfer.id,
          values: formData,
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
      title: "إجمالي المقبوضات",
      value: `$${(summary.total_receipts || 0).toLocaleString()}`,
      icon: DollarSign,
    },
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

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.id === statusFilter)?.label || "الحالة";

  const displayDetails = selectedTransferDetails || selectedTransfer;

  return (
    <div className="financial-payments-page" dir="rtl">
      {/* 1. قسم البطاقات الإحصائية */}
      <section className="financial-payments-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>

      {/* 2. قسم الجدول واللوحة الرئيسية */}
      <section className="financial-payments-main-grid">
        <article className="financial-panel">
          <div className="financial-panel-head">
            <div>
              <h2>سجل الحركة والتحويلات المالية</h2>
              <p>عرض تفصيلي لعمليات التحويل وتدفق الأموال</p>
            </div>

            <button
              className="financial-primary-btn"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus size={18} />
              إجراء تحويل جديد
            </button>
          </div>

          <div className="financial-payments-toolbar">
            <div className="financial-search-wrapper">
              <div className="financial-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ابحث برقم المرجع، الوصف، أو المنشئ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="financial-status-dropdown" ref={statusDropdownRef}>
                <button
                  type="button"
                  className="financial-status-trigger"
                  onClick={() => setStatusDropdownOpen((prev) => !prev)}
                >
                  <Filter size={16} />
                  <span>{currentStatusLabel}</span>
                  <ChevronDown
                    size={15}
                    className={`status-arrow ${statusDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {statusDropdownOpen && (
                  <div className="financial-status-menu">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`status-menu-item ${
                          statusFilter === opt.id ? "active" : ""
                        }`}
                        onClick={() => {
                          setStatusFilter(opt.id);
                          setStatusDropdownOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="project-empty-state">جاري تحميل البيانات...</div>
          ) : error ? (
            <div className="project-empty-state">{error}</div>
          ) : (
            <div className="financial-payments-table-wrap">
              <table className="financial-payments-table">
                <thead>
                  <tr>
                    <th>المنشئ / الطرف</th>
                    <th>طريقة / نوع التحويل</th>
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
                      <td colSpan="7">
                        <div className="project-empty-state">
                          لا توجد تحويلات مالية مطابقة للبحث.
                        </div>
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
                            <div className="financial-payment-title-cell">
                              <div className="financial-payment-icon-box">
                                {item.type === "receipt" ? (
                                  <ArrowDownLeft size={18} className="icon-inbound" />
                                ) : (
                                  <ArrowUpRight size={18} className="icon-outbound" />
                                )}
                              </div>
                              <div className="financial-payment-info">
                                <span className="financial-payment-title">
                                  {creatorName} 
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="financial-type-chip">
                              {formatPaymentMethod(item.payment_method)} • ({item.type === "receipt" ? "واردة" : "صادرة"})
                            </span>
                          </td>

                          <td>
                            <span className="financial-account-num">
                              {item.voucher_number || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="financial-metric">
                              ${Number(item.amount).toLocaleString()} {item.currency}
                            </span>
                          </td>

                          <td>
                            <span className="financial-account-num">
                              {item.created_at?.split(" ")[0] || "—"}
                            </span>
                          </td>

                          <td>
                            <StatusBadge status={meta.label} type={meta.type} />
                          </td>

                          <td>
                            <div className="financial-row-actions">
                              <button
                                className="financial-icon-btn"
                                title="معاينة التفاصيل"
                                onClick={() => openPreviewModal(item)}
                              >
                                <Eye size={15} />
                              </button>

                              {item.status !== "cancelled" && (
                                <button
                                  className="financial-icon-btn danger"
                                  title="إلغاء المعاملة"
                                  onClick={() => openCancelModal(item)}
                                >
                                  <Ban size={15} />
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
        </article>
      </section>

      {/* 3. مودال إضافة وتعديل التحويل المالي */}
      <Modal
        open={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          resetForm();
        }}
        title={editOpen ? `تعديل المعاملة المالية #${selectedTransfer?.id}` : "إضافة معاملة / تحويل مالي جديد"}
        size="lg"
      >
        <form className="financial-modal-form" onSubmit={handleSubmit} noValidate>
          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>نوع المعاملة (Type)</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="receipt">سند قبض (Receipt)</option>
                <option value="payment">سند صرف (Payment)</option>
              </select>
            </div>
          </div>

          <div className="financial-modal-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="custom-form-group">
              <label>
                المبلغ (Amount) <span className="required-dot">*</span>
              </label>
              <input
                type="number"
                name="amount"
                placeholder="50000"
                value={formData.amount}
                onChange={handleChange}
                required
              />
              <ErrorMessage message={formErrors.amount} />
            </div>

            <div className="custom-form-group">
              <label>العملة</label>
              <select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SYP">SYP (ل.س)</option>
              </select>
            </div>

            <div className="custom-form-group">
              <label>سعر الصرف (Exchange Rate)</label>
              <input
                type="number"
                name="exchange_rate"
                placeholder="13200"
                value={formData.exchange_rate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>التصنيف (Category)</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="down_payment">دفعة أولى (Down Payment)</option>
                <option value="installment">قسط (Installment)</option>
                <option value="rent">إيجار (Rent)</option>
                <option value="warehouse_purchase">شراء مستودع (Warehouse Purchase)</option>
              </select>
            </div>

            <div className="custom-form-group">
              <label>طريقة الدفع (Payment Method)</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                <option value="cash">نقدي (Cash)</option>
                <option value="check">شيك (Check)</option>
                <option value="card">بطاقة دائنة (Card)</option>
                <option value="western_union">ويسترن يونيون (Western Union)</option>
                <option value="e_wallet">محفظة إلكترونية (E-Wallet)</option>
              </select>
            </div>
          </div>

          {/* 4️⃣ إظهار القوائم المنسدلة للعميل والمشروع بدلاً من الحقول النصية */}
          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>اختر العميل / الطرف (Party)</label>
              <select
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
            </div>

            <div className="custom-form-group">
              <label>اختر المشروع (Project - اختياري)</label>
              <select
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
            </div>
          </div>

          <div className="custom-form-group">
            <label>وصف المعاملة (Description)</label>
            <textarea
              name="description"
              placeholder="استلام قسط الشقة رقم 102 للمشروع الأول..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="custom-form-group">
            <label>المرفقات (إيصالات / صور)</label>
            <input
              type="file"
              multiple
              id="file-input-transfer"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-input-transfer"
              className="financial-secondary-btn"
              style={{ cursor: "pointer", width: "fit-content" }}
            >
              <Upload size={16} />
              <span>اختر الملفات...</span>
            </label>

            {selectedFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="financial-type-chip" style={{ gap: "6px" }}>
                    <FileText size={14} />
                    {file.name}
                    <X size={14} style={{ cursor: "pointer" }} onClick={() => removeFile(idx)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="financial-modal-actions">
            <button type="submit" className="btn-save-primary" disabled={loading}>
              <Send size={16} />
              <span>{loading ? "جاري الحفظ..." : editOpen ? "تحديث المعاملة" : "حفظ المعاملة"}</span>
            </button>
            <button
              type="button"
              className="btn-cancel-secondary"
              onClick={() => {
                setCreateOpen(false);
                setEditOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. مودال إلغاء المعاملة */}
      <Modal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setItemToCancel(null);
        }}
        title="إلغاء المعاملة المالية"
        size="md"
      >
        <form onSubmit={handleConfirmCancel}>
          <p style={{ marginBottom: "16px", fontSize: "14px", color: "var(--text-secondary, #666)" }}>
            هل أنت تأكد من إلغاء المعاملة رقم <strong>#{itemToCancel?.voucher_number || itemToCancel?.id}</strong>؟
          </p>

          <div className="custom-form-group">
            <label>
              سبب الإلغاء (Reason) <span className="required-dot">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="يرجى كتابة سبب الإلغاء..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="financial-modal-actions justify-end" style={{ marginTop: "20px" }}>
            <button type="submit" className="btn-save-primary danger-btn" disabled={loading}>
              تأكيد الإلغاء
            </button>
            <button
              type="button"
              className="btn-cancel-secondary"
              onClick={() => {
                setCancelOpen(false);
                setItemToCancel(null);
              }}
            >
              تراجع
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. مودال معاينة التفاصيل المباشرة */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedTransfer(null);
        }}
        title="تفاصيل التحويل المالي"
        size="lg"
      >
        {loadingDetails ? (
          <div className="project-empty-state">جاري تحميل بيانات المعاملة من السيرفر...</div>
        ) : (
          <div className="financial-preview-modal">
            <div className="financial-preview-card">
              <div className="financial-preview-row">
                <span className="label">رقم مرجع العملية (Voucher)</span>
                <span className="value">{displayDetails?.voucher_number || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">الطرف المستلم / العميل</span>
                <span className="value">العميل {displayDetails?.party_id || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">المبلغ الإجمالي</span>
                <span className="value highlight">
                  ${Number(displayDetails?.amount || 0).toLocaleString()} {displayDetails?.currency}
                </span>
              </div>

              <div className="financial-preview-row">
                <span className="label">طريقة التحويل</span>
                <span className="value">{formatPaymentMethod(displayDetails?.payment_method)}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">اسم المنشئ</span>
                <span className="value">{displayDetails?.creator?.account?.full_name || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">التاريخ</span>
                <span className="value">{displayDetails?.created_at || "—"}</span>
              </div>

              <div className="financial-preview-row">
                <span className="label">الحالة الحالية</span>
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
                <h4 className="financial-preview-title">البيان / الوصف</h4>
                <p className="financial-preview-desc">{displayDetails.description}</p>
              </div>
            )}

            <div className="financial-modal-actions justify-end">
              <button
                className="btn-cancel-secondary"
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