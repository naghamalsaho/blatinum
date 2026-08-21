import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  PencilLine,
  Trash2,
  Eye,
  Building2,
  Image as ImageIcon,
  Star,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Briefcase,
  Home,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

import {
  fetchOffers,
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

function isOfferActive(offer) {
  if (typeof offer?.is_active === "boolean") return offer.is_active;
  if (typeof offer?.status === "boolean") return offer.status;
  if (offer?.status === "active" || offer?.status === 1 || offer?.status === "1") return true;
  return false;
}

function getOfferStatusMeta(offer) {
  const active = isOfferActive(offer);
  return active ? STATUS_META.active : STATUS_META.inactive;
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

  const offersState = useSelector((state) => state.offers || state.offer || {});
  const offers = offersState?.items || offersState?.offers || [];
  const loading = offersState?.loading || false;
  const error = offersState?.error || null;

  const unitsState = useSelector((state) => state.units || {});
  const units = unitsState?.units || [];
  const unitsLoading = unitsState?.loading || false;

  const servicesState = useSelector((state) => state.services || {});
  const services = servicesState?.services || [];
  const servicesLoading = servicesState?.loading || false;

  useEffect(() => {
    dispatch(fetchOffers());
    dispatch(fetchUnits());
    dispatch(fetchServices());
  }, [dispatch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    offerable_type: "unit",
    offerable_id: "",
    discount_percentage: "",
    duration_days: "",
    started_at: "",
    status: "1",
  });

  const [formErrors, setFormErrors] = useState({});

  // 🔹 شبكة الإحصائيات العلوية باستخدام StatCard الموحد
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
      {
        title: "إجمالي العروض",
        value: String(totalCount),
        icon: Building2,
      },
      {
        title: "العروض النشطة",
        value: String(activeCount),
        icon: ImageIcon,
      },
      {
        title: "متوسط الخصم",
        value: `${avgDiscount}%`,
        icon: Star,
      },
      {
        title: "العروض غير النشطة",
        value: String(totalCount - activeCount),
        icon: ShieldCheck,
      },
    ];
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();

    return offers.filter((offer) => {
      let matchesStatus = true;
      const isActive = isOfferActive(offer);

      if (filterStatus === "active") {
        matchesStatus = isActive;
      } else if (filterStatus === "inactive") {
        matchesStatus = !isActive;
      }

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
  }, [offers, search, filterStatus]);

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

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      unit_number: offer.item?.name || offer.item?.unit_number || "",
      discount_percentage: offer.discount_percentage || "",
      status: isOfferActive(offer) ? "1" : "0",
      start_date: offer.start_date ? offer.start_date.slice(0, 10) : "",
      end_date: offer.end_date ? offer.end_date.slice(0, 10) : "",
      description: offer.item?.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا العرض؟")) {
      dispatch(deleteOffer(id));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

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
        dispatch(fetchOffers());
      } catch (e) {
        console.error(e);
      }
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
        dispatch(fetchOffers());
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleOpenDetails = (offer) => {
    setPreviewOffer(offer);
    setPreviewOpen(true);
  };

  return (
    <div className="marketing-offers-page" dir="rtl">
      {/* 🔹 كروت الإحصائيات العلوية */}
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

      {/* 🔹 شريط الأدوات المخصص (زر إضافة + القائمة المنسدلة + حقل البحث) */}
      <div className="exact-toolbar-card" dir="rtl">
        {/* 1. زر إضافة عرض */}
        <button
          type="button"
          className="exact-primary-btn"
          onClick={handleOpenCreate}
        >
          <Plus size={18} />
          <span>إضافة عرض</span>
        </button>

        {/* 2. القائمة المنسدلة للتصفية */}
        <div className="exact-select-wrapper">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="active">عروض نشطة</option>
            <option value="inactive">عروض غير نشطة</option>
          </select>
          <ChevronDown size={16} className="exact-select-chevron" />
        </div>

        {/* 3. عنوان وأيقونة التصفية */}
        <div className="exact-filter-label">
          <SlidersHorizontal size={16} />
          <span>تصفية</span>
        </div>

        {/* 4. حقل البحث المماد يساراً */}
        <div className="exact-search-field">
          <input
            type="text"
            placeholder="ابحث عن عرض، عنصر، أو نسبة خصم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* 🔹 جدول البيانات باستخدام TableCard */}
      <TableCard title="إدارة العروض" count={filteredOffers.length}>
        {loading ? (
          <div className="table-state">جاري تحميل العروض...</div>
        ) : error ? (
          <div className="table-state is-error">
            {typeof error === "string" ? error : "حدث خطأ أثناء جلب البيانات"}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>العنصر</th>
                  <th>التفاصيل</th>
                  <th>السعر قبل الخصم</th>
                  <th>السعر بعد الخصم</th>
                  <th>نسبة الخصم</th>
                  <th>تاريخ البداية</th>
                  <th>تاريخ النهاية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((item) => {
                    const meta = getOfferStatusMeta(item);
                    const isService = !!item.item?.name;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="offers-item-cell">
                            <button
                              type="button"
                              className="offers-thumb-btn"
                              onClick={() => handleOpenDetails(item)}
                              title="عرض التفاصيل"
                            >
                              <div className="offers-thumb-placeholder">
                                {isService ? <Briefcase size={16} /> : <Home size={16} />}
                              </div>
                            </button>

                            <div className="offers-item-info">
                              <strong>
                                {isService
                                  ? item.item?.name
                                  : item.item?.unit_number
                                  ? `شقة ${item.item.unit_number}`
                                  : "—"}
                              </strong>
                              <span>
                                {isService
                                  ? "عرض خدمة"
                                  : item.item?.building_id
                                  ? `مبنى ${item.item.building_id}`
                                  : "عرض عقاري"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {isService
                            ? "خدمة"
                            : item.item?.building_id
                            ? `مبنى ${item.item.building_id}`
                            : "—"}
                        </td>

                        <td>
                          <span className="offers-price-old">
                            {formatPrice(item.old_price)}
                          </span>
                        </td>

                        <td>
                          <span className="offers-price-new">
                            {formatPrice(item.new_price)}
                          </span>
                        </td>

                        <td>
                          <span className="offers-discount-badge">
                            {item.discount_percentage}%
                          </span>
                        </td>

                        <td className="offers-date">{formatDate(item.start_date)}</td>
                        <td className="offers-date">{formatDate(item.end_date)}</td>

                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => handleOpenDetails(item)}
                              title="عرض التفاصيل"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => handleOpenEdit(item)}
                              title="تعديل"
                            >
                              <PencilLine size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={() => handleDelete(item.id)}
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
                    <td colSpan="9" className="empty-cell">
                      لا توجد عروض مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* MODAL: إضافة / تعديل عرض */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingOffer ? "تعديل حالة العرض" : "إضافة عرض جديد"}
        size={editingOffer ? "md" : "lg"}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          {editingOffer ? (
            <div className="modal-grid">
              <div className="exact-select-wrapper" style={{ width: "100%" }}>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="1">نشط</option>
                  <option value="0">غير نشط</option>
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>
          ) : (
            <>
              <div className="modal-grid">
                <div className="field-group">
                  <div className="exact-select-wrapper" style={{ width: "100%" }}>
                    <select
                      name="offerable_type"
                      value={formData.offerable_type}
                      onChange={handleChange}
                      style={{ width: "100%" }}
                    >
                      <option value="unit">شقة / وحدة سكنية (Unit)</option>
                      <option value="solution">خدمة / حلول (Solution)</option>
                    </select>
                    <ChevronDown size={16} className="exact-select-chevron" />
                  </div>
                </div>

                <div className="field-group">
                  <div className="exact-select-wrapper" style={{ width: "100%" }}>
                    <select
                      name="offerable_id"
                      value={formData.offerable_id}
                      onChange={handleChange}
                      disabled={
                        formData.offerable_type === "unit"
                          ? unitsLoading
                          : servicesLoading
                      }
                      style={{ width: "100%" }}
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
                    <ChevronDown size={16} className="exact-select-chevron" />
                  </div>
                  <ErrorMessage message={formErrors.offerable_id} />
                </div>
              </div>

              <div className="modal-grid">
                <div>
                  <Field
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    label="نسبة الخصم (%)"
                    iconClass="fa-solid fa-percent"
                    placeholder="مثال: 25"
                    required
                  />
                  <ErrorMessage message={formErrors.discount_percentage} />
                </div>

                <div>
                  <Field
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    label="مدة العرض (بالأيام)"
                    iconClass="fa-solid fa-calendar-days"
                    placeholder="مثال: 3"
                    required
                  />
                  <ErrorMessage message={formErrors.duration_days} />
                </div>
              </div>

              <Field
                type="date"
                name="started_at"
                value={formData.started_at}
                onChange={handleChange}
                label="تاريخ بداية العرض (اختياري - افتراضياً اليوم)"
                iconClass="fa-solid fa-clock"
              />
            </>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={loading}
            >
              <Plus size={16} />
              <span>
                {loading
                  ? "جاري الحفظ..."
                  : editingOffer
                  ? "حفظ الحالة"
                  : "حفظ العرض"}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: معاينة تفاصيل العرض */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          previewOffer?.item?.name
            ? `تفاصيل عرض الخدمة (${previewOffer.item.name})`
            : previewOffer?.item?.unit_number
            ? `تفاصيل العرض العقاري (شقة ${previewOffer.item.unit_number})`
            : "تفاصيل العرض"
        }
        size="lg"
      >
        {previewOffer ? (
          <div className="offers-details">
            <div className="offers-details-grid">
              <div>
                <strong>السعر الأصلي</strong>
                <span>{formatPrice(previewOffer.old_price)}</span>
              </div>

              <div>
                <strong>السعر بعد الخصم</strong>
                <span className="offers-price-text">
                  {formatPrice(previewOffer.new_price)}
                </span>
              </div>

              <div>
                <strong>نسبة الخصم</strong>
                <span className="offers-price-text">
                  {previewOffer.discount_percentage || 0}%
                </span>
              </div>

              <div>
                <strong>تاريخ البداية</strong>
                <span>{formatDate(previewOffer.start_date)}</span>
              </div>

              <div>
                <strong>تاريخ النهاية</strong>
                <span>{formatDate(previewOffer.end_date)}</span>
              </div>

              <div>
                <strong>الحالة</strong>
                <span>{getOfferStatusMeta(previewOffer).label}</span>
              </div>
            </div>

            {!previewOffer?.item?.name && (
              <div className="offers-details-grid">
                <div>
                  <strong>رقم المبنى</strong>
                  <span>{previewOffer.item?.building_id || "—"}</span>
                </div>
                <div>
                  <strong>المساحة</strong>
                  <span>{previewOffer.item?.area ? `${previewOffer.item.area} م²` : "—"}</span>
                </div>
                <div>
                  <strong>الطابق</strong>
                  <span>{previewOffer.item?.floor ?? "—"}</span>
                </div>
              </div>
            )}

            <div className="offers-preview-description">
              <h4>وصف العنصر</h4>
              <p>{previewOffer.item?.description || "لا يوجد وصف تفصيلي متوفر."}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}