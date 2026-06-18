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

  ChevronRight,

} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
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
        title: "الخدمات",
        value: String(totalServices),
        note: "إجمالي الخدمات",
        icon: Building2,
      },
      {
        title: "بصور مرفقة",
        value: String(withImage),
        note: "خدمات مع صور",
        icon: ImageIcon,
      },
      {
        title: "إجمالي الأسعار",
        value: formatPrice(totalValue),
        note: "مجموع الأسعار",
        icon: Star,
      },
      {
        title: "آخر خدمة",
        value: formatPrice(latestPrice),
        note: "أحدث سعر مسجل",
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

      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilePick = () => {
    fileInputRef.current?.click();
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
     

      <section className="services-stats-grid">
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

      <section className="services-layout">
        <article className="services-panel services-list-panel">
         <div className="services-panel-head">
  <div>
    <h2>الخدمات</h2>
    <p>استعرض الخدمات وابحث عنها وافتح تفاصيلها بسرعة</p>
  </div>

  <Button className="services-primary-btn" onClick={handleOpenCreate}>
    <Plus size={18} />
    <span>إضافة خدمة</span>
  </Button>
</div>

          <div className="services-toolbar">
            <div className="services-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث عن خدمة أو وصف أو سعر..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {error ? <div className="services-error-box">{error}</div> : null}

          <div className="services-cards-scroll">
            {loading ? (
              <div className="services-empty">جاري تحميل الخدمات...</div>
            ) : filteredServices.length > 0 ? (
              <div className="services-cards-grid">
                {filteredServices.map((service) => {
                  const imageUrl = getFirstImage(service);
                  const isLatest = latestService?.id === service.id;

                  return (
                    <article
                      key={service.id}
                      className={`service-card ${isLatest ? "is-featured" : ""}`}
                    >
                      <div className="service-card-visual">
                        {imageUrl ? (
                          <img src={imageUrl} alt={service.name} />
                        ) : (
                          <div className="service-card-placeholder">
                            <Sparkles size={22} />
                          </div>
                        )}

                        {isLatest ? (
                          <div className="service-card-ribbon">
                            <ChevronRight size={14} />
                            الأحدث
                          </div>
                        ) : null}
                      </div>

                      <div className="service-card-body">
                        <div className="service-card-top">
                          <div className="service-card-title-wrap">
                            <h3>{service.name}</h3>
                            <p>{service.description || "لا يوجد وصف"}</p>
                          </div>

                          
                        </div>

                        <div className="service-card-bottom">

  <div className="service-card-meta">
    <span className="service-meta-price">
      <BadgeCheck size={12} />
      {formatPrice(service.price)} ل.س
    </span>

    <span>{service.created_from || "—"}</span>

    <span>{formatDate(service.created_at)}</span>
  </div>


  <div className="service-card-footer">

    <button
      type="button"
      className="services-icon-btn"
      onClick={() => handleOpenDetails(service)}
    >
      <Eye size={15}/>
    </button>


    <button
      type="button"
      className="services-icon-btn"
      onClick={() => handleOpenEdit(service)}
    >
      <PencilLine size={15}/>
    </button>


    <button
      type="button"
      className="services-icon-btn danger"
      onClick={() => handleDelete(service.id)}
    >
      <Trash2 size={15}/>
    </button>

  </div>

  </div>
  </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="services-empty">لا توجد خدمات مطابقة للبحث</div>
            )}
          </div>
        </article>
      </section>

      <Modal
        open={Boolean(selectedService)}
        title={selectedService?.name || "تفاصيل الخدمة"}
        description="عرض كامل لمعلومات الخدمة"
        onClose={() => setSelectedService(null)}
        size="lg"
      >
        {selectedService ? (
          <div className="services-preview">
            <div className="services-preview-top">
              <div className="services-preview-icon">
                <Sparkles size={24} />
              </div>

              <div className="services-preview-head">
                <h3>{selectedService.name}</h3>
                <p>{selectedService.description || "لا يوجد وصف"}</p>
              </div>
            </div>

            {getFirstImage(selectedService) ? (
              <div className="services-preview-image">
                <img
                  src={getFirstImage(selectedService)}
                  alt={selectedService.name}
                />
              </div>
            ) : null}

            <div className="services-preview-grid">
              <div className="services-preview-price-card">
                <strong>السعر</strong>
                <span>{formatPrice(selectedService.price)} ل.س</span>
              </div>

              <div className="services-preview-date-card">
                <strong>تاريخ الإنشاء</strong>
                <span>{formatDate(selectedService.created_at)}</span>
              </div>

              <div className="services-preview-since-card">
                <strong>منذ</strong>
                <span>{selectedService.created_from || "—"}</span>
              </div>
            </div>

            <div className="services-preview-description">
              <h4>الوصف</h4>
              <p>{selectedService.description || "لا يوجد وصف مفصل."}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={createOpen}
        title="إضافة خدمة جديدة"
        description="أدخل بيانات الخدمة ثم احفظها."
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        size="lg"
      >
        <form className="services-create-form" onSubmit={handleCreateSubmit}>
          <div className="services-create-grid">
            <Field
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              label="اسم الخدمة"
              iconClass="fa-solid fa-sparkles"
              error=""
              required
            />

            <Field
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              label="السعر"
              iconClass="fa-solid fa-coins"
              error=""
              required
            />
          </div>

          <div className="services-create-grid services-create-grid--single">
            <Field
              type="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              label="الوصف"
              iconClass="fa-solid fa-file-lines"
              error=""
              required
            />
          </div>

          <div className="services-file-row">
            <input
              type="file"
              name="attachments"
              ref={fileInputRef}
              onChange={handleChange}
              accept="image/*,application/pdf"
              multiple
              hidden
            />

            <Button
              type="button"
              className="services-primary-btn"
              onClick={handleFilePick}
            >
              <Upload size={16} />
              <span>اختر ملفات</span>
            </Button>

            <span className="services-file-name">
              {formData.attachments.length > 0
                ? `${formData.attachments.length} ملف/ملفات محددة`
                : "لم يتم اختيار ملفات"}
            </span>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="services-secondary-btn"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>

            <Button type="submit" className="services-primary-btn" disabled={creating}>
              <Plus size={16} />
              <span>{creating ? "جاري الحفظ..." : "حفظ الخدمة"}</span>
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title="تعديل الخدمة"
        description="عدلي الاسم أو الوصف أو السعر ثم احفظي التغييرات."
        onClose={() => {
          setEditOpen(false);
          setEditingServiceId(null);
          resetForm();
        }}
        size="lg"
      >
        <form className="services-create-form" onSubmit={handleEditSubmit}>
          <div className="services-create-grid">
            <Field
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              label="اسم الخدمة"
              iconClass="fa-solid fa-sparkles"
              error=""
            />

            <Field
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              label="السعر"
              iconClass="fa-solid fa-coins"
              error=""
            />
          </div>

          <div className="services-create-grid services-create-grid--single">
            <Field
              type="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              label="الوصف"
              iconClass="fa-solid fa-file-lines"
              error=""
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="services-secondary-btn"
              onClick={() => {
                setEditOpen(false);
                setEditingServiceId(null);
                resetForm();
              }}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              className="services-primary-btn"
              disabled={updating}
            >
              <PencilLine size={16} />
              <span>{updating ? "جاري الحفظ..." : "حفظ التعديل"}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}