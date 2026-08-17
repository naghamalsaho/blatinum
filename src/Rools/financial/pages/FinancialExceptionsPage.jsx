import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Plus,
  Eye,

  Trash2,
  Search,
  Filter,
  ChevronDown,
  DollarSign,
  CheckCircle2,
  Clock,
  User,
  FileCheck,
  Check,
  X,
  ArrowRightLeft,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

// Redux Thunks الخاصة بالاستثناءات والعملاء والعقود
import {
  fetchContractExceptions,
  fetchContractExceptionById,
  createContractException,
  updateContractException,
  reviewContractException,
  deleteContractException,
} from "../features/exceptions/model/contractException.thunks";
import { fetchCustomerServiceClients } from "../../customerService/features/clients/model/client.thunks";
import { fetchClientContracts } from "../../legal/features/contracts/model/contract.thunks";

import "../styles/financial-exceptions.css";

// تحديث قاموس الحالات ليشمل جميع حالات العقد والاستثناء
const STATUS_META = {
  // حالات الاستثناء والعقد
  pending: { label: "قيد المراجعة", type: "busy" },
  pending_approval: { label: "بانتظار موافقة المالي", type: "busy" },
  approved: { label: "معتمد", type: "ok" },
  active: { label: "عقد نشط", type: "ok" },
  rejected: { label: "مرفوض", type: "off" },
  completed: { label: "مكتمل الدفع", type: "ok" },
  terminated: { label: "مفسوخ", type: "off" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "pending", label: "قيد المراجعة" },
  { id: "approved", label: "مقبول / معتمد" },
  { id: "rejected", label: "مرفوض" },
];

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status || "—", type: "off" };
}

function formatDate(value) {
  return value || "—";
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null || amount === "") return "—";
  return `${Number(amount).toLocaleString("ar-SY")} $`;
}

export default function FinancialContractExceptionsPage() {
  const dispatch = useDispatch();
  const statusDropdownRef = useRef(null);

  // Selector للاستثناءات من الـ Redux Store
  const {
    items: exceptions = [],
    loading = false,
    error = null,
  } = useSelector((state) => state.contractExceptions || {});

  // Selector للعملاء
  const clients = useSelector(
    (state) => state.customerServiceClients?.items || []
  );

  // حالات المودالات
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const [selectedException, setSelectedException] = useState(null);

  // عقود العميل المحدد
  const [clientContracts, setClientContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // حالات الفلترة والبحث
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // نموذج إنشاء/تعديل طلب الاستثناء
  const [formData, setFormData] = useState({
    client_id: "",
    contract_id: "",
    exception_reason: "",
    requested_total_price: "",
    requested_down_payment: "",
    requested_installments_count: "",
  });

  // نموذج المراجعة واتخاذ القرار
  const [reviewData, setReviewData] = useState({
    status: "approved", // approved | rejected
    review_notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // 1. جلب سجل الاستثناءات وقائمة العملاء
  useEffect(() => {
    dispatch(fetchContractExceptions());
    dispatch(fetchCustomerServiceClients());
  }, [dispatch]);

  // إغلاق قوائم الفلترة عند النقر خارجها
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

  // 2. معالجة تغيير العميل وجلب عقوده
  const handleClientChange = async (e) => {
    const clientId = e.target.value;

    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      contract_id: "",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      contract_id: "",
      exception_reason: "",
      requested_total_price: "",
      requested_down_payment: "",
      requested_installments_count: "",
    });
    setReviewData({
      status: "approved",
      review_notes: "",
    });
    setClientContracts([]);
    setFormErrors({});
    setSelectedException(null);
  };

  // فتح مودال التعديل
  

  // فتح مودال المعاينة (جلب البيانات التفصيلية للراوت /1)
  const openPreviewModal = async (item) => {
    setSelectedException(item);
    setPreviewOpen(true);
    // يمكنك جلب التفاصيل الكاملة من الراوت إذا كانت تحتوي معلومات أعمق
    dispatch(fetchContractExceptionById(item.id));
  };

  // فتح مودال المراجعة واتخاذ القرار
  const openReviewModal = (item) => {
    setSelectedException(item);
    setReviewData({
      status: item.status === "pending" ? "approved" : item.status,
      review_notes: "",
    });
    setReviewOpen(true);
  };

  // تقديم النموذج (إنشاء / تعديل)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.contract_id) errors.contract_id = "يرجى اختيار العقد";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (createOpen) {
      const result = await dispatch(createContractException(formData));
      if (createContractException.fulfilled.match(result)) {
        setCreateOpen(false);
        resetForm();
      }
    } else if (editOpen && selectedException) {
      const result = await dispatch(
        updateContractException({
          id: selectedException.id,
          values: formData,
        })
      );
      if (updateContractException.fulfilled.match(result)) {
        setEditOpen(false);
        resetForm();
      }
    }
  };

  // حفظ المراجعة والاعتماد
 // داخل FinancialContractExceptionsPage.jsx

// حفظ المراجعة والاعتماد أو الرفض
const handleReviewSubmit = async (e) => {
  e.preventDefault();
  if (!selectedException) return;

  // التحقق من وجود سبب الرفض في حال تم اختيار الرفض
  if (reviewData.status === "rejected" && !reviewData.review_notes.trim()) {
    setFormErrors({ review_notes: "يرجى كتابة سبب الرفض" });
    return;
  }

  const result = await dispatch(
    reviewContractException({
      id: selectedException.id,
      status: reviewData.status, // "approved" أو "rejected"
      rejection_reason: reviewData.review_notes, // إرسال السبب باسم rejection_reason
      review_notes: reviewData.review_notes,
    })
  );

  if (reviewContractException.fulfilled.match(result)) {
    setReviewOpen(false);
    resetForm();
  }
};

  const handleDelete = async (id) => {
    if (window.confirm(`هل أنت تأكد من رغبتك في حذف الاستثناء ${id}؟`)) {
      dispatch(deleteContractException(id));
    }
  };

  // إحصائيات الصفحة
  const stats = useMemo(() => {
    const totalCount = exceptions.length;
    const pendingCount = exceptions.filter(
      (item) => item.status === "pending"
    ).length;
    const approvedCount = exceptions.filter(
      (item) => item.status === "approved"
    ).length;

    // مجموع الخصومات المطلوبة
    const totalDiscountValue = exceptions.reduce((sum, item) => {
      const discount = item.comparison?.total_price?.discount_amount || 0;
      return sum + Math.abs(Number(discount));
    }, 0);

    return [
      {
        title: "إجمالي طلبات الاستثناء",
        value: String(totalCount),
        icon: FileText,
      },
      {
        title: "طلبات قيد المراجعة",
        value: String(pendingCount),
        icon: Clock,
      },
      {
        title: "استثناءات معتمدة",
        value: String(approvedCount),
        icon: CheckCircle2,
      },
      {
        title: "إجمالي فروقات الخصم المطلوب",
        value: formatCurrency(totalDiscountValue),
        icon: DollarSign,
      },
    ];
  }, [exceptions]);

  // فلترة السجلات والبحث
  const filteredExceptions = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return exceptions.filter((item) => {
      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus = item.status === statusFilter;
      }

      const clientName =
        item.contract?.client?.account?.full_name ||
        item.requested_by?.name ||
        "";
      const clientPhone = item.contract?.client?.account?.phone || "";
      const contractId = String(item.contract_id || item.contract?.id || "");
      const requestedPrice = String(
        item.comparison?.total_price?.requested || ""
      );

      const searchable = [
        clientName,
        clientPhone,
        contractId,
        item.exception_reason,
        requestedPrice,
        item.id,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [exceptions, searchTerm, statusFilter]);

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.id === statusFilter)?.label || "الحالة";

  return (
    <div className="financial-exceptions-page" dir="rtl">
      {/* 1. قسم الإحصائيات */}
      <section className="financial-exceptions-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>

      {/* 2. اللوحة الرئيسية للجدول والفلترة */}
      <section className="financial-exceptions-main-grid">
        <article className="financial-panel">
          <div className="financial-panel-head">
            <div>
              <h2>إدارة واستثناءات العقود المالية</h2>
              <p>مراجعة، تقديم، واعتماد الاستثناءات للشروط المالية للعقود</p>
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
              <span>تقديم طلب استثناء جديد</span>
            </Button>
          </div>

          <div className="financial-exceptions-toolbar">
            <div className="financial-search-wrapper">
              <div className="financial-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ابحث باسم العميل، رقم العقد، مقدم الطلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div
                className="financial-status-dropdown"
                ref={statusDropdownRef}
              >
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
            <div className="project-empty-state">
              جاري تحميل بيانات الاستثناءات...
            </div>
          ) : error ? (
            <div className="project-empty-state">
              {typeof error === "string"
                ? error
                : "حدث خطأ أثناء تحميل البيانات"}
            </div>
          ) : (
            <div className="financial-exceptions-table-wrap">
              <table className="financial-exceptions-table">
                <thead>
                  <tr>
                    <th>اسم العميل</th>
                    <th>مُقدم الطلب</th>
                    <th>رقم العقد</th>
                    <th>مقارنة السعر (الأصلي / المطلوب)</th>
                    <th>تاريخ الطلب</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExceptions.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="project-empty-state">
                          لا توجد استثناءات عقود مطابقة لخيارات البحث والحالة
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredExceptions.map((item) => {
                      const meta = getStatusMeta(item.status);
                      const clientAccount = item.contract?.client?.account;
                      const priceComp = item.comparison?.total_price;

                      return (
                        <tr key={item.id}>
                          <td className="financial-primary-td">
                            <div className="financial-exception-title-cell">
                              <div className="financial-exception-icon-box">
                                <User size={18} />
                              </div>
                              <span className="financial-exception-title">
                                {clientAccount?.full_name ||
                                  `عميل لعقد ${item.contract_id}`}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="financial-type-chip">
                              {item.requested_by?.name || "—"}
                            </span>
                          </td>

                          <td className="financial-account-num">
                            عقد {item.contract_id || "—"}
                          </td>

                          <td className="financial-metric">
                            {priceComp ? (
                              <div>
                                <span style={{ textDecoration: "line-through", color: "#888", marginLeft: "6px" }}>
                                  {formatCurrency(priceComp.original)}
                                </span>
                                <strong style={{ color: "#2563eb" }}>
                                  {formatCurrency(priceComp.requested)}
                                </strong>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="financial-date">
                            {formatDate(item.created_at)}
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
                                title="عرض التفاصيل والمقارنة"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                className="financial-icon-btn review"
                                onClick={() => openReviewModal(item)}
                                title="مراجعة واعتماد الطلب"
                              >
                                <FileCheck size={14} />
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

      {/* 3. مودال تسجيل / تعديل طلب الاستثناء */}
      <Modal
        open={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          resetForm();
        }}
        title={
          editOpen
            ? `تعديل الاستثناء ${selectedException?.id || ""}`
            : "تقديم طلب استثناء عقد جديد"
        }
        size="lg"
      >
        <form className="financial-modal-form" onSubmit={handleSubmit} noValidate>
          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>اختيار العميل</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleClientChange}
                disabled={editOpen}
              >
                <option value="">-- اختر العميل --</option>
                {clients.map((client) => {
                  const cId =
                    client.additional_info?.client_id || client.account?.id;
                  const name =
                    client.account?.full_name || `عميل ${cId}`;
                  return (
                    <option key={cId} value={cId}>
                      {name}
                    </option>
                  );
                })}
              </select>
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
                    ? "-- اختر العميل أولاً --"
                    : clientContracts.length === 0
                    ? "لا توجد عقود لهذا العميل"
                    : "-- اختر العقد --"}
                </option>
                {clientContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    عقد {contract.id}{" "}
                    {contract.total_price ? `(${contract.total_price} $)` : ""}
                  </option>
                ))}
              </select>
              <ErrorMessage message={formErrors.contract_id} />
            </div>
          </div>

          <div className="financial-modal-grid">
            <div className="custom-form-group">
              <label>السعر الإجمالي المطلوب</label>
              <input
                type="number"
                name="requested_total_price"
                placeholder="السعر الجديد المطلوب..."
                value={formData.requested_total_price}
                onChange={handleChange}
              />
            </div>

            <div className="custom-form-group">
              <label>الدفعة الأولى المطلوبة</label>
              <input
                type="number"
                name="requested_down_payment"
                placeholder="قيمة الدفعة الأولى جديدة..."
                value={formData.requested_down_payment}
                onChange={handleChange}
              />
            </div>

            <div className="custom-form-group">
              <label>عدد الأقساط المطلوب</label>
              <input
                type="number"
                name="requested_installments_count"
                placeholder="عدد الأقساط المعدل..."
                value={formData.requested_installments_count}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="financial-modal-grid financial-modal-grid--single">
            <div className="custom-form-group">
            </div>
          </div>

          <div className="financial-modal-actions">
            <button
              type="submit"
              className="btn-save-primary"
              disabled={loading}
            >
              <span>
                {loading
                  ? "جاري الحفظ..."
                  : editOpen
                  ? "تحديث الاستثناء"
                  : "حفظ الطلب"}
              </span>
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

      {/* 4. مودال مراجعة واعتماد الاستثناء */}
      <Modal
        open={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          resetForm();
        }}
        title={`مراجعة وتأكيد الاستثناء ${selectedException?.id || ""}`}
        size="lg"
      >
        <form className="financial-modal-form" onSubmit={handleReviewSubmit}>
          <div className="financial-review-context">
            <div className="financial-preview-row">
              <span className="label">العميل:</span>
              <span className="value">
                {selectedException?.contract?.client?.account?.full_name || "—"}
              </span>
            </div>
            <div className="financial-preview-row">
              <span className="label">رقم العقد:</span>
              <span className="value">{selectedException?.contract_id || "—"}</span>
            </div>
            <div className="financial-preview-row">
              <span className="label">سبب الاستثناء:</span>
              <span className="value">
                {selectedException?.exception_reason || "لا يوجد سبب مدون"}
              </span>
            </div>
          </div>

          <div className="custom-form-group">
            <label>قرار المراجعة والاعتماد</label>
            <div className="financial-review-options">
              <label
                className={`review-option ${
                  reviewData.status === "approved" ? "selected-ok" : ""
                }`}
              >
                <input
                  type="radio"
                  name="review_status"
                  value="approved"
                  checked={reviewData.status === "approved"}
                  onChange={() =>
                    setReviewData((prev) => ({ ...prev, status: "approved" }))
                  }
                />
                <Check size={16} />
                <span>اعتماد وقبول الاستثناء</span>
              </label>

              <label
                className={`review-option ${
                  reviewData.status === "rejected" ? "selected-off" : ""
                }`}
              >
                <input
                  type="radio"
                  name="review_status"
                  value="rejected"
                  checked={reviewData.status === "rejected"}
                  onChange={() =>
                    setReviewData((prev) => ({ ...prev, status: "rejected" }))
                  }
                />
                <X size={16} />
                <span>رفض الاستثناء</span>
              </label>
            </div>
          </div>

          <div className="custom-form-group">
            <label>ملاحظات توجيهات المراجعة</label>
            <textarea
              name="review_notes"
              placeholder="اكتب ملاحظات الإدارة بخصوص هذا القرار..."
              value={reviewData.review_notes}
              onChange={(e) =>
                setReviewData((prev) => ({
                  ...prev,
                  review_notes: e.target.value,
                }))
              }
            />
          </div>

          <div className="financial-modal-actions">
            <button
              type="submit"
              className="btn-save-primary"
              disabled={loading}
            >
              <span>{loading ? "جاري الحفظ..." : "حفظ القرار والاعتماد"}</span>
            </button>

            <button
              type="button"
              className="btn-cancel-secondary"
              onClick={() => {
                setReviewOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. مودال معاينة تفاصيل الاستثناء والمقارنة (Comparison Details) */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedException(null);
        }}
        title={`عرض تفاصيل استثناء العقد ${selectedException?.id || ""}`}
        size="lg"
      >
        <div className="financial-preview-modal">
          <div className="financial-preview-card">
            <div className="financial-preview-row">
              <span className="label">اسم العميل:</span>
              <span className="value">
                {selectedException?.contract?.client?.account?.full_name || "—"}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">مُقدم الطلب:</span>
              <span className="value">
                {selectedException?.requested_by?.name || "—"}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">رقم العقد:</span>
              <span className="value">
                {selectedException?.contract_id || "—"}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">تاريخ الطلب:</span>
              <span className="value">
                {formatDate(selectedException?.created_at)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">الحالة الحالية:</span>
              <span className="value">
                <StatusBadge
                  status={getStatusMeta(selectedException?.status).label}
                  type={getStatusMeta(selectedException?.status).type}
                />
              </span>
            </div>
          </div>

          {/* جدول المقارنة التفصيلي (Comparison Table) */}
          {selectedException?.comparison && (
            <div className="financial-preview-details" style={{ marginTop: "16px" }}>
              <h4 className="financial-preview-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ArrowRightLeft size={18} />
                <span>جدول مقارنة التغييرات المطلوبة في العقد:</span>
              </h4>

              <table className="financial-exceptions-table" style={{ marginTop: "10px" }}>
                <thead>
                  <tr>
                    <th>البند</th>
                    <th>القيمة الأصلية</th>
                    <th>القيمة المطلوبة</th>
                    <th>حالة التغيير</th>
                  </tr>
                </thead>
                <tbody>
                  {/* السعر الكلي */}
                  {selectedException.comparison.total_price && (
                    <tr>
                      <td><strong>السعر الإجمالي</strong></td>
                      <td>{formatCurrency(selectedException.comparison.total_price.original)}</td>
                      <td>{formatCurrency(selectedException.comparison.total_price.requested)}</td>
                      <td>
                        {selectedException.comparison.total_price.is_changed ? (
                          <span style={{ color: "#e11d48", fontWeight: "bold" }}>مُعدَّل</span>
                        ) : (
                          "غير متغير"
                        )}
                      </td>
                    </tr>
                  )}

                  {/* الدفعة الأولى */}
                  {selectedException.comparison.down_payment && (
                    <tr>
                      <td><strong>الدفعة الأولى</strong></td>
                      <td>{formatCurrency(selectedException.comparison.down_payment.original)}</td>
                      <td>{formatCurrency(selectedException.comparison.down_payment.requested)}</td>
                      <td>
                        {selectedException.comparison.down_payment.is_changed ? (
                          <span style={{ color: "#e11d48", fontWeight: "bold" }}>مُعدَّل</span>
                        ) : (
                          "غير متغير"
                        )}
                      </td>
                    </tr>
                  )}

                  {/* عدد الأقساط */}
                  {selectedException.comparison.installments_count && (
                    <tr>
                      <td><strong>عدد الأقساط</strong></td>
                      <td>{selectedException.comparison.installments_count.original} أقساط</td>
                      <td>{selectedException.comparison.installments_count.requested} أقساط</td>
                      <td>
                        {selectedException.comparison.installments_count.is_changed ? (
                          <span style={{ color: "#e11d48", fontWeight: "bold" }}>مُعدَّل</span>
                        ) : (
                          "غير متغير"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="financial-preview-details" style={{ marginTop: "16px" }}>
            <h4 className="financial-preview-title">سبب تقديم طلب الاستثناء:</h4>
            <p className="financial-preview-desc">
              {selectedException?.exception_reason || "لا يوجد سبب مدون"}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}