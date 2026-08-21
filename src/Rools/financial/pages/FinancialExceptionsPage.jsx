import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Search,
  SlidersHorizontal,
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
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";
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

const STATUS_META = {
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
  return value ? new Date(value).toLocaleDateString("ar-SY") : "—";
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null || amount === "") return "—";
  return `${Number(amount).toLocaleString("ar-SY")} $`;
}

export default function FinancialContractExceptionsPage() {
  const dispatch = useDispatch();

  // Selector للاستثناءات
  const {
    items: exceptions = [],
    loading = false,
    error = null,
    actionLoading = false,
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
    status: "approved",
    review_notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // 1. جلب سجل الاستثناءات وقائمة العملاء
  useEffect(() => {
    dispatch(fetchContractExceptions());
    dispatch(fetchCustomerServiceClients());
  }, [dispatch]);

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

  const openPreviewModal = async (item) => {
    setSelectedException(item);
    setPreviewOpen(true);
    dispatch(fetchContractExceptionById(item.id));
  };

  const openReviewModal = (item) => {
    setSelectedException(item);
    setReviewData({
      status: item.status === "pending" ? "approved" : item.status,
      review_notes: "",
    });
    setReviewOpen(true);
  };

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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedException) return;

    if (reviewData.status === "rejected" && !reviewData.review_notes.trim()) {
      setFormErrors({ review_notes: "يرجى كتابة سبب الرفض" });
      return;
    }

    const result = await dispatch(
      reviewContractException({
        id: selectedException.id,
        status: reviewData.status,
        rejection_reason: reviewData.review_notes,
        review_notes: reviewData.review_notes,
      })
    );

    if (reviewContractException.fulfilled.match(result)) {
      setReviewOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`هل أنت تأكد من رغبتك في حذف الاستثناء #${id}؟`)) {
      dispatch(deleteContractException(id));
    }
  };

  // الإحصائيات
  const stats = useMemo(() => {
    const totalCount = exceptions.length;
    const pendingCount = exceptions.filter(
      (item) => item.status === "pending"
    ).length;
    const approvedCount = exceptions.filter(
      (item) => item.status === "approved"
    ).length;

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

  // الفلترة والبحث
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

  return (
    <div className="financial-exceptions-page" dir="rtl">
      {/* 1. شبكة الإحصائيات الموحدة */}
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

      {/* 2. شريط الأدوات الموحد تماماً مطاط لصفحة المواعيد والخدمات */}
      <div className="exact-toolbar-card" dir="rtl">
        {/* زر تقديم طلب استثناء جديد */}
        <button
          type="button"
          className="exact-primary-btn"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus size={18} />
          <span>تقديم طلب استثناء جديد</span>
        </button>

        {/* القائمة المنسدلة للتصفية بالحالة */}
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

        {/* عنوان وأيقونة التصفية */}
        <div className="exact-filter-label">
          <SlidersHorizontal size={16} />
          <span>تصفية</span>
        </div>

        {/* حقل البحث المماد يساراً */}
        <div className="exact-search-field">
          <input
            type="text"
            placeholder="ابحث باسم العميل، رقم العقد، مقدم الطلب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* 3. بطاقة الجدول باستخدام مكون TableCard الموحد */}
      <TableCard
        title="إدارة واستثناءات العقود المالية"
        count={filteredExceptions.length}
      >
        {loading ? (
          <div className="table-state">جاري تحميل بيانات الاستثناءات...</div>
        ) : error ? (
          <div className="table-state is-error">
            {typeof error === "string" ? error : "حدث خطأ أثناء تحميل البيانات"}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
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
                    <td colSpan="7" className="empty-cell">
                      لا توجد استثناءات عقود مطابقة لخيارات البحث والحالة
                    </td>
                  </tr>
                ) : (
                  filteredExceptions.map((item) => {
                    const meta = getStatusMeta(item.status);
                    const clientAccount = item.contract?.client?.account;
                    const priceComp = item.comparison?.total_price;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="services-item-cell">
                            <div className="services-thumb-placeholder">
                              <User size={16} />
                            </div>
                            <div className="services-item-info">
                              <strong>
                                {clientAccount?.full_name ||
                                  `عميل لعقد #${item.contract_id}`}
                              </strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="services-date">
                            {item.requested_by?.name || "—"}
                          </span>
                        </td>

                        <td>
                          <strong>عقد #{item.contract_id || "—"}</strong>
                        </td>

                        <td>
                          {priceComp ? (
                            <div>
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "var(--dash-muted)",
                                  marginLeft: "6px",
                                }}
                              >
                                {formatCurrency(priceComp.original)}
                              </span>
                              <strong style={{ color: "var(--dash-accent)" }}>
                                {formatCurrency(priceComp.requested)}
                              </strong>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="services-date">
                          {formatDate(item.created_at)}
                        </td>

                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => openPreviewModal(item)}
                              title="عرض التفاصيل والمقارنة"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn review"
                              onClick={() => openReviewModal(item)}
                              title="مراجعة واعتماد الطلب"
                            >
                              <FileCheck size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={() => handleDelete(item.id)}
                              title="حذف"
                            >
                              <Trash2 size={16} />
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
      </TableCard>

      {/* 4. مودال إضافة / تعديل طلب استثناء */}
      <Modal
        open={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          resetForm();
        }}
        title={
          editOpen
            ? `تعديل الاستثناء #${selectedException?.id || ""}`
            : "تقديم طلب استثناء عقد جديد"
        }
        size="md"
      >
        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label">اختيار العميل</label>
            <div className="exact-select-wrapper" style={{ width: "100%" }}>
              <select
                style={{ width: "100%" }}
                name="client_id"
                value={formData.client_id}
                onChange={handleClientChange}
                disabled={editOpen}
              >
                <option value="">-- اختر العميل --</option>
                {clients.map((client) => {
                  const cId =
                    client.additional_info?.client_id || client.account?.id;
                  const name = client.account?.full_name || `عميل #${cId}`;
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

          <div className="field-group">
            <label className="field-label">
              اختيار العقد <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <div className="exact-select-wrapper" style={{ width: "100%" }}>
              <select
                style={{ width: "100%" }}
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
                    عقد #{contract.id}{" "}
                    {contract.total_price ? `(${contract.total_price} $)` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="exact-select-chevron" />
            </div>
            <ErrorMessage message={formErrors.contract_id} />
          </div>

          <div className="modal-grid">
            <Field
              type="number"
              name="requested_total_price"
              label="السعر الإجمالي المطلوب"
              placeholder="السعر الجديد المطلوب..."
              value={formData.requested_total_price}
              onChange={handleChange}
            />

            <Field
              type="number"
              name="requested_down_payment"
              label="الدفعة الأولى المطلوبة"
              placeholder="قيمة الدفعة الأولى جديدة..."
              value={formData.requested_down_payment}
              onChange={handleChange}
            />
          </div>

          <Field
            type="number"
            name="requested_installments_count"
            label="عدد الأقساط المطلوب"
            placeholder="عدد الأقساط المعدل..."
            value={formData.requested_installments_count}
            onChange={handleChange}
          />

          <div className="field-group">
            <label className="field-label">سبب تقديم الاستثناء</label>
            <textarea
              name="exception_reason"
              className="financial-textarea"
              placeholder="اكتب أسباب طلب الاستثناء بالتفصيل..."
              value={formData.exception_reason}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                setEditOpen(false);
                resetForm();
              }}
              disabled={actionLoading}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={actionLoading}
            >
              <Plus size={16} />
              <span>
                {actionLoading
                  ? "جاري الحفظ..."
                  : editOpen
                  ? "تحديث الاستثناء"
                  : "حفظ الطلب"}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. مودال مراجعة واعتماد الاستثناء */}
      <Modal
        open={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          resetForm();
        }}
        title={`مراجعة وتأكيد الاستثناء #${selectedException?.id || ""}`}
        size="md"
      >
        <form className="modal-form" onSubmit={handleReviewSubmit}>
          <div className="financial-review-context">
            <div className="financial-preview-row">
              <span className="label">العميل:</span>
              <span className="value">
                {selectedException?.contract?.client?.account?.full_name || "—"}
              </span>
            </div>
            <div className="financial-preview-row">
              <span className="label">رقم العقد:</span>
              <span className="value">#{selectedException?.contract_id || "—"}</span>
            </div>
            <div className="financial-preview-row">
              <span className="label">سبب الاستثناء:</span>
              <span className="value">
                {selectedException?.exception_reason || "لا يوجد سبب مدون"}
              </span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">قرار المراجعة والاعتماد</label>
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

          <div className="field-group">
            <label className="field-label">ملاحظات وتوجيهات المراجعة</label>
            <textarea
              name="review_notes"
              className="financial-textarea"
              placeholder="اكتب ملاحظات الإدارة بخصوص هذا القرار..."
              value={reviewData.review_notes}
              onChange={(e) =>
                setReviewData((prev) => ({
                  ...prev,
                  review_notes: e.target.value,
                }))
              }
            />
            <ErrorMessage message={formErrors.review_notes} />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setReviewOpen(false);
                resetForm();
              }}
              disabled={actionLoading}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={actionLoading}
            >
              <FileCheck size={16} />
              <span>
                {actionLoading ? "جاري الحفظ..." : "حفظ القرار والاعتماد"}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. مودال معاينة تفاصيل الاستثناء والمقارنة */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedException(null);
        }}
        title={`تفاصيل استثناء العقد #${selectedException?.id || ""}`}
        size="md"
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
                #{selectedException?.contract_id || "—"}
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

          {/* جدول المقارنة التفصيلي */}
          {selectedException?.comparison && (
            <div className="financial-preview-details">
              <h4 className="financial-preview-title">
                <ArrowRightLeft size={16} />
                <span>جدول مقارنة التغييرات المطلوبة في العقد:</span>
              </h4>

              <div className="table-scroll">
                <table className="legal-table" style={{ minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th>البند</th>
                      <th>القيمة الأصلية</th>
                      <th>القيمة المطلوبة</th>
                      <th>حالة التغيير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedException.comparison.total_price && (
                      <tr>
                        <td>
                          <strong>السعر الإجمالي</strong>
                        </td>
                        <td>
                          {formatCurrency(
                            selectedException.comparison.total_price.original
                          )}
                        </td>
                        <td>
                          {formatCurrency(
                            selectedException.comparison.total_price.requested
                          )}
                        </td>
                        <td>
                          {selectedException.comparison.total_price
                            .is_changed ? (
                            <span
                              style={{
                                color: "var(--danger)",
                                fontWeight: "bold",
                              }}
                            >
                              مُعدَّل
                            </span>
                          ) : (
                            "غير متغير"
                          )}
                        </td>
                      </tr>
                    )}

                    {selectedException.comparison.down_payment && (
                      <tr>
                        <td>
                          <strong>الدفعة الأولى</strong>
                        </td>
                        <td>
                          {formatCurrency(
                            selectedException.comparison.down_payment.original
                          )}
                        </td>
                        <td>
                          {formatCurrency(
                            selectedException.comparison.down_payment
                              .requested
                          )}
                        </td>
                        <td>
                          {selectedException.comparison.down_payment
                            .is_changed ? (
                            <span
                              style={{
                                color: "var(--danger)",
                                fontWeight: "bold",
                              }}
                            >
                              مُعدَّل
                            </span>
                          ) : (
                            "غير متغير"
                          )}
                        </td>
                      </tr>
                    )}

                    {selectedException.comparison.installments_count && (
                      <tr>
                        <td>
                          <strong>عدد الأقساط</strong>
                        </td>
                        <td>
                          {
                            selectedException.comparison.installments_count
                              .original
                          }{" "}
                          أقساط
                        </td>
                        <td>
                          {
                            selectedException.comparison.installments_count
                              .requested
                          }{" "}
                          أقساط
                        </td>
                        <td>
                          {selectedException.comparison.installments_count
                            .is_changed ? (
                            <span
                              style={{
                                color: "var(--danger)",
                                fontWeight: "bold",
                              }}
                            >
                              مُعدَّل
                            </span>
                          ) : (
                            "غير متغير"
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="financial-preview-details">
            <h4 className="financial-preview-title">
              سبب تقديم طلب الاستثناء:
            </h4>
            <p className="financial-preview-desc">
              {selectedException?.exception_reason || "لا يوجد سبب مدون"}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}