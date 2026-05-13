import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Trash2,
  CalendarDays,
  Clock3,
  BadgeCheck,
  CircleSlash2,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import StatusBadge from "@/shared/components/StatusBadge";
import Toolbar from "@/shared/components/Toolbar";
import TableCard from "@/shared/components/TableCard";
import Button from "@/shared/components/Button";
import Field from "@/shared/components/Field";
import Modal from "@/shared/components/Modal";
import StatusDropdown from "@/shared/components/StatusDropdown";

import {
  fetchAvailableSlots,
  createAvailableSlot,
  updateAvailableSlot,
  deleteAvailableSlot,
} from "../features/availableSlots/model/availableSlot.thunks";

import "../styles/legal.css";

const STATUS_META = {
  available: {
    label: "متاح",
    type: "ok",
  },
  booked: {
    label: "محجوز",
    type: "busy",
  },
  cancelled: {
    label: "ملغاة",
    type: "off",
  },
};

const STATUS_OPTIONS = [
  {
    value: "available",
    label: "متاح",
    dotClass: "ok",
  },
  {
    value: "booked",
    label: "محجوز",
    dotClass: "busy",
  },
  {
    value: "cancelled",
    label: "ملغاة",
    dotClass: "off",
  },
];

export default function LegalAvailableSlotsPage() {
  const dispatch = useDispatch();

  const {
    items: legalSlots = [],
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.availableSlots || {});

  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    dispatch(fetchAvailableSlots());
  }, [dispatch]);

  const filteredSlots = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return legalSlots.filter((slot) => {
      const statusLabel = STATUS_META[slot.status]?.label || slot.status || "-";

      const searchableText = [
        slot.id,
        slot.employee_id,
        slot.batch_id,
        slot.start_time,
        slot.status,
        statusLabel,
        slot.created_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesStatus = statusFilter === "all" || slot.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [legalSlots, searchTerm, statusFilter]);

  const total = legalSlots.length;
  const available = legalSlots.filter((slot) => slot.status === "available").length;
  const booked = legalSlots.filter((slot) => slot.status === "booked").length;
  const cancelled = legalSlots.filter((slot) => slot.status === "cancelled").length;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      createAvailableSlot({
        start_time: formData.start_time,
        end_time: formData.end_time,
      })
    );

    if (createAvailableSlot.fulfilled.match(result)) {
      setCreateOpen(false);
      setFormData({
        start_time: "",
        end_time: "",
      });
    }
  };

  const handleStatusChange = (id, status) => {
    dispatch(
      updateAvailableSlot({
        id,
        payload: { status },
      })
    );
  };

  const handleDelete = (id) => {
    dispatch(deleteAvailableSlot(id));
  };

  return (
    <div className="legal-page">
      <PageHeader
        kicker="القسم القانوني"
        title="Available Slots"
        subtitle="إدارة المواعيد المتاحة للقسم القانوني مع التحكم بالحالة والوقت."
        action={
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} />
            <span>إضافة Slot</span>
          </button>
        }
      />

      <div className="legal-stats-grid">
        <StatCard
          title="إجمالي السلات"
          value={total}
          note="كل المواعيد"
          icon={CalendarDays}
        />
        <StatCard
          title="المتاح"
          value={available}
          note="جاهز للحجز"
          icon={BadgeCheck}
        />
        <StatCard
          title="محجوز"
          value={booked}
          note="مواعيد ممتلئة"
          icon={Clock3}
        />
        <StatCard
          title="ملغاة"
          value={cancelled}
          note="غير متاحة"
          icon={CircleSlash2}
        />
      </div>

      <Toolbar
  placeholder="ابحث بالوقت أو الحالة..."
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  filterValue={statusFilter}
  onFilterChange={setStatusFilter}
  selectOptions={[
    {
      value: "all",
      label: "كل الحالات",
      dotClass: "",
    },

    {
      value: "available",
      label: "متاح",
      dotClass: "ok",
    },

    {
      value: "booked",
      label: "محجوز",
      dotClass: "busy",
    },

    {
      value: "cancelled",
      label: "ملغاة",
      dotClass: "off",
    },
  ]}
/>

      <TableCard title="جدول السلات" count={filteredSlots.length}>
        {loading ? (
          <div style={{ padding: "16px" }}>جاري التحميل...</div>
        ) : error ? (
          <div style={{ padding: "16px", color: "red" }}>{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>الموظف</th>
                <th>الباتش</th>
                <th>بداية الوقت</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filteredSlots.length > 0 ? (
                filteredSlots.map((slot) => {
                  const meta = STATUS_META[slot.status] || {
                    label: slot.status || "-",
                    type: "off",
                  };

                  return (
                    <tr key={slot.id}>
                      <td>{slot.id}</td>
                      <td>{slot.employee_id ?? "-"}</td>
                      <td>{slot.batch_id ?? "-"}</td>
                      <td>{slot.start_time ?? "-"}</td>
                      <td>
                        <StatusBadge status={meta.label} type={meta.type} />
                      </td>
                      <td>
                        {slot.created_at
                          ? new Date(slot.created_at).toLocaleString("ar-EG")
                          : "-"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <StatusDropdown
                            value={slot.status}
                            options={STATUS_OPTIONS}
                            onChange={(newStatus) =>
                              handleStatusChange(slot.id, newStatus)
                            }
                          />

                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() => handleDelete(slot.id)}
                            title="حذف"
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
                  <td colSpan="7" style={{ padding: "16px", textAlign: "center" }}>
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إضافة Slot"
        description="أدخل وقت البداية ووقت النهاية، ثم احفظ لتُرسل البيانات."
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreate}>
          <div className="modal-grid">
            <Field
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              label="Start Time"
              iconClass="fa-solid fa-clock"
              error=""
            />

            <Field
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              label="End Time"
              iconClass="fa-solid fa-clock"
              error=""
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => setCreateOpen(false)}
              disabled={actionLoading}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}