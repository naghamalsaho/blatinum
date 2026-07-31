import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Megaphone,
  Image as ImageIcon,
  Plus,
  Eye,
  Trash2,
  Sparkles,
  Search,
  CalendarDays,
  Upload,
  Filter,
  ChevronDown,
  Tag,
  FileText,
  ExternalLink,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

import {
  fetchAdvertisements,
  fetchActiveAdvertisements,
  deleteAdvertisement,
  createAdvertisement,
} from "../features/advertisements/model/advertisement.thunks";

import { fetchOffers } from "../features/offer/model/offer.thunks";

import { validateAdvertisementForm } from "../features/advertisements/validation/advertisement.validation";
import "../styles/marketing-ads.css";

const STATUS_META = {
  active: { label: "نشط", type: "ok" },
  draft: { label: "مسودة", type: "off" },
  scheduled: { label: "مجدول", type: "busy" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "active", label: "نشط" },
  { id: "draft", label: "مسودة" },
  { id: "scheduled", label: "مجدول" },
  { id: "with_offer", label: "عروض الخصم 🏷️" },
];

function isAdvertisementActive(advertisement) {
  if (typeof advertisement?.status === "boolean") return advertisement.status;
  if (typeof advertisement?.is_active === "boolean") return advertisement.is_active;
  if (advertisement?.status === "active") return true;
  if (advertisement?.status === 1) return true;
  if (advertisement?.status === "1") return true;
  return false;
}

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status || "-", type: "off" };
}

function getAdvertisementRowMeta(advertisement) {
  if (typeof advertisement?.status === "boolean") {
    return getStatusMeta(advertisement.status ? "active" : "draft");
  }

  if (typeof advertisement?.is_active === "boolean") {
    return getStatusMeta(advertisement.is_active ? "active" : "draft");
  }

  if (advertisement?.status === 1 || advertisement?.status === "1") {
    return getStatusMeta("active");
  }

  if (advertisement?.status === 0 || advertisement?.status === "0") {
    return getStatusMeta("draft");
  }

  if (advertisement?.status) {
    return getStatusMeta(advertisement.status);
  }

  return getStatusMeta("draft");
}

function getFirstImage(advertisement) {
  return (
    advertisement?.attachments?.find((item) => item.type === "image" || item.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i))?.url ||
    null
  );
}

function formatDate(value) {
  return value || "—";
}

export default function MarketingAdsPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const {
    advertisements = [],
    activeAdvertisements = [],
    loading = false,
    activeLoading = false,
    error = null,
  } = useSelector((state) => state.advertisements || {});

  const { items: offersList = [] } = useSelector((state) => state.offer || state.offers || {});

  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [previewAdvertisement, setPreviewAdvertisement] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "1",
    duration_days: "",
    offer_id: "",
    attachmentFile: null,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAdvertisements());
    dispatch(fetchActiveAdvertisements());
    dispatch(fetchOffers());
  }, [dispatch]);

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
    const totalAds = advertisements.length;
    const activeCount = activeAdvertisements.length;

    const offersCount = advertisements.filter(
      (item) => item.offer && item.offer.is_active
    ).length;

    const avgDuration =
      totalAds > 0
        ? Math.round(
            advertisements.reduce(
              (sum, item) => sum + Number(item.duration_days || 0),
              0
            ) / totalAds
          )
        : 0;

    return [
      {
        title: "إجمالي الإعلانات",
        value: String(totalAds),
        icon: Megaphone,
      },
      {
        title: "إعلانات نشطة",
        value: String(activeCount),
        icon: Sparkles,
      },
      {
        title: "إعلانات بعروض خصم",
        value: String(offersCount),
        icon: Tag,
      },
      {
        title: "متوسط مدة الإعلان",
        value: `${avgDuration} يوم`,
        icon: CalendarDays,
      },
    ];
  }, [advertisements, activeAdvertisements]);

  const filteredAds = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return advertisements.filter((item) => {
      let matchesStatus = true;
      const isActive = isAdvertisementActive(item);

      if (statusFilter === "active") {
        matchesStatus = isActive;
      } else if (statusFilter === "draft") {
        matchesStatus =
          !isActive ||
          item.status === "draft" ||
          item.status === 0 ||
          item.status === "0";
      } else if (statusFilter === "scheduled") {
        matchesStatus = item.status === "scheduled";
      } else if (statusFilter === "with_offer") {
        matchesStatus = Boolean(item.offer && item.offer.is_active);
      }

      const searchable = [
        item.title,
        item.description,
        item.starts_at,
        item.ends_at,
        String(item.duration_days || ""),
        String(item.status || item.is_active || ""),
        item.offer?.discount_percentage ? `خصم ${item.offer.discount_percentage}%` : "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [advertisements, searchTerm, statusFilter]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachment") {
      setFormData((prev) => ({
        ...prev,
        attachmentFile: files?.[0] || null,
      }));

      setFormErrors((prev) => ({
        ...prev,
        attachmentFile: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (id) => {
    if (window.confirm("هل أنتِ متأكدة من رغبتكِ في حذف هذا الإعلان نهائياً؟")) {
      dispatch(deleteAdvertisement(id));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "1",
      duration_days: "",
      offer_id: "",
      attachmentFile: null,
    });
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validateAdvertisementForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const data = new FormData();

    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("status", formData.status);
    data.append("duration_days", String(formData.duration_days));

    if (formData.offer_id) {
      data.append("offer_id", formData.offer_id);
    }

    if (formData.attachmentFile) {
      data.append(
        "attachments[0]",
        formData.attachmentFile,
        formData.attachmentFile.name
      );
    }

    dispatch(createAdvertisement(data)).then((res) => {
      if (!res.error) {
        setCreateOpen(false);
        resetForm();
        dispatch(fetchAdvertisements());
        dispatch(fetchActiveAdvertisements());
      }
    });
  };

  const openImagePreview = (advertisement) => {
    setPreviewAdvertisement(advertisement);
    setPreviewOpen(true);
  };

  const pageLoading = loading || activeLoading;

  const currentStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.id === statusFilter)?.label || "الحالة";

  return (
    <div className="marketing-ads-page" dir="rtl">
      {/* 1. قسم الإحصائيات */}
      <section className="marketing-ads-stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            note={item.note}
            icon={item.icon}
          />
        ))}
      </section>

      {/* 2. قسم الجدول والفلترة الرئيسي */}
      <section className="marketing-ads-main-grid">
        <article className="marketing-panel marketing-panel--full">
          <div className="marketing-panel-head">
            <div>
              <h2>الإعلانات والعروض الترويجية</h2>
              <p>قائمة الإدارة السريعة مع استعراض حقول العروض النشطة</p>
            </div>

            <Button
              type="button"
              className="marketing-secondary-btn"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} />
              <span>إعلان جديد</span>
            </Button>
          </div>

          {/* شريط البحث والتصفية */}
          <div className="marketing-ads-toolbar">
            <div className="marketing-search-wrapper">
              <div className="marketing-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ابحث بعنوان الإعلان، الوصف، أو نسب الخصم..."
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

          {/* الجدول الرئيسي */}
          {pageLoading ? (
            <div className="project-empty-state">جاري تحميل الإعلانات...</div>
          ) : error ? (
            <div className="project-empty-state">
              {typeof error === "string"
                ? error
                : error
                ? JSON.stringify(error)
                : "حدث خطأ غير متوقع"}
            </div>
          ) : (
            <div className="marketing-ads-table-wrap">
              <table className="marketing-ads-table">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>البداية</th>
                    <th>النهاية</th>
                    <th>المدة</th>
                    <th>العرض المرفق</th>
                    <th>المرفقات</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="project-empty-state">
                          لا توجد إعلانات مطابقة لخيارات البحث والحالة
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map((item) => {
                      const meta = getAdvertisementRowMeta(item);
                      const firstImage = getFirstImage(item);
                      const hasOffer = item.offer && item.offer.is_active;

                      return (
                        <tr key={item.id}>
                          <td className="marketing-primary-td">
                            <div className="marketing-ad-title-cell">
                              <button
                                type="button"
                                className="marketing-ad-thumb-btn"
                                disabled
                                style={{ cursor: "default" }}
                              >
                                {firstImage ? (
                                  <img
                                    src={firstImage}
                                    alt={item.title}
                                    className="marketing-ad-thumb"
                                  />
                                ) : (
                                  <div className="marketing-ad-thumb-placeholder">
                                    <Megaphone size={16} />
                                  </div>
                                )}
                              </button>

                              <span className="marketing-ad-title">{item.title}</span>
                            </div>
                          </td>

                          <td className="marketing-date">{formatDate(item.starts_at)}</td>
                          <td className="marketing-date">{formatDate(item.ends_at)}</td>
                          <td className="marketing-metric marketing-metric--duration">
                            {item.duration_days || "—"} يوم
                          </td>

                          <td>
                            {hasOffer ? (
                              <div className="marketing-offer-cell">
                                <span className="marketing-offer-badge">
                                  🏷️ خصم {item.offer.discount_percentage}%
                                </span>
                                <span className="marketing-offer-price">
                                  {Number(item.offer.new_price).toLocaleString("ar-SY")} ل.س
                                </span>
                              </div>
                            ) : (
                              <span className="marketing-no-offer-badge">بدون عرض</span>
                            )}
                          </td>

                          <td>
                            <span className="marketing-type-chip">
                              <ImageIcon size={12} />
                              {item.attachments?.length || 0} مرفق
                            </span>
                          </td>

                          <td>
                            <StatusBadge status={meta.label} type={meta.type} />
                          </td>

                          <td>
                            <div className="marketing-row-actions">
                              <button
                                type="button"
                                className="marketing-icon-btn"
                                onClick={() => openImagePreview(item)}
                                title="عرض التفاصيل"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                className="marketing-icon-btn danger"
                                onClick={() => handleDelete(item.id)}
                                title="حذف الإعلان"
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
      </section>

      {/* 3. مودال إضافة إعلان جديد */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title="إضافة إعلان جديد"
        size="lg"
      >
        <form className="marketing-modal-form" onSubmit={handleSubmit}>
          <div className="marketing-modal-grid">
            <div className="custom-form-group">
              <label>عنوان الإعلان</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="أدخل عنوان الإعلان"
              />
              <ErrorMessage message={formErrors.title} />
            </div>

            <div className="custom-form-group">
              <label>مدة الإعلان (بالأيام)</label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                placeholder="أدخل المدة"
              />
              <ErrorMessage message={formErrors.duration_days} />
            </div>
          </div>

          <div className="marketing-modal-grid">
            <div className="custom-form-group">
              <label>العرض المرفق (اختياري)</label>
              <select
                name="offer_id"
                value={formData.offer_id}
                onChange={handleChange}
              >
                <option value="">-- بدون عرض --</option>
                {offersList.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.title ? `${off.title} (${off.discount_percentage}%)` : `عرض #${off.id} - خصم ${off.discount_percentage}%`}
                  </option>
                ))}
              </select>
              <ErrorMessage message={formErrors.offer_id} />
            </div>

            <div className="custom-form-group">
              <label>الحالة</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="1">نشط</option>
                <option value="0">مسودة</option>
              </select>
              <ErrorMessage message={formErrors.status} />
            </div>
          </div>

          <div className="marketing-modal-grid marketing-modal-grid--single">
            <div className="custom-form-group">
              <label>
                الوصف <span className="required-dot">•</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="أدخل وصف تفصيلي للإعلان"
              />
              <ErrorMessage message={formErrors.description} />
            </div>
          </div>

          <div className="marketing-modal-grid marketing-modal-grid--single">
            <div className="custom-form-group">
              <label>الملفات والمرفقات</label>
              <input
                type="file"
                name="attachment"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*,application/pdf"
                style={{ display: "none" }}
              />

              <div
                className="marketing-upload-dropzone"
                onClick={handleButtonClick}
              >
                <Upload size={18} />
                <span>
                  {formData.attachmentFile
                    ? formData.attachmentFile.name
                    : "اختر صور أو ملفات مرافقة"}
                </span>
              </div>

              <ErrorMessage message={formErrors.attachmentFile} />
            </div>
          </div>

          <div className="marketing-modal-actions">
            <button
              type="submit"
              className="btn-save-primary"
              disabled={loading}
            >
              <span>+ {loading ? "جاري الحفظ..." : "حفظ الإعلان"}</span>
            </button>

            <button
              type="button"
              className="btn-cancel-secondary"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. مودال معاينة التفاصيل والمرفقات بالكامل 👈 */}
     {/* 4. مودال معاينة التفاصيل والمرفقات بالكامل */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewAdvertisement?.title || "معاينة الإعلان"}
        size="lg"
      >
        <div className="marketing-preview-modal">
          
          {/* قسم استعراض المرفقات كاملة */}
          {previewAdvertisement?.attachments && previewAdvertisement.attachments.length > 0 ? (
            <div className="marketing-preview-attachments">
              <h4 className="marketing-preview-title">
                المرفقات ({previewAdvertisement.attachments.length}):
              </h4>
              <div className="marketing-preview-grid">
                {previewAdvertisement.attachments.map((att, idx) => {
                  const isImg =
                    att.type === "image" ||
                    att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                  return isImg ? (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="marketing-preview-img-link"
                    >
                      <img
                        src={att.url}
                        alt={`attachment-${idx}`}
                        className="marketing-preview-img"
                      />
                    </a>
                  ) : (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="marketing-preview-file-link"
                    >
                      <FileText size={20} className="file-icon" />
                      <span className="file-name">مرفق {idx + 1}</span>
                      <ExternalLink size={12} className="file-ext-icon" />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="marketing-preview-empty">
              لا توجد مرفقات مع هذا الإعلان.
            </div>
          )}

          {/* التفاصيل والوصف والعرض */}
          <div className="marketing-preview-details">
            <p className="marketing-preview-desc">
              {previewAdvertisement?.description || "لا يوجد وصف."}
            </p>

            {previewAdvertisement?.offer && previewAdvertisement.offer.is_active && (
              <div className="marketing-preview-offer-card">
                <div className="offer-card-title">
                  🏷️ تفاصيل العرض الترويجي (خصم {previewAdvertisement.offer.discount_percentage}%)
                </div>
                <div className="offer-card-price old">
                  السعر القديم:{" "}
                  <span>
                    {Number(previewAdvertisement.offer.old_price).toLocaleString("ar-SY")} ل.س
                  </span>
                </div>
                <div className="offer-card-price new">
                  السعر الجديد:{" "}
                  <span>
                    {Number(previewAdvertisement.offer.new_price).toLocaleString("ar-SY")} ل.س
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      
      </Modal>
    </div>
  );
}