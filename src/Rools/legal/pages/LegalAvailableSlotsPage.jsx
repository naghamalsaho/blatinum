import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  Clock3,
  BadgeCheck,
  Search,
  User,
  BookmarkCheck,
  SlidersHorizontal,
  ChevronDown,
  Eye,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";
import StatusBadge from "@/shared/components/StatusBadge";
import { t } from "../../../shared/i18n";

import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
  fetchAppointments,
  fetchDepartmentOrders,
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

function getCustomerName(item) {
  return (
    item?.client?.account?.full_name ||
    item?.client?.full_name ||
    item?.user?.full_name ||
    item?.order?.user?.full_name ||
    item?.order?.client?.full_name ||
    "—"
  );
}

export default function LegalAvailableSlotsPage() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("slots");

  const STATUS_META = useMemo(
    () => ({
      available: { label: t("legal_slots.status_available"), type: "ok" },
      booked: { label: t("legal_slots.status_booked"), type: "busy" },
      cancelled: { label: t("legal_slots.status_cancelled"), type: "off" },
      pending: { label: "قيد الانتظار", type: "busy" },
      initially_accepted: { label: "مقبول مبدئياً", type: "ok" },
      accepted: { label: "مقبول", type: "ok" },
      rejected: { label: "مرفوض", type: "off" },
    }),
    []
  );

  // 🎯 قراءة حالة Redux مفصولة
  const availableSlotsSlice = useSelector((state) => state.availableSlots || {});

  // جلب الفترات المتاحة
  const legalSlots = useMemo(() => {
    const slotsData = availableSlotsSlice.slots || availableSlotsSlice;
    if (Array.isArray(slotsData.items)) return slotsData.items;
    if (Array.isArray(slotsData)) return slotsData;
    return [];
  }, [availableSlotsSlice]);

  const loadingSlots = availableSlotsSlice.slots?.loading ?? false;
  const errorSlots = availableSlotsSlice.slots?.error ?? null;
  const actionLoading = availableSlotsSlice.actionLoading || false;

  // جلب الحجوزات
  const appointments = useMemo(() => {
    const appData = availableSlotsSlice.appointments;
    if (Array.isArray(appData?.items)) return appData.items;
    if (Array.isArray(appData)) return appData;
    return [];
  }, [availableSlotsSlice]);

  const loadingAppointments = availableSlotsSlice.appointments?.loading ?? false;
  const errorAppointments = availableSlotsSlice.appointments?.error ?? null;

  const [departmentOrders, setDepartmentOrders] = useState([]);
  const [loadingDepartmentOrders, setLoadingDepartmentOrders] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });

  const [editStatusModal, setEditStatusModal] = useState({
    isOpen: false,
    slotId: null,
    status: "available",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setStatusFilter("all");
    setSearchTerm("");
  };

  useEffect(() => {
    let isMounted = true;

    dispatch(fetchAvailableSlots());
    dispatch(fetchAppointments());

    dispatch(fetchDepartmentOrders(2))
      .then((action) => {
        if (isMounted && fetchDepartmentOrders.fulfilled.match(action)) {
          setDepartmentOrders(action.payload || []);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDepartmentOrders(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const filteredSlots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return legalSlots.filter((slot) => {
      const statusLabel = STATUS_META[slot.status]?.label || slot.status || "—";

      const searchableText = [
        slot.id,
        slot.date,
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
      const matchesStatus = statusFilter === "all" || slot.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [legalSlots, searchTerm, statusFilter, STATUS_META]);

  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return appointments.filter((item) => {
      const customerName = getCustomerName(item);

      const searchableText = [
        item.id,
        item.type,
        item.status,
        customerName,
        item.order?.id,
        item.order?.type,
        item.order?.status,
        item.slot?.date,
        item.slot?.start_time,
        item.slot?.batch_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const total = legalSlots.length;
  const available = legalSlots.filter((slot) => slot.status === "available").length;
  const booked = legalSlots.filter((slot) => slot.status === "booked").length;
  const totalAppointments = appointments.length;

  const stats = useMemo(() => {
    return [
      {
        title: t("legal_slots.total_slots"),
        value: String(total),
        icon: CalendarDays,
      },
      {
        title: t("legal_slots.available_slots"),
        value: String(available),
        icon: BadgeCheck,
      },
      {
        title: t("legal_slots.booked_slots"),
        value: String(booked),
        icon: Clock3,
      },
      {
        title: "إجمالي الحجوزات",
        value: String(totalAppointments),
        icon: BookmarkCheck,
      },
    ];
  }, [total, available, booked, totalAppointments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createAvailableSlot(formData));

    if (createAvailableSlot.fulfilled.match(result)) {
      setCreateOpen(false);
      setFormData({ date: "", start_time: "", end_time: "" });
      dispatch(fetchAvailableSlots());
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
      dispatch(fetchAvailableSlots());
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm(t("legal_slots.confirm_delete"));
    if (!ok) return;
    const res = await dispatch(deleteAvailableSlot(id));
    if (deleteAvailableSlot.fulfilled.match(res)) {
      dispatch(fetchAvailableSlots());
    }
  };

  return (
    <div className="legal-slots-page" dir="rtl">
      {/* شبكة الإحصائيات */}
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

      {/* تبويب الانتقال السريع */}
      <div className="legal-slots-tabs-bar">
        <button
          type="button"
          className={`legal-tab-btn ${activeTab === "slots" ? "active" : ""}`}
          onClick={() => handleTabChange("slots")}
        >
          الفترات المتاحة ({legalSlots.length})
        </button>
        <button
          type="button"
          className={`legal-tab-btn ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => handleTabChange("appointments")}
        >
          جدول الحجوزات ({appointments.length})
        </button>
      </div>

      {/* شريط الأدوات */}
      <div className="exact-toolbar-card" dir="rtl">
        {activeTab === "slots" && (
          <button
            type="button"
            className="exact-primary-btn"
            onClick={() => {
              setFormData({ date: "", start_time: "", end_time: "" });
              setCreateOpen(true);
            }}
          >
            <Plus size={18} />
            <span>{t("legal_slots.add_slot")}</span>
          </button>
        )}

        <div className="exact-select-wrapper">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("legal_slots.status_all")}</option>
            {activeTab === "slots" ? (
              <>
                <option value="available">{t("legal_slots.status_available")}</option>
                <option value="booked">{t("legal_slots.status_booked")}</option>
                <option value="cancelled">{t("legal_slots.status_cancelled")}</option>
              </>
            ) : (
              <>
                <option value="pending">قيد الانتظار (pending)</option>
                <option value="initially_accepted">مقبول مبدئياً (initially_accepted)</option>
                <option value="accepted">مقبول (accepted)</option>
                <option value="rejected">مرفوض (rejected)</option>
              </>
            )}
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
            placeholder={t("legal_slots.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* جدول الفترات المتاحة */}
      {activeTab === "slots" && (
        <TableCard title={t("legal_slots.title")} count={filteredSlots.length}>
          {loadingSlots ? (
            <div className="table-state">{t("legal_slots.loading_slots")}</div>
          ) : errorSlots ? (
            <div className="table-state is-error">{errorSlots}</div>
          ) : (
            <div className="table-scroll">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>{t("legal_slots.id")}</th>
                    <th>{t("legal_slots.employee_name")}</th>
                    <th>{t("legal_slots.employee_id")}</th>
                    <th>{t("legal_slots.employee_email")}</th>
                    <th>{t("legal_slots.employee_phone")}</th>
                    <th>{t("legal_slots.batch_id")}</th>
                    <th>التاريخ</th>
                    <th>{t("legal_slots.time")}</th>
                    <th>{t("legal_slots.status")}</th>
                    <th>{t("legal_slots.created_at")}</th>
                    <th>{t("legal_slots.actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSlots.length > 0 ? (
                    filteredSlots.map((slot) => {
                      const meta = STATUS_META[slot.status] || {
                        label: slot.status || "—",
                        type: "off",
                      };

                      return (
                        <tr key={slot.id}>
                          <td><strong>#{slot.id}</strong></td>
                          <td>
                            <div className="services-item-cell">
                              <div className="services-thumb-placeholder">
                                <User size={16} />
                              </div>
                              <div className="services-item-info">
                                <strong>{getEmployeeName(slot)}</strong>
                              </div>
                            </div>
                          </td>
                          <td>{getEmployeeId(slot)}</td>
                          <td>{getEmployeeEmail(slot)}</td>
                          <td>{getEmployeePhone(slot)}</td>
                          <td>{slot.batch_id ?? "—"}</td>
                          <td>{slot.date ?? "—"}</td>
                          <td>
                            <span className="services-price">
                              {slot.start_time ?? "—"}{" "}
                              {slot.end_time
                                ? ` ${t("legal_slots.to")} ${slot.end_time}`
                                : ""}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={meta.label} type={meta.type} />
                          </td>
                          <td className="services-date">
                            {slot.created_at
                              ? new Date(slot.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-action-btn"
                                onClick={() => handleOpenEditStatus(slot)}
                                title={t("legal_slots.edit_status")}
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-action-btn danger"
                                onClick={() => handleDelete(slot.id)}
                                title={t("legal_slots.delete_slot")}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="empty-cell">
                        {t("legal_slots.no_matching_slots")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      )}

      {/* جدول الحجوزات */}
      {activeTab === "appointments" && (
        <TableCard title="جدول الحجوزات" count={filteredAppointments.length}>
          {loadingAppointments || loadingDepartmentOrders ? (
            <div className="table-state">جاري تحميل البيانات...</div>
          ) : errorAppointments ? (
            <div className="table-state is-error">{errorAppointments}</div>
          ) : (
            <div className="table-scroll">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>رقم الحجز</th>
                    <th>اسم الزبون</th>
                    <th>نوع الحجز</th>
                    <th>حالة الطلب</th>
                    <th>تاريخ الفترة (Slot Date)</th>
                    <th>وقت البداية</th>
                    <th>حالة الحجز</th>
                    <th>تاريخ الإنشاء</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((item) => {
                      const meta = STATUS_META[item.status] || {
                        label: item.status || "—",
                        type: "busy",
                      };

                      const customerName = getCustomerName(item);

                      const matchingOrder =
                        departmentOrders.find(
                          (ord) =>
                            ord.id === item.order_id ||
                            ord.id === item.order?.id ||
                            ord.id === item.id
                        ) || item.order;

                      return (
                        <tr key={item.id}>
                          <td><strong>#{item.id}</strong></td>
                          <td>
                            <div className="services-item-cell">
                              <div className="services-thumb-placeholder">
                                <User size={16} />
                              </div>
                              <div className="services-item-info">
                                <strong>{customerName}</strong>
                              </div>
                            </div>
                          </td>
                          <td style={{ textTransform: "capitalize" }}>
                            {item.type || matchingOrder?.type || "—"}
                          </td>
                          <td>{matchingOrder?.status || item.order?.status || "—"}</td>
                          <td>{item.slot?.date || "—"}</td>
                          <td>
                            <span className="services-price">
                              {item.slot?.start_time || "—"}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={meta.label} type={meta.type} />
                          </td>
                          <td className="services-date">
                            {item.created_at || "—"}
                          </td>
                          <td>
                            <div className="row-actions">
                              {matchingOrder ? (
                                <button
                                  type="button"
                                  className="icon-action-btn"
                                  onClick={() => setSelectedOrderDetails(matchingOrder)}
                                  title="عرض تفاصيل الطلب"
                                >
                                  <Eye size={16} />
                                </button>
                              ) : (
                                <span style={{ color: "#9ca3af" }}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="empty-cell">
                        لا توجد حجوزات مطابقة للبحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      )}

      {/* نافذة تفاصيل الطلب */}
      <Modal
        open={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        title={`تفاصيل الطلب #${selectedOrderDetails?.id || ""}`}
        size="md"
      >
        {selectedOrderDetails && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>حالة الطلب:</span>
              <StatusBadge
                status={STATUS_META[selectedOrderDetails.status]?.label || selectedOrderDetails.status}
                type={STATUS_META[selectedOrderDetails.status]?.type || "ok"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>نوع الطلب:</span>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{selectedOrderDetails.type || "—"}</div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>تاريخ الإنشاء:</span>
                <div style={{ fontWeight: 600 }}>{selectedOrderDetails.created_at || "—"}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <Button
                type="button"
                className="ghost-filter-btn"
                onClick={() => setSelectedOrderDetails(null)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* مودال إضافة فترة جديدة */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("legal_slots.add_new_slot")}
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreate}>
          <Field
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            label="التاريخ (Date)"
            required
          />

          <div className="modal-grid">
            <Field
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              label={t("legal_slots.start_time")}
              required
            />

            <Field
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              label={t("legal_slots.end_time")}
              required
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => setCreateOpen(false)}
              disabled={actionLoading}
            >
              {t("cancel")}
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={actionLoading}
            >
              <Plus size={16} />
              <span>
                {actionLoading ? t("saving") : t("legal_slots.save_slot")}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال تعديل حالة الفترة */}
      <Modal
        open={editStatusModal.isOpen}
        onClose={() =>
          setEditStatusModal({
            isOpen: false,
            slotId: null,
            status: "available",
          })
        }
        title={t("legal_slots.edit_slot_status")}
        size="md"
      >
        <form className="modal-form" onSubmit={handleSaveStatus}>
          <div className="field-group">
            <label className="field-label">{t("legal_slots.new_status")}</label>
            <div className="exact-select-wrapper" style={{ width: "100%" }}>
              <select
                style={{ width: "100%" }}
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
              <ChevronDown size={16} className="exact-select-chevron" />
            </div>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() =>
                setEditStatusModal({
                  isOpen: false,
                  slotId: null,
                  status: "available",
                })
              }
              disabled={actionLoading}
            >
              {t("cancel")}
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={actionLoading}
            >
              <Pencil size={16} />
              <span>{actionLoading ? t("saving") : t("save_changes")}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}