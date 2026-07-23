import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  X,
  Pencil,
  Eye
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
import { t } from "../../../shared/i18n"; // اضبطي المسار بحسب موقع الملف لديكِ

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
  const [selectedStatusContract, setSelectedStatusContract] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    order_id: "",
    total_price: "",
    down_payment_amount: "",
    installments_count: "",
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

    attachments.forEach((file, index) => {
      payload.append(`attachments[${index}][file]`, file);
    });

    const res = await dispatch(createContract(payload));

    if (createContract.fulfilled.match(res)) {
      setShowCreateModal(false);
      setFormData({
        order_id: "",
        total_price: "",
        down_payment_amount: "",
        installments_count: "",
      });
      setAttachments([]);
    }
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
                    <td>#{contract.id}</td>

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

                    <td>{Number(contract.total_price).toLocaleString()} $</td>
                    <td>{Number(contract.down_payment_amount).toLocaleString()} $</td>
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

                        <button
                          type="button"
                          className="icon-btn"
                          title={t("legal_contracts.edit_status")}
                          onClick={() => {
                            setSelectedStatusContract(contract);
                            setNewStatus(contract.status);
                            setShowStatusModal(true);
                          }}
                        >
                          <Pencil size={16} />
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

      {/* MODAL: CREATE CONTRACT */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{t("legal_contracts.create_contract")}</h3>
            <form onSubmit={handleCreateContract} className="modal-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>{t("legal_contracts.order_name")}</label>
                  <select
                    className={`input-field ${fieldErrors.order_id ? "has-error" : ""}`}
                    value={formData.order_id}
                    disabled={ordersLoading}
                    onChange={(e) => {
                      setFormData({ ...formData, order_id: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, order_id: "" }));
                    }}
                  >
                    <option value="">
                      {ordersLoading ? t("legal_contracts.loading_orders") : t("legal_contracts.select_order")}
                    </option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.client?.account?.full_name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.order_id && (
                    <span className="field-error-msg">{fieldErrors.order_id}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>{t("legal_contracts.total_price_label")}</label>
                  <input
                    type="number"
                    className={`input-field ${fieldErrors.total_price ? "has-error" : ""}`}
                    value={formData.total_price}
                    onChange={(e) => {
                      setFormData({ ...formData, total_price: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, total_price: "" }));
                    }}
                  />
                  {fieldErrors.total_price && (
                    <span className="field-error-msg">{fieldErrors.total_price}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
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

              <div className="form-group">
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
                  onClick={() => setShowCreateModal(false)}
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
          <div className="modal-card contract-details-modal">
            <div className="modal-header">
              <div>
                <h3>{t("legal_contracts.contract_details")} #{selectedContract?.id}</h3>
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
                  <div className="details-section">
                    <h4>{t("legal_contracts.contract_info")}</h4>
                    <div className="details-grid">
                      <div className="details-item">
                        <span>{t("legal_contracts.client_name")}</span>
                        <strong>
                          {contractDetails.client?.account?.full_name || "-"}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.status")}</span>
                        <strong className={`status-badge ${contractDetails.status}`}>
                          {contractDetails.status}
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.total_price")}</span>
                        <strong>
                          {Number(contractDetails.total_price).toLocaleString()} $
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.down_payment")}</span>
                        <strong>
                          {Number(contractDetails.down_payment_amount).toLocaleString()} $
                        </strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.installments_count")}</span>
                        <strong>{contractDetails.installments_count}</strong>
                      </div>

                      <div className="details-item">
                        <span>{t("legal_contracts.created_at")}</span>
                        <strong>{contractDetails.created_at}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>{t("legal_contracts.assigned_employee")}</h4>
                    <div className="details-box">
                      {contractDetails.employee?.account?.full_name || "-"}
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>{t("legal_contracts.payment_schedule")}</h4>
                    <div className="payments-table-wrap">
                      <table className="legal-contracts-table">
                        <thead>
                          <tr>
                            <th>{t("legal_contracts.amount")}</th>
                            <th>{t("legal_contracts.type")}</th>
                            <th>{t("legal_contracts.status")}</th>
                            <th>{t("legal_contracts.date")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractDetails.payments?.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.amount} $</td>
                              <td>
                                {payment.payment_type === "down_payment"
                                  ? t("legal_contracts.payment_type_down")
                                  : t("legal_contracts.payment_type_installment")}
                              </td>
                              <td>
                                <span className={`status-badge ${payment.status}`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td>{payment.payment_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>{t("legal_contracts.attached_files")}</h4>
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
                          {file.original_name}
                        </a>
                      ))}
                    </div>
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
                    <h4>{t("legal_contracts.contract")} #{contract.id}</h4>

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
                          {Number(contract.total_price || 0).toLocaleString()} $
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