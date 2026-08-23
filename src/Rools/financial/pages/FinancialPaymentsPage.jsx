import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CreditCard,
  Plus,
  Eye,
  Pencil,
  Search,
  SlidersHorizontal,
  ChevronDown,
  DollarSign,
  CheckCircle2,
  Clock,
  User,
  Upload,
  FileText,
  X,
  History,
  Layers,
  ExternalLink,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

// Redux Thunks
import {
  fetchPayments,
  createPayment,
  changePaymentStatus,
  fetchPaymentsByContract,
  payCustomByContract,
} from "../features/payments/model/payment.thunks";
import { fetchCustomerServiceClients } from "../../customerService/features/clients/model/client.thunks";
import { fetchClientContracts } from "../../legal/features/contracts/model/contract.thunks";

// Validations
import { validateCreatePaymentForm } from "../features/payments/validation/payment.validation";

import "../styles/financial-payments.css";

const STATUS_META = {
  paid: { label: "مدفوع", type: "ok" },
  active: { label: "نشط", type: "ok" },
  pending: { label: "قيد الانتظار", type: "busy" },
  inactive: { label: "غير نشط", type: "off" },
  posted: { label: "مرحّل", type: "ok" },
  failed: { label: "فاشل", type: "off" },
  refunded: { label: "مسترجع", type: "off" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "pending", label: "قيد الانتظار" },
  { id: "active", label: "نشط" },
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
  return value ? new Date(value).toLocaleDateString("ar-SY") : "—";
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "—";
  return `${Number(amount).toLocaleString("ar-SY")} $`;
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
    case "custom":
      return "سداد مخصص / أشهر قادمة";
    default:
      return type || "—";
  }
}

function getClientDetails(item) {
  const partyAccount = item?.party?.account;
  const clientAccount = item?.client?.account;

  const fullName =
    partyAccount?.full_name ||
    clientAccount?.full_name ||
    item?.party?.full_name ||
    item?.client?.full_name ||
    "—";

  const phone =
    partyAccount?.phone ||
    clientAccount?.phone ||
    item?.party?.phone ||
    item?.client?.phone ||
    "—";

  const clientId =
    item?.party?.additional_info?.client_id ||
    item?.party_id ||
    item?.client?.additional_info?.client_id ||
    item?.client_id ||
    item?.client?.id;

  return { fullName, phone, clientId };
}

export default function FinancialPaymentsPage() {
  const dispatch = useDispatch();

  // Selectors
  const {
    items: payments = [],
    loading = false,
    error = null,
  } = useSelector((state) => state.payments || state.financialPayments || {});

  const clients = useSelector(
    (state) => state.customerServiceClients?.items || []
  );

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Tracking Modal States
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [contractPayments, setContractPayments] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [selectedContractInfo, setSelectedContractInfo] = useState(null);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Client Contracts
  const [clientContracts, setClientContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payment Mode (standard vs custom)
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Form Data
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

  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchCustomerServiceClients());
  }, [dispatch]);

  const handleOpenTracking = async (item) => {
    const contractId =
      item?.contract_id ||
      item?.contract?.id ||
      item?.transactionable?.contract_id ||
      item?.transactionable_id;

    if (!contractId) {
      alert("تعذر العثور على رقم العقد المربوط به الموفق / السند.");
      return;
    }

    setTrackingOpen(true);
    setLoadingTracking(true);
    setContractPayments([]);
    setSelectedContractInfo(null);

    try {
      const data = await dispatch(fetchPaymentsByContract(contractId)).unwrap();
      setContractPayments(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && data[0].contract) {
        setSelectedContractInfo(data[0].contract);
      }
    } catch {
      setContractPayments([]);
    } finally {
      setLoadingTracking(false);
    }
  };

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
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setClientContracts(list);
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
    setIsCustomMode(false);
    setSelectedFiles([]);
    setClientContracts([]);
    setFormErrors({});
    setSelectedPayment(null);
  };

  const openEditModal = async (payment) => {
    setSelectedPayment(payment);

    let rawDate = payment.payment_date || payment.created_at || "";
    if (rawDate.includes(" ")) {
      rawDate = rawDate.split(" ")[0];
    }

    const { clientId } = getClientDetails(payment);

    setFormData({
      client_id: clientId || "",
      contract_id: payment.contract_id || payment.contract?.id || "",
      amount: payment.amount || payment.amount_limit || "",
      payment_date: rawDate,
      payment_method: payment.payment_method || "cash",
      payment_type: payment.payment_type || payment.category || "down_payment",
      status: payment.status || "pending",
      notes: "",
    });

    if (clientId) {
      setLoadingContracts(true);
      try {
        const result = await dispatch(fetchClientContracts(clientId)).unwrap();
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];
        setClientContracts(list);
      } catch {
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
      if (isCustomMode) {
        if (!formData.contract_id || !formData.amount) {
          setFormErrors({
            contract_id: !formData.contract_id ? "يرجى اختيار العقد" : "",
            amount: !formData.amount ? "يرجى إدخال المبلغ" : "",
          });
          return;
        }

        const result = await dispatch(
          payCustomByContract({
            contractId: formData.contract_id,
            values: {
              amount: formData.amount,
              payment_method: formData.payment_method,
            },
            files: selectedFiles,
          })
        );

        if (payCustomByContract.fulfilled.match(result)) {
          setCreateOpen(false);
          dispatch(fetchPayments());

          if (formData.contract_id) {
            const updatedContractData = await dispatch(
              fetchPaymentsByContract(formData.contract_id)
            ).unwrap();
            setContractPayments(
              Array.isArray(updatedContractData) ? updatedContractData : []
            );
          }

          resetForm();
        }
        return;
      }

      const { errors, isValid } = validateCreatePaymentForm(
        formData,
        selectedFiles
      );
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
        createPayment({ values, files: selectedFiles })
      );

      if (createPayment.fulfilled.match(result)) {
        setCreateOpen(false);
        dispatch(fetchPayments());

        if (formData.contract_id) {
          const updatedContractData = await dispatch(
            fetchPaymentsByContract(formData.contract_id)
          ).unwrap();
          setContractPayments(
            Array.isArray(updatedContractData) ? updatedContractData : []
          );
        }

        resetForm();
      }
    } else if (editOpen && selectedPayment) {
      const result = await dispatch(
        changePaymentStatus({
          id: selectedPayment.id,
          status: formData.status,
        })
      );

      if (changePaymentStatus.fulfilled.match(result)) {
        setEditOpen(false);
        dispatch(fetchPayments());

        const activeContractId =
          selectedPayment?.contract_id ||
          selectedPayment?.contract?.id ||
          selectedPayment?.transactionable?.contract_id;

        if (activeContractId) {
          try {
            const updatedContractData = await dispatch(
              fetchPaymentsByContract(activeContractId)
            ).unwrap();
            setContractPayments(
              Array.isArray(updatedContractData) ? updatedContractData : []
            );
          } catch {
            // التعامل مع الخطأ
          }
        }

        resetForm();
      }
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const activeCount = payments.filter(
      (item) =>
        item.status === "paid" ||
        item.status === "posted" ||
        item.status === "active" ||
        item.status === 1 ||
        item.status === true
    ).length;

    const pendingCount = payments.filter((item) => item.status === "pending").length;

    const totalLimits = payments.reduce(
      (sum, item) => sum + Number(item.amount || item.amount_limit || 0),
      0
    );

    return [
      { title: "إجمالي السجلات والمعاملات", value: String(totalPayments), icon: CreditCard },
      { title: "معاملات مدفوعة / مرحّلة", value: String(activeCount), icon: CheckCircle2 },
      { title: "دفعة قيد الانتظار", value: String(pendingCount), icon: Clock },
      { title: "إجمالي المبالغ والسيولة", value: formatCurrency(totalLimits), icon: DollarSign },
    ];
  }, [payments]);

  // Group Payments by Contract
  const groupedPayments = useMemo(() => {
    if (!payments || payments.length === 0) return [];

    const map = new Map();

    payments.forEach((payment) => {
      const contractId =
        payment.contract_id ||
        payment.contract?.id ||
        payment.transactionable_id ||
        `unknown-${payment.id}`;

      const { fullName, phone } = getClientDetails(payment);
      const amount = Number(payment.amount || payment.amount_limit || 0);

      if (!map.has(contractId)) {
        map.set(contractId, {
          contractId,
          contractRef: payment.contract?.reference_number || contractId,
          clientName: fullName,
          phone,
          totalAmount: 0,
          paidAmount: 0,
          totalPaymentsCount: 0,
          paymentsList: [],
          lastPaymentDate: payment.payment_date || payment.created_at,
          sampleItem: payment,
        });
      }

      const group = map.get(contractId);
      group.totalPaymentsCount += 1;
      group.totalAmount += amount;

      if (
        payment.status === "paid" ||
        payment.status === "posted" ||
        payment.status === "active" ||
        payment.status === 1 ||
        payment.status === true
      ) {
        group.paidAmount += amount;
      }

      group.paymentsList.push(payment);
    });

    return Array.from(map.values());
  }, [payments]);

  // Filter Grouped Payments
  const filteredPayments = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return groupedPayments.filter((group) => {
      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus = group.paymentsList.some((p) => p.status === statusFilter);
      }

      const searchable = [
        group.clientName,
        group.phone,
        group.contractRef,
        String(group.totalAmount),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [groupedPayments, searchTerm, statusFilter]);

  // Tracking Summary
  const trackingSummary = useMemo(() => {
    if (!contractPayments || contractPayments.length === 0) {
      return { paidCount: 0, totalCount: 0, totalPaidAmount: 0 };
    }
    const paidList = contractPayments.filter((p) => p.status === "paid");
    const totalPaidAmount = paidList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const contractMeta = selectedContractInfo || contractPayments[0]?.contract;

    return {
      paidCount: paidList.length,
      totalCount: contractMeta?.installments_count || contractPayments.length,
      totalPaidAmount,
      contractMeta,
    };
  }, [contractPayments, selectedContractInfo]);

  return (
    <div className="financial-methods-page" dir="rtl">
      {/* 1. شبكة الإحصائيات الموحدة */}
      <section className="legal-stats-grid">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} icon={item.icon} />
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
          <span>تسجيل دفعة جديدة</span>
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
            placeholder="ابحث باسم العميل أو مرجع العقد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* 3. بطاقة الجدول المجمع حسب العقود */}
      <TableCard
        title="ملخص عقود ومدفوعات العملاء"
        count={filteredPayments.length}
      >
        {loading ? (
          <div className="table-state">جاري تحميل البيانات المالية...</div>
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
                  <th>مرجع العقد</th>
                  <th>رقم التواصل</th>
                  <th>عدد الدفعات / الأقساط</th>
                  <th>المبلغ المسدد / الإجمالي</th>
                  <th>آخر حركة دفع</th>
                  <th>إجراءات والتتبع</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      لا توجد سجلات دفع مطابقة لخيارات البحث والحالة
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((group) => {
                    return (
                      <tr key={group.contractId}>
                        <td>
                          <div className="services-item-cell">
                            <div className="services-thumb-placeholder">
                              <User size={16} />
                            </div>
                            <div className="services-item-info">
                              <strong>{group.clientName}</strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong>{group.contractRef}</strong>
                        </td>

                        <td className="services-date">{group.phone}</td>

                        <td>
                          <span>{group.totalPaymentsCount} دفعات</span>
                        </td>

                        <td>
                          <strong style={{ color: "var(--dash-accent)" }}>
                            {formatCurrency(group.paidAmount)}
                          </strong>
                          <span style={{ fontSize: "12px", color: "var(--dash-muted)", marginRight: "4px" }}>
                            / {formatCurrency(group.totalAmount)}
                          </span>
                        </td>

                        <td className="services-date">
                          {formatDate(group.lastPaymentDate)}
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn review"
                              onClick={() => handleOpenTracking(group.sampleItem)}
                              title="تتبع جدول كافة أقساط هذا العقد"
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px", width: "auto", padding: "6px 12px" }}
                            >
                              <History size={16} />
                              <span style={{ fontSize: "12px", fontWeight: "600" }}>عرض الأقساط</span>
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

      {/* 4. مودال تتبع أقساط ودفعات العقد (عرض الحالة عبر StatusBadge الأنيق) */}
      <Modal
        open={trackingOpen}
        onClose={() => {
          setTrackingOpen(false);
          setContractPayments([]);
        }}
        title={`تتبع أقساط ودفعات العقد ${
          trackingSummary.contractMeta?.reference_number
            ? `(${trackingSummary.contractMeta.reference_number})`
            : ""
        }`}
        size="lg"
      >
        <div className="tracking-modal-content">
          {loadingTracking ? (
            <div className="table-state">جاري جلب جدول أقساط العقد...</div>
          ) : contractPayments.length === 0 ? (
            <div className="table-state">لا توجد دفعات أو أقساط مسجلة لهذا العقد بعد.</div>
          ) : (
            <>
              {/* ملخص أرقام العقد والأقساط */}
              {trackingSummary.contractMeta && (
                <div className="tracking-stats-grid">
                  <div className="tracking-stat-card">
                    <span className="label">إجمالي العقد</span>
                    <span className="value">
                      {formatCurrency(trackingSummary.contractMeta.total_price)}
                    </span>
                  </div>

                  <div className="tracking-stat-card">
                    <span className="label">المقدم</span>
                    <span className="value">
                      {formatCurrency(trackingSummary.contractMeta.down_payment_amount)}
                    </span>
                  </div>

                  <div className="tracking-stat-card success">
                    <span className="label">الأقساط المدفوعة</span>
                    <span className="value">
                      {trackingSummary.paidCount} / {trackingSummary.totalCount} أقساط
                    </span>
                  </div>

                  <div className="tracking-stat-card accent">
                    <span className="label">إجمالي المسدد</span>
                    <span className="value">
                      {formatCurrency(trackingSummary.totalPaidAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* جدول الأقساط والدفعات التفصيلي */}
              <div className="tracking-table-wrapper">
                <table className="tracking-table">
                  <thead>
                    <tr>
                      <th style={{ width: "36px" }}>#</th>
                      <th>نوع الدفعة</th>
                      <th>طريقة الدفع</th>
                      <th>المبلغ</th>
                      <th>تاريخ الدفع</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractPayments.map((p, index) => {
                      const statusMeta = getStatusMeta(p.status);
                      return (
                        <tr key={p.id || index}>
                          <td style={{ color: "var(--dash-muted)", fontWeight: "600" }}>
                            {index + 1}
                          </td>
                          <td>{formatPaymentType(p.payment_type)}</td>
                          <td>{formatPaymentMethod(p.payment_method)}</td>
                          <td>
                            <span className="tracking-amount">
                              {formatCurrency(p.amount)}
                            </span>
                          </td>
                          <td className="services-date">{formatDate(p.payment_date)}</td>
                          
                          {/* عرض الحالة باستخدام StatusBadge المصمم بشكل أنيق */}
                          <td>
                            <StatusBadge
                              status={statusMeta.label}
                              type={statusMeta.type}
                            />
                          </td>

                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-action-btn"
                                onClick={() => openPreviewModal(p)}
                                title="عرض التفاصيل وإثبات الدفع"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                className="icon-action-btn"
                                onClick={() => openEditModal(p)}
                                title="تعديل تفاصيل الدفعة وحالتها"
                              >
                                <Pencil size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 5. مودال تسجيل / تعديل الدفعة */}
      <Modal
        open={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          resetForm();
        }}
        title={editOpen ? `تحديث حالة الدفعة #${selectedPayment?.id || ""}` : "تسجيل دفعة جديدة"}
        size="md"
      >
        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {createOpen && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button
                type="button"
                className={`ghost-filter-btn ${!isCustomMode ? "active" : ""}`}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  borderColor: !isCustomMode ? "var(--dash-accent)" : "transparent",
                  fontWeight: !isCustomMode ? "700" : "normal",
                }}
                onClick={() => setIsCustomMode(false)}
              >
                <Plus size={16} />
                <span>دفعة جديدة قياسية</span>
              </button>

              <button
                type="button"
                className={`ghost-filter-btn ${isCustomMode ? "active" : ""}`}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  borderColor: isCustomMode ? "var(--dash-accent)" : "transparent",
                  fontWeight: isCustomMode ? "700" : "normal",
                }}
                onClick={() => setIsCustomMode(true)}
              >
                <Layers size={16} />
                <span>سداد مخصص / لأشهر قادمة</span>
              </button>
            </div>
          )}

          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">
                اختيار الزبون <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select
                  style={{ width: "100%" }}
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
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
              <ErrorMessage message={formErrors.client_id} />
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
                      ? "-- اختر الزبون أولاً --"
                      : clientContracts.length === 0
                      ? "لا توجد عقود لهذا الزبون"
                      : "-- اختر العقد --"}
                  </option>
                  {clientContracts.map((item) => {
                    const contract = item?.contract || item?.data || item;
                    const refNumber =
                      contract?.reference_number ||
                      contract?.order?.id ||
                      `عقد #${contract?.id}`;

                    const totalPrice = contract?.total_price
                      ? ` (${Number(contract.total_price).toLocaleString("ar-SY")} $)`
                      : "";

                    return (
                      <option key={contract?.id} value={contract?.id}>
                        {refNumber} {totalPrice}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
              <ErrorMessage message={formErrors.contract_id} />
            </div>
          </div>

          <div className="modal-grid">
            <Field
              type="number"
              name="amount"
              label="المبلغ"
              placeholder="مثال: 50000"
              value={formData.amount}
              onChange={handleChange}
              disabled={editOpen}
              error={formErrors.amount}
            />

            {!isCustomMode && (
              <Field
                type="date"
                name="payment_date"
                label="تاريخ الدفع"
                value={formData.payment_date}
                onChange={handleChange}
                disabled={editOpen}
                error={formErrors.payment_date}
              />
            )}

            <div className="field-group">
              <label className="field-label">طريقة الدفع</label>
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select
                  style={{ width: "100%" }}
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  disabled={editOpen}
                >
                  <option value="cash">نقدي (cash)</option>
                  <option value="bank_transfer">تحويل بنكي (bank_transfer)</option>
                  <option value="check">شيك بنكي (check)</option>
                  <option value="card">بطاقة إلكترونية (card)</option>
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
              <ErrorMessage message={formErrors.payment_method} />
            </div>
          </div>

          {!isCustomMode && (
            <div className="modal-grid">
              <div className="field-group">
                <label className="field-label">الحالة</label>
                <div className="exact-select-wrapper" style={{ width: "100%" }}>
                  <select
                    style={{ width: "100%" }}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="pending">قيد الانتظار (pending)</option>
                    <option value="paid">مدفوع (paid)</option>
                    <option value="posted">مرحّل (posted)</option>
                    <option value="failed">فاشل (failed)</option>
                    <option value="refunded">مسترجع (refunded)</option>
                  </select>
                  <ChevronDown size={16} className="exact-select-chevron" />
                </div>
                <ErrorMessage message={formErrors.status} />
              </div>

              <div className="field-group">
                <label className="field-label">نوع الدفعة</label>
                <div className="exact-select-wrapper" style={{ width: "100%" }}>
                  <select
                    style={{ width: "100%" }}
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handleChange}
                    disabled={editOpen}
                  >
                    <option value="down_payment">دفعة أولى مقدم (down_payment)</option>
                    <option value="installment">قسط شهري (installment)</option>
                    <option value="final_payment">دفعة نهائية (final_payment)</option>
                    <option value="maintenance">صيانة (maintenance)</option>
                  </select>
                  <ChevronDown size={16} className="exact-select-chevron" />
                </div>
                <ErrorMessage message={formErrors.payment_type} />
              </div>
            </div>
          )}

          {/* عرض إثبات الدفع والمرفقات المرفوعة من الموبايل */}
          {editOpen && (selectedPayment?.attachments || selectedPayment?.files || selectedPayment?.attachment) && (
            <div className="field-group" style={{ marginBottom: "16px" }}>
              <label className="field-label" style={{ color: "var(--dash-accent)", fontWeight: "bold" }}>
                📁 إثبات الدفع المرفوع من الزبون (عبر تطبيق الموبايل):
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {(() => {
                  const rawList = selectedPayment?.attachments || selectedPayment?.files || (selectedPayment?.attachment ? [selectedPayment.attachment] : []);
                  const list = Array.isArray(rawList) ? rawList : [rawList];

                  if (list.length === 0) {
                    return <span style={{ fontSize: "12px", color: "var(--dash-muted)" }}>لا توجد ملفات مرفقة</span>;
                  }

                  return list.map((fileItem, idx) => {
                    const fileUrl = typeof fileItem === "string" ? fileItem : fileItem?.file_url || fileItem?.url || fileItem?.path;
                    return (
                      <a
                        key={fileItem?.id || idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ghost-filter-btn"
                        style={{
                          gap: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderColor: "var(--dash-accent)",
                          color: "var(--dash-accent)",
                          textDecoration: "none",
                        }}
                      >
                        <FileText size={14} />
                        <span>عرض إثبات الدفع {idx + 1}</span>
                        <ExternalLink size={12} />
                      </a>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {createOpen && (
            <div className="field-group">
              <label className="field-label">مرفقات الدفعة (ملفات / صور)</label>
              <input
                type="file"
                multiple
                id="file-input"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-input"
                className="ghost-filter-btn"
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
                      className="ghost-filter-btn"
                      style={{ gap: "6px", padding: "4px 10px", fontSize: "12px" }}
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
          )}

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                setEditOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              إلغاء
            </Button>

            <Button type="submit" className="exact-primary-btn" disabled={loading}>
              <Plus size={16} />
              <span>
                {loading
                  ? "جاري الحفظ..."
                  : editOpen
                  ? "حفظ وتحديث الحالة"
                  : isCustomMode
                  ? "سداد وتوزيع الأقساط"
                  : "حفظ الدفعة"}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. مودال المعاينة */}
      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedPayment(null);
        }}
        title={`تفاصيل السند / الدفعة #${selectedPayment?.id || ""}`}
        size="md"
      >
        <div className="financial-preview-modal">
          <div className="financial-preview-card">
            <div className="financial-preview-row">
              <span className="label">اسم العميل:</span>
              <span className="value">{getClientDetails(selectedPayment).fullName}</span>
            </div>

            <div className="financial-preview-row">
              <span className="label">مرجع العقد / السند:</span>
              <span className="value">
                {selectedPayment?.contract?.reference_number ||
                  selectedPayment?.voucher_number ||
                  `#${selectedPayment?.contract_id || selectedPayment?.contract?.id || "—"}`}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">طريقة الدفع:</span>
              <span className="value">
                {formatPaymentMethod(selectedPayment?.payment_method)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">نوع / فئة الدفعة:</span>
              <span className="value">
                {formatPaymentType(selectedPayment?.payment_type || selectedPayment?.category)}
              </span>
            </div>

            <div className="financial-preview-row">
              <span className="label">المبلغ:</span>
              <span className="value highlight" style={{ color: "var(--dash-accent)" }}>
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

            {/* معاينة ملفات إثبات الدفع المرفوعة عبر التطبيق */}
            {(selectedPayment?.attachments || selectedPayment?.files || selectedPayment?.attachment) && (
              <div className="financial-preview-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px", marginTop: "10px" }}>
                <span className="label" style={{ fontWeight: "bold" }}>إثبات الدفع المرفوع (من التطبيق):</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(() => {
                    const rawList = selectedPayment?.attachments || selectedPayment?.files || (selectedPayment?.attachment ? [selectedPayment.attachment] : []);
                    const list = Array.isArray(rawList) ? rawList : [rawList];
                    return list.map((fileItem, idx) => {
                      const fileUrl = typeof fileItem === "string" ? fileItem : fileItem?.file_url || fileItem?.url || fileItem?.path;
                      return (
                        <a
                          key={fileItem?.id || idx}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ghost-filter-btn"
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            textDecoration: "none",
                            color: "var(--dash-accent)",
                          }}
                        >
                          <FileText size={14} />
                          <span>فتح المرفق {idx + 1}</span>
                        </a>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}