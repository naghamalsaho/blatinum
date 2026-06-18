import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Megaphone,
  Image as ImageIcon,
  Plus,
  Eye,
  Edit,
  Trash2,
  Sparkles,
 
  Search,
  CalendarDays,

  Upload,
} from "lucide-react";


import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import Field from "@/shared/components/Field";
import StatusBadge from "@/shared/components/StatusBadge";
import ErrorMessage from "@/shared/ui/ErrorMessage";

import {
  fetchAdvertisements,
  fetchActiveAdvertisements,
  deleteAdvertisement,
  createAdvertisement,
} from "../features/advertisements/model/advertisement.thunks";
import { validateAdvertisementForm } from "../features/advertisements/validation/advertisement.validation";

import "../styles/marketing-ads.css";

const STATUS_META = {
  active: { label: "نشط", type: "ok" },
  draft: { label: "مسودة", type: "off" },
  scheduled: { label: "مجدول", type: "busy" },
};

const portfolio = [
  {
    id: "PRT-001",
    name: "برج النخيل",
    type: "مشروع سكني",
    units: 48,
    year: "2023",
    icon: "🏗️",
  },
  {
    id: "PRT-002",
    name: "واجهة البحر",
    type: "مشروع فاخر",
    units: 32,
    year: "2022",
    icon: "🌊",
  },
  {
    id: "PRT-003",
    name: "الروضة ريزيدنس",
    type: "مشروع متوسط",
    units: 64,
    year: "2021",
    icon: "🌿",
  },
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
    advertisement?.attachments?.find((item) => item.type === "image")?.url ||
    null
  );
}

function formatDate(value) {
  return value || "—";
}

export default function MarketingAdsPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const {
    advertisements = [],
    activeAdvertisements = [],
    loading = false,
    activeLoading = false,
    error = null,
  } = useSelector((state) => state.advertisements || {});

  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [previewAdvertisement, setPreviewAdvertisement] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "1",
    duration_days: "",
    attachmentFile: null,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAdvertisements());
    dispatch(fetchActiveAdvertisements());
  }, [dispatch]);

  const stats = useMemo(() => {
    const totalAds = advertisements.length;
    const activeCount = activeAdvertisements.length;

    const adsWithImages = advertisements.filter((item) =>
      item.attachments?.some((att) => att.type === "image")
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
        note: "كل الإعلانات",
        icon: Megaphone,
      },
      {
        title: "إعلانات نشطة",
        value: String(activeCount),
        note: "من الراوت النشط",
        icon: Sparkles,
      },
      {
        title: "إعلانات تحتوي صور",
        value: String(adsWithImages),
        note: "بوسائط مرئية",
        icon: ImageIcon,
      },
      {
        title: "متوسط مدة الإعلان",
        value: `${avgDuration} يوم`,
        note: "متوسط المدة",
        icon: CalendarDays,
      },
    ];
  }, [advertisements, activeAdvertisements]);

  const filteredAds = useMemo(() => {
    const q = String(searchTerm || "").trim().toLowerCase();

    return advertisements.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isAdvertisementActive(item));

      const searchable = [
        item.title,
        item.description,
        item.starts_at,
        item.ends_at,
        String(item.duration_days || ""),
        String(item.status || item.is_active || ""),
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
    setPreviewImage(getFirstImage(advertisement));
    setPreviewOpen(true);
  };

  
  const pageLoading = loading || activeLoading;

  return (
    <div className="marketing-ads-page">
     

    

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

      <section className="marketing-ads-main-grid">
        <article className="marketing-panel marketing-panel--full">
          <div className="marketing-panel-head">
            <div>
              <h2>الإعلانات والعروض الترويجية</h2>
              <p>قائمة الإدارة السريعة مع إجراءات مباشرة</p>
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

          <div className="marketing-ads-toolbar">
            <div className="marketing-search">
              <Search size={16} />

              <input
                type="text"
                placeholder="ابحث بعنوان الإعلان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="marketing-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
            </select>
          </div>

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
                    <th>المرفقات</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAds.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="project-empty-state">لا توجد إعلانات حالياً</div>
                      </td>
                    </tr>
                  ) : (
                    filteredAds.map((item) => {
                      const meta = getAdvertisementRowMeta(item);
                      const firstImage = getFirstImage(item);

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

      <section className="marketing-portfolio-section">
        <div className="marketing-panel-head marketing-section-head">
          <div>
            <h2>معرض الأعمال</h2>
            <p>المشاريع التي يمكن الترويج لها في الحملات التسويقية</p>
          </div>
        </div>

        <div className="marketing-portfolio-grid">
          {portfolio.map((item) => (
            <article key={item.id} className="marketing-portfolio-card">
              <div className="marketing-portfolio-hero">{item.icon}</div>

              <div className="marketing-portfolio-body">
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.type} · {item.year}
                  </p>
                </div>

                <div className="marketing-portfolio-footer">
                  <span className="marketing-unit-chip">{item.units} وحدة</span>

                  <div className="marketing-row-actions">
                    <button type="button" className="marketing-icon-btn">
                      <Eye size={13} />
                    </button>

                    <button type="button" className="marketing-icon-btn">
                      <Edit size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title="إعلان / عرض جديد"
        description="أدخل البيانات الأساسية ثم احفظ التغييرات."
        size="lg"
      >
        <form className="marketing-modal-form" onSubmit={handleSubmit}>
          <div className="marketing-modal-grid">
            <div className="custom-form-group">
              <Field
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                label="العنوان"
                iconClass="fa-solid fa-heading"
              />
              <ErrorMessage message={formErrors.title} />
            </div>

            <div className="custom-form-group">
              <Field
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                label="مدة الإعلان (بالأيام)"
                iconClass="fa-solid fa-calendar-days"
              />
              <ErrorMessage message={formErrors.duration_days} />
            </div>
          </div>

          <div className="marketing-modal-grid marketing-modal-grid--single">
            <div className="custom-form-group">
              <Field
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                label="الوصف"
                iconClass="fa-solid fa-file-lines"
              />
              <ErrorMessage message={formErrors.description} />
            </div>
          </div>

          <div className="marketing-modal-grid">
            <div className="custom-form-group">
              <label className="marketing-file-label">
                <i className="fa-solid fa-circle-info" style={{ marginLeft: "6px" }} />
                الحالة
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="marketing-select"
              >
                <option value="1">نشط</option>
                <option value="0">مسودة</option>
              </select>
              <ErrorMessage message={formErrors.status} />
            </div>

            <div className="custom-form-group marketing-file-field">
              <label className="marketing-file-label">
                <i className="fa-solid fa-paperclip" style={{ marginLeft: "6px" }} />
                المرفق
              </label>

              <div className="marketing-file-row">
                <input
                  type="file"
                  name="attachment"
                  ref={fileInputRef}
                  onChange={handleChange}
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                />

                <Button
                  type="button"
                  className="marketing-secondary-btn"
                  onClick={handleButtonClick}
                >
                  <Upload size={16} />
                  اختر ملف
                </Button>

                <span className="marketing-file-name">
                  {formData.attachmentFile
                    ? formData.attachmentFile.name
                    : "لم يتم اختيار ملف"}
                </span>
              </div>

              <ErrorMessage message={formErrors.attachmentFile} />
            </div>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="marketing-secondary-btn"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>

            <Button type="submit" className="marketing-primary-btn" disabled={loading}>
              <Plus size={16} />
              <span>{loading ? "جاري الحفظ..." : "حفظ الإعلان"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewAdvertisement?.title || "معاينة الصورة"}
        description="عرض الصورة والوصف الكامل"
        size="lg"
      >
        <div className="marketing-preview-modal">
          {previewImage ? (
            <div className="marketing-image-preview">
              <img src={previewImage} alt="advertisement preview" />
            </div>
          ) : null}

          <div className="marketing-preview-details">
            <h3>{previewAdvertisement?.title || "-"}</h3>
            <p>{previewAdvertisement?.description || "لا يوجد وصف."}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}