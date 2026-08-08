import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
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
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";

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
    const q = search.trim().toLowerCase();
    if (!q) return sortedServices;

    return sortedServices.filter((item) => {
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
  }, [sortedServices, search]);

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
    <div className="services-page" dir="rtl">
      {/* البطاقات الإحصائية المنفصلة */}
      <section className="services-stats-grid">
        {stats.map((item) => (
          <div key={item.title} className="services-stat-card">
            <StatCard
              title={item.title}
              value={item.value}
              icon={item.icon}
            />
          </div>
        ))}
      </section>

      {/* اللوحة الرئيسية */}
      <section className="services-panel">
        <div className="services-panel-head">
          <div>
            <h2>إدارة الخدمات</h2>
            <p>استعرض الخدمات وابحث عنها وافتح تفاصيلها أو قم بإدارتها بسهولة</p>
            <Button className="services-primary-btn" onClick={handleOpenCreate}>
              <Plus size={18} />
              <span>إضافة خدمة</span>
            </Button>
          </div>
        </div>

        <div className="services-toolbar">
          <div className="services-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ابحث عن خدمة، وصف، أو سعر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="services-empty">جاري تحميل الخدمات...</div>
        ) : error ? (
          <div className="services-error-box">{error}</div>
        ) : filteredServices.length === 0 ? (
          <div className="services-empty">لا توجد خدمات مطابقة للبحث</div>
        ) : (
          <div className="services-table-wrap">
            <table className="services-table">
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
                {filteredServices.map((service) => {
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
                        <div className="services-row-actions">
                          <button
                            type="button"
                            className="services-icon-btn"
                            onClick={() => handleOpenDetails(service)}
                            title="عرض التفاصيل"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="services-icon-btn"
                            onClick={() => handleOpenEdit(service)}
                            title="تعديل"
                          >
                            <PencilLine size={14} />
                          </button>

                          <button
                            type="button"
                            className="services-icon-btn danger"
                            onClick={() => handleDelete(service.id)}
                            title="حذف"
                            disabled={deleting}
                          >
                            <Trash2 size={14} />
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

      {/* MODAL: إضافة خدمة جديد */}
      {createOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setCreateOpen(false);
            resetForm();
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة خدمة جديدة</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>اسم الخدمة</label>
                  <input
                    type="text"
                    name="name"
                    className="input-field"
                    placeholder="أدخل اسم الخدمة"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>السعر (ل.س)</label>
                  <input
                    type="number"
                    name="price"
                    className="input-field"
                    placeholder="أدخل السعر"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  name="description"
                  className="input-field textarea-field"
                  placeholder="أدخل وصف تفصيلي للخدمة"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>الملفات والمرفقات</label>
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
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setCreateOpen(false);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="services-primary-btn"
                  disabled={creating}
                >
                  <Plus size={16} />
                  <span>{creating ? "جاري الحفظ..." : "حفظ الخدمة"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: تعديل خدمة */}
      {editOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setEditOpen(false);
            setEditingServiceId(null);
            resetForm();
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تعديل الخدمة</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setEditOpen(false);
                  setEditingServiceId(null);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label>اسم الخدمة</label>
                  <input
                    type="text"
                    name="name"
                    className="input-field"
                    placeholder="أدخل اسم الخدمة"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>السعر (ل.س)</label>
                  <input
                    type="number"
                    name="price"
                    className="input-field"
                    placeholder="أدخل السعر"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  name="description"
                  className="input-field textarea-field"
                  placeholder="أدخل وصف الخدمة"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingServiceId(null);
                    resetForm();
                  }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="services-primary-btn"
                  disabled={updating}
                >
                  <PencilLine size={16} />
                  <span>{updating ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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