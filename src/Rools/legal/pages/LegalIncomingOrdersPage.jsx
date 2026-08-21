import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2, ClipboardList, Clock3, Eye, MessageSquarePlus, Scale } from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import {
  addCustomerServiceOrderNoteRequest,
  changeCustomerServiceOrderStatusRequest,
  getCustomerServiceOrderRequest,
  getDepartmentOrdersRequest,
  transferCustomerServiceOrderRequest,
} from "@/Rools/customerService/features/orders/api/order.api";
import { formatStatus } from "@/Rools/customerService/constants/customerServiceData";
import { useToast } from "@/shared/toast/ToastProvider";
import "../styles/legal.css";

const LEGAL_DEPARTMENT_ID = 5;
const FINANCE_DEPARTMENT_ID = 4;
const TERMINAL = new Set(["accepted", "approved", "completed", "done", "closed", "rejected", "cancelled", "canceled"]);
const FILTERS = ["all", "pending", "initially_accepted", "accepted", "rejected"].map((value) => ({ value, label: formatStatus(value) }));

const listFrom = (payload) => {
  for (const value of [payload, payload?.data, payload?.data?.data]) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.orders)) return value.orders;
    if (Array.isArray(value?.items)) return value.items;
  }
  return [];
};

const read = (item, paths, fallback = "-") => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const idOf = (order) => read(order, ["id", "order_id"]);
const statusOf = (order) => String(read(order, ["status"], "pending")).toLowerCase();
const clientOf = (order) => read(order, ["client.account.full_name", "client.full_name", "client.name"]);
const typeOf = (order) => read(order, ["type"], order?.unit ? "unit" : "solution");
const itemOf = (order) => read(order, ["unit.unit_number", "unit.name", "solution.title", "solution.name", "service.title", "service.name"]);
const updatedOf = (order) => read(order, ["updated_at", "created_at"]);
const notesOf = (order) => {
  const value = read(order, ["notes", "order_notes", "note"], []);
  return Array.isArray(value) ? value : value && value !== "-" ? [value] : [];
};
const textOfNote = (note) => typeof note === "string" ? note : read(note, ["note", "content", "text", "message"]);
const nextStatuses = (order) => ({ pending: ["initially_accepted", "rejected"], initially_accepted: ["accepted", "rejected"] })[statusOf(order)] || [];

export default function LegalIncomingOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    const result = await getDepartmentOrdersRequest(LEGAL_DEPARTMENT_ID);
    if (result.ok) { setOrders(listFrom(result.data)); setError(""); }
    else setError(result.message || "Failed to load incoming legal orders.");
    setLoading(false);
  };

  const loadDetail = async (id) => {
    setDetailLoading(true);
    const result = await getCustomerServiceOrderRequest(id);
    if (result.ok) {
      const detail = result.data?.data || result.data;
      setSelected(detail);
      setNextStatus(nextStatuses(detail)[0] || "");
    } else toast.error(result.message || "Failed to load order details.");
    setDetailLoading(false);
  };

  useEffect(() => {
    // Initial API synchronization for this route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, []);

  const openOrder = async (order) => {
    setSelected(order); setModalOpen(true); setNote(""); setNextStatus(nextStatuses(order)[0] || "");
    await loadDetail(idOf(order));
  };

  const refreshAll = async (id) => Promise.all([loadOrders(), loadDetail(id)]);

  const runAction = async (kind) => {
    const id = idOf(selected);
    if (!id || id === "-" || actionLoading || (kind === "note" && !note.trim())) return;
    if (kind === "status" && !nextStatuses(selected).includes(nextStatus)) return;
    setActionLoading(true);
    let result;
    if (kind === "note") result = await addCustomerServiceOrderNoteRequest(id, note.trim());
    if (kind === "status") result = await changeCustomerServiceOrderStatusRequest(id, nextStatus);
    if (kind === "transfer") result = await transferCustomerServiceOrderRequest(id, {
      departmentId: FINANCE_DEPARTMENT_ID,
      status: statusOf(selected) === "pending" ? "initially_accepted" : statusOf(selected),
      note: note.trim() || "Transferred by Legal to Finance",
    });

    if (result?.ok) {
      toast.success(kind === "note" ? "Note added successfully." : kind === "status" ? "Order status updated successfully." : "Order transferred successfully.");
      setNote("");
      if (kind === "transfer") { await refreshAll(id); setModalOpen(false); }
      else await refreshAll(id);
    } else toast.error(result?.message || "The order action failed.");
    setActionLoading(false);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matches = filter === "all" || statusOf(order) === filter;
      const text = [idOf(order), clientOf(order), typeOf(order), itemOf(order), statusOf(order), updatedOf(order)].join(" ").toLowerCase();
      return matches && (!query || text.includes(query));
    });
  }, [filter, orders, search]);

  return (
    <div className="legal-page legal-incoming-orders-page">
      <section className="legal-stats-grid">
        <StatCard title="Incoming Orders" value={orders.length} note="Assigned to Legal" icon={ClipboardList} />
        <StatCard title="Pending" value={orders.filter((order) => statusOf(order) === "pending").length} note="Awaiting review" icon={Clock3} />
        <StatCard title="In Progress" value={orders.filter((order) => statusOf(order) === "initially_accepted").length} note="Initially accepted" icon={Scale} />
        <StatCard title="Closed" value={orders.filter((order) => TERMINAL.has(statusOf(order))).length} note="Final decisions" icon={CheckCircle2} />
      </section>
      <Toolbar placeholder="Search legal incoming orders..." searchValue={search} onSearchChange={setSearch} filterValue={filter} onFilterChange={setFilter} selectOptions={FILTERS} />
      <TableCard title="Legal Incoming Orders" count={filtered.length}>
        {loading ? <div className="table-state">Loading incoming orders...</div> : error ? <div className="table-state is-error">{error}</div> : !filtered.length ? <div className="table-state">No incoming legal orders found.</div> : (
          <table className="legal-table legal-incoming-orders-table">
            <thead><tr><th>Order ID</th><th>Client</th><th>Type</th><th>Unit / Solution</th><th>Status</th><th>Updated At</th><th>Notes</th><th>Action</th></tr></thead>
            <tbody>{filtered.map((order) => <tr key={idOf(order)}>
              <td>#{idOf(order)}</td><td>{clientOf(order)}</td><td>{formatStatus(typeOf(order))}</td><td>{itemOf(order)}</td>
              <td><span className={`legal-order-status is-${statusOf(order)}`}>{formatStatus(statusOf(order))}</span></td><td>{updatedOf(order)}</td><td>{notesOf(order).length}</td>
              <td><Button type="button" className="primary-action-btn" onClick={() => openOrder(order)}><Eye size={16} /> View / Process</Button></td>
            </tr>)}</tbody>
          </table>
        )}
      </TableCard>

      <Modal open={modalOpen} onClose={() => !actionLoading && setModalOpen(false)} title={`Process Order #${selected ? idOf(selected) : ""}`} description="Review and process the incoming legal order." size="lg">
        {detailLoading ? <div className="table-state">Loading order details...</div> : selected ? <div className="legal-order-process">
          <div className="legal-order-detail-grid">
            <div><span>Client</span><strong>{clientOf(selected)}</strong></div><div><span>Type</span><strong>{formatStatus(typeOf(selected))}</strong></div>
            <div><span>Unit / Solution</span><strong>{itemOf(selected)}</strong></div><div><span>Status</span><strong>{formatStatus(statusOf(selected))}</strong></div>
            <div><span>Updated At</span><strong>{updatedOf(selected)}</strong></div><div><span>Department</span><strong>{read(selected, ["department.name"], "Legal")}</strong></div>
          </div>
          <section><h3>Notes</h3>{notesOf(selected).length ? <div className="legal-order-notes">{notesOf(selected).map((item, index) => <p key={item?.id || index}>{textOfNote(item)}</p>)}</div> : <p className="legal-order-empty">No notes yet.</p>}</section>
          <section><h3>Add Note</h3><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Write an internal legal note..." disabled={actionLoading} /><Button type="button" className="primary-action-btn" disabled={actionLoading || !note.trim()} onClick={() => runAction("note")}><MessageSquarePlus size={16} />{actionLoading ? "Saving..." : "Add Note"}</Button></section>
          {nextStatuses(selected).length ? <section><h3>Change Status</h3><div className="legal-order-status-actions">{nextStatuses(selected).map((status) => <button type="button" key={status} className={nextStatus === status ? "is-selected" : ""} onClick={() => setNextStatus(status)} disabled={actionLoading}>{formatStatus(status)}</button>)}</div><Button type="button" className="primary-action-btn" disabled={actionLoading || !nextStatus} onClick={() => runAction("status")}>{actionLoading ? "Saving..." : "Apply Status"}</Button></section> : null}
          <section className="legal-order-transfer"><div><h3>Transfer Order</h3><p>Send this order to Finance & Accounting.</p></div><Button type="button" className="primary-action-btn" disabled={actionLoading} onClick={() => runAction("transfer")}><ArrowRightLeft size={16} /> Transfer to Finance</Button></section>
        </div> : null}
      </Modal>
    </div>
  );
}
