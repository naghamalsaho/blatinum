import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CreditCard,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  DollarSign,
  CheckCircle2,
  Clock,
  User,
  Upload,
  FileText,
  X,
  
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

// Redux Thunks
import {
  fetchPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from "../features/payments/model/payment.thunks";
import { fetchCustomerServiceClients } from "../../customerService/features/clients/model/client.thunks";
import { fetchClientContracts } from "../../legal/features/contracts/model/contract.thunks";

// Validations
import {
  validateCreatePaymentForm,
  validateUpdatePaymentForm,
} from "../features/payments/validation/payment.validation";

import "../styles/financial-payments.css";

const STATUS_META = {
  paid: { label: "مدفوع", type: "ok" },
  active: { label: "نشط", type: "ok" },
  pending: { label: "قيد الانتظار", type: "busy" },
  inactive: { label: "غير نشط", type: "off" },
  failed: { label: "فاشل / ملغى", type: "off" },
  refunded: { label: "مسترجع", type: "off" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "paid", label: "مدفوع" },
  { id: "pending", label: "قيد الانتظار" },
  { id: "active", label: "نشط" },
  { id: "failed", label: "فاشل / ملغى" },
];

function getStatusMeta(status) {
  if (typeof status === "boolean") {
    return STATUS_META[status ? "active" : "inactive"];
  }
  if (status === "1" || status === 1) return STATUS_META.active;
  if (status === "0" || status === 0) return STATUS_META.inactive;
  return STATUS_META[status] || { label: status || "—", type: "off" };
}

function formatDate(value) {
  return value || "—";
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "—";
  return `${Number(amount).toLocaleString("ar-SY")} ل.س`;
}

function formatPaymentMethod(method) {
  switch (method) {
    case "cash":
      return "نقدي (كاش)";
    case "bank_transfer":
      return "تحويل بنكي";
    case "check":
    case "cheque":
      return "شيك بنكي";
    case "card":
      return "بطاقة إلكترونية";
    default:
      return method || "—";
  }
}

function formatPaymentType(type) {
  switch (type) {
    case "down_payment":
      return "دفعة أولى (مقدم)";
    case "installment":
      return "قسط شهري";
    case "final_payment":
      return "دفعة نهائية";
    case "maintenance":
      return "صيانة";
    case "full":
      return "سداد كامل";
    default:
      return type || "—";
  }
}

export default function FinancialPaymentsPage() {
  const dispatch = useDispatch();
  const statusDropdownRef = useRef(null);

  // Selector للدفعات
  const {
    items: payments = [],
    loading = false,
    error = null,
  } = useSelector((state) => state.payments || state.financialPayments || {});

  // Selector للعملاء المجلوبين من /client
  const clients = useSelector(
    (state) => state.customerServiceClients?.items || []
  );

  // حالات المودال والفلترة
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // عقود العميل المحدد حالياً
  const [clientContracts, setClientContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    client_id: "",
    contract_id: "",
    amount: "",
    payment_date: "",
    payment_method: "cash",
    payment_type: "down_payment",
    status: "pending",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // 1. جلب سجل الدفعات وقائمة العملاء عند بداية التشغيل
  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchCustomerServiceClients());
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

  // 2. معالجة تغيير الزبون وجلب عقوده من `/contract/client/{clientId}`
  const handleClientChange = async (e) => {
    const clientId = e.target.value;

    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      contract_id: "", // إعادة تعيين العقد عند تغيير الزبون
    }));

    setFormErrors((prev) => ({
      ...prev,
      client_id: "",
      contract_id: "",
    }));

    if (!clientId) {
      setClientContracts([]);
      return;
    }

    // جلب عقود الزبون المحدد
    setLoadingContracts(true);
    try {
      const result = await dispatch(fetchClientContracts(clientId)).unwrap();
      setClientContracts(Array.isArray(result) ? result : []);
    } catch {
      setClientContracts([]);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      setFormErrors((prev) => ({ ...prev, files: "" }));
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      contract_id: "",
      amount: "",
      payment_date: "",
      payment_method: "cash",
      payment_type: "down_payment",
      status: "pending",
      notes: "",
    });
    setSelectedFiles([]);
    setClientContracts([]);
    setFormErrors({});
    setSelectedPayment(null);
  };

  const openEditModal = async (payment) => {
    setSelectedPayment(payment);

    let rawDate = payment.payment_date || "";
    if (rawDate.includes(" ")) {
      rawDate = rawDate.split(" ")[0];
    }

    const clientId = payment.client_id || payment.client?.additional_info?.client_id || payment.client?.id || "";

    setFormData({
      client_id: clientId,
      contract_id: payment.contract_id || payment.contract?.id || "",
      amount: payment.amount || payment.amount_limit || "",
      payment_date: rawDate,
      payment_method: payment.payment_method || "cash",
      payment_type: payment.payment_type || "down_payment",
      status: payment.status || "pending",
      notes: "",
    });

    // جلب العقود في حال التعديل أيضاً
    if (clientId) {
      setLoadingContracts(true);
      try {
        const result = await dispatch(fetchClientContracts(clientId)).unwrap();
        setClientContracts(Array.isArray(result) ? result : []);
      } catch  {
        setClientContracts([]);
      } finally {
        setLoadingContracts(false);
      }
    }

    setSelectedFiles([]);
    setFormErrors({});
    setEditOpen(true);
  };

  const openPreviewModal = (payment) => {
    setSelectedPayment(payment);
    setPreviewOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (createOpen) {
      const { errors, isValid } = validateCreatePaymentForm(formData, selectedFiles);
      if (!isValid) {
        setFormErrors(errors);
        return;
      }

      const values = {
        client_id: formData.client_id,
        contract_id: formData.contract_id,
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        status: formData.status,
      };

      const result = await dispatch(
        createPayment({
          values,
          files: selectedFiles,
        })
      );

      if (createPayment.fulfilled.match(result)) {
        setCreateOpen(false);
        resetForm();
      }
    } else if (editOpen && selectedPayment) {
      const { errors, isValid } = validateUpdatePaymentForm(formData, selectedFiles);
      if (!isValid) {
        setFormErrors(errors);
        return;
      }

      const values = {
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        status: formData.status,
      };

      const result = await dispatch(
        updatePayment({
          id: selectedPayment.id,
          values,
          files: selectedFiles,
        })
      );

      if (updatePayment.fulfilled.match(result)) {
        setEditOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`هل أنت تأكد من رغبتك في حذف الدفعة #${id}؟`)) {
      dispatch(deletePayment(id));
    }
  };

  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const activeCount = payments.filter(
      (item) =>
        item.status === "paid" ||
        item.status === "active" ||
        item.status === 1 ||
        item.status === true
    ).length;
    const pendingCount = payments.filter(
      (item) => item.status === "pending"
    ).length;

    const totalLimits = payments.reduce(
      (sum, item) => sum + Number(item.amount || item.amount_limit || 0),
      0
    );

    return [
      {
        title: "إجمالي السجلات والمعاملات",
        value: String(totalPayments),
        icon: CreditCard,
      },
      {
        title: "معاملات مدفوعة / نشطة",
        value: String(activeCount),
        icon: CheckCircle2,
      },
      {
        title: "دفعة قيد الانتظار",
        value: String(pendingCount),
        icon: Clock,
      },
      {
        title: "إجمالي المبالغ والسيولة",
        value: formatCurrency(totalLimits),
        icon: DollarSign,
      },
    ];
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return payments.filter((item) => {
      let matchesStatus = true;
      const statusKey = item.status;

      if (statusFilter !== "all") {
        matchesStatus = statusKey === statusFilter;
      }

      const clientName = item.client?.account?.full_name || "";
      const clientPhone = item.client?.account?.phone || "";
      const clientEmail = item.client?.account?.email || "";
      const amountStr = String(item.amount || item.amount_limit || "");

      const searchable = [
        clientName,
        clientPhone,
        clientEmail,
        item.payment_method,
        item.payment_type,
        amountStr,
        item.id,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [payments, searchTerm, statusFilter]);

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.id === statusFilter)?.label || "الحالة";

  return (
    <div className="financial-payments-page" dir="rtl">
      {/* 1. قسم الإحصائيات */}
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

      {/* 2. قسم الجدول والفلترة */}
      <section className="financial-payments-main-grid">
        <article className="financial-panel">
          <div className="financial-panel-head">
            <div>
              <h2>إدارة الوسائل والدفعات المالية</h2>
              <p>استعراض، متابعة، وإدارة دفعات العملاء في النظام</p>
            </div>

            <Button
              type="button"
              className="financial-secondary-btn"
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
            >
              <Plus size={16} />
              <span>تسجيل دفعة جديدة</span>
            </Button>
          </div>

          <div className="financial-payments-toolbar">
            <div className="financial-search-wrapper">
              <div className="financial-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ابحث باسم العميل، الهاتف، أو نوع الدفعة..."
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
                    className={`status-arrow ${
                      statusDropdownOpen ? "open" : ""
                    }`}
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
            <div className="project-empty-state">جاري تحميل البيانات المالية...</div>
          ) : error ? (
            <div className="project-empty-state">
              {typeof error === "string" ? error : "حدث خطأ أثناء تحميل البيانات"}
            </div>
          ) : (
            <div className="financial-payments-table-wrap">
              <table className="financial-payments-table">
                <thead>
                  <tr>
                    <th>اسم العميل</th>
                    <th>طريقة / نوع الدفع</th>
                    <th>رقم التواصل</th>
                    <th>المبلغ</th>
                    <th>تاريخ الدفع</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="project-empty-state">
                          لا توجد سجلات دفع مطابقة لخيارات البحث والحالة
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((item) => {
                      const meta = getStatusMeta(item.status);
                      const clientAccount = item.client?.account;

                      return (
                        <tr key={item.id}>
                          <td className="financial-primary-td">
                            <div className="financial-payment-title-cell">
                              <div className="financial-payment-icon-box">
                                <User size={18} />
                              </div>
                              <span className="financial-payment-title">
                                {clientAccount?.full_name || `دفعة #${item.id}`}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="financial-type-chip">
                              {formatPaymentMethod(item.payment_method)} (
                              {formatPaymentType(item.payment_type)})
                            </span>
                          </td>

                          <td className="financial-account-num">
                            {clientAccount?.phone || "—"}
                          </td>

                          <td className="financial-metric">
                            {formatCurrency(item.amount || item.amount_limit)}
                          </td>

                          <td className="financial-date">
                            {formatDate(item.payment_date || item.created_at)}
                          </td>

                          <td>
                            <StatusBadge status={meta.label} type={meta.type} />
                          </td>

                          <td>
                            <div className="financial-row-actions">
                              <button
                                type="button"
                                className="financial-icon-btn"
                                onClick={() => openPreviewModal(item)}
                                title="عرض التفاصيل"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                className="financial-icon-btn edit"
                                onClick={() => openEditModal(item)}
                                title="تعديل"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                className="financial-icon-btn danger"
                                onClick={() => handleDelete(item.id)}
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
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

      {/* 3. مودال تسجيل / تعديل الدفعة الديناميكي */}
      <Modal
        open={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          resetForm();
        }}
        title={editOpen ? `تعديل الدفعة #${selectedPayment?.id || ""}` : "تسجيل دفعة جديدة"}
        size="lg"
      >
        <form className="financial-modal-form" onSubmit={handleSubmit} noValidate>
          {/* اختيار الزبون والعقد بشكل ديناميكي */}
          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>
                اختيار الزبون <span className="required-dot">•</span>
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleClientChange}
                disabled={editOpen}
              >
                <option value="">-- اختر الزبون --</option>
                {clients.map((client) => {
                  const cId = client.additional_info?.client_id || client.account?.id;
                  const name = client.account?.full_name || `زبون #${cId}`;
                  const phone = client.account?.phone ? ` (${client.account.phone})` : "";
                  return (
                    <option key={cId} value={cId}>
                      {name} {phone}
                    </option>
                  );
                })}
              </select>
              <ErrorMessage message={formErrors.client_id} />
            </div>

            <div className="custom-form-group">
              <label>
                اختيار العقد <span className="required-dot">•</span>
              </label>
              <select
                name="contract_id"
                value={formData.contract_id}
                onChange={handleChange}
                disabled={!formData.client_id || loadingContracts || editOpen}
              >
                <option value="">
                  {loadingContracts
                    ? "جاري تحميل العقود..."
                    : !formData.client_id
                    ? "-- اختر الزبون أولاً --"
                    : clientContracts.length === 0
                    ? "لا توجد عقود لهذا الزبون"
                    : "-- اختر العقد --"}
                </option>
                {clientContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    عقد #{contract.id} {contract.total_price ? `(${contract.total_price} ل.س)` : ""}
                  </option>
                ))}
              </select>
              <ErrorMessage message={formErrors.contract_id} />
            </div>
          </div>

          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>
                المبلغ <span className="required-dot">•</span>
              </label>
              <input
                type="number"
                name="amount"
                placeholder="مثال: 800"
                value={formData.amount}
                onChange={handleChange}
                disabled={editOpen}
              />
              <ErrorMessage message={formErrors.amount} />
            </div>

            <div className="custom-form-group">
              <label>
                تاريخ الدفع <span className="required-dot">•</span>
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
              />
              <ErrorMessage message={formErrors.payment_date} />
            </div>
          </div>

          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>
                الحالة <span className="required-dot">•</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">قيد الانتظار (pending)</option>
                <option value="paid">مدفوع (paid)</option>
                <option value="failed">فاشل (failed)</option>
                <option value="refunded">مسترجع (refunded)</option>
              </select>
              <ErrorMessage message={formErrors.status} />
            </div>

            <div className="custom-form-group">
              <label>طريقة الدفع</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                <option value="cash">نقدي (cash)</option>
                <option value="bank_transfer">تحويل بنكي (bank_transfer)</option>
                <option value="check">شيك بنكي (check)</option>
                <option value="card">بطاقة إلكترونية (card)</option>
              </select>
              <ErrorMessage message={formErrors.payment_method} />
            </div>
          </div>

          <div className="financial-modal-grid financial-modal-grid--single">
            <div className="custom-form-group">
              <label>نوع الدفعة</label>
              <select
                name="payment_type"
                value={formData.payment_type}
                onChange={handleChange}
              >
                <option value="down_payment">دفعة أولى مقدم (down_payment)</option>
                <option value="installment">قسط شهري (installment)</option>
                <option value="final_payment">دفعة نهائية (final_payment)</option>
                <option value="maintenance">صيانة (maintenance)</option>
              </select>
              <ErrorMessage message={formErrors.payment_type} />
            </div>
          </div>

          {/* رفع المرفقات */}
          <div className="financial-modal-grid financial-modal-grid--single">
            <div className="custom-form-group">
              <label>مرفقات الدفعة (ملفات / صور)</label>
              <input
                type="file"
                multiple
                id="file-input"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-input"
                className="financial-secondary-btn"
                style={{ cursor: "pointer", width: "fit-content" }}
              >
                <Upload size={16} />
                <span>اختر الملفات...</span>
              </label>

              <ErrorMessage message={formErrors.files} />

              {selectedFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                  {selectedFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="financial-type-chip"
                      style={{ gap: "6px", padding: "6px 12px" }}
                    >
                      <FileText size={14} />
                      {file.name}
                      <X
                        size={14}
                        style={{ cursor: "pointer", marginRight: "4px" }}
                        onClick={() => removeFile(idx)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="financial-modal-actions">
            <button type="submit" className="btn-save-primary" disabled={loading}>
              <span>{loading ? "جاري الحفظ..." : editOpen ? "تحديث الدفعة" : "حفظ الدفعة"}</span>
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

      {/* 4. مودال معاينة التفاصيل */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedPayment(null);
        }}
        title={`تفاصيل دفعة #${selectedPayment?.id || ""}`}
        size="lg"
      >
        <div className="financial-preview-modal">
          <div className="financial-preview-card">
            <div className="financial-preview-row">
              <span className="label">اسم العميل:</span>
              <span className="value">
                {selectedPayment?.client?.account?.full_name || "—"}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">رقم العقد:</span>
              <span className="value">
                #{selectedPayment?.contract_id || selectedPayment?.contract?.id || "—"}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">طريقة الدفع:</span>
              <span className="value">
                {formatPaymentMethod(selectedPayment?.payment_method)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">نوع الدفعة:</span>
              <span className="value">
                {formatPaymentType(selectedPayment?.payment_type)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">المبلغ:</span>
              <span className="value highlight">
                {formatCurrency(selectedPayment?.amount || selectedPayment?.amount_limit)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">تاريخ الدفع:</span>
              <span className="value">
                {formatDate(selectedPayment?.payment_date || selectedPayment?.created_at)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">الحالة:</span>
              <span className="value">
                <StatusBadge
                  status={getStatusMeta(selectedPayment?.status).label}
                  type={getStatusMeta(selectedPayment?.status).type}
                />
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}