import { useEffect, useMemo, useState } from "react";
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
  Tag,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";

import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
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

/* استخدام ملف تنسيقات الخدمات الموحد لتطابق التنسيق تماماً */
import "../styles/marketing-services.css";

const STATUS_META = {
  active: { label: "نشط", type: "ok" },
  draft: { label: "مسودة", type: "off" },
};

const STATUS_OPTIONS = [
  { id: "all", label: "جميع الحالات" },
  { id: "active", label: "نشط" },
  { id: "draft", label: "مسودة" },
  { id: "with_offer", label: "عروض الخصم 🏷️" },
];

function isAdvertisementActive(advertisement) {
  if (typeof advertisement?.status === "boolean") return advertisement.status;
  if (typeof advertisement?.is_active === "boolean") return advertisement.is_active;
  if (advertisement?.status === "active" || advertisement?.status === 1 || advertisement?.status === "1") return true;
  return false;
}

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status || "-", type: "off" };
}

function getAdvertisementRowMeta(advertisement) {
  if (typeof advertisement?.status === "boolean") return getStatusMeta(advertisement.status ? "active" : "draft");
  if (typeof advertisement?.is_active === "boolean") return getStatusMeta(advertisement.is_active ? "active" : "draft");
  if (advertisement?.status === 1 || advertisement?.status === "1") return getStatusMeta("active");
  return getStatusMeta("draft");
}

function getFirstImage(advertisement) {
  return (
    advertisement?.attachments?.find(
      (item) => item.type === "image" || item.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i)
    )?.url || null
  );
}

function formatDate(value) {
  return value || "—";
}

export default function MarketingAdsPage() {
  const dispatch = useDispatch();

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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

  const stats = useMemo(() => {
    const totalAds = advertisements.length;
    const activeCount = activeAdvertisements.length;
    const offersCount = advertisements.filter((item) => item.offer && item.offer.is_active).length;
    const avgDuration =
      totalAds > 0
        ? Math.round(advertisements.reduce((sum, item) => sum + Number(item.duration_days || 0), 0) / totalAds)
        : 0;

    return [
      { title: "إجمالي الإعلانات", value: String(totalAds), icon: Megaphone },
      { title: "إعلانات نشطة", value: String(activeCount), icon: Sparkles },
      { title: "إعلانات بعروض خصم", value: String(offersCount), icon: Tag },
      { title: "متوسط مدة الإعلان", value: `${avgDuration} يوم`, icon: CalendarDays },
    ];
  }, [advertisements, activeAdvertisements]);

  const filteredAds = useMemo(() => {
    const targetList = filterStatus === "active" && activeAdvertisements.length > 0 ? activeAdvertisements : advertisements;

    return targetList.filter((item) => {
      let matchesStatus = true;
      const isActive = isAdvertisementActive(item);

      if (filterStatus === "active") matchesStatus = isActive;
      else if (filterStatus === "draft") matchesStatus = !isActive;
      else if (filterStatus === "with_offer") matchesStatus = Boolean(item.offer && item.offer.is_active);

      const q = search.trim().toLowerCase();
      if (!q) return matchesStatus;

      const searchable = [
        item.title,
        item.description,
        item.starts_at,
        item.ends_at,
        String(item.duration_days || ""),
        item.offer?.discount_percentage ? `خصم ${item.offer.discount_percentage}%` : "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(q);
    });
  }, [advertisements, activeAdvertisements, search, filterStatus]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData((prev) => ({ ...prev, attachmentFile: files?.[0] || null }));
      setFormErrors((prev) => ({ ...prev, attachmentFile: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
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
    if (Object.keys(errors).length > 0) return;

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("status", formData.status);
    data.append("duration_days", String(formData.duration_days));
    if (formData.offer_id) data.append("offer_id", formData.offer_id);
    if (formData.attachmentFile) {
      data.append("attachments[0]", formData.attachmentFile, formData.attachmentFile.name);
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

  const pageLoading = loading || activeLoading;

  return (
    <div className="marketing-services-page" dir="rtl">
      {/* 1. شبكة الإحصائيات العلوية */}
      <section className="legal-stats-grid">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} icon={item.icon} />
        ))}
      </section>

      {/* 2. شريط الأدوات المنسق تماماً كواجهة الخدمات */}
      <div className="exact-toolbar-card" dir="rtl">
        <button
          type="button"
          className="exact-primary-btn"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={18} />
          <span>إعلان جديد</span>
        </button>

        <div className="exact-select-wrapper">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
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
            placeholder="ابحث بعنوان الإعلان، الوصف، أو نسب الخصم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* 3. جدول الإعلانات باستخدام TableCard */}
      <TableCard title="الإعلانات والعروض الترويجية" >
        {pageLoading ? (
          <div className="table-state">جاري تحميل الإعلانات...</div>
        ) : error ? (
          <div className="table-state is-error">{typeof error === "string" ? error : "حدث خطأ غير متوقع"}</div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>الإعلان</th>
                  <th>البداية</th>
                  <th>النهاية</th>
                  <th>المدة</th>
                  <th>العرض المرفق</th>
                  <th>المرفقات</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.length > 0 ? (
                  filteredAds.map((item) => {
                    const meta = getAdvertisementRowMeta(item);
                    const firstImage = getFirstImage(item);
                    const hasOffer = item.offer && item.offer.is_active;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="services-item-cell">
                            <button
                              type="button"
                              className="services-thumb-btn"
                              onClick={() => {
                                setPreviewAdvertisement(item);
                                setPreviewOpen(true);
                              }}
                              title="عرض التفاصيل"
                            >
                              {firstImage ? (
                                <img src={firstImage} alt={item.title} className="services-thumb" />
                              ) : (
                                <div className="services-thumb-placeholder">
                                  <Megaphone size={16} />
                                </div>
                              )}
                            </button>
                            <div className="services-item-info">
                              <strong>{item.title}</strong>
                              <span>{item.description || "لا يوجد وصف"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="services-date">{formatDate(item.starts_at)}</td>
                        <td className="services-date">{formatDate(item.ends_at)}</td>
                        <td className="services-date">{item.duration_days ? `${item.duration_days} يوم` : "—"}</td>

                        <td>
                          {hasOffer ? (
                            <span className="marketing-offer-badge">🏷️ خصم {item.offer.discount_percentage}%</span>
                          ) : (
                            <span className="services-date">بدون عرض</span>
                          )}
                        </td>

                        <td className="services-date">
                          <ImageIcon size={14} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
                          {item.attachments?.length || 0} مرفق
                        </td>

                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => {
                                setPreviewAdvertisement(item);
                                setPreviewOpen(true);
                              }}
                              title="عرض التفاصيل"
                            >
                              <Eye size={16} />
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
                    <td colSpan="8" className="empty-cell">
                      لا توجد إعلانات مطابقة لخيارات البحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* مودال إنشاء إعلان */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="إضافة إعلان جديد" size="md">
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-grid">
            <div className="custom-form-group">
              <label>عنوان الإعلان</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="العنوان" />
              <ErrorMessage message={formErrors.title} />
            </div>
            <div className="custom-form-group">
              <label>المدة (بالأيام)</label>
              <input type="number" name="duration_days" value={formData.duration_days} onChange={handleChange} placeholder="الأيام" />
              <ErrorMessage message={formErrors.duration_days} />
            </div>
          </div>

          <div className="modal-grid">
            <div className="custom-form-group">
              <label>العرض المرفق</label>
              <select name="offer_id" value={formData.offer_id} onChange={handleChange}>
                <option value="">-- بدون عرض --</option>
                {offersList.map((off) => (
                  <option key={off.id} value={off.id}>
                    خصم {off.discount_percentage}%
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-form-group">
              <label>الحالة</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="1">نشط</option>
                <option value="0">مسودة</option>
              </select>
            </div>
          </div>

          <div className="custom-form-group">
            <label>الوصف</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="وصف الإعلان..." rows={3} style={{ width: '100%', border: '1px solid var(--dash-line)', borderRadius: '12px', background: 'var(--dash-input-bg)', color: 'var(--dash-text)', padding: '10px 14px', outline: 'none' }} />
            <ErrorMessage message={formErrors.description} />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              إلغاء
            </button>
            <button type="submit" className="exact-primary-btn" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ الإعلان"}
            </button>
          </div>
        </form>
      </Modal>

      {/* مودال استعراض الإعلان */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="تفاصيل الإعلان" size="lg">
        {previewAdvertisement && (
          <div className="services-details">
            {getFirstImage(previewAdvertisement) ? (
              <div className="services-preview-image">
                <img src={getFirstImage(previewAdvertisement)} alt={previewAdvertisement.title} />
              </div>
            ) : null}

            <div className="services-details-grid">
              <div>
                <strong>المدة</strong>
                <span>{previewAdvertisement.duration_days || "—"} يوم</span>
              </div>
              <div>
                <strong>البداية</strong>
                <span>{formatDate(previewAdvertisement.starts_at)}</span>
              </div>
              <div>
                <strong>النهاية</strong>
                <span>{formatDate(previewAdvertisement.ends_at)}</span>
              </div>
            </div>

            <div className="services-preview-description">
              <h4>عنوان الإعلان</h4>
              <p>{previewAdvertisement.title}</p>
            </div>

            <div className="services-preview-description">
              <h4>وصف الإعلان</h4>
              <p>{previewAdvertisement.description || "لا يوجد وصف مفصل."}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}