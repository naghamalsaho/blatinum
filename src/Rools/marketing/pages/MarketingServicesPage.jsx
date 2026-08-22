import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  PencilLine,
  Trash2,
  Eye,
  Sparkles,
  BadgeCheck,
  Star,
  Building2,
  Image as ImageIcon,
  Upload,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import Field from "@/shared/components/Field";

import {
  fetchServices,
  deleteService,
  createService,
  updateService,
} from "../features/services/model/service.thunks";

import "../styles/marketing-services.css";

function getFirstImage(service) {
  return service?.attachments?.find((item) => item.type === "image")?.url || null;
}

function formatPrice(value) {
  const num = Number(value || 0);
  return num.toLocaleString();
}

function formatDate(value) {
  return value || "—";
}

function getSafeDateValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function MarketingServicesPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const servicesState = useSelector((state) => state.services || {});
  const services =
    servicesState.services ||
    servicesState.items ||
    servicesState.data ||
    [];

  const loading = servicesState.loading || false;
  const creating = servicesState.creating || false;
  const updating = servicesState.updating || false;
  const deleting = servicesState.deleting || false;
  const error = servicesState.error || "";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedService, setSelectedService] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    attachments: [],
  });

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const sortedServices = useMemo(() => {
    return [...services].sort(
      (a, b) => getSafeDateValue(b.created_at) - getSafeDateValue(a.created_at)
    );
  }, [services]);

  const latestService = sortedServices[0] || null;

  const stats = useMemo(() => {
    const totalServices = services.length;
    const totalValue = services.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    const withImage = services.filter((item) => getFirstImage(item)).length;
    const latestPrice = latestService?.price || 0;

    return [
      {
        title: "إجمالي الخدمات",
        value: String(totalServices),
        icon: Building2,
      },
      {
        title: "خدمات بصور",
        value: String(withImage),
        icon: ImageIcon,
      },
      {
        title: "مجموع الأسعار",
        value: `${formatPrice(totalValue)} ل.س`,
        icon: Star,
      },
      {
        title: "آخر سعر مسجل",
        value: `${formatPrice(latestPrice)} ل.س`,
        icon: BadgeCheck,
      },
    ];
  }, [services, latestService]);

  const filteredServices = useMemo(() => {
    let result = sortedServices;

    // تصفية حسب الحالة (بصور / بدون صور)
    if (filterStatus === "with_image") {
      result = result.filter((item) => Boolean(getFirstImage(item)));
    } else if (filterStatus === "without_image") {
      result = result.filter((item) => !getFirstImage(item));
    }

    // تصفية حسب النص
    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((item) => {
      const searchable = [
        item.name,
        item.description,
        item.price,
        item.created_at,
        item.created_from,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [sortedServices, search, filterStatus]);

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      attachments: [],
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenDetails = (service) => {
    setSelectedService(service);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingServiceId(service.id);
    setFormData({
      name: service.name || "",
      price: service.price || "",
      description: service.description || "",
      attachments: [],
    });
    setEditOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("هل تريد حذف هذه الخدمة؟");
    if (!ok) return;

    const result = await dispatch(deleteService(id));

    if (deleteService.fulfilled.match(result)) {
      dispatch(fetchServices());
      if (selectedService?.id === id) {
        setSelectedService(null);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachments") {
      const nextFiles = Array.from(files || []);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...nextFiles],
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", String(formData.price));
    data.append("description", formData.description);

    formData.attachments.forEach((file, index) => {
      data.append(`attachments[${index}]`, file, file.name);
    });

    dispatch(createService(data))
      .unwrap()
      .then(() => {
        setCreateOpen(false);
        resetForm();
        dispatch(fetchServices());
      })
      .catch(() => {});
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
    };

    dispatch(
      updateService({
        id: editingServiceId,
        payload,
      })
    )
      .unwrap()
      .then(() => {
        setEditOpen(false);
        setEditingServiceId(null);
        resetForm();
        dispatch(fetchServices());
      })
      .catch(() => {});
  };

  return (
    <div className="marketing-services-page" dir="rtl">
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

      {/* شريط الأدوات المخصص المطابق للصورة تماماً */}
      <div className="exact-toolbar-card" dir="rtl">
        {/* 1. زر إضافة خدمة (على أقصى اليمين) */}
        <button
          type="button"
          className="exact-primary-btn"
          onClick={handleOpenCreate}
        >
          <Plus size={18} />
          <span>إضافة خدمة</span>
        </button>

        {/* 2. القائمة المنسدلة للتصفية */}
        <div className="exact-select-wrapper">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="with_image">خدمات بصور</option>
            <option value="without_image">خدمات بدون صور</option>
          </select>
          <ChevronDown size={16} className="exact-select-chevron" />
        </div>

        {/* 3. عنوان وأيقونة التصفية */}
        <div className="exact-filter-label">
          <SlidersHorizontal size={16} />
          <span>تصفية</span>
        </div>

        {/* 4. حقل البحث (يمتد على بقية المساحة يساراً) */}
        <div className="exact-search-field">
          <input
            type="text"
            placeholder="ابحث عن خدمة، وصف، أو سعر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* جدول الخدمات */}
      <TableCard title="إدارة الخدمات" count={filteredServices.length}>
        {loading ? (
          <div className="table-state">جاري تحميل الخدمات...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>الخدمة</th>
                  <th>السعر</th>
                  <th>منذ</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => {
                    const imageUrl = getFirstImage(service);

                    return (
                      <tr key={service.id}>
                        <td>
                          <div className="services-item-cell">
                            <button
                              type="button"
                              className="services-thumb-btn"
                              onClick={() => handleOpenDetails(service)}
                              title="عرض التفاصيل"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={service.name}
                                  className="services-thumb"
                                />
                              ) : (
                                <div className="services-thumb-placeholder">
                                  <Sparkles size={16} />
                                </div>
                              )}
                            </button>

                            <div className="services-item-info">
                              <strong>{service.name}</strong>
                              <span>{service.description || "لا يوجد وصف"}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="services-price">
                            {formatPrice(service.price)} ل.س
                          </span>
                        </td>

                        <td className="services-date">{service.created_from || "—"}</td>

                        <td className="services-date">{formatDate(service.created_at)}</td>

                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => handleOpenDetails(service)}
                              title="عرض التفاصيل"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => handleOpenEdit(service)}
                              title="تعديل"
                            >
                              <PencilLine size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={() => handleDelete(service.id)}
                              title="حذف"
                              disabled={deleting}
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
                    <td colSpan="5" className="empty-cell">
                      لا توجد خدمات مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* MODAL: إضافة خدمة جديدة */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title="إضافة خدمة جديدة"
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreateSubmit}>
          <div className="modal-grid">
            <Field
              name="name"
              value={formData.name}
              onChange={handleChange}
              label="اسم الخدمة"
              iconClass="fa-solid fa-tag"
              required
            />

            <Field
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              label="السعر (ل.س)"
              iconClass="fa-solid fa-coins"
              required
            />
          </div>

          <Field
            name="description"
            value={formData.description}
            onChange={handleChange}
            label="الوصف"
            iconClass="fa-solid fa-align-left"
            required
          />

          <div className="field-group">
            <label className="file-upload-box">
              <Upload size={18} />
              <span>اختر صور أو ملفات مرافقة</span>
              <input
                type="file"
                name="attachments"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*,application/pdf"
                multiple
                style={{ display: "none" }}
              />
            </label>

            {formData.attachments.length > 0 && (
              <div className="attachments-list">
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="attachment-chip">
                    <span>{file.name}</span>
                    <X
                      size={14}
                      onClick={() => removeAttachment(idx)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
              disabled={creating}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={creating}
            >
              <Plus size={16} />
              <span>{creating ? "جاري الحفظ..." : "حفظ الخدمة"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: تعديل خدمة */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingServiceId(null);
          resetForm();
        }}
        title="تعديل الخدمة"
        size="md"
      >
        <form className="modal-form" onSubmit={handleEditSubmit}>
          <div className="modal-grid">
            <Field
              name="name"
              value={formData.name}
              onChange={handleChange}
              label="اسم الخدمة"
              iconClass="fa-solid fa-tag"
            />

            <Field
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              label="السعر (ل.س)"
              iconClass="fa-solid fa-coins"
            />
          </div>

          <Field
            name="description"
            value={formData.description}
            onChange={handleChange}
            label="الوصف"
            iconClass="fa-solid fa-align-left"
          />

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setEditOpen(false);
                setEditingServiceId(null);
                resetForm();
              }}
              disabled={updating}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={updating}
            >
              <PencilLine size={16} />
              <span>{updating ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: تفاصيل الخدمة */}
      <Modal
        open={Boolean(selectedService)}
        title={selectedService?.name || "تفاصيل الخدمة"}
        description="عرض كامل لمعلومات الخدمة المحددة"
        onClose={() => setSelectedService(null)}
        size="lg"
      >
        {selectedService ? (
          <div className="services-details">
            {getFirstImage(selectedService) ? (
              <div className="services-preview-image">
                <img
                  src={getFirstImage(selectedService)}
                  alt={selectedService.name}
                />
              </div>
            ) : null}

            <div className="services-details-grid">
              <div>
                <strong>السعر</strong>
                <span className="services-price-text">
                  {formatPrice(selectedService.price)} ل.س
                </span>
              </div>

              <div>
                <strong>تاريخ الإنشاء</strong>
                <span>{formatDate(selectedService.created_at)}</span>
              </div>

              <div>
                <strong>منذ</strong>
                <span>{selectedService.created_from || "—"}</span>
              </div>
            </div>

            <div className="services-preview-description">
              <h4>وصف الخدمة</h4>
              <p>{selectedService.description || "لا يوجد وصف مفصل."}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}