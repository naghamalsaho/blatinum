import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Tag,
  Percent,
  Plus,
  Eye,
  Edit,
  Sparkles,
  Search,
  CalendarDays,
  Filter,
  ChevronDown,
  Home,
  Building2,
  Maximize2,
  Layers,
  Trash2,
  Briefcase,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

import {
  fetchOffers,
  fetchActiveOffers,
  deleteOffer,
  changeOfferStatus,
  createOffer,
} from "../features/offer/model/offer.thunks";

import { fetchUnits } from "../features/units/model/unit.thunks";
import { fetchServices } from "../features/services/model/service.thunks";

import "../styles/marketing-offers.css";

const STATUS_META = {
  active: { label: "نشط", type: "ok" },
  inactive: { label: "غير نشط", type: "off" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "active", label: "نشط" },
  { id: "inactive", label: "غير نشط" },
];

function isOfferActive(offer) {
  if (typeof offer?.is_active === "boolean") return offer.is_active;
  if (typeof offer?.status === "boolean") return offer.status;
  if (offer?.status === "active" || offer?.status === 1 || offer?.status === "1") return true;
  return false;
}

function getOfferStatusMeta(offer) {
  const active = isOfferActive(offer);
  if (active) return STATUS_META.active;
  if (offer?.status === "scheduled") return STATUS_META.scheduled;
  return STATUS_META.inactive;
}

function formatDate(value) {
  return value ? String(value).split(" ")[0] : "—";
}

function formatPrice(amount) {
  if (!amount && amount !== 0) return "—";
  return Number(amount).toLocaleString("ar-EG") + " ل.س";
}

export default function MarketingOffersPage() {
  const dispatch = useDispatch();
  const statusDropdownRef = useRef(null);

  const [viewMode, setViewMode] = useState("all");

  const offersState = useSelector((state) => state.offers || state.offer);
  const items = offersState?.items || [];
  const loading = offersState?.loading || false;
  const error = offersState?.error || null;

  const offers = items;
  const unitsState = useSelector((state) => state.units);
  const units = unitsState?.units || [];
  const unitsLoading = unitsState?.loading || false;

  const servicesState = useSelector((state) => state.services);
  const services = servicesState?.services || [];
  const servicesLoading = servicesState?.loading || false;

  useEffect(() => {
    dispatch(fetchOffers());
    dispatch(fetchUnits());
    dispatch(fetchServices());
  }, [dispatch]);

  const handleFetchAll = () => {
    setViewMode("all");
    dispatch(fetchOffers());
  };

  const handleFetchActiveOnly = () => {
    setViewMode("active");
    dispatch(fetchActiveOffers());
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    offerable_type: "unit",
    offerable_id: "",
    discount_percentage: "",
    duration_days: "",
    started_at: "",
    status: "1",
  });

  const [formErrors, setFormErrors] = useState({});

  const handleDeleteOffer = (id) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا العرض؟")) {
      dispatch(deleteOffer(id));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    const totalCount = offers.length;
    const activeCount = offers.filter(isOfferActive).length;

    const avgDiscount =
      totalCount > 0
        ? Math.round(
            offers.reduce(
              (sum, item) => sum + Number(item.discount_percentage || 0),
              0
            ) / totalCount
          )
        : 0;

    return [
      { title: "إجمالي العروض", value: String(totalCount), icon: Tag },
      { title: "العروض النشطة", value: String(activeCount), icon: Sparkles },
      { title: "متوسط الخصم", value: `${avgDiscount}%`, icon: Percent },
      { title: "العروض غير النشطة", value: String(totalCount - activeCount), icon: CalendarDays },
    ];
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return offers.filter((offer) => {
      let matchesStatus = true;
      const isActive = isOfferActive(offer);

      if (statusFilter === "active") {
        matchesStatus = isActive;
      } else if (statusFilter === "inactive") {
        matchesStatus = !isActive;
      } else if (statusFilter === "scheduled") {
        matchesStatus = offer.status === "scheduled";
      }

      // البحث يشمل كل من اسم الخدمة ورقم الشقة والوصف والنوع ورقم المبنى
      const searchable = [
        offer.item?.name,
        offer.item?.unit_number,
        offer.item?.description,
        offer.item?.type,
        String(offer.item?.building_id || ""),
        String(offer.discount_percentage || ""),
        offer.start_date,
        offer.end_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [offers, searchTerm, statusFilter]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachment") {
      setFormData((prev) => ({
        ...prev,
        attachmentFile: files?.[0] || null,
      }));
      setFormErrors((prev) => ({ ...prev, attachmentFile: "" }));
      return;
    }

    if (name === "offerable_type") {
      setFormData((prev) => ({
        ...prev,
        offerable_type: value,
        offerable_id: "",
      }));
      setFormErrors((prev) => ({ ...prev, offerable_type: "", offerable_id: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setFormData({
      offerable_type: "unit",
      offerable_id: "",
      discount_percentage: "",
      duration_days: "",
      started_at: "",
      status: "1",
    });
    setFormErrors({});
    setEditingOffer(null);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      unit_number: offer.item?.name || offer.item?.unit_number || "",
      discount_percentage: offer.discount_percentage || "",
      status: isOfferActive(offer) ? "1" : "0",
      start_date: offer.start_date ? offer.start_date.slice(0, 10) : "",
      end_date: offer.end_date ? offer.end_date.slice(0, 10) : "",
      description: offer.item?.description || "",
      attachmentFile: null,
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingOffer) {
      try {
        await dispatch(
          changeOfferStatus({
            id: editingOffer.id,
            status: Number(formData.status),
          })
        ).unwrap();

        setModalOpen(false);
        resetForm();
      } catch {e}
    } else {
      const errors = {};
      if (!formData.offerable_id) errors.offerable_id = "معرف العنصر مطلوب";
      if (!formData.discount_percentage) errors.discount_percentage = "نسبة الخصم مطلوبة";
      if (!formData.duration_days) errors.duration_days = "مدة العرض بالأيام مطلوبة";

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const payload = {
        offerable_type: formData.offerable_type,
        offerable_id: Number(formData.offerable_id),
        discount_percentage: Number(formData.discount_percentage),
        duration_days: Number(formData.duration_days),
      };

      if (formData.started_at) {
        payload.started_at = formData.started_at;
      }

      try {
        await dispatch(createOffer(payload)).unwrap();
        setModalOpen(false);
        resetForm();
      } catch {e}
    }
  };

  const openPreview = (offer) => {
    setPreviewOffer(offer);
    setPreviewOpen(true);
  };

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.id === statusFilter)?.label || "الحالة";

  return (
    <div className="marketing-offers-page" dir="rtl">
      <section className="marketing-offers-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>

      <article className="marketing-panel marketing-panel--full">
        <div className="marketing-panel-head">
          <div>
            <h2>عروض الخصومات</h2>
            <p>إدارة عروض الخصومات المتاحة على العقارات والخدمات</p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="marketing-view-switch-wrapper">
              <button
                type="button"
                onClick={handleFetchAll}
                className={`marketing-toggle-btn ${viewMode === "all" ? "active" : ""}`}
              >
                <Layers size={15} />
                <span>كل العروض</span>
              </button>

              <button
                type="button"
                onClick={handleFetchActiveOnly}
                className={`marketing-toggle-btn ${viewMode === "active" ? "active" : ""}`}
              >
                <Sparkles size={15} />
                <span>العروض النشطة فقط</span>
              </button>
            </div>

            <Button
              type="button"
              className="marketing-secondary-btn"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              <span>عرض جديد</span>
            </Button>
          </div>
        </div>

        <div className="marketing-offers-toolbar">
          <div className="marketing-search-wrapper">
            <div className="marketing-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث باسم الخدمة، رقم الشقة، المبنى، أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="marketing-status-dropdown" ref={statusDropdownRef}>
              <button
                type="button"
                className="marketing-status-trigger"
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
              >
                <Filter size={16} />
                <span>{currentStatusLabel}</span>
                <ChevronDown
                  size={15}
                  className={`status-arrow ${statusDropdownOpen ? "open" : ""}`}
                />
              </button>

              {statusDropdownOpen && (
                <div className="marketing-status-menu">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`status-menu-item ${
                        statusFilter === opt.id ? "active" : ""
                      }`}
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setStatusDropdownOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="project-empty-state">جاري تحميل العروض...</div>
        ) : error ? (
          <div className="project-empty-state">
            {typeof error === "string" ? error : "حدث خطأ أثناء جلب البيانات"}
          </div>
        ) : (
          <div className="marketing-offers-table-wrap">
            <table className="marketing-offers-table">
              <thead>
                <tr>
                  <th>العنصر </th>
                  <th>  التفاصيل</th>
                  <th>السعر قبل الخصم</th>
                  <th>السعر بعد الخصم</th>
                  <th>نسبة الخصم</th>
                  <th>تاريخ البداية</th>
                  <th>تاريخ النهاية</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="project-empty-state">
                        لا توجد عروض مطابقة لخيارات البحث
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((item) => {
                    const meta = getOfferStatusMeta(item);
                    const isService = !!item.item?.name;

                    return (
                      <tr key={item.id}>
                        <td className="marketing-primary-td">
                          <div className="marketing-ad-title-cell">
                            <div className="marketing-ad-thumb-placeholder">
                              {isService ? <Briefcase size={16} /> : <Home size={16} />}
                            </div>
                            <span className="marketing-ad-title" title={item.item?.name || item.item?.unit_number}>
                              {isService ? item.item?.name : item.item?.unit_number ? `شقة ${item.item.unit_number}` : "-"}
                            </span>
                          </div>
                        </td>

                        <td>
                          {isService
                            ? "خدمة"
                            : item.item?.building_id
                            ? `مبنى ${item.item.building_id}`
                            : "—"}
                        </td>

                        <td style={{ textDecoration: "line-through", color: "var(--dash-muted)" }}>
                          {formatPrice(item.old_price)}
                        </td>

                        <td style={{ fontWeight: "700", color: "var(--dash-accent)" }}>
                          {formatPrice(item.new_price)}
                        </td>

                        <td className="marketing-metric">
                          <span style={{ color: "var(--dash-accent)", fontWeight: "bold" }}>
                            {item.discount_percentage}%
                          </span>
                        </td>

                        <td className="marketing-date">{formatDate(item.start_date)}</td>
                        <td className="marketing-date">{formatDate(item.end_date)}</td>

                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>

                        <td>
                          <div className="marketing-row-actions">
                            <button
                              type="button"
                              className="marketing-icon-btn"
                              onClick={() => openPreview(item)}
                              title="عرض التفاصيل"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              className="marketing-icon-btn"
                              onClick={() => openEditModal(item)}
                              title="تعديل العرض"
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              type="button"
                              className="marketing-icon-btn danger"
                              onClick={() => handleDeleteOffer(item.id)}
                              title="حذف العرض"
                            >
                              <Trash2 size={14} />
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
      </article>

      {/* Modal - إضافة / تعديل */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingOffer ? "تعديل حالة العرض" : "إضافة عرض جديد"}
        size={editingOffer ? "sm" : "lg"}
      >
        <form className="marketing-modal-form" onSubmit={handleSubmit}>
          {editingOffer ? (
            <div className="marketing-modal-grid marketing-modal-grid--single">
              <div className="custom-form-group">
                <label>
                  حالة العرض <span className="required-dot">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="1">نشط</option>
                  <option value="0">غير نشط</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="marketing-modal-grid">
                <div className="custom-form-group">
                  <label>
                    نوع العرض <span className="required-dot">*</span>
                  </label>
                  <select
                    name="offerable_type"
                    value={formData.offerable_type}
                    onChange={handleChange}
                  >
                    <option value="unit">شقة / وحدة سكنية (Unit)</option>
                    <option value="solution">خدمة / حلول (Solution)</option>
                  </select>
                </div>

                <div className="custom-form-group">
                  <label>
                    اختر{" "}
                    {formData.offerable_type === "unit" ? "الشقة" : "الخدمة"}{" "}
                    <span className="required-dot">*</span>
                  </label>

                  <select
                    name="offerable_id"
                    value={formData.offerable_id}
                    onChange={handleChange}
                    disabled={
                      formData.offerable_type === "unit"
                        ? unitsLoading
                        : servicesLoading
                    }
                  >
                    <option value="">
                      {formData.offerable_type === "unit"
                        ? unitsLoading
                          ? "جاري تحميل الشقق..."
                          : "-- اختر شقة --"
                        : servicesLoading
                        ? "جاري تحميل الخدمات..."
                        : "-- اختر خدمة --"}
                    </option>

                    {formData.offerable_type === "unit"
                      ? units.map((u) => (
                          <option key={u.id} value={u.id}>
                            شقة رقم {u.unit_number || u.id}{" "}
                            {u.building_id ? `(مبنى ${u.building_id})` : ""}
                          </option>
                        ))
                      : services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.price ? `(${s.price} ل.س)` : ""}
                          </option>
                        ))}
                  </select>

                  <ErrorMessage message={formErrors.offerable_id} />
                </div>
              </div>

              <div className="marketing-modal-grid">
                <div className="custom-form-group">
                  <label>
                    نسبة الخصم (%) <span className="required-dot">*</span>
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    placeholder="مثال: 25"
                  />
                  <ErrorMessage message={formErrors.discount_percentage} />
                </div>

                <div className="custom-form-group">
                  <label>
                    مدة العرض (بالأيام) <span className="required-dot">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    placeholder="مثال: 3"
                  />
                  <ErrorMessage message={formErrors.duration_days} />
                </div>
              </div>

              <div className="marketing-modal-grid marketing-modal-grid--single">
                <div className="custom-form-group">
                  <label>تاريخ بداية العرض (اختياري - افتراضياً اليوم)</label>
                  <input
                    type="date"
                    name="started_at"
                    value={formData.started_at}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          <div className="marketing-modal-actions">
            <button
              type="submit"
              className="btn-save-primary"
              disabled={loading}
            >
              <span>
                {loading
                  ? "جاري الحفظ..."
                  : editingOffer
                  ? "حفظ الحالة"
                  : "+ حفظ العرض"}
              </span>
            </button>

            <button
              type="button"
              className="btn-cancel-secondary"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal - معاينة العرض */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          previewOffer?.item?.name
            ? `معاينة الخدمة (${previewOffer.item.name})`
            : previewOffer?.item?.unit_number
            ? `معاينة الوحدة (${previewOffer.item.unit_number})`
            : "معاينة العرض"
        }
        size="lg"
      >
        <div
          className="marketing-offers-summary-card"
          style={{ maxWidth: "100%" }}
        >
          <div className="marketing-offers-summary-head">
            <div>
              <p>{previewOffer?.item?.name ? "تفاصيل عرض الخدمة" : "تفاصيل العرض العقاري"}</p>
              <h3>
                {previewOffer?.item?.name
                  ? previewOffer.item.name
                  : `الوحدة السكنية: ${previewOffer?.item?.unit_number || "-"}`}
              </h3>
            </div>
            <div className="marketing-summary-icon">
              {previewOffer?.item?.name ? <Briefcase size={22} /> : <Home size={22} />}
            </div>
          </div>

          {/* معاينة خصائص الوحدة في حال لم تكن خدمة */}
          {!previewOffer?.item?.name && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", margin: "10px 0" }}>
              <div>
                <Building2 size={13} /> رقم المبنى:{" "}
                <strong style={{ fontSize: "14px" }}>
                  {previewOffer?.item?.building_id ? `${previewOffer.item.building_id}` : "—"}
                </strong>
              </div>

              <div>
                <Maximize2 size={13} /> المساحة:{" "}
                <strong style={{ fontSize: "14px" }}>
                  {previewOffer?.item?.area ? `${previewOffer.item.area} م²` : "—"}
                </strong>
              </div>

              <div>
                <Layers size={13} /> الطابق:{" "}
                <strong style={{ fontSize: "14px" }}>{previewOffer?.item?.floor ?? "—"}</strong>
              </div>

              <div>
                <Home size={13} /> عدد الغرف:{" "}
                <strong style={{ fontSize: "14px" }}>{previewOffer?.item?.rooms_count ?? "—"}</strong>
              </div>
            </div>
          )}

          <p style={{ color: "var(--dash-muted)", fontSize: "13px", lineHeight: "1.6", margin: "10px 0" }}>
            {previewOffer?.item?.description || "لا يوجد وصف تفصيلي."}
          </p>

          <div
            className="marketing-offers-summary-metrics"
            style={{ marginTop: "15px" }}
          >
            <div>
              <strong>السعر الأصلي</strong>
              {formatPrice(previewOffer?.old_price)}
            </div>

            <div>
              <strong>السعر بعد الخصم</strong>
              {formatPrice(previewOffer?.new_price)}
            </div>

            <div>
              <strong>نسبة الخصم</strong>
              <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                {previewOffer?.discount_percentage || 0}%
              </span>
            </div>

            <div>
              <strong>تاريخ البداية</strong>
              <span>{formatDate(previewOffer?.start_date)}</span>
            </div>

            <div>
              <strong>تاريخ النهاية</strong>
              <span>{formatDate(previewOffer?.end_date)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}