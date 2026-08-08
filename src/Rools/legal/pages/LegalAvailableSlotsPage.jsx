import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  Clock3,
  BadgeCheck,
  CircleSlash2,
  Search,
  X,
  User,
  Filter,
} from "lucide-react";

import StatusBadge from "@/shared/components/StatusBadge";
import { t } from "../../../shared/i18n";

import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
} from "../features/availableSlots/model/availableSlot.thunks";

import "../styles/legal-available-slots.css";

function getEmployeeName(slot) {
  return slot?.employee?.account?.full_name || "—";
}

function getEmployeeEmail(slot) {
  return slot?.employee?.account?.email || "—";
}

function getEmployeePhone(slot) {
  return slot?.employee?.account?.phone || "—";
}

function getEmployeeId(slot) {
  return slot?.employee?.additional_info?.employee_id ?? "—";
}

export default function LegalAvailableSlotsPage() {
  const dispatch = useDispatch();

  const STATUS_META = useMemo(() => ({
    available: { label: t("legal_slots.status_available"), type: "ok" },
    booked: { label: t("legal_slots.status_booked"), type: "busy" },
    cancelled: { label: t("legal_slots.status_cancelled"), type: "off" },
  }), []);

  const {
    items: legalSlots = [],
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.availableSlots || {});

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ start_time: "", end_time: "" });

  const [editStatusModal, setEditStatusModal] = useState({
    isOpen: false,
    slotId: null,
    status: "available",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchAvailableSlots());
  }, [dispatch]);

  const filteredSlots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return legalSlots.filter((slot) => {
      const statusLabel = STATUS_META[slot.status]?.label || slot.status || "—";

      const searchableText = [
        slot.id,
        slot.start_time,
        slot.end_time,
        slot.batch_id,
        slot.status,
        statusLabel,
        slot.created_at,
        getEmployeeId(slot),
        getEmployeeName(slot),
        getEmployeeEmail(slot),
        getEmployeePhone(slot),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesStatus =
        statusFilter === "all" || slot.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [legalSlots, searchTerm, statusFilter, STATUS_META]);

  const total = legalSlots.length;
  const available = legalSlots.filter((slot) => slot.status === "available").length;
  const booked = legalSlots.filter((slot) => slot.status === "booked").length;
  const cancelled = legalSlots.filter((slot) => slot.status === "cancelled").length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createAvailableSlot(formData));

    if (createAvailableSlot.fulfilled.match(result)) {
      setCreateOpen(false);
      setFormData({ start_time: "", end_time: "" });
    }
  };

  const handleOpenEditStatus = (slot) => {
    setEditStatusModal({
      isOpen: true,
      slotId: slot.id,
      status: slot.status || "available",
    });
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editStatusModal.slotId) return;

    const result = await dispatch(
      updateAvailableSlot({
        id: editStatusModal.slotId,
        payload: { status: editStatusModal.status },
      })
    );

    if (updateAvailableSlot.fulfilled.match(result)) {
      setEditStatusModal({ isOpen: false, slotId: null, status: "available" });
    }
  };

  const handleDelete = (id) => {
    const ok = window.confirm(t("legal_slots.confirm_delete"));
    if (!ok) return;
    dispatch(deleteAvailableSlot(id));
  };

  return (
    <div className="legal-slots-page">
      {/* STATS CARDS */}
      <section className="legal-slots-stats-grid">
        <div className="legal-slots-stat-card">
          <div className="legal-slots-stat-info">
            <p>{t("legal_slots.total_slots")}</p>
            <h3>{total}</h3>
          </div>
          <div className="legal-slots-stat-icon">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="legal-slots-stat-card">
          <div className="legal-slots-stat-info">
            <p>{t("legal_slots.available_slots")}</p>
            <h3>{available}</h3>
          </div>
          <div className="legal-slots-stat-icon">
            <BadgeCheck size={20} />
          </div>
        </div>

        <div className="legal-slots-stat-card">
          <div className="legal-slots-stat-info">
            <p>{t("legal_slots.booked_slots")}</p>
            <h3>{booked}</h3>
          </div>
          <div className="legal-slots-stat-icon">
            <Clock3 size={20} />
          </div>
        </div>

        <div className="legal-slots-stat-card">
          <div className="legal-slots-stat-info">
            <p>{t("legal_slots.cancelled_slots")}</p>
            <h3>{cancelled}</h3>
          </div>
          <div className="legal-slots-stat-icon">
            <CircleSlash2 size={20} />
          </div>
        </div>
      </section>

      {/* MAIN PANEL */}
      <section className="legal-slots-panel">
        <div className="legal-slots-panel-head">
          <div>
            <h2>{t("legal_slots.title")}</h2>
            <p>{t("legal_slots.subtitle")}</p>
            <button
              type="button"
              className="legal-slots-primary-btn"
              onClick={() => {
                setFormData({ start_time: "", end_time: "" });
                setCreateOpen(true);
              }}
            >
              <Plus size={18} />
              <span>{t("legal_slots.add_slot")}</span>
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="legal-slots-toolbar">
          <div className="legal-slots-filter">
            <Filter size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t("legal_slots.status_all")}</option>
              <option value="available">{t("legal_slots.status_available")}</option>
              <option value="booked">{t("legal_slots.status_booked")}</option>
              <option value="cancelled">{t("legal_slots.status_cancelled")}</option>
            </select>
          </div>

          <div className="legal-slots-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={t("legal_slots.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="legal-slots-empty">{t("legal_slots.loading_slots")}</div>
        ) : error ? (
          <div className="legal-slots-error">{error}</div>
        ) : filteredSlots.length === 0 ? (
          <div className="legal-slots-empty">{t("legal_slots.no_matching_slots")}</div>
        ) : (
          <div className="legal-slots-table-wrap">
            <table className="legal-slots-table">
              <thead>
                <tr>
                  <th>{t("legal_slots.id")}</th>
                  <th>{t("legal_slots.employee_name")}</th>
                  <th>{t("legal_slots.employee_id")}</th>
                  <th>{t("legal_slots.employee_email")}</th>
                  <th>{t("legal_slots.employee_phone")}</th>
                  <th>{t("legal_slots.batch_id")}</th>
                  <th>{t("legal_slots.time")}</th>
                  <th>{t("legal_slots.status")}</th>
                  <th>{t("legal_slots.created_at")}</th>
                  <th>{t("legal_slots.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredSlots.map((slot) => {
                  const meta = STATUS_META[slot.status] || {
                    label: slot.status || "—",
                    type: "off",
                  };

                  return (
                    <tr key={slot.id}>
                      <td><strong>#{slot.id}</strong></td>
                      <td>
                        <div className="legal-slots-user-cell">
                          <div className="legal-slots-avatar">
                            <User size={14} />
                          </div>
                          <strong>{getEmployeeName(slot)}</strong>
                        </div>
                      </td>
                      <td>{getEmployeeId(slot)}</td>
                      <td>{getEmployeeEmail(slot)}</td>
                      <td>{getEmployeePhone(slot)}</td>
                      <td>{slot.batch_id ?? "—"}</td>
                      <td>
                        {slot.start_time ?? "—"} {slot.end_time ? ` ${t("legal_slots.to")} ${slot.end_time}` : ""}
                      </td>
                      <td>
                        <StatusBadge status={meta.label} type={meta.type} />
                      </td>
                      <td>
                        {slot.created_at
                          ? new Date(slot.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <div className="actions-group">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleOpenEditStatus(slot)}
                            title={t("legal_slots.edit_status")}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => handleDelete(slot.id)}
                            title={t("legal_slots.delete_slot")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================= MODAL: EDIT STATUS ================= */}
      {editStatusModal.isOpen && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setEditStatusModal({ isOpen: false, slotId: null, status: "available" })
          }
        >
          <div className="modal-card status-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-btn"
              onClick={() =>
                setEditStatusModal({ isOpen: false, slotId: null, status: "available" })
              }
            >
              <X size={18} />
            </button>

            <div className="modal-header">
              <h3>{t("legal_slots.edit_slot_status")}</h3>
            </div>

            <form onSubmit={handleSaveStatus} className="modal-form">
              <div className="form-group">
                <label>{t("legal_slots.new_status")}</label>
                <select
                  className="input-field"
                  value={editStatusModal.status}
                  onChange={(e) =>
                    setEditStatusModal((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="available">{t("legal_slots.option_available")}</option>
                  <option value="booked">{t("legal_slots.option_booked")}</option>
                  <option value="cancelled">{t("legal_slots.option_cancelled")}</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? t("saving") : t("save_changes")}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setEditStatusModal({ isOpen: false, slotId: null, status: "available" })
                  }
                  disabled={actionLoading}
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE SLOT ================= */}
      {createOpen && (
        <div className="modal-backdrop" onClick={() => setCreateOpen(false)}>
          <div className="modal-card status-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-btn"
              onClick={() => setCreateOpen(false)}
            >
              <X size={18} />
            </button>

            <div className="modal-header">
              <h3>{t("legal_slots.add_new_slot")}</h3>
            </div>

            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-group">
                <label>{t("legal_slots.start_time")}</label>
                <input
                  type="time"
                  name="start_time"
                  className="input-field"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t("legal_slots.end_time")}</label>
                <input
                  type="time"
                  name="end_time"
                  className="input-field"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? t("saving") : t("legal_slots.save_slot")}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateOpen(false)}
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}