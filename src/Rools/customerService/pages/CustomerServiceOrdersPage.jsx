import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  Home,
  RefreshCcw,
  UserRound,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import {
  clearCustomerServiceClientOrders,
} from "../features/orders/model/order.slice";
import {
  fetchCustomerServiceClientOrders,
  fetchCustomerServiceOrders,
} from "../features/orders/model/order.thunks";
import { formatStatus } from "../constants/customerServiceData";

import "../styles/customer-service.css";

const ORDER_FILTERS = [
  { value: "all", label: "All", dotClass: "" },
  { value: "pending", label: "Pending", dotClass: "busy" },
  { value: "approved", label: "Approved", dotClass: "ok" },
  { value: "completed", label: "Completed", dotClass: "ok" },
  { value: "cancelled", label: "Cancelled", dotClass: "off" },
  { value: "canceled", label: "Canceled", dotClass: "off" },
  { value: "rejected", label: "Rejected", dotClass: "off" },
];

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
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

const getUnitLabel = (order) =>
  readNested(order, ["unit.unit_number", "unit.name", "unit.id"]) || "-";

const getUnitType = (order) =>
  readNested(order, ["unit.type"]) || "-";

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

function OrdersMiniTable({ title, orders, message }) {
  return (
    <section className="customer-service-detail-section">
      <div className="customer-service-detail-head">
        <h3>{title}</h3>
        <span>{orders.length} records</span>
      </div>

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
    </section>
  );
}

export default function CustomerServiceOrdersPage() {
  const dispatch = useDispatch();
  const {
    items: orders = [],
    meta,
    message,
    loading,
    error,
    clientOrders,
  } = useSelector((state) => state.customerServiceOrders || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomerServiceOrders());
  }, [dispatch]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
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
        getCreatedAt(order),
        getUpdatedAt(order),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [orders, searchTerm, statusFilter]);

  const total = meta?.total ?? orders.length;
  const pending = orders.filter((order) => getOrderStatus(order) === "pending").length;
  const completed = orders.filter((order) =>
    ["completed", "done", "approved"].includes(getOrderStatus(order))
  ).length;
  const uniqueClients = new Set(orders.map(getClientId).filter(Boolean)).size;

  const openClientOrders = async (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);

    const clientId = getClientId(order);

    if (clientId) {
      await dispatch(fetchCustomerServiceClientOrders(clientId));
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
    dispatch(clearCustomerServiceClientOrders());
  };

  return (
    <div className="customer-service-page" dir="ltr">
      <PageHeader
        kicker="Customer Service"
        title="Orders"
        subtitle="Review all customer orders, then drill into a client's unit and service order history."
      />

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
          <div className="table-state">Loading orders...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Client</th>
                <th>Contact</th>
                <th>Unit</th>
                <th>Unit Details</th>
                <th>Price</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const id = getOrderId(order);
                  const status = getOrderStatus(order);
                  const clientId = getClientId(order);

                  return (
                    <tr key={id}>
                      <td data-label="Order">
                        <strong>{id}</strong>
                      </td>
                      <td data-label="Client">
                        <div className="customer-service-name-cell">
                          <strong>{getClientName(order)}</strong>
                          <span>{clientId ? `Client #${clientId}` : "No client id"}</span>
                        </div>
                      </td>
                      <td data-label="Contact">{getClientContact(order)}</td>
                      <td data-label="Unit">
                        <div className="customer-service-name-cell">
                          <strong>{getUnitLabel(order)}</strong>
                          <span>{formatStatus(getUnitType(order))}</span>
                        </div>
                      </td>
                      <td data-label="Unit Details">{getUnitMeta(order)}</td>
                      <td data-label="Price">{getUnitPrice(order)}</td>
                      <td data-label="Status">
                        <span className={`customer-service-pill ${status}`}>
                          {formatStatus(status)}
                        </span>
                      </td>
                      <td data-label="Updated">{getUpdatedAt(order)}</td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => openClientOrders(order)}
                          disabled={!clientId}
                          title="View client orders"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    {message || "No orders found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={detailsOpen}
        onClose={closeDetails}
        title="Client order history"
        description={
          selectedOrder
            ? `${getClientName(selectedOrder)} - Client #${getClientId(selectedOrder) || "-"}`
            : ""
        }
        size="lg"
      >
        <div className="customer-service-detail-panel">
          {clientOrders?.loading ? (
            <div className="table-state">Loading client orders...</div>
          ) : clientOrders?.error ? (
            <div className="table-state is-error">{clientOrders.error}</div>
          ) : (
            <>
              <OrdersMiniTable
                title="Unit Orders"
                orders={clientOrders?.unitOrders?.items || []}
                message={clientOrders?.unitOrders?.message}
              />

              <OrdersMiniTable
                title="Service Orders"
                orders={clientOrders?.solutionOrders?.items || []}
                message={clientOrders?.solutionOrders?.message}
              />
            </>
          )}

          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={closeDetails}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
