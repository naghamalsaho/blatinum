import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { t } from "@/shared/i18n";
import i18n from "i18next";
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
  Building2,
  Home,
  CheckCircle2,
  XCircle,
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

import "../styles/marketing-services.css";

function isAdvertisementActive(advertisement) {
  if (typeof advertisement?.status === "boolean") return advertisement.status;
  if (typeof advertisement?.is_active === "boolean") return advertisement.is_active;
  if (advertisement?.status === "active" || advertisement?.status === 1 || advertisement?.status === "1") return true;
  return false;
}

function getStatusMeta(status) {
  const metaMap = {
    active: { label: t("marketing_ads.toolbar.status_active"), type: "ok" },
    draft: { label: t("marketing_ads.toolbar.status_inactive"), type: "off" },
  };
  return metaMap[status] || { label: status || "-", type: "off" };
}

function getAdvertisementRowMeta(advertisement) {
  const active = isAdvertisementActive(advertisement);
  return getStatusMeta(active ? "active" : "draft");
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

  const statusOptions = useMemo(
    () => [
      { id: "all", label: t("marketing_ads.toolbar.status_all") },
      { id: "active", label: t("marketing_ads.toolbar.status_active") },
      { id: "draft", label: t("marketing_ads.toolbar.status_inactive") },
      { id: "with_offer", label: t("marketing_ads.toolbar.status_with_offer") },
    ],
    []
  );

  const stats = useMemo(() => {
    const totalAds = advertisements.length;
    const activeCount = activeAdvertisements.length;
    const offersCount = advertisements.filter((item) => item.offer && item.offer.is_active).length;
    const avgDuration =
      totalAds > 0
        ? Math.round(advertisements.reduce((sum, item) => sum + Number(item.duration_days || 0), 0) / totalAds)
        : 0;

    return [
      { title: t("marketing_ads.stats.total_ads"), value: String(totalAds), icon: Megaphone },
      { title: t("marketing_ads.stats.active_ads"), value: String(activeCount), icon: Sparkles },
      { title: t("marketing_ads.stats.offer_ads"), value: String(offersCount), icon: Tag },
      { title: t("marketing_ads.stats.avg_duration"), value: t("marketing_ads.stats.days_unit", { count: avgDuration }), icon: CalendarDays },
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
        item.offer?.item?.unit_number || "",
        item.offer?.item?.type || "",
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
    if (window.confirm(t("marketing_ads.table.confirm_delete"))) {
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
  const currentLang = i18n?.language || "ar";

  return (
    <div className="marketing-services-page" dir={currentLang === "ar" ? "rtl" : "ltr"}>
      {/* 1. الإحصائيات العلوية */}
      <section className="legal-stats-grid">
        {stats.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} icon={item.icon} />
        ))}
      </section>

      {/* 2. شريط الأدوات والتصفية */}
      <div className="exact-toolbar-card" dir={currentLang === "ar" ? "rtl" : "ltr"}>
        <button type="button" className="exact-primary-btn" onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          <span>{t("marketing_ads.toolbar.new_ad")}</span>
        </button>

        <div className="exact-select-wrapper">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {statusOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="exact-select-chevron" />
        </div>

        <div className="exact-filter-label">
          <SlidersHorizontal size={16} />
          <span>{t("marketing_ads.toolbar.filter")}</span>
        </div>

        <div className="exact-search-field">
          <input
            type="text"
            placeholder={t("marketing_ads.toolbar.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* 3. جدول الإعلانات */}
      <TableCard title={t("marketing_ads.table.title")}>
        {pageLoading ? (
          <div className="table-state">{t("marketing_ads.table.loading")}</div>
        ) : error ? (
          <div className="table-state is-error">
            {typeof error === "string" ? error : t("marketing_ads.table.unexpected_error")}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>{t("marketing_ads.table.col_ad")}</th>
                  <th>{t("marketing_ads.table.col_period")}</th>
                  <th>{t("marketing_ads.table.col_property")}</th>
                  <th>{t("marketing_ads.table.col_discount")}</th>
                  <th>{t("marketing_ads.table.col_attachments")}</th>
                  <th>{t("marketing_ads.table.col_status")}</th>
                  <th>{t("marketing_ads.table.col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.length > 0 ? (
                  filteredAds.map((item) => {
                    const meta = getAdvertisementRowMeta(item);
                    const firstImage = getFirstImage(item);
                    const offerObj = item.offer;
                    const itemObj = offerObj?.item;

                    return (
                      <tr key={item.id}>
                        {/* عنوان الإعلان والوصف */}
                        <td>
                          <div className="services-item-cell">
                            <button
                              type="button"
                              className="services-thumb-btn"
                              onClick={() => {
                                setPreviewAdvertisement(item);
                                setPreviewOpen(true);
                              }}
                              title={t("marketing_ads.table.view_details")}
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
                              <strong>#{item.id} {item.title}</strong>
                              <span>{item.description || t("marketing_ads.table.no_description")}</span>
                            </div>
                          </div>
                        </td>

                        {/* الفترة والمدة */}
                        <td className="services-date">
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span>{t("marketing_ads.table.from", { date: formatDate(item.starts_at) })}</span>
                            <span>{t("marketing_ads.table.to", { date: formatDate(item.ends_at) })}</span>
                            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                              {t("marketing_ads.table.duration", { count: item.duration_days || "—" })}
                            </span>
                          </div>
                        </td>

                        {/* تفاصيل العقار المرتبط */}
                        <td>
                          {itemObj ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.85rem" }}>
                              <strong>
                                <Home size={13} style={{ display: "inline", marginInlineEnd: 4 }} />
                                {t("marketing_ads.table.unit", { number: itemObj.unit_number })}
                              </strong>
                              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                                {t("marketing_ads.table.building_meta", {
                                  building_id: itemObj.building_id,
                                  type: itemObj.type,
                                  area: itemObj.area,
                                })}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: itemObj.status === "available" ? "#10b981" : "var(--dash-text-muted)" }}>
                                {t("marketing_ads.table.property_status", { status: itemObj.status })}
                              </span>
                            </div>
                          ) : (
                            <span className="services-date">{t("marketing_ads.table.no_property")}</span>
                          )}
                        </td>

                        {/* تفاصيل الخصم والسعر */}
                        <td>
                          {offerObj ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <span className="marketing-offer-badge" style={{ width: "fit-content" }}>
                                {t("marketing_ads.table.discount_badge", { percentage: offerObj.discount_percentage })}
                              </span>
                              <span style={{ fontSize: "0.78rem" }}>
                                <s style={{ color: "#ef4444", marginInlineEnd: "4px" }}>{offerObj.old_price}</s>
                                <strong style={{ color: "#10b981" }}>{offerObj.new_price}</strong>
                              </span>
                            </div>
                          ) : (
                            <span className="services-date">{t("marketing_ads.table.no_offer")}</span>
                          )}
                        </td>

                        {/* المرفقات */}
                        <td className="services-date">
                          <ImageIcon size={14} style={{ display: "inline", verticalAlign: "middle", marginInlineEnd: 4 }} />
                          {t("marketing_ads.table.attachments_count", { count: item.attachments?.length || 0 })}
                        </td>

                        {/* الحالة */}
                        <td>
                          <StatusBadge status={meta.label} type={meta.type} />
                        </td>

                        {/* الإجراءات */}
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => {
                                setPreviewAdvertisement(item);
                                setPreviewOpen(true);
                              }}
                              title={t("marketing_ads.table.view_full_details")}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={() => handleDelete(item.id)}
                              title={t("marketing_ads.table.delete")}
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
                    <td colSpan="7" className="empty-cell">
                      {t("marketing_ads.table.empty_search")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* مودال إضافة إعلان جديد */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("marketing_ads.create_modal.title")} size="md">
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-grid">
            <div className="custom-form-group">
              <label>{t("marketing_ads.create_modal.ad_title")}</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder={t("marketing_ads.create_modal.ad_title_placeholder")} />
              <ErrorMessage message={formErrors.title} />
            </div>
            <div className="custom-form-group">
              <label>{t("marketing_ads.create_modal.duration_days")}</label>
              <input type="number" name="duration_days" value={formData.duration_days} onChange={handleChange} placeholder={t("marketing_ads.create_modal.duration_placeholder")} />
              <ErrorMessage message={formErrors.duration_days} />
            </div>
          </div>

          <div className="modal-grid">
            <div className="custom-form-group">
              <label>{t("marketing_ads.create_modal.attached_offer")}</label>
              <select name="offer_id" value={formData.offer_id} onChange={handleChange}>
                <option value="">{t("marketing_ads.create_modal.no_offer_option")}</option>
                {offersList.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.item?.unit_number
                      ? t("marketing_ads.create_modal.offer_option_unit", { percentage: off.discount_percentage, unit: off.item.unit_number })
                      : t("marketing_ads.create_modal.offer_option_id", { percentage: off.discount_percentage, id: off.id })}
                  </option>
                ))}
              </select>
            </div>
            <div className="custom-form-group">
              <label>{t("marketing_ads.create_modal.status")}</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="1">{t("marketing_ads.create_modal.active")}</option>
                <option value="0">{t("marketing_ads.create_modal.draft")}</option>
              </select>
            </div>
          </div>

          <div className="custom-form-group">
            <label>{t("marketing_ads.create_modal.attachment")}</label>
            <input type="file" name="attachment" onChange={handleChange} accept="image/*" />
            <ErrorMessage message={formErrors.attachmentFile} />
          </div>

          <div className="custom-form-group">
            <label>{t("marketing_ads.create_modal.description")}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t("marketing_ads.create_modal.description_placeholder")}
              rows={3}
              style={{
                width: "100%",
                border: "1px solid var(--dash-line)",
                borderRadius: "12px",
                background: "var(--dash-input-bg)",
                color: "var(--dash-text)",
                padding: "10px 14px",
                outline: "none",
              }}
            />
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
              {t("marketing_ads.create_modal.cancel")}
            </button>
            <button type="submit" className="exact-primary-btn" disabled={loading}>
              {loading ? t("marketing_ads.create_modal.saving") : t("marketing_ads.create_modal.save")}
            </button>
          </div>
        </form>
      </Modal>

      {/* مودال استعراض كافة التفاصيل */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={t("marketing_ads.details_modal.title")} size="lg">
        {previewAdvertisement && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {getFirstImage(previewAdvertisement) && (
              <div className="services-preview-image">
                <img src={getFirstImage(previewAdvertisement)} alt={previewAdvertisement.title} />
              </div>
            )}

            {/* معلومات الإعلان الأساسية */}
            <div style={{ border: "1px solid var(--dash-line)", borderRadius: "12px", padding: "16px", background: "var(--dash-card-bg)" }}>
              <h4 style={{ margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--dash-text)" }}>
                <Megaphone size={18} /> {t("marketing_ads.details_modal.basic_info")}
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.9rem" }}>
                <div><strong>{t("marketing_ads.details_modal.id")}</strong> #{previewAdvertisement.id}</div>
                <div><strong>{t("marketing_ads.details_modal.ad_title")}</strong> {previewAdvertisement.title}</div>
                <div>
                  <strong>{t("marketing_ads.details_modal.status")}</strong>{" "}
                  {isAdvertisementActive(previewAdvertisement) ? (
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>
                      {t("marketing_ads.details_modal.active")} <CheckCircle2 size={14} style={{ display: "inline" }} />
                    </span>
                  ) : (
                    <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                      {t("marketing_ads.details_modal.inactive")} <XCircle size={14} style={{ display: "inline" }} />
                    </span>
                  )}
                </div>
                <div><strong>{t("marketing_ads.details_modal.total_duration")}</strong> {t("marketing_ads.details_modal.days", { count: previewAdvertisement.duration_days || "—" })}</div>
                <div><strong>{t("marketing_ads.details_modal.starts_at")}</strong> {formatDate(previewAdvertisement.starts_at)}</div>
                <div><strong>{t("marketing_ads.details_modal.ends_at")}</strong> {formatDate(previewAdvertisement.ends_at)}</div>
                <div><strong>{t("marketing_ads.details_modal.created_by")}</strong> #{previewAdvertisement.created_by || "—"}</div>
                <div><strong>{t("marketing_ads.details_modal.created_at")}</strong> {formatDate(previewAdvertisement.created_at)}</div>
                <div><strong>{t("marketing_ads.details_modal.updated_at")}</strong> {formatDate(previewAdvertisement.updated_at)}</div>
              </div>
            </div>

            {/* تفاصيل العرض المرتبط */}
            {previewAdvertisement.offer ? (
              <div style={{ border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "16px", backgroundColor: "rgba(16, 185, 129, 0.05)" }}>
                <h4 style={{ margin: "0 0 14px 0", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Tag size={18} /> {t("marketing_ads.details_modal.offer_info")}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.9rem" }}>
                  <div><strong>{t("marketing_ads.details_modal.offer_id")}</strong> #{previewAdvertisement.offer.id}</div>
                  <div>
                    <strong>{t("marketing_ads.details_modal.discount")}</strong>{" "}
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "1.05rem" }}>{previewAdvertisement.offer.discount_percentage}%</span>
                  </div>
                  <div>
                    <strong>{t("marketing_ads.details_modal.old_price")}</strong>{" "}
                    <span style={{ textDecoration: "line-through", color: "#ef4444" }}>{previewAdvertisement.offer.old_price}</span>
                  </div>
                  <div>
                    <strong>{t("marketing_ads.details_modal.new_price")}</strong>{" "}
                    <span style={{ fontWeight: "bold", color: "#10b981", fontSize: "1.05rem" }}>{previewAdvertisement.offer.new_price}</span>
                  </div>
                  <div><strong>{t("marketing_ads.details_modal.offer_start")}</strong> {formatDate(previewAdvertisement.offer.start_date)}</div>
                  <div><strong>{t("marketing_ads.details_modal.offer_end")}</strong> {formatDate(previewAdvertisement.offer.end_date)}</div>
                  <div><strong>{t("marketing_ads.details_modal.offer_created")}</strong> {formatDate(previewAdvertisement.offer.created_at)}</div>
                  <div>
                    <strong>{t("marketing_ads.details_modal.offer_status")}</strong>{" "}
                    {previewAdvertisement.offer.is_active ? t("marketing_ads.details_modal.active") : t("marketing_ads.details_modal.inactive")}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "14px", border: "1px dashed var(--dash-line)", borderRadius: "12px", textAlign: "center", color: "var(--dash-text-muted)" }}>
                {t("marketing_ads.details_modal.no_offer")}
              </div>
            )}

            {/* تفاصيل العقار/الوحدة المرتبطة */}
            {previewAdvertisement.offer?.item ? (
              <div style={{ border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", padding: "16px", backgroundColor: "rgba(59, 130, 246, 0.05)" }}>
                <h4 style={{ margin: "0 0 14px 0", color: "#3b82f6", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building2 size={18} /> {t("marketing_ads.details_modal.property_info")}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.9rem" }}>
                  <div><strong>{t("marketing_ads.details_modal.item_id")}</strong> #{previewAdvertisement.offer.item.id}</div>
                  <div><strong>{t("marketing_ads.details_modal.building_id")}</strong> #{previewAdvertisement.offer.item.building_id}</div>
                  <div><strong>{t("marketing_ads.details_modal.unit_number")}</strong> <span style={{ fontWeight: "bold" }}>{previewAdvertisement.offer.item.unit_number}</span></div>
                  <div><strong>{t("marketing_ads.details_modal.property_type")}</strong> {previewAdvertisement.offer.item.type}</div>
                  <div><strong>{t("marketing_ads.details_modal.floor")}</strong> {previewAdvertisement.offer.item.floor}</div>
                  <div><strong>{t("marketing_ads.details_modal.area")}</strong> {t("marketing_ads.details_modal.area_m2", { area: previewAdvertisement.offer.item.area })}</div>
                  <div><strong>{t("marketing_ads.details_modal.rooms")}</strong> {previewAdvertisement.offer.item.rooms_count}</div>
                  <div><strong>{t("marketing_ads.details_modal.original_price")}</strong> {previewAdvertisement.offer.item.original_price}</div>
                  <div><strong>{t("marketing_ads.details_modal.current_price")}</strong> <span style={{ color: "#10b981", fontWeight: "bold" }}>{previewAdvertisement.offer.item.current_price}</span></div>
                  <div><strong>{t("marketing_ads.details_modal.property_status_label")}</strong> <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{previewAdvertisement.offer.item.status}</span></div>
                  <div><strong>{t("marketing_ads.details_modal.property_registered")}</strong> {formatDate(previewAdvertisement.offer.item.created_at)}</div>
                </div>
              </div>
            ) : null}

            {/* الوصف التفصيلي */}
            <div style={{ border: "1px solid var(--dash-line)", borderRadius: "12px", padding: "16px", background: "var(--dash-card-bg)" }}>
              <h4 style={{ margin: "0 0 8px 0" }}>{t("marketing_ads.details_modal.description_title")}</h4>
              <p style={{ margin: 0, lineHeight: 1.6, color: "var(--dash-text-muted)" }}>
                {previewAdvertisement.description || t("marketing_ads.details_modal.no_description_provided")}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}