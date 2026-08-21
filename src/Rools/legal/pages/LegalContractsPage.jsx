import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  X,
  Eye,
  User,
  Briefcase,
  AlertCircle
} from "lucide-react";

import { 
  createContract,
  fetchOrders,
  fetchContracts,
  fetchContractById,
  fetchClientContracts,
  changeContractStatus
} from "../features/contracts/model/contract.thunks";

import { validateContractForm } from "../features/contracts/validation/contract.validation";
import "../styles/LegalContractsPage.css";
import ContractStatusStepper from "../../../shared/components/ContractStatusStepper";
import { t } from "../../../shared/i18n";

export default function LegalContractsPage() {
  const dispatch = useDispatch();

  const {
    creating,
    orders,
    ordersLoading,
    items: contractsList,
    loading,
    contractDetails,
    detailsLoading,
    clientContracts,
    clientContractsLoading,
    statusUpdating
  } = useSelector((state) => state.contract);

  const contracts = contractsList || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showClientContractsModal, setShowClientContractsModal] = useState(false);

  const [selectedContract, setSelectedContract] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusContract] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    order_id: "",
    total_price: "",
    down_payment_amount: "",
    installments_count: "",
    reference_number: "",
    currency: "",
    has_exception: false,
    exception_reason: "",
    original_total_price: "",
    original_down_payment: "",
    original_installments_count: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    dispatch(fetchContracts());
  }, [dispatch]);

  const openClientContracts = (clientId) => {
    dispatch(fetchClientContracts(clientId));
    setShowClientContractsModal(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
    setFieldErrors((prev) => ({
      ...prev,
      attachments: ""
    }));
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrderSelect = (e) => {
    const selectedId = e.target.value;
    const selectedOrder = orders.find((o) => String(o.id) === String(selectedId));

    const detectedCurrency =
      selectedOrder?.currency ||
      selectedOrder?.unit?.currency ||
      selectedOrder?.solution?.currency ||
      "USD";

    const defaultOriginalPrice =
      selectedOrder?.unit?.original_price ||
      selectedOrder?.solution?.original_price ||
      "";

    setFormData((prev) => ({
      ...prev,
      order_id: selectedId,
      currency: detectedCurrency,
      original_total_price: prev.original_total_price || defaultOriginalPrice,
    }));

    setFieldErrors((prev) => ({ ...prev, order_id: "" }));
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();

    const validationResult = validateContractForm({
      ...formData,
      attachments,
    });

    if (Object.keys(validationResult).length > 0) {
      setFieldErrors(validationResult);
      return;
    }

    setFieldErrors({});

    const payload = new FormData();
    payload.append("order_id", formData.order_id);
    payload.append("total_price", formData.total_price);
    payload.append("down_payment_amount", formData.down_payment_amount);
    payload.append("installments_count", formData.installments_count);
    payload.append("reference_number", formData.reference_number);
    payload.append("currency", formData.currency || "USD");

    payload.append("has_exception", formData.has_exception ? "1" : "0");
    if (formData.has_exception) {
      payload.append("original_total_price", formData.original_total_price);
      payload.append("original_down_payment", formData.original_down_payment);
      payload.append("original_installments_count", formData.original_installments_count);
      if (formData.exception_reason) {
        payload.append("exception_reason", formData.exception_reason);
      }
    }

    attachments.forEach((file, index) => {
      payload.append(`attachments[${index}][file]`, file);
    });

    const res = await dispatch(createContract(payload));

    if (createContract.fulfilled.match(res)) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      order_id: "",
      total_price: "",
      down_payment_amount: "",
      installments_count: "",
      reference_number: "",
      currency: "",
      has_exception: false,
      exception_reason: "",
      original_total_price: "",
      original_down_payment: "",
      original_installments_count: "",
    });
    setAttachments([]);
    setFieldErrors({});
  };

  const handleChangeStatus = async () => {
    if (!selectedStatusContract) return;

    const res = await dispatch(
      changeContractStatus({
        id: selectedStatusContract.id,
        status: newStatus,
      })
    );

    if (changeContractStatus.fulfilled.match(res)) {
      setShowStatusModal(false);
      dispatch(fetchContracts());
    }
  };

  const openCreateModal = () => {
    dispatch(fetchOrders());
    setShowCreateModal(true);
  };

  const filteredContracts = contracts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const clientName = c.client?.account?.full_name?.toLowerCase() || "";
    const matchesSearch = clientName.includes(term);

    const matchesStatus =
      filterStatus === "all" ? true : c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="legal-contracts-page">
      {/* MAIN PANEL */}
      <div className="legal-contracts-panel">
        <div className="legal-contracts-panel-head">
          <div>
            <h2>{t("legal_contracts.title")}</h2>
            <p>{t("legal_contracts.subtitle")}</p>
            <button
              className="legal-contracts-primary-btn"
              onClick={openCreateModal}
            >
              <Plus size={16} /> {t("legal_contracts.create_contract")}
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="legal-contracts-toolbar">
          <div className="legal-contracts-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={t("legal_contracts.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="legal-contracts-filter">
            <Filter size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t("legal_contracts.status_all")}</option>
              <option value="draft">{t("legal_contracts.status_draft")}</option>
              <option value="active">{t("legal_contracts.status_active")}</option>
              <option value="completed">{t("legal_contracts.status_completed")}</option>
              <option value="terminated">{t("legal_contracts.status_terminated")}</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="legal-contracts-table-wrap">
          {loading ? (
            <div className="legal-contracts-loading">
              {t("legal_contracts.loading_contracts")}
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="legal-contracts-empty">
              {t("legal_contracts.no_matching_contracts")}
            </div>
          ) : (
            <table className="legal-contracts-table">
              <thead>
                <tr>
                  <th>{t("legal_contracts.contract_id")}</th>
                  <th>{t("legal_contracts.client_name")}</th>
                  <th>{t("legal_contracts.total_price")}</th>
                  <th>{t("legal_contracts.down_payment")}</th>
                  <th>{t("legal_contracts.installments_count")}</th>
                  <th>{t("legal_contracts.status")}</th>
                  <th>{t("legal_contracts.created_at")}</th>
                  <th>{t("legal_contracts.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.id}</td>

                    <td>
                      <button
                        type="button"
                        className="client-name-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const clientId =
                            contract.client?.additional_info?.client_id ??
                            contract.client?.id ??
                            contract.client_id;

                          if (clientId) {
                            openClientContracts(clientId);
                          } else {
                            alert(t("legal_contracts.client_id_not_found"));
                          }
                        }}
                      >
                        {contract.client?.account?.full_name || contract.client?.name || t("legal_contracts.view_contracts")}
                      </button>
                    </td>

                    <td>{Number(contract.total_price).toLocaleString()} {contract.currency || "$"}</td>
                    <td>{Number(contract.down_payment_amount).toLocaleString()} {contract.currency || "$"}</td>
                    <td>{contract.installments_count} {t("legal_contracts.installments_suffix")}</td>

                    <td>
                      <ContractStatusStepper currentStatus={contract.status} />
                    </td>

                    <td>{contract.created_at}</td>

                    <td>
                      <div className="actions-group">
                        <button
                          type="button"
                          className="icon-btn"
                          title={t("legal_contracts.view_details")}
                          onClick={() => {
                            setSelectedContract(contract);
                            dispatch(fetchContractById(contract.id));
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: CREATE CONTRACT WITH HIDDEN SCROLLBAR */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <style>{`
            .create-modal-scrollable {
              max-height: 85vh;
              overflow-y: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .create-modal-scrollable::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <div className="modal-card create-modal-scrollable">
            <h3>{t("legal_contracts.create_contract")}</h3>
            <form onSubmit={handleCreateContract} className="modal-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>{t("legal_contracts.order_name")}</label>
                  <select
                    className={`input-field ${fieldErrors.order_id ? "has-error" : ""}`}
                    value={formData.order_id}
                    disabled={ordersLoading}
                    onChange={handleOrderSelect}
                  >
                    <option value="">
                      {ordersLoading ? t("legal_contracts.loading_orders") : t("legal_contracts.select_order")}
                    </option>
                    {orders
                      .filter((order) => Boolean(order.has_done_appointment))
                      .map((order) => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {order.client?.account?.full_name || `الطلب ${order.id}`}
                        </option>
                      ))}
                  </select>
                  {fieldErrors.order_id && (
                    <span className="field-error-msg">{fieldErrors.order_id}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>رقم المرجع (Reference Number)</label>
                  <input
                    type="text"
                    className={`input-field ${fieldErrors.reference_number ? "has-error" : ""}`}
                    value={formData.reference_number}
                    placeholder="مثال: 233445556669"
                    onChange={(e) => {
                      setFormData({ ...formData, reference_number: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, reference_number: "" }));
                    }}
                  />
                  {fieldErrors.reference_number && (
                    <span className="field-error-msg">{fieldErrors.reference_number}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("legal_contracts.total_price_label")}</label>
                  <div className="input-with-currency">
                    <input
                      type="number"
                      className={`input-field ${fieldErrors.total_price ? "has-error" : ""}`}
                      value={formData.total_price}
                      onChange={(e) => {
                        setFormData({ ...formData, total_price: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, total_price: "" }));
                      }}
                    />
                    {formData.currency && (
                      <span className="currency-badge">
                        {formData.currency}
                      </span>
                    )}
                  </div>
                  {fieldErrors.total_price && (
                    <span className="field-error-msg">{fieldErrors.total_price}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>{t("legal_contracts.down_payment_label")}</label>
                  <input
                    type="number"
                    className={`input-field ${fieldErrors.down_payment_amount ? "has-error" : ""}`}
                    value={formData.down_payment_amount}
                    onChange={(e) => {
                      setFormData({ ...formData, down_payment_amount: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, down_payment_amount: "" }));
                    }}
                  />
                  {fieldErrors.down_payment_amount && (
                    <span className="field-error-msg">{fieldErrors.down_payment_amount}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("legal_contracts.installments_count")}</label>
                  <input
                    type="number"
                    className={`input-field ${fieldErrors.installments_count ? "has-error" : ""}`}
                    value={formData.installments_count}
                    onChange={(e) => {
                      setFormData({ ...formData, installments_count: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, installments_count: "" }));
                    }}
                  />
                  {fieldErrors.installments_count && (
                    <span className="field-error-msg">{fieldErrors.installments_count}</span>
                  )}
                </div>
              </div>

              <div className="form-group full-width checkbox-form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.has_exception}
                    onChange={(e) =>
                      setFormData({ ...formData, has_exception: e.target.checked })
                    }
                  />
                  <span>يوجد استثناء في العقد (Has Exception)</span>
                </label>
              </div>

              {formData.has_exception && (
                <div className="exception-form-box">
                  <div className="form-row">
                    <div className="form-group">
                      <label>السعر الأصلي قبل الخصم (Original Total Price) *</label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.original_total_price}
                        placeholder="أدخل السعر الأصلي"
                        onChange={(e) =>
                          setFormData({ ...formData, original_total_price: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>الدفعة الأولى الأصلية (Original Down Payment) *</label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.original_down_payment}
                        placeholder="أدخل الدفعة الأولى الأصلية"
                        onChange={(e) =>
                          setFormData({ ...formData, original_down_payment: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>عدد الأقساط الأصلي (Original Installments) *</label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.original_installments_count}
                        placeholder="أدخل عدد الأقساط الأصلي"
                        onChange={(e) =>
                          setFormData({ ...formData, original_installments_count: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group full-width exception-textarea-group">
                    <label>سبب / تفاصيل الاستثناء (Exception Reason)</label>
                    <textarea
                      className="input-field"
                      rows="2"
                      value={formData.exception_reason}
                      placeholder="أدخل سبب وتفاصيل الاستثناء..."
                      onChange={(e) =>
                        setFormData({ ...formData, exception_reason: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="form-group attachments-form-group">
                <label>{t("legal_contracts.attachments_label")}</label>
                <label className="file-upload-box">
                  <Upload size={18} />
                  <span>{t("legal_contracts.choose_files")}</span>
                  <input
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>
                {fieldErrors.attachments && (
                  <span className="field-error-msg">{fieldErrors.attachments}</span>
                )}

                {attachments.length > 0 && (
                  <div className="attachments-list">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="attachment-chip">
                        <span>{file.name}</span>
                        <X size={14} onClick={() => removeAttachment(idx)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={creating}
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="legal-contracts-primary-btn"
                  disabled={creating}
                >
                  {creating ? t("legal_contracts.saving") : t("legal_contracts.save_contract")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONTRACT DETAILS */}
      {showDetailsModal && (
        <div className="modal-backdrop">
          <style>{`
            .details-modal-scrollable {
              max-height: 85vh;
              overflow-y: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .details-modal-scrollable::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <div className="modal-card contract-details-modal details-modal-scrollable">
            <div className="modal-header">
              <div>
                <h3>تفاصيل العقد #{selectedContract?.id || contractDetails?.id}</h3>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="legal-contracts-loading">
                {t("legal_contracts.loading_details")}
              </div>
            ) : (
              contractDetails && (
                <div className="contract-details-content">
                  
                  {/* 1. معلومات العقد والطلب */}
                  <div className="details-section">
                    <h4><FileText size={16} /> معلومات العقد والطلب</h4>
                    <div className="details-grid">
                      <div className="details-item">
                        <span>رقم المرجع (Reference)</span>
                        <strong>{contractDetails.reference_number || "-"}</strong>
                      </div>

                      <div className="details-item">
                        <span>الحالة</span>
                        <strong className={`status-badge ${contractDetails.status}`}>
                          {contractDetails.status}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>إجمالي المبلغ</span>
                        <strong>
                          {Number(contractDetails.total_price || 0).toLocaleString()} {contractDetails.currency || "$"}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>الدفعة الأولى</span>
                        <strong>
                          {Number(contractDetails.down_payment_amount || 0).toLocaleString()} {contractDetails.currency || "$"}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>عدد الأقساط</span>
                        <strong>{contractDetails.installments_count} أقساط</strong>
                      </div>

                      <div className="details-item">
                        <span>تاريخ الإنشاء</span>
                        <strong>{contractDetails.created_at}</strong>
                      </div>

                      {/* بيانات الطلب Order */}
                      {contractDetails.order && (
                        <>
                          <div className="details-item">
                            <span>رقم الطلب المرتبط</span>
                            <strong>#{contractDetails.order.id}</strong>
                          </div>
                          <div className="details-item">
                            <span>نوع الطلب / حالة الطلب</span>
                            <strong>
                              {contractDetails.order.type} ({contractDetails.order.status})
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 2. بيانات الاستثناء (إن وجد) */}
                  {contractDetails.latest_exception && (
                    <div className="details-section exception-details-section">
                      <h4 className="exception-details-title"><AlertCircle size={16} /> بيانات الاستثناء الأخير</h4>
                      <div className="details-grid">
                        <div className="details-item">
                          <span>السعر الأصلي</span>
                          <strong>{Number(contractDetails.latest_exception.original_total_price || 0).toLocaleString()}</strong>
                        </div>
                        <div className="details-item">
                          <span>الدفعة الأولى الأصلية</span>
                          <strong>{Number(contractDetails.latest_exception.original_down_payment || 0).toLocaleString()}</strong>
                        </div>
                        <div className="details-item">
                          <span>عدد الأقساط الأصلي</span>
                          <strong>{contractDetails.latest_exception.original_installments_count}</strong>
                        </div>
                        <div className="details-item">
                          <span>سبب الاستثناء</span>
                          <strong>{contractDetails.latest_exception.reason || "لا يوجد"}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. معلومات العميل الكاملة */}
                  <div className="details-section">
                    <h4><User size={16} /> معلومات العميل</h4>
                    <div className="details-grid">
                      <div className="details-item">
                        <span>الاسم الكامل</span>
                        <strong>{contractDetails.client?.account?.full_name || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>البريد الإلكتروني</span>
                        <strong>{contractDetails.client?.account?.email || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>رقم الهاتف</span>
                        <strong>{contractDetails.client?.account?.phone || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>العنوان</span>
                        <strong>{contractDetails.client?.account?.address || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>الرقم الوطني</span>
                        <strong>{contractDetails.client?.additional_info?.national_id || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>المسمى الوظيفي</span>
                        <strong>{contractDetails.client?.additional_info?.job_title || "-"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 4. الموظف المسؤول */}
                  <div className="details-section">
                    <h4><Briefcase size={16} /> الموظف المسؤول</h4>
                    <div className="details-grid">
                      <div className="details-item">
                        <span>اسم الموظف</span>
                        <strong>{contractDetails.employee?.account?.full_name || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>البريد الإلكتروني</span>
                        <strong>{contractDetails.employee?.account?.email || "-"}</strong>
                      </div>
                      <div className="details-item">
                        <span>رقم الهاتف</span>
                        <strong>{contractDetails.employee?.account?.phone || "-"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 5. جدولة الدفعات Payments */}
                  <div className="details-section">
                    <h4>جدول الدفعات والأقساط ({contractDetails.payments?.length || 0})</h4>
                    <div className="payments-table-wrap">
                      <table className="legal-contracts-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>المبلغ</th>
                            <th>النوع</th>
                            <th>طريقة الدفع</th>
                            <th>الحالة</th>
                            <th>تاريخ الدفع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractDetails.payments?.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.id}</td>
                              <td>{Number(payment.amount).toLocaleString()} {contractDetails.currency || "$"}</td>
                              <td>
                                {payment.payment_type === "down_payment"
                                  ? "دفعة أولى"
                                  : "قسط"}
                              </td>
                              <td>{payment.payment_method || "نقدي"}</td>
                              <td>
                                <span className={`status-badge ${payment.status}`}>
                                  {payment.status === "paid" ? "مدفوع" : "معلق"}
                                </span>
                              </td>
                              <td>{payment.payment_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 6. المرفقات Attachments */}
                  <div className="details-section">
                    <h4>{t("legal_contracts.attached_files")}</h4>
                    {(!contractDetails.attachments || contractDetails.attachments.length === 0) ? (
                      <p className="no-attachments-text">لا توجد ملفات مرفقة</p>
                    ) : (
                      <div className="attachments-list">
                        {contractDetails.attachments?.map((file) => (
                          <a
                            key={file.id}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-chip"
                          >
                            <FileText size={16} />
                            {file.original_name || `ملف #${file.id}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* CLIENT CONTRACTS MODAL */}
      {showClientContractsModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowClientContractsModal(false)}
        >
          <div
            className="modal-card contract-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("legal_contracts.client_contracts")}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowClientContractsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="contract-details-content">
              {clientContractsLoading ? (
                <div className="legal-contracts-loading">
                  {t("legal_contracts.loading_client_contracts")}
                </div>
              ) : !clientContracts || clientContracts.length === 0 ? (
                <div className="legal-contracts-empty">
                  {t("legal_contracts.no_client_contracts")}
                </div>
              ) : (
                clientContracts.map((contract) => (
                  <div key={contract.id} className="details-section">
                    <h4>{t("legal_contracts.contract")} {contract.id}</h4>

                    <div className="details-grid">
                      <div className="details-item">
                        <span>{t("legal_contracts.status")}</span>
                        <strong className={`status-badge ${contract.status}`}>
                          {contract.status}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.total_price")}</span>
                        <strong>
                          {Number(contract.total_price || 0).toLocaleString()} {contract.currency || "$"}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.installments_count")}</span>
                        <strong>{contract.installments_count} {t("legal_contracts.installments_suffix")}</strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.created_at")}</span>
                        <strong>{contract.created_at}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="legal-contracts-action-btn"
                      onClick={() => {
                        dispatch(fetchContractById(contract.id));
                        setSelectedContract(contract);
                        setShowClientContractsModal(false);
                        setShowDetailsModal(true);
                      }}
                    >
                      {t("legal_contracts.view_details")}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE STATUS */}
      {showStatusModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="modal-card status-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("legal_contracts.edit_contract_status")}</h3>
              <button
                className="close-btn"
                onClick={() => setShowStatusModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label>{t("legal_contracts.new_status")}</label>
                <select
                  className="input-field"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="draft">{t("legal_contracts.status_draft")}</option>
                  <option value="active">{t("legal_contracts.status_active")}</option>
                  <option value="completed">{t("legal_contracts.status_completed")}</option>
                  <option value="terminated">{t("legal_contracts.status_terminated")}</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  {t("cancel")}
                </button>

                <button
                  className="legal-contracts-primary-btn"
                  disabled={statusUpdating}
                  onClick={handleChangeStatus}
                >
                  {statusUpdating ? t("legal_contracts.updating") : t("legal_contracts.save_changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}