import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Layers3,
  MessageSquarePlus,
  MoreVertical,
  PencilLine,
  RefreshCcw,
  SearchX,
  Sparkles,
  X,
  UserRound,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import {
  clearCustomerServiceClientOrders,
  clearCustomerServiceOrderActionState,
  clearCustomerServiceSelectedOrder,
} from "../features/orders/model/order.slice";
import {
  addCustomerServiceOrderNote,
  changeCustomerServiceOrderStatus,
  fetchCustomerServiceClientOrders,
  fetchCustomerServiceOrder,
  fetchCustomerServiceOrders,
  transferCustomerServiceOrder,
} from "../features/orders/model/order.thunks";
import { getCustomerServiceOrderRequest } from "../features/orders/api/order.api";
import { formatStatus } from "../constants/customerServiceData";

import "../styles/customer-service.css";

const ORDER_FILTERS = [
  { value: "all", label: "All", dotClass: "" },
  { value: "pending", label: "Pending", dotClass: "busy" },
  { value: "initially_accepted", label: "Initially Accepted", dotClass: "ok" },
  { value: "accepted", label: "Accepted", dotClass: "ok" },
  { value: "rejected", label: "Rejected", dotClass: "off" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "initially_accepted", label: "Initially Accepted" },
  { value: "rejected", label: "Rejected" },
];

const LEGAL_TRANSFER_DEPARTMENT_ID = 5;

const FALLBACK_TRANSFER_DEPARTMENTS = [
  {
    id: LEGAL_TRANSFER_DEPARTMENT_ID,
    name: "Legal & Contracts",
    description:
      "Drafts and reviews property contracts, lease agreements, title deeds, and legal compliance.",
  },
];

const TRANSFER_DEPARTMENT_IDS = [String(LEGAL_TRANSFER_DEPARTMENT_ID)];

const isTransferDepartmentId = (departmentId) =>
  TRANSFER_DEPARTMENT_IDS.includes(String(departmentId));

const getTransferStatusValue = (status) => {
  const normalized = String(status || "").toLowerCase();
  return normalized === "rejected" ? "rejected" : "initially_accepted";
};

const isEditableStatusValue = (status) =>
  ["initially_accepted", "rejected"].includes(String(status || "").toLowerCase());

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
      value.label ||
      value.value ||
      JSON.stringify(value)
    );
  }

  return String(value);
};

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const displayValue = toDisplayText(value);
      if (displayValue.trim() !== "") {
        return displayValue;
      }
      continue;
    }

    return value;
  }

  return "";
};

const getOrderId = (order) => readNested(order, ["id", "order_id"]) || "-";

const getOrderStatus = (order) =>
  String(readNested(order, ["status"]) || "pending").toLowerCase();

const getClientId = (order) =>
  readNested(order, [
    "client.additional_info.client_id",
    "client.client_id",
    "client.id",
    "client.account.id",
  ]);

const getClientName = (order) =>
  readNested(order, [
    "client.account.full_name",
    "client.full_name",
    "client.name",
    "account.full_name",
  ]) || "-";

const getClientContact = (order) =>
  readNested(order, [
    "client.account.email",
    "client.account.phone",
    "client.email",
    "client.phone",
  ]) || "-";

const getDepartmentId = (order) =>
  readNested(order, [
    "department_id",
    "department.id",
    "department.department_id",
    "target_department_id",
    "target_department.id",
    "target_department.department_id",
    "assigned_department_id",
    "assignment.department_id",
  ]);

const getDepartmentOptionId = (department) =>
  readNested(department, ["id", "department_id", "value"]);

const getDepartmentOptionName = (department) =>
  toDisplayText(
    readNested(department, [
      "name",
      "title",
      "department.name",
      "department.title",
      "label",
      "value",
    ])
  );

const getDepartmentOptionDescription = (department) =>
  toDisplayText(
    readNested(department, [
      "description",
      "department.description",
      "details",
      "note",
    ])
  ) || "Available for order transfer";

const getDepartmentName = (order, departments = []) => {
  const id = getDepartmentId(order);
  const department = departments.find(
    (item) => String(getDepartmentOptionId(item)) === String(id)
  );

  return (
    toDisplayText(
      readNested(order, [
        "department.name",
        "department.title",
        "target_department.name",
        "target_department.title",
        "assigned_department.name",
        "assigned_department.title",
      ])
    ) ||
    getDepartmentOptionName(department) ||
    (id ? `Department #${id}` : "Not assigned")
  );
};

const buildDepartmentOptions = (orders = [], departments = FALLBACK_TRANSFER_DEPARTMENTS) => {
  const options = new Map();

  departments.forEach((department) => {
    const id = getDepartmentOptionId(department);
    if (!id) return;

    options.set(String(id), {
      id,
      name: getDepartmentOptionName(department) || `Department #${id}`,
      description: getDepartmentOptionDescription(department),
    });
  });

  orders.forEach((order) => {
    const id = getDepartmentId(order);
    const name = toDisplayText(
      readNested(order, [
        "department.name",
        "department.title",
        "target_department.name",
        "target_department.title",
        "assigned_department.name",
        "assigned_department.title",
      ])
    );

    if (!id || options.has(String(id))) return;

    options.set(String(id), {
      id,
      name: name || `Department #${id}`,
      description: "Department detected from existing orders",
    });
  });

  return Array.from(options.values());
};

const getOrderNotes = (order) => {
  const notes = readNested(order, ["notes", "order_notes"]);

  if (Array.isArray(notes)) return notes;

  const note = readNested(order, ["note", "latest_note"]);
  return note ? [{ id: "note", note }] : [];
};

const getOrderAttachments = (order) => {
  const attachments = readNested(order, [
    "unit.attachments",
    "solution.attachments",
    "service.attachments",
    "attachments",
    "files",
    "documents",
  ]);
  return Array.isArray(attachments) ? attachments : [];
};

const getNoteAuthor = (note) =>
  readNested(note, [
    "created_by.account.full_name",
    "created_by.full_name",
    "author.name",
    "employee.account.full_name",
    "employee.full_name",
    "user.name",
  ]) || "Customer Service";

const getNoteMessage = (note) =>
  readNested(note, ["text", "note", "content", "message", "body"]) || String(note);

const getNoteTimestamp = (note) =>
  readNested(note, ["created_at", "updated_at", "timestamp"]) || "No timestamp";

const getNoteKey = (note) => {
  const id = readNested(note, ["id", "note_id"]);
  if (id) return `id:${id}`;

  return `content:${getNoteMessage(note).trim().toLowerCase()}:${getNoteTimestamp(note)}`;
};

const getNoteContentKey = (note) => getNoteMessage(note).trim().toLowerCase();

const getUnitLabel = (order) =>
  readNested(order, ["unit.unit_number", "unit.name", "unit.id"]) || "-";

const getUnitType = (order) =>
  readNested(order, ["unit.type"]) || "-";

const getUnitStatus = (order) =>
  readNested(order, ["unit.status"]) || "-";

const getUnitDescription = (order) =>
  readNested(order, ["unit.description"]) || "-";

const getSolutionPrice = (order, key) => {
  const value = readNested(order, [`solution.${key}`, `service.${key}`]);
  return value === "" || value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString("en-US");
};

const getOrderType = (order) => {
  if (readNested(order, ["unit.id", "unit.unit_number"])) return "unit";
  if (
    readNested(order, [
      "solution.id",
      "solution.title",
      "service.id",
      "service.title",
      "solution_order.id",
      "solution_order.title",
    ])
  ) {
    return "service";
  }

  return "unit";
};

const getOrderItemTitle = (order) =>
  readNested(order, [
    "unit.unit_number",
    "solution.title",
    "solution.name",
    "service.title",
    "service.name",
    "solution_order.title",
    "solution_order.name",
    "item.title",
    "item.name",
  ]) || "-";

const getOrderItemMeta = (order) => {
  if (getOrderType(order) === "unit") {
    return `${formatStatus(getUnitType(order))} - ${getUnitMeta(order)}`;
  }

  return (
    readNested(order, [
      "solution.description",
      "service.description",
      "solution_order.description",
      "item.description",
    ]) || "Service request"
  );
};

const getBuildingId = (order) =>
  readNested(order, ["unit.building_id", "building_id"]) || "-";

const getUnitPrice = (order) => {
  const price = readNested(order, ["unit.price", "price"]);

  if (!price) return "-";

  return Number(price).toLocaleString("en-US");
};

const getUnitMeta = (order) => {
  const floor = readNested(order, ["unit.floor"]);
  const area = readNested(order, ["unit.area"]);
  const rooms = readNested(order, ["unit.rooms_count"]);

  return [
    floor ? `Floor ${floor}` : "",
    area ? `${area} m2` : "",
    rooms ? `${rooms} rooms` : "",
  ]
    .filter(Boolean)
    .join(" - ") || "-";
};

const getUpdatedAt = (order) => readNested(order, ["updated_at", "created_at"]) || "-";

const getCreatedAt = (order) => readNested(order, ["created_at"]) || "-";

const mergeOrderDetails = (order, detailsById = {}, localNotesById = {}) => {
  const id = getOrderId(order);
  const details = detailsById[String(id)];
  const mergedOrder = details ? { ...order, ...details } : order;
  const localNotes = localNotesById[String(id)] || [];

  if (localNotes.length === 0) return mergedOrder;

  const apiNotes = getOrderNotes(mergedOrder);
  const noteKeys = new Set(apiNotes.map(getNoteKey));
  const contentKeys = new Set(apiNotes.map(getNoteContentKey).filter(Boolean));
  const notes = [...apiNotes];

  localNotes.forEach((note) => {
    const key = getNoteKey(note);
    const contentKey = getNoteContentKey(note);

    if (noteKeys.has(key) || (contentKey && contentKeys.has(contentKey))) return;

    noteKeys.add(key);
    if (contentKey) contentKeys.add(contentKey);
    notes.push(note);
  });

  return { ...mergedOrder, notes };
};

function OrdersTableSkeleton() {
  return (
    <div className="customer-service-table-skeleton" aria-label="Loading orders">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="customer-service-skeleton-row" key={index}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <span key={cellIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyOrdersState({ message }) {
  return (
    <div className="customer-service-empty-state">
      <div className="customer-service-empty-icon">
        <SearchX size={24} />
      </div>
      <strong>No orders found</strong>
      <p>{message || "Try adjusting the search term or status filter."}</p>
    </div>
  );
}

EmptyOrdersState.propTypes = {
  message: PropTypes.string,
};

EmptyOrdersState.defaultProps = {
  message: "",
};

function OrdersMiniTable({ title, orders, message }) {
  return (
    <details className="customer-service-detail-section" open>
      <summary className="customer-service-detail-head">
        <h3>{title}</h3>
        <span>{orders.length} records</span>
      </summary>

      {orders.length > 0 ? (
        <div className="customer-service-mini-list">
          {orders.map((order) => (
            <article className="customer-service-mini-card" key={getOrderId(order)}>
              <div>
                <strong>Order #{getOrderId(order)}</strong>
                <span>{getUnitLabel(order)}</span>
              </div>
              <span className={`customer-service-pill ${getOrderStatus(order)}`}>
                {formatStatus(getOrderStatus(order))}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="customer-service-empty-note">{message || "No records found."}</p>
      )}
    </details>
  );
}

OrdersMiniTable.propTypes = {
  title: PropTypes.string.isRequired,
  orders: PropTypes.arrayOf(PropTypes.object).isRequired,
  message: PropTypes.string,
};

OrdersMiniTable.defaultProps = {
  message: "",
};

function DepartmentPicker({
  departments,
  value,
  onChange,
  disabled,
  loading,
  error,
}) {
  if (loading) {
    return <div className="customer-service-transfer-state">Loading departments...</div>;
  }

  if (departments.length === 0) {
    const unavailableMessage =
      error === "Unauthorized. Please login again."
        ? "Departments cannot be loaded for this account. Enable department access to transfer by department name."
        : error || "No departments are available for transfer.";

    return (
      <div className="customer-service-transfer-state is-error">
        {unavailableMessage}
      </div>
    );
  }

  return (
    <div className="customer-service-department-picker" role="radiogroup">
      {departments.map((department) => {
        const id = String(department.id);
        const selected = String(value) === id;

        return (
          <button
            type="button"
            className={`customer-service-department-option ${selected ? "selected" : ""}`}
            key={id}
            onClick={() => onChange(id)}
            disabled={disabled}
            role="radio"
            aria-checked={selected}
          >
            <span className="customer-service-department-check" />
            <span>
              <strong>{department.name}</strong>
              <small>{department.description}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

DepartmentPicker.propTypes = {
  departments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

DepartmentPicker.defaultProps = {
  value: "",
  disabled: false,
  loading: false,
  error: "",
};
function OrderDetailsDrawer({
  open,
  order,
  loading,
  error,
  departmentOptions,
  actionError,
  actionMessage,
  onClose,
}) {
  const status = getOrderStatus(order);
  const notes = getOrderNotes(order);
  const attachments = getOrderAttachments(order);
  const orderType = getOrderType(order);

  if (!open) return null;

  return (
    <div className="order-details-modal-shell">
      <button
        type="button"
        className="order-details-modal-backdrop"
        onClick={onClose}
        aria-label="Close order details"
      />

      <section className="order-details-modal">
        <button
          type="button"
          className="order-details-close"
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={22} />
        </button>

        {loading ? <div className="table-state">Loading order details...</div> : null}
        {error ? <div className="table-state is-error">{error}</div> : null}

        {order ? (
          <>
            <div className="order-details-header-row">
              <header className="order-details-header">
                <div className="order-details-icon">
                  <ClipboardList size={28} />
                </div>

                <div>
                  <h2>Order #{getOrderId(order)}</h2>
                  <span className={`customer-service-pill ${status}`}>
                    {formatStatus(status)}
                  </span>
                </div>
              </header>
            </div>

            {/* <section className="order-details-tabs">
              <button type="button" className="order-details-tab active">
                Overview
              </button>
              <button type="button" className="order-details-tab">
                Notes ({notes.length})
              </button>
              <button type="button" className="order-details-tab">
                Appointments
              </button>
              <button type="button" className="order-details-tab">
                History
              </button>
            </section> */}

            <section className="order-details-summary">
              <div>
                <Layers3 size={22} />
                <span>
                  <small>Department</small>
                  <strong>{getDepartmentName(order, departmentOptions)}</strong>
                </span>
              </div>

              <div>
                <Sparkles size={22} />
                <span>
                  <small>Status</small>
                  <strong className="order-details-green">{formatStatus(status)}</strong>
                </span>
              </div>

              <div>
                <FileText size={22} />
                <span>
                  <small>Created At</small>
                  <strong>{getCreatedAt(order)}</strong>
                </span>
              </div>

              <div>
                <RefreshCcw size={22} />
                <span>
                  <small>Updated At</small>
                  <strong>{getUpdatedAt(order)}</strong>
                </span>
              </div>
            </section>

            <main className="order-details-grid">
              <section className="order-details-card order-details-customer">
                <header>
                  <UserRound size={20} />
                  <h3>Customer Information</h3>
                </header>

                <dl className="order-details-list">
                  <div>
                    <dt>Full Name</dt>
                    <dd>{getClientName(order)}</dd>
                  </div>

                  <div>
                    <dt>Email</dt>
                    <dd>{readNested(order, ["client.account.email"]) || "-"}</dd>
                  </div>

                  <div>
                    <dt>Phone</dt>
                    <dd>{readNested(order, ["client.account.phone"]) || "-"}</dd>
                  </div>

                  <div>
                    <dt>Address</dt>
                    <dd>{readNested(order, ["client.account.address"]) || "-"}</dd>
                  </div>

                  <div>
                    <dt>National ID</dt>
                    <dd>{readNested(order, ["client.additional_info.national_id"]) || "-"}</dd>
                  </div>

                  <div>
                    <dt>Birth Date</dt>
                    <dd>{readNested(order, ["client.additional_info.birth_date"]) || "-"}</dd>
                  </div>

                  <div>
                    <dt>Job Title</dt>
                    <dd>{readNested(order, ["client.additional_info.job_title"]) || "-"}</dd>
                  </div>

                  <div>
                    <dt>Social Status</dt>
                    <dd>
                      {formatStatus(
                        readNested(order, ["client.additional_info.social_status"]) || "-"
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Account Type</dt>
                    <dd>
                      {formatStatus(readNested(order, ["client.account.type"]) || "-")}
                    </dd>
                  </div>

                  <div>
                    <dt>Verified At</dt>
                    <dd>
                      {readNested(order, ["client.account.verified_at"]) || "-"}
                      {readNested(order, ["client.account.verified_at"]) ? (
                        <span className="order-details-verified">Verified</span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </section>

              <div className="order-details-side">
                {orderType === "unit" ? (
                  <section className="order-details-card">
                    <header>
                      <Layers3 size={20} />
                      <h3>Unit Information</h3>
                    </header>

                    <dl className="order-details-unit-grid">
                    <div>
                      <dt>Unit Number</dt>
                      <dd>{getUnitLabel(order)}</dd>
                    </div>

                    <div>
                      <dt>Area</dt>
                      <dd>{readNested(order, ["unit.area"]) || "-"} m2</dd>
                    </div>

                    <div>
                      <dt>Status</dt>
                      <dd>
                        <span className={`customer-service-pill ${String(getUnitStatus(order)).toLowerCase()}`}>
                          {formatStatus(getUnitStatus(order))}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt>Type</dt>
                      <dd>{formatStatus(getUnitType(order))}</dd>
                    </div>

                    <div>
                      <dt>Rooms</dt>
                      <dd>{readNested(order, ["unit.rooms_count"]) || "-"}</dd>
                    </div>

                    <div>
                      <dt>Building ID</dt>
                      <dd>{getBuildingId(order)}</dd>
                    </div>

                    <div>
                      <dt>Floor</dt>
                      <dd>{readNested(order, ["unit.floor"]) || "-"}</dd>
                    </div>

                    <div>
                      <dt>Price</dt>
                      <dd>{getUnitPrice(order)}</dd>
                    </div>

                    <div>
                      <dt>Created At</dt>
                      <dd>{readNested(order, ["unit.created_at"]) || "-"}</dd>
                    </div>
                    </dl>

                    <div className="order-details-description">
                      <dt>Description</dt>
                      <dd>{getUnitDescription(order)}</dd>
                    </div>
                  </section>
                ) : (
                  <section className="order-details-card order-details-solution">
                    <header>
                      <Sparkles size={20} />
                      <h3>Service Information</h3>
                    </header>

                    <dl className="order-details-unit-grid">
                      <div>
                        <dt>Service ID</dt>
                        <dd>{readNested(order, ["solution.id", "service.id"]) || "-"}</dd>
                      </div>

                      <div>
                        <dt>Service Name</dt>
                        <dd>{getOrderItemTitle(order)}</dd>
                      </div>

                      <div>
                        <dt>Original Price</dt>
                        <dd>{getSolutionPrice(order, "original_price")}</dd>
                      </div>

                      <div>
                        <dt>Current Price</dt>
                        <dd>{getSolutionPrice(order, "current_price")}</dd>
                      </div>

                      <div>
                        <dt>Active Offer</dt>
                        <dd>
                          {readNested(order, ["solution.has_active_offer", "service.has_active_offer"])
                            ? "Yes"
                            : "No"}
                        </dd>
                      </div>

                      <div>
                        <dt>Discount</dt>
                        <dd>
                          {readNested(order, [
                            "solution.discount_percentage",
                            "service.discount_percentage",
                          ]) ?? 0}%
                        </dd>
                      </div>

                      <div>
                        <dt>Created At</dt>
                        <dd>{readNested(order, ["solution.created_at", "service.created_at"]) || "-"}</dd>
                      </div>

                      <div>
                        <dt>Created</dt>
                        <dd>{readNested(order, ["solution.created_from", "service.created_from"]) || "-"}</dd>
                      </div>
                    </dl>

                    <div className="order-details-description">
                      <dt>Description</dt>
                      <dd>{getOrderItemMeta(order)}</dd>
                    </div>
                  </section>
                )}

                <section className="order-details-card">
                  <header>
                    <Layers3 size={20} />
                    <h3>Department Information</h3>
                  </header>

                  <dl className="order-details-department-grid">
                    <div>
                      <dt>Department Name</dt>
                      <dd>{getDepartmentName(order, departmentOptions)}</dd>
                    </div>

                    <div>
                      <dt>Department ID</dt>
                      <dd>{readNested(order, ["department.id"]) || "-"}</dd>
                    </div>

                    <div>
                      <dt>Description</dt>
                      <dd>{readNested(order, ["department.description"]) || "-"}</dd>
                    </div>

                    <div>
                      <dt>Created At</dt>
                      <dd>{readNested(order, ["department.created_at"]) || "-"}</dd>
                    </div>
                  </dl>
                </section>

                <section className="order-details-card">
                  <header>
                    <MessageSquarePlus size={20} />
                    <h3>Notes</h3>
                  </header>

                  {notes.length > 0 ? (
                    <div className="customer-service-notes-timeline">
                      {notes.map((note, index) => (
                        <article className="customer-service-timeline-item" key={note.id || index}>
                          <span className="customer-service-timeline-dot" />
                          <div>
                            <header>
                              <strong>{getNoteAuthor(note)}</strong>
                              <time>{getNoteTimestamp(note)}</time>
                            </header>
                            <p>{getNoteMessage(note)}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="order-details-empty">No notes available.</div>
                  )}
                </section>
              </div>
            </main>

            {attachments.length > 0 ? (
              <section className="order-details-card order-details-attachments">
                <header>
                  <FileText size={20} />
                  <h3>Attachments</h3>
                </header>

                <div className="customer-service-attachment-list">
                  {attachments.map((attachment, index) => (
                    <a
                      href={attachment.url || attachment.path || "#"}
                      className="customer-service-attachment"
                      key={attachment.id || index}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={16} />
                      <span>{attachment.name || attachment.file_name || `Attachment ${index + 1}`}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {actionError ? <p className="customer-service-form-error">{actionError}</p> : null}
            {actionMessage ? <p className="customer-service-form-success">{actionMessage}</p> : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

OrderDetailsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  order: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  departmentOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  departmentsLoading: PropTypes.bool,
  departmentsError: PropTypes.string,
  actionLoading: PropTypes.bool,
  actionError: PropTypes.string,
  actionMessage: PropTypes.string,
  noteText: PropTypes.string.isRequired,
  statusValue: PropTypes.string.isRequired,
  transferDepartmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  onNoteChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onTransferDepartmentChange: PropTypes.func.isRequired,
  onSubmitNote: PropTypes.func.isRequired,
  onSubmitStatus: PropTypes.func.isRequired,
  onSubmitTransfer: PropTypes.func.isRequired,
  onOpenAction: PropTypes.func.isRequired,
};

OrderDetailsDrawer.defaultProps = {
  order: null,
  loading: false,
  error: "",
  departmentsLoading: false,
  departmentsError: "",
  actionLoading: false,
  actionError: "",
  actionMessage: "",
  transferDepartmentId: "",
};

export default function CustomerServiceOrdersPage() {
  const dispatch = useDispatch();
  const {
    items: orders = [],
    meta,
    message,
    loading,
    error,
    selectedOrder: selectedOrderState,
    actionLoading,
    actionError,
    actionMessage,
  } = useSelector((state) => state.customerServiceOrders || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState("");
  const [orderDetailsById, setOrderDetailsById] = useState({});
  const [localOrderNotesById, setLocalOrderNotesById] = useState({});
  const [transferDepartmentId, setTransferDepartmentId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [statusValue, setStatusValue] = useState("initially_accepted");

  useEffect(() => {
    dispatch(fetchCustomerServiceOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!openActionMenuId) return undefined;

    const closeMenu = () => setOpenActionMenuId("");
    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, [openActionMenuId]);

  const enrichedOrders = useMemo(
    () => orders.map((order) => mergeOrderDetails(order, orderDetailsById, localOrderNotesById)),
    [localOrderNotesById, orderDetailsById, orders]
  );

  const departmentOptions = useMemo(
    () => buildDepartmentOptions(enrichedOrders, FALLBACK_TRANSFER_DEPARTMENTS),
    [enrichedOrders]
  );

  const transferDepartmentOptions = useMemo(
    () =>
      departmentOptions.filter((department) =>
        isTransferDepartmentId(getDepartmentOptionId(department))
      ),
    [departmentOptions]
  );

  useEffect(() => {
    if (loading || orders.length === 0) return undefined;

    let cancelled = false;
    const missingDepartmentOrders = orders.filter((order) => {
      const id = getOrderId(order);
      return id && id !== "-" && !getDepartmentId(order) && !orderDetailsById[String(id)];
    });

    if (missingDepartmentOrders.length === 0) return undefined;

    const hydrateDepartments = async () => {
      const entries = await Promise.all(
        missingDepartmentOrders.map(async (order) => {
          const id = getOrderId(order);
          const result = await getCustomerServiceOrderRequest(id);

          if (!result.ok) return null;

          return [String(id), result.data?.data || result.data];
        })
      );

      if (cancelled) return;

      const nextDetails = entries
        .filter(Boolean)
        .reduce((accumulator, [id, details]) => {
          accumulator[id] = details;
          return accumulator;
        }, {});

      if (Object.keys(nextDetails).length > 0) {
        setOrderDetailsById((current) => ({ ...current, ...nextDetails }));
      }
    };

    hydrateDepartments();

    return () => {
      cancelled = true;
    };
  }, [loading, orderDetailsById, orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return enrichedOrders.filter((order) => {
      const status = getOrderStatus(order);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const searchable = [
        getOrderId(order),
        status,
        getClientName(order),
        getClientContact(order),
        getUnitLabel(order),
        getUnitType(order),
        getUnitMeta(order),
        getDepartmentName(order, departmentOptions),
        getCreatedAt(order),
        getUpdatedAt(order),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [departmentOptions, enrichedOrders, searchTerm, statusFilter]);

  const total = meta?.total ?? enrichedOrders.length;
  const pending = enrichedOrders.filter((order) => getOrderStatus(order) === "pending").length;
  const completed = enrichedOrders.filter((order) =>
    ["completed", "done", "approved", "accepted", "initially_accepted"].includes(getOrderStatus(order))
  ).length;
  const uniqueClients = new Set(enrichedOrders.map(getClientId).filter(Boolean)).size;
  const currentOrderDetails =
    selectedOrderState?.item
      ? mergeOrderDetails(selectedOrderState.item, orderDetailsById, localOrderNotesById)
      : selectedOrder
        ? mergeOrderDetails(selectedOrder, orderDetailsById, localOrderNotesById)
        : null;

  const cacheOrderDetails = (orderId, details) => {
    const normalizedDetails = details?.data || details;
    if (!orderId || orderId === "-" || !normalizedDetails) return;

    setOrderDetailsById((current) => ({
      ...current,
      [String(orderId)]: normalizedDetails,
    }));
  };

  const appendLocalOrderNote = (orderId, note) => {
    if (!orderId || orderId === "-" || !note || !getNoteContentKey(note)) return;

    setLocalOrderNotesById((current) => {
      const existingNotes = current[String(orderId)] || [];
      const contentKey = getNoteContentKey(note);

      if (existingNotes.some((item) => getNoteContentKey(item) === contentKey)) {
        return current;
      }

      return {
        ...current,
        [String(orderId)]: [...existingNotes, note],
      };
    });
  };

  const buildLocalTransferNote = (orderId, departmentId, note) => {
    const departmentName =
      transferDepartmentOptions.find(
        (department) => String(getDepartmentOptionId(department)) === String(departmentId)
      )?.name || `Department #${departmentId}`;
    const message = note?.trim() || `Transferred to ${departmentName}.`;

    return {
      id: `transfer-${orderId}-${Date.now()}`,
      note: message,
      created_at: "Just now",
      created_by: {
        full_name: "Customer Service",
      },
      department: {
        id: departmentId,
        name: departmentName,
      },
      type: "transfer",
    };
  };

  const openClientOrders = async (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    setTransferDepartmentId(String(getDepartmentId(order) || LEGAL_TRANSFER_DEPARTMENT_ID));
    setStatusValue(getTransferStatusValue(getOrderStatus(order)));
    setNoteText("");
    dispatch(clearCustomerServiceOrderActionState());
    dispatch(clearCustomerServiceSelectedOrder());
    const orderId = getOrderId(order);
    const detailsResult = await dispatch(fetchCustomerServiceOrder(orderId));

    if (fetchCustomerServiceOrder.fulfilled.match(detailsResult)) {
      cacheOrderDetails(orderId, detailsResult.payload);
    }

    const clientId = getClientId(order);

    if (clientId) {
      await dispatch(fetchCustomerServiceClientOrders(clientId));
    }
  };

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelectedOrder(null);
    setTransferDepartmentId("");
    setNoteText("");
    setStatusValue("initially_accepted");
    dispatch(clearCustomerServiceClientOrders());
    dispatch(clearCustomerServiceSelectedOrder());
    dispatch(clearCustomerServiceOrderActionState());
  }, [dispatch]);

  useEffect(() => {
    if (!detailsOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDetails();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDetails, detailsOpen]);

  const openOrderAction = (type, order) => {
    const departmentId = getDepartmentId(order);
    const nextTransferDepartment =
      type === "transfer"
        ? String(LEGAL_TRANSFER_DEPARTMENT_ID)
        : isTransferDepartmentId(departmentId)
          ? String(departmentId)
          : "";

    setOpenActionMenuId("");
    setSelectedOrder(order);
    setActionType(type);
    setActionOpen(true);
    setTransferDepartmentId(nextTransferDepartment);
    setNoteText("");
    setStatusValue(
      type === "status"
        ? getTransferStatusValue(getOrderStatus(order))
        : "initially_accepted"
    );
    dispatch(clearCustomerServiceOrderActionState());
  };

  const closeOrderAction = () => {
    setActionOpen(false);
    setActionType("");
    setSelectedOrder(null);
    setTransferDepartmentId("");
    setNoteText("");
    setStatusValue("initially_accepted");
    dispatch(clearCustomerServiceOrderActionState());
  };

  const submitOrderAction = async (event) => {
    event.preventDefault();

    const orderId = getOrderId(selectedOrder);
    if (!orderId || orderId === "-") return;

    if (actionType === "status" && !isEditableStatusValue(statusValue)) return;

    let result;

    if (actionType === "transfer") {
      if (!transferDepartmentId || !isTransferDepartmentId(transferDepartmentId)) return;

      result = await dispatch(
        transferCustomerServiceOrder({
          orderId,
          departmentId: transferDepartmentId,
          status: getTransferStatusValue(statusValue),
          note: noteText.trim(),
        })
      );
    }

    if (actionType === "note") {
      if (!noteText.trim()) return;

      result = await dispatch(
        addCustomerServiceOrderNote({
          orderId,
          note: noteText.trim(),
        })
      );
    }

    if (actionType === "status") {
      result = await dispatch(
        changeCustomerServiceOrderStatus({
          orderId,
          status: getTransferStatusValue(statusValue),
        })
      );
    }

    if (
      transferCustomerServiceOrder.fulfilled.match(result) ||
      changeCustomerServiceOrderStatus.fulfilled.match(result) ||
      addCustomerServiceOrderNote.fulfilled.match(result)
    ) {
      cacheOrderDetails(orderId, result.payload);

      if (actionType === "transfer") {
        appendLocalOrderNote(
          orderId,
          buildLocalTransferNote(orderId, transferDepartmentId, noteText)
        );
      }

      if (actionType === "note" && noteText.trim()) {
        appendLocalOrderNote(orderId, {
          id: `note-${orderId}-${Date.now()}`,
          note: noteText.trim(),
          created_at: "Just now",
          created_by: {
            full_name: "Customer Service",
          },
        });
      }

      closeOrderAction();
    }
  };

  const refreshCurrentOrder = async (orderId) => {
    dispatch(fetchCustomerServiceOrders());
    const detailsResult = await dispatch(fetchCustomerServiceOrder(orderId));

    if (fetchCustomerServiceOrder.fulfilled.match(detailsResult)) {
      cacheOrderDetails(orderId, detailsResult.payload);
    }
  };

  const submitDrawerStatus = async (event) => {
    event.preventDefault();

    const orderId = getOrderId(currentOrderDetails);
    if (!orderId || orderId === "-") return;
    if (!isEditableStatusValue(statusValue)) return;

    const result = await dispatch(
      changeCustomerServiceOrderStatus({
        orderId,
        status: getTransferStatusValue(statusValue),
      })
    );

    if (changeCustomerServiceOrderStatus.fulfilled.match(result)) {
      cacheOrderDetails(orderId, result.payload);
      await refreshCurrentOrder(orderId);
    }
  };

  const submitDrawerTransfer = async (event) => {
    event.preventDefault();

    const orderId = getOrderId(currentOrderDetails);
    if (!orderId || orderId === "-" || !transferDepartmentId || !isTransferDepartmentId(transferDepartmentId)) return;

    const result = await dispatch(
      transferCustomerServiceOrder({
        orderId,
        departmentId: transferDepartmentId,
        status: getTransferStatusValue(statusValue),
        note: noteText.trim(),
      })
    );

    if (transferCustomerServiceOrder.fulfilled.match(result)) {
      cacheOrderDetails(orderId, result.payload);

      if (noteText.trim()) {
        appendLocalOrderNote(
          orderId,
          buildLocalTransferNote(orderId, transferDepartmentId, noteText.trim())
        );
      }

      await refreshCurrentOrder(orderId);
    }
  };

  const submitDrawerNote = async (event) => {
    event.preventDefault();

    const orderId = getOrderId(currentOrderDetails);
    if (!orderId || orderId === "-") return;

    const result = await dispatch(
      addCustomerServiceOrderNote({
        orderId,
        note: noteText.trim(),
      })
    );

    if (addCustomerServiceOrderNote.fulfilled.match(result)) {
      cacheOrderDetails(orderId, result.payload);

      if (noteText.trim()) {
        appendLocalOrderNote(orderId, {
          id: `note-${orderId}-${Date.now()}`,
          note: noteText.trim(),
          created_at: "Just now",
          created_by: {
            full_name: "Customer Service",
          },
        });
      }

      await refreshCurrentOrder(orderId);
      setNoteText("");
    }
  };

  return (
    <div className="customer-service-page">
      <section className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Orders from API" icon={ClipboardList} />
        <StatCard title="Pending" value={pending} note="Need follow-up" icon={RefreshCcw} />
        <StatCard title="Completed" value={completed} note="Closed or approved" icon={CheckCircle2} />
        <StatCard title="Clients" value={uniqueClients} note="With orders" icon={UserRound} />
      </section>

      <Toolbar
        placeholder="Search orders by client, unit, status, or date..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={ORDER_FILTERS}
      />

      <TableCard title="Order List" count={meta?.total ?? filteredOrders.length}>
        {loading ? (
          <OrdersTableSkeleton />
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <EmptyOrdersState message={message} />
        ) : (
          <table className="legal-table customer-service-orders-table">
            <thead>
              <tr>
                <th>Order / Client</th>
                <th>Type</th>
                <th>Item</th>
                <th>Department</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order, orderIndex) => {
                  const id = getOrderId(order);
                  const status = getOrderStatus(order);
                  const type = getOrderType(order);
                  const menuOpen = String(openActionMenuId) === String(id);

                  return (
                    <tr key={id}>
                      <td data-label="Order / Client">
                        <div className="customer-service-order-primary-cell">
                          <span className="customer-service-order-id">#{id}</span>
                          <strong>{getClientName(order)}</strong>
                          <small>{getClientContact(order)}</small>
                        </div>
                      </td>
                      <td data-label="Type">
                        <span className={`customer-service-type-pill ${type}`}>
                          {formatStatus(type)}
                        </span>
                      </td>
                      <td data-label="Item">
                        <div className="customer-service-name-cell">
                          <strong>{getOrderItemTitle(order)}</strong>
                          <span>{getOrderItemMeta(order)}</span>
                        </div>
                      </td>
                      <td data-label="Department">
                        <div className="customer-service-name-cell">
                          <strong>{getDepartmentName(order, departmentOptions)}</strong>
                          <span>{getDepartmentId(order) ? "Assigned department" : "Not assigned yet"}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`customer-service-pill ${status}`}>
                          {formatStatus(status)}
                        </span>
                      </td>
                      <td data-label="Updated">
                        <span className="customer-service-muted-time">{getUpdatedAt(order)}</span>
                      </td>
                      <td data-label="Actions">
                        <div
                          className="customer-service-row-actions customer-service-actions-menu-wrap"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="customer-service-action-btn primary"
                            onClick={() => openClientOrders(order)}
                            disabled={!id || id === "-"}
                            title="View order"
                            aria-label={`View details for order ${getOrderId(order) || ""}`}
                          >
                            <Eye size={16} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className={`customer-service-action-btn customer-service-menu-trigger ${menuOpen ? "is-open" : ""}`}
                            onClick={() =>
                              setOpenActionMenuId((current) =>
                                String(current) === String(id) ? "" : String(id)
                              )
                            }
                            title="More actions"
                            aria-label={`Open actions for order ${getOrderId(order) || ""}`}
                            aria-expanded={menuOpen}
                          >
                            <MoreVertical size={16} />
                            <span>Actions</span>
                          </button>

                          {menuOpen ? (
                            <div className={`customer-service-actions-menu ${orderIndex === filteredOrders.length - 1 ? "open-upwards" : ""}`}>
                              <button
                                type="button"
                                onClick={() => openOrderAction("status", order)}
                              >
                                <PencilLine size={15} />
                                <span>Change Status</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openOrderAction("transfer", order)}
                              >
                                <ArrowRightLeft size={15} />
                                <span>Transfer Order</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openOrderAction("note", order)}
                              >
                                <MessageSquarePlus size={15} />
                                <span>Add Note</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </TableCard>

    <OrderDetailsDrawer
  open={detailsOpen}
  order={currentOrderDetails}
  loading={selectedOrderState?.loading}
  error={selectedOrderState?.error}
  departmentOptions={departmentOptions}
  departmentsLoading={false}
  departmentsError=""
  actionLoading={actionLoading}
  actionError={actionError}
  actionMessage={actionMessage}
  noteText={noteText}
  statusValue={statusValue}
  transferDepartmentId={transferDepartmentId}
  onClose={closeDetails}
  onNoteChange={setNoteText}
  onStatusChange={setStatusValue}
  onTransferDepartmentChange={setTransferDepartmentId}
  onSubmitNote={submitDrawerNote}
  onSubmitStatus={submitDrawerStatus}
  onSubmitTransfer={submitDrawerTransfer}
  onOpenAction={openOrderAction}
/>

      <Modal
        open={actionOpen}
        onClose={closeOrderAction}
        title={
          actionType === "transfer"
            ? "Transfer order"
            : actionType === "note"
              ? "Add order note"
              : "Change order status"
        }
        description={selectedOrder ? `Order #${getOrderId(selectedOrder)}` : ""}
        size="md"
      >
        <form className="customer-service-order-action-form" onSubmit={submitOrderAction}>
          {actionType === "transfer" ? (
            <section className="customer-service-action-section">
              <div className="customer-service-action-section-head">
                <span>Transfer destination</span>
                <strong>
                  {transferDepartmentOptions.length === 0
                      ? "No departments available"
                      : transferDepartmentId
                        ? transferDepartmentOptions.find(
                            (department) =>
                              String(getDepartmentOptionId(department)) === String(transferDepartmentId)
                          )?.name || "Selected department"
                        : "Choose a department"}
                </strong>
              </div>
              <DepartmentPicker
                departments={transferDepartmentOptions}
                value={transferDepartmentId}
                onChange={setTransferDepartmentId}
                disabled={actionLoading}
                loading={false}
                error=""
              />
              <div className="customer-service-action-section-head">
                <span>Transfer status</span>
                <strong>{formatStatus(statusValue)}</strong>
              </div>
              <div className="customer-service-status-options modal-status-options">
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <button
                    type="button"
                    className={`customer-service-status-option ${
                      statusValue === option.value ? "selected" : ""
                    }`}
                    key={option.value}
                    onClick={() => setStatusValue(option.value)}
                    disabled={actionLoading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <textarea
                className="customer-service-action-textarea compact"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Optional transfer note..."
                rows={3}
                disabled={actionLoading}
              />
            </section>
          ) : null}

          {actionType === "note" ? (
            <section className="customer-service-action-section">
              <div className="customer-service-action-section-head">
                <span>Internal note</span>
                <strong>Add a note for this order</strong>
              </div>
              <textarea
                className="customer-service-action-textarea"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Write a clear note for this order..."
                rows={5}
              />
            </section>
          ) : null}

          {actionType === "status" ? (
            <section className="customer-service-action-section">
              <div className="customer-service-action-section-head">
                <span>New order status</span>
                <strong>{formatStatus(statusValue)}</strong>
              </div>
              <div className="customer-service-status-options modal-status-options">
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <button
                    type="button"
                    className={`customer-service-status-option ${
                      statusValue === option.value ? "selected" : ""
                    }`}
                    key={option.value}
                    onClick={() => setStatusValue(option.value)}
                    disabled={actionLoading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {actionError ? <p className="customer-service-form-error">{actionError}</p> : null}
          {actionMessage ? <p className="customer-service-form-success">{actionMessage}</p> : null}

          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={closeOrderAction}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="primary-action-btn"
              disabled={
                actionLoading ||
                (actionType === "transfer" &&
                  (!transferDepartmentId ||
                    !isTransferDepartmentId(transferDepartmentId) ||
                    transferDepartmentOptions.length === 0)) ||
                (actionType === "note" && !noteText.trim())
              }
            >
              {actionLoading
                ? "Saving..."
                : actionType === "transfer"
                  ? "Transfer Order"
                  : actionType === "note"
                    ? "Add Note"
                    : "Change Status"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
