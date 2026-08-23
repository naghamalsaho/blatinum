import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PencilLine,
  Plus,
  RefreshCcw,
  Tags,
  Trash2,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import Toolbar from "@/shared/components/Toolbar";
import { formatStatus } from "../constants/customerServiceData";
import { clearCustomerServiceComplaintActionState } from "../features/complaints/model/complaint.slice";
import {
  changeCustomerServiceComplaintStatus,
  createCustomerServiceComplaintType,
  fetchCustomerServiceComplaints,
  fetchCustomerServiceComplaintTypes,
  removeCustomerServiceComplaint,
  removeCustomerServiceComplaintType,
} from "../features/complaints/model/complaint.thunks";

import "../styles/customer-service.css";

const COMPLAINT_FILTERS = [
  { value: "all", label: "All", dotClass: "" },
  { value: "pending", label: "Pending", dotClass: "busy" },
  { value: "in_review", label: "In Review", dotClass: "busy" },
  { value: "resolved", label: "Resolved", dotClass: "ok" },
  { value: "accepted", label: "Accepted", dotClass: "ok" },
  { value: "rejected", label: "Rejected", dotClass: "off" },
  { value: "closed", label: "Closed", dotClass: "off" },
];

const COMPLAINT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value !== undefined && value !== null && toDisplayText(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const toDisplayText = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(toDisplayText).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return (
      value.en ||
      value.ar ||
      value.name ||
      value.title ||
      value.value ||
      JSON.stringify(value)
    );
  }

  return String(value);
};

const getComplaintId = (complaint) => readNested(complaint, ["id", "complaint_id"]);
const getComplaintTitle = (complaint) =>
  toDisplayText(readNested(complaint, ["title", "subject", "name"])) || "-";
const getComplaintBody = (complaint) =>
  toDisplayText(readNested(complaint, ["body", "description", "content", "message"])) || "-";
const getComplaintStatus = (complaint) =>
  toDisplayText(readNested(complaint, ["status", "state"]) || "pending").toLowerCase();
const getComplaintTypeId = (complaint) =>
  readNested(complaint, ["complaint_type_id", "type_id", "type.id", "complaint_type.id"]);
const getComplaintTypeTitle = (complaint, types = []) => {
  const id = getComplaintTypeId(complaint);
  const type = types.find((item) => String(readNested(item, ["id", "type_id"])) === String(id));

  return (
    toDisplayText(
      readNested(complaint, ["type.title", "type.name", "complaint_type.title", "complaint_type.name"])
    ) ||
    toDisplayText(readNested(type, ["title", "name"])) ||
    (id ? `Type #${id}` : "-")
  );
};
const getClientName = (complaint) =>
  toDisplayText(readNested(complaint, [
    "client.account.full_name",
    "client.full_name",
    "client.name",
    "account.full_name",
    "user.account.full_name",
    "user.full_name",
  ])) || "-";
const getUnitLabel = (complaint) =>
  toDisplayText(readNested(complaint, ["unit.unit_number", "unit.name", "unit_id"])) || "-";
const getCreatedAt = (complaint) =>
  toDisplayText(readNested(complaint, ["created_at", "createdAt"])) || "-";

export default function CustomerServiceComplaintsPage() {
  const dispatch = useDispatch();
  const {
    items: complaints = [],
    meta,
    message,
    loading,
    error,
    types,
    actionLoading,
    actionError,
    actionMessage,
  } = useSelector((state) => state.customerServiceComplaints || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusValue, setStatusValue] = useState("pending");
  const [typeTitle, setTypeTitle] = useState("");

  useEffect(() => {
    dispatch(fetchCustomerServiceComplaints());
    dispatch(fetchCustomerServiceComplaintTypes());
  }, [dispatch]);

  const typeItems = useMemo(() => types?.items || [], [types?.items]);

  const filteredComplaints = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const status = getComplaintStatus(complaint);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const searchable = [
        getComplaintId(complaint),
        getComplaintTitle(complaint),
        getComplaintBody(complaint),
        getComplaintTypeTitle(complaint, typeItems),
        getClientName(complaint),
        getUnitLabel(complaint),
        status,
        getCreatedAt(complaint),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [complaints, searchTerm, statusFilter, typeItems]);

  const total = meta?.total ?? complaints.length;
  const pending = complaints.filter((item) => getComplaintStatus(item) === "pending").length;
  const resolved = complaints.filter((item) =>
    ["resolved", "accepted", "closed"].includes(getComplaintStatus(item))
  ).length;
  const rejected = complaints.filter((item) => getComplaintStatus(item) === "rejected").length;

  const openStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusValue(getComplaintStatus(complaint));
    setStatusModalOpen(true);
    dispatch(clearCustomerServiceComplaintActionState());
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedComplaint(null);
    setStatusValue("pending");
    dispatch(clearCustomerServiceComplaintActionState());
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    const complaintId = getComplaintId(selectedComplaint);
    if (!complaintId) return;

    const result = await dispatch(
      changeCustomerServiceComplaintStatus({ complaintId, status: statusValue })
    );

    if (changeCustomerServiceComplaintStatus.fulfilled.match(result)) {
      closeStatusModal();
    }
  };

  const submitType = async (event) => {
    event.preventDefault();
    if (!typeTitle.trim()) return;

    const result = await dispatch(createCustomerServiceComplaintType(typeTitle.trim()));

    if (createCustomerServiceComplaintType.fulfilled.match(result)) {
      setTypeTitle("");
    }
  };

  return (
    <div className="customer-service-page">
      <section className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Complaints from API" icon={ClipboardList} />
        <StatCard title="Pending" value={pending} note="Need review" icon={RefreshCcw} />
        <StatCard title="Resolved" value={resolved} note="Handled complaints" icon={CheckCircle2} />
        <StatCard title="Rejected" value={rejected} note="Rejected records" icon={AlertTriangle} />
      </section>

      <Toolbar
        placeholder="Search complaints by title, client, type, unit, or status..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={COMPLAINT_FILTERS}
      />

      {actionError ? <p className="customer-service-form-error">{actionError}</p> : null}
      {actionMessage ? <p className="customer-service-form-success">{actionMessage}</p> : null}

      <section className="customer-service-split-grid">
        <article className="customer-service-complaints-card">
          <div className="customer-service-complaints-head">
            <h2>Complaint List</h2>
            <span>{meta?.total ?? filteredComplaints.length} records</span>
          </div>

          {loading ? (
            <div className="table-state">Loading complaints...</div>
          ) : error ? (
            <div className="table-state is-error">{error}</div>
          ) : filteredComplaints.length > 0 ? (
            <div className="customer-service-complaint-list">
              {filteredComplaints.map((complaint) => {
                const id = getComplaintId(complaint);
                const status = getComplaintStatus(complaint);

                return (
                  <article
                    className="customer-service-complaint-item"
                    key={id || JSON.stringify(complaint)}
                  >
                    <div className="customer-service-complaint-main">
                      <div className="customer-service-complaint-title-row">
                        <span className="customer-service-complaint-id">#{id || "-"}</span>
                        <h3>{getComplaintTitle(complaint)}</h3>
                      </div>
                      <p>{getComplaintBody(complaint)}</p>
                    </div>

                    <div className="customer-service-complaint-meta">
                      <div className="customer-service-complaint-meta-item">
                        <span>Type</span>
                        <strong>{getComplaintTypeTitle(complaint, typeItems)}</strong>
                      </div>
                      <div className="customer-service-complaint-meta-item">
                        <span>Created</span>
                        <strong>{getCreatedAt(complaint)}</strong>
                      </div>
                    </div>

                    <div className="customer-service-complaint-side">
                      <span className={`customer-service-pill ${status}`}>
                        {formatStatus(status)}
                      </span>
                      <div className="customer-service-row-actions">
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => openStatusModal(complaint)}
                          title="Update status"
                          aria-label="Update status"
                        >
                          <PencilLine size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => dispatch(removeCustomerServiceComplaint(id))}
                          disabled={actionLoading || !id}
                          title="Delete complaint"
                          aria-label="Delete complaint"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="customer-service-complaints-empty">
              <ClipboardList size={28} />
              <p>{message || "No complaints found"}</p>
            </div>
          )}
        </article>

        <article className="customer-service-side-card">
          <div className="customer-service-detail-head">
            <h3>Complaint Types</h3>
            <span>{typeItems.length} types</span>
          </div>
          <form className="customer-service-compact-form" onSubmit={submitType}>
            <input
              value={typeTitle}
              onChange={(event) => setTypeTitle(event.target.value)}
              placeholder="New type title"
              disabled={actionLoading}
            />
            <Button type="submit" className="primary-action-btn" disabled={actionLoading}>
              <Plus size={16} />
              Add
            </Button>
          </form>
          {types?.loading ? <div className="table-state">Loading types...</div> : null}
          {types?.error ? <div className="table-state is-error">{types.error}</div> : null}
          <div className="customer-service-type-list">
            {typeItems.map((type) => {
              const id = readNested(type, ["id", "type_id"]);
              const title = toDisplayText(readNested(type, ["title", "name"])) || `Type #${id}`;

              return (
                <div className="customer-service-type-row" key={id || title}>
                  <span>
                    <Tags size={15} />
                    {title}
                  </span>
                  <button
                    type="button"
                    className="icon-action-btn danger"
                    onClick={() => dispatch(removeCustomerServiceComplaintType(id))}
                    disabled={actionLoading || !id}
                    title="Delete type"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
            {typeItems.length === 0 && !types?.loading ? (
              <p className="customer-service-empty-note">No complaint types yet.</p>
            ) : null}
          </div>
        </article>
      </section>

      <Modal
        open={statusModalOpen}
        onClose={closeStatusModal}
        title="Update complaint status"
        description={
          selectedComplaint ? `Complaint #${getComplaintId(selectedComplaint)}` : ""
        }
        size="sm"
      >
        <form className="customer-service-order-action-form" onSubmit={submitStatus}>
          <label>
            Status
            <select
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value)}
              disabled={actionLoading}
            >
              {COMPLAINT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {actionError ? <p className="customer-service-form-error">{actionError}</p> : null}
          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={closeStatusModal}>
              Cancel
            </Button>
            <Button type="submit" className="primary-action-btn" disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
