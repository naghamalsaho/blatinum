import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Banknote,
  BadgeCheck,
  Building2,
  HeartHandshake,
  ContactRound,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users2,
  X,
  ChevronDown,
  SlidersHorizontal,
  Eye,
} from "lucide-react";

import { t } from "../../../shared/i18n";

import StatCard from "@/shared/components/StatCard";
import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import TableCard from "@/shared/components/TableCard";
import StatusBadge from "@/shared/components/StatusBadge";

// Thunks المبيعات والملكيات
import {
  fetchSoldUnitOwnership,
  fetchClientUnits,
  createSoldUnitOwnership,
  updateSoldUnitOwnership,
  deleteSoldUnitOwnership,
} from "../features/soldUnits/model/soldUnitOwnership.thunks";

import {
  clearSoldUnitOwnershipError,
  clearClientUnitsError,
} from "../features/soldUnits/model/soldUnitOwnership.slice";

// Thunks جلب الوحدات والعملاء للمودال
import { fetchUnits } from "@/Rools/marketing/features/units/model/unit.thunks";
import { fetchCustomerServiceClients } from "@/Rools/customerService/features/clients/model/client.thunks";

import "../styles/legal-sales.css";

function firstValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "—";
}

function formatNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString();
}

function getClient(item) {
  return item?.client?.account || item?.client || {};
}

function getClientId(item) {
  return firstValue(
    item?.client?.additional_info?.client_id,
    item?.client_id,
    item?.client?.id,
    item?.client?.account?.id
  );
}

function getClientName(item) {
  return firstValue(getClient(item)?.full_name, item?.client?.full_name, item?.client?.name);
}

function getClientEmail(item) {
  return firstValue(getClient(item)?.email, item?.client?.email);
}

function getClientPhone(item) {
  return firstValue(getClient(item)?.phone, item?.client?.phone);
}

function getClientAddress(item) {
  return firstValue(getClient(item)?.address, item?.client?.address);
}

function getClientRole(item) {
  const roles = getClient(item)?.roles;
  if (Array.isArray(roles) && roles.length > 0) return roles.join(" · ");
  return firstValue(getClient(item)?.type, item?.client?.type);
}

function getClientJobTitle(item) {
  return firstValue(item?.client?.additional_info?.job_title);
}

function getClientSocialStatus(item) {
  return firstValue(item?.client?.additional_info?.social_status);
}

function getClientNationalId(item) {
  return firstValue(item?.client?.additional_info?.national_id);
}

function getUnit(item) {
  return item?.unit || {};
}

function getUnitNumber(item) {
  return firstValue(getUnit(item)?.unit_number, getUnit(item)?.id);
}

function getUnitDescription(item) {
  return firstValue(getUnit(item)?.description);
}

function getUnitType(item) {
  return firstValue(getUnit(item)?.type);
}

function getUnitFloor(item) {
  return firstValue(getUnit(item)?.floor);
}

function getUnitArea(item) {
  return firstValue(getUnit(item)?.area);
}

function getRoomsCount(item) {
  return firstValue(getUnit(item)?.rooms_count);
}

function getUnitPrice(item) {
  return firstValue(getUnit(item)?.price);
}

function getUnitStatus(item) {
  return firstValue(getUnit(item)?.status);
}

function getPurchasePrice(item) {
  return firstValue(item?.purchase_price);
}

function getOwnedAt(item) {
  return firstValue(item?.owned_at);
}

function getCreatedAt(item) {
  return firstValue(item?.created_at);
}

function getFirstImage(item) {
  return (
    item?.attachments?.find((attachment) => attachment.type === "image")?.url ||
    null
  );
}

function getOwnershipStatusMeta(item) {
  if (item?.status === "active") return { label: t("legal_sales.status_active"), type: "ok" };
  if (item?.status === "inactive") return { label: t("legal_sales.status_inactive"), type: "off" };
  if (item?.status === "pending") return { label: t("legal_sales.status_pending"), type: "busy" };

  if (typeof item?.status === "boolean") {
    return item.status
      ? { label: t("legal_sales.status_active"), type: "ok" }
      : { label: t("legal_sales.status_inactive"), type: "off" };
  }

  if (typeof item?.status === "number") {
    return item.status === 1
      ? { label: t("legal_sales.status_active"), type: "ok" }
      : { label: t("legal_sales.status_inactive"), type: "off" };
  }

  const normalized = String(item?.status || "").toLowerCase();

  if (normalized === "1" || normalized === "true" || normalized === "active") {
    return { label: t("legal_sales.status_active"), type: "ok" };
  }

  if (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "inactive"
  ) {
    return { label: t("legal_sales.status_inactive"), type: "off" };
  }

  return { label: "—", type: "busy" };
}

function getUnitBadgeMeta(unitStatus) {
  const normalized = String(unitStatus || "").toLowerCase();

  if (normalized === "sold") return { label: t("legal_sales.unit_sold"), type: "ok" };
  if (normalized === "available") return { label: t("legal_sales.unit_available"), type: "busy" };
  if (normalized === "reserved") return { label: t("legal_sales.unit_reserved"), type: "off" };

  return { label: unitStatus || "—", type: "busy" };
}

function getSoldOwnershipId(item) {
  return item?.id ?? item?.unit?.id ?? null;
}

function buildEditForm(item) {
  return {
    client_id: String(getClientId(item) || ""),
    purchase_price: String(
      Number(String(getPurchasePrice(item) || "").replace(/[^\d.]/g, "")) || ""
    ),
    owned_at: String(getOwnedAt(item) || ""),
    status: item?.status || "active",
    attachments: [],
  };
}

const EMPTY_CREATE_FORM = {
  unit_id: "",
  client_id: "",
  purchase_price: "",
  status: "active",
  owned_at: "",
  attachments: [],
};

export default function LegalSalesPage() {
  const dispatch = useDispatch();
  const createFileRef = useRef(null);
  const editFileRef = useRef(null);

  // Redux States
  const soldUnitOwnershipState = useSelector(
    (state) => state.soldUnitOwnership || {}
  );
  const unitsState = useSelector((state) => state.units || {});
  const clientsState = useSelector((state) => state.customerServiceClients || {});

  const items = soldUnitOwnershipState.items || [];
  const meta = soldUnitOwnershipState.meta || {};
  const loading = soldUnitOwnershipState.loading || false;
  const creating = soldUnitOwnershipState.creating || false;
  const updating = soldUnitOwnershipState.updating || false;
  const deleting = soldUnitOwnershipState.deleting || false;
  const clientUnitsLoading = soldUnitOwnershipState.clientUnitsLoading || false;
  const clientUnitsError = soldUnitOwnershipState.clientUnitsError || null;
  const error = soldUnitOwnershipState.error || null;
  const clientUnits = soldUnitOwnershipState.clientUnits || [];

  // Lists for Select Dropdowns
  const unitsList = unitsState.units || [];
  const clientsList = clientsState.items || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [clientUnitsOpen, setClientUnitsOpen] = useState(false);
  const [clientUnitsOwner, setClientUnitsOwner] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    client_id: "",
    purchase_price: "",
    owned_at: "",
    status: "active",
    attachments: [],
  });

  useEffect(() => {
    dispatch(fetchSoldUnitOwnership(1));
    dispatch(fetchUnits());
    dispatch(fetchCustomerServiceClients());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = Number(meta?.total || items.length || 0);
    const activeCount = items.filter(
      (item) => getOwnershipStatusMeta(item).type === "ok"
    ).length;
    const soldUnits = items.filter(
      (item) => String(getUnitStatus(item)).toLowerCase() === "sold"
    ).length;
    const withPhone = items.filter((item) => getClientPhone(item) !== "—").length;

    return [
      {
        title: t("legal_sales.total_sales"),
        value: String(total),
        icon: Banknote,
      },
      {
        title: t("legal_sales.active_sales"),
        value: String(activeCount),
        icon: HeartHandshake,
      },
      {
        title: t("legal_sales.sold_units"),
        value: String(soldUnits),
        icon: BadgeCheck,
      },
      {
        title: t("legal_sales.contacts"),
        value: String(withPhone),
        icon: ContactRound,
      },
    ];
  }, [items, meta]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const statusMeta = getOwnershipStatusMeta(item);
      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter ||
        (statusFilter === "active" && statusMeta.type === "ok") ||
        (statusFilter === "inactive" && statusMeta.type === "off");

      const searchable = [
        getClientName(item),
        getClientEmail(item),
        getClientPhone(item),
        getClientAddress(item),
        getClientRole(item),
        getClientJobTitle(item),
        getClientSocialStatus(item),
        getClientNationalId(item),
        getUnitNumber(item),
        getUnitDescription(item),
        getUnitType(item),
        getUnitStatus(item),
        getPurchasePrice(item),
        getOwnedAt(item),
        getCreatedAt(item),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || searchable.includes(q);

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const selectedFirstImage = getFirstImage(selectedItem);

  const resetCreateForm = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    if (createFileRef.current) createFileRef.current.value = "";
    dispatch(clearSoldUnitOwnershipError());
  };

  const resetEditForm = () => {
    setEditItem(null);
    setEditForm({
      client_id: "",
      purchase_price: "",
      owned_at: "",
      status: "active",
      attachments: [],
    });
    if (editFileRef.current) editFileRef.current.value = "";
    dispatch(clearSoldUnitOwnershipError());
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    dispatch(clearSoldUnitOwnershipError());
  };

  const openEdit = (item) => {
    const id = getSoldOwnershipId(item);

    if (!id) {
      console.error("Missing sold ownership id", item);
      return;
    }

    setEditItem({ ...item, editId: id });
    setEditForm(buildEditForm(item));
    setEditOpen(true);
    dispatch(clearSoldUnitOwnershipError());
  };

  const handleCreateChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachments") {
      const newFiles = Array.from(files || []);
      setCreateForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }));
      return;
    }

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachments") {
      const newFiles = Array.from(files || []);
      setEditForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }));
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeCreateAttachment = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const removeEditAttachment = (index) => {
    setEditForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const submitCreate = async (e) => {
    e.preventDefault();

    const unitId = String(createForm.unit_id || "").trim();
    const clientId = String(createForm.client_id || "").trim();
    const price = Number(
      String(createForm.purchase_price || "").replace(/[^\d.]/g, "").trim()
    );

    if (!unitId || !clientId || !Number.isFinite(price)) return;

    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("purchase_price", String(price));
    formData.append("status", createForm.status || "active");
    formData.append("owned_at", String(createForm.owned_at || ""));

    createForm.attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file, file.name);
    });

    const resultAction = await dispatch(
      createSoldUnitOwnership({
        id: unitId,
        formData,
      })
    );

    if (createSoldUnitOwnership.fulfilled.match(resultAction)) {
      setCreateOpen(false);
      resetCreateForm();
      dispatch(fetchSoldUnitOwnership(1));
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();

    const id = editItem?.editId || getSoldOwnershipId(editItem);

    if (!id) {
      console.error("No update id found", editItem);
      return;
    }

    const cleanPrice = Number(
      String(editForm.purchase_price || "")
        .replace(/[^\d.]/g, "")
        .trim()
    );

    const formData = new FormData();
    formData.append("client_id", String(editForm.client_id));
    formData.append("purchase_price", String(cleanPrice));
    formData.append("owned_at", String(editForm.owned_at || ""));
    if (editForm.status) {
      formData.append("status", String(editForm.status));
    }

    editForm.attachments.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file, file.name);
    });

    const resultAction = await dispatch(
      updateSoldUnitOwnership({
        id,
        formData,
      })
    );

    if (updateSoldUnitOwnership.fulfilled.match(resultAction)) {
      setEditOpen(false);
      resetEditForm();
      dispatch(fetchSoldUnitOwnership(1));
    }
  };

  const handleDelete = async (item) => {
    const id = getSoldOwnershipId(item);
    if (!id) return;

    const ok = window.confirm(t("legal_sales.confirm_delete"));
    if (!ok) return;

    const resultAction = await dispatch(deleteSoldUnitOwnership(id));

    if (deleteSoldUnitOwnership.fulfilled.match(resultAction)) {
      if (selectedItem?.id === item?.id) setSelectedItem(null);
      dispatch(fetchSoldUnitOwnership(1));
    }
  };

  const openClientUnits = async (item) => {
    const clientId = getClientId(item);
    if (!clientId) return;

    setClientUnitsOwner(getClientName(item));
    setClientUnitsOpen(true);
    dispatch(clearClientUnitsError());
    await dispatch(fetchClientUnits(clientId));
  };

  return (
    <div className="legal-sales-page" dir="rtl">
      {/* شبكة الإحصائيات الموحدة */}
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

      {/* شريط الأدوات الموحد مع واجهة المواعيد والخدمات */}
      <div className="exact-toolbar-card" dir="rtl">
        
        <div className="exact-select-wrapper">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t("legal_slots.status_all")}</option>
            <option value="active">{t("legal_sales.status_active")}</option>
            <option value="inactive">{t("legal_sales.status_inactive")}</option>
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
            placeholder={t("legal_sales.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="exact-search-icon" />
        </div>
      </div>

      {/* بطاقة جدول المبيعات بنفس تصميم TableCard */}
      <TableCard
        title={t("legal_sales.title")}
        count={filteredItems.length}
      >
        {loading ? (
          <div className="table-state">{t("legal_sales.loading_sales")}</div>
        ) : error ? (
          <div className="table-state is-error">
            {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="table-state">{t("legal_sales.no_results_found")}</div>
        ) : (
          <div className="table-scroll">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>{t("legal_sales.client")}</th>
                  <th>{t("legal_sales.unit")}</th>
                  <th>{t("legal_sales.purchase_price")}</th>
                  <th>{t("legal_sales.status")}</th>
                  <th>{t("legal_sales.ownership_date")}</th>
                  <th>{t("legal_sales.created_at")}</th>
                  <th>{t("legal_sales.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const statusMeta = getOwnershipStatusMeta(item);
                  const unitBadgeMeta = getUnitBadgeMeta(getUnitStatus(item));
                  const clientId = getClientId(item);
                  const rowId = getSoldOwnershipId(item);
                  const imageUrl = getFirstImage(item);

                  return (
                    <tr
                      key={
                        rowId ||
                        `${getUnitNumber(item)}-${getClientName(item)}-${getOwnedAt(item)}`
                      }
                    >
                      <td>
                        <div className="services-item-cell">
                          <div className="services-thumb-placeholder">
                            <Users2 size={16} />
                          </div>
                          <div className="services-item-info">
                            <button
                              type="button"
                              className="legal-sales-client-link"
                              onClick={() => openClientUnits(item)}
                              title={t("legal_sales.view_client_units")}
                            >
                              <strong>{getClientName(item)}</strong>
                            </button>
                            <span className="services-date">
                              {getClientEmail(item)} ·{" "}
                              {clientId ? `ID ${clientId}` : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="legal-sales-unit-cell">
                          <div className="legal-sales-unit-head">
                            <button
                              type="button"
                              className="legal-thumb-btn"
                              onClick={() => openDetails(item)}
                              title={t("legal_sales.view_details")}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={getUnitNumber(item)}
                                  className="legal-thumb"
                                />
                              ) : (
                                <div className="legal-thumb-placeholder">
                                  <Building2 size={16} />
                                </div>
                              )}
                            </button>

                            <span className="legal-sales-unit-number">
                              {getUnitNumber(item)}
                            </span>
                          </div>

                          <div className="legal-sales-unit-sub">
                            <span>{getUnitType(item)}</span>
                            <span>{t("legal_sales.floor")} {getUnitFloor(item)}</span>
                            <span>{getUnitArea(item)} m²</span>
                          </div>

                          <div className="legal-sales-unit-mini">
                            <span>{unitBadgeMeta.label}</span>
                            <span>{getRoomsCount(item)} {t("legal_sales.rooms")}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="services-price">
                          {getPurchasePrice(item)}
                        </span>
                      </td>

                      <td>
                        <StatusBadge
                          status={statusMeta.label}
                          type={statusMeta.type}
                        />
                      </td>

                      <td className="services-date">{getOwnedAt(item)}</td>

                      <td className="services-date">{getCreatedAt(item)}</td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => openDetails(item)}
                            title={t("legal_sales.view_details")}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => openEdit(item)}
                            title={t("legal_sales.edit")}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() => handleDelete(item)}
                            title={t("legal_sales.delete")}
                            disabled={deleting}
                          >
                            <Trash2 size={16} />
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
      </TableCard>

      {/* ================= MODAL: إضافة بيع جديد (مكون Modal الموحد) ================= */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        title={t("legal_sales.add_new_sale")}
        size="md"
      >
        <form onSubmit={submitCreate} className="modal-form" noValidate>
          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">{t("legal_sales.unit_id")}</label>
              <div className="exact-select-wrapper">
                <select
                  name="unit_id"
                  value={createForm.unit_id}
                  onChange={handleCreateChange}
                  required
                >
                  <option value="">{t("legal_sales.select_unit")}</option>
                  {unitsList.map((unit, index) => {
                    const unitId = unit?.id ?? unit?.unit_id;
                    const unitNum = unit?.unit_number || unitId;

                    return (
                      <option key={unitId || index} value={unitId || ""}>
                        {unitNum ? `${t("legal_sales.unit_number_prefix")} ${unitNum}` : `${t("legal_sales.unit_prefix")} ${unitId}`}
                        {unit?.type ? ` (${unit.type})` : ""}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">{t("legal_sales.client_id")}</label>
              <div className="exact-select-wrapper">
                <select
                  name="client_id"
                  value={createForm.client_id}
                  onChange={handleCreateChange}
                  required
                >
                  <option value="">{t("legal_sales.select_client")}</option>
                  {clientsList.map((client, index) => {
                    const clientId =
                      client?.id ??
                      client?.client_id ??
                      client?.additional_info?.client_id ??
                      client?.account?.id;

                    const clientName =
                      client?.account?.full_name ||
                      client?.full_name ||
                      client?.name ||
                      `${t("legal_sales.client_prefix")} ${clientId}`;

                    const clientPhone = client?.account?.phone || client?.phone || "";

                    return (
                      <option key={clientId || index} value={clientId || ""}>
                        {clientName} {clientPhone ? `(${clientPhone})` : ""} {clientId ? `[ID: ${clientId}]` : ""}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>
          </div>

          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">{t("legal_sales.purchase_price")}</label>
              <input
                type="text"
                name="purchase_price"
                className="input-field"
                placeholder={t("legal_sales.enter_purchase_price")}
                value={createForm.purchase_price}
                onChange={handleCreateChange}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">{t("legal_sales.ownership_date")}</label>
              <input
                type="date"
                name="owned_at"
                className="input-field"
                value={createForm.owned_at}
                onChange={handleCreateChange}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">{t("legal_sales.status")}</label>
            <div className="exact-select-wrapper">
              <select
                name="status"
                value={createForm.status}
                onChange={handleCreateChange}
              >
                <option value="active">{t("legal_sales.status_active")}</option>
                <option value="inactive">{t("legal_sales.status_inactive")}</option>
              </select>
              <ChevronDown size={16} className="exact-select-chevron" />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">{t("legal_sales.attachments_label")}</label>
            <label className="file-upload-box">
              <Upload size={18} />
              <span>{t("legal_sales.choose_files")}</span>
              <input
                type="file"
                name="attachments"
                ref={createFileRef}
                onChange={handleCreateChange}
                accept="image/*,application/pdf"
                multiple
                style={{ display: "none" }}
              />
            </label>

            {createForm.attachments.length > 0 && (
              <div className="attachments-list">
                {createForm.attachments.map((file, idx) => (
                  <div key={idx} className="attachment-chip">
                    <span>{file.name}</span>
                    <X
                      size={14}
                      onClick={() => removeCreateAttachment(idx)}
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
                resetCreateForm();
              }}
              disabled={creating}
            >
              {t("legal_sales.cancel")}
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={creating}
            >
              <Plus size={16} />
              <span>{creating ? t("legal_sales.saving") : t("legal_sales.save_sale")}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: تعديل بيع (مكون Modal الموحد) ================= */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          resetEditForm();
        }}
        title={t("legal_sales.edit_sale")}
        size="md"
      >
        <form onSubmit={submitEdit} className="modal-form" noValidate>
          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">{t("legal_sales.client_id")}</label>
              <div className="exact-select-wrapper">
                <select
                  name="client_id"
                  value={editForm.client_id}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">{t("legal_sales.select_client")}</option>
                  {clientsList.map((client, index) => {
                    const clientId =
                      client?.id ??
                      client?.client_id ??
                      client?.additional_info?.client_id ??
                      client?.account?.id;

                    const clientName =
                      client?.account?.full_name ||
                      client?.full_name ||
                      client?.name ||
                      `${t("legal_sales.client_prefix")} ${clientId}`;

                    return (
                      <option key={clientId || index} value={clientId || ""}>
                        {clientName}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">{t("legal_sales.purchase_price")}</label>
              <input
                type="text"
                name="purchase_price"
                className="input-field"
                placeholder={t("legal_sales.enter_purchase_price")}
                value={editForm.purchase_price}
                onChange={handleEditChange}
                required
              />
            </div>
          </div>

          <div className="modal-grid">
            <div className="field-group">
              <label className="field-label">{t("legal_sales.ownership_date")}</label>
              <input
                type="date"
                name="owned_at"
                className="input-field"
                value={editForm.owned_at}
                onChange={handleEditChange}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">{t("legal_sales.status")}</label>
              <div className="exact-select-wrapper">
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                >
                  <option value="active">{t("legal_sales.status_active")}</option>
                  <option value="inactive">{t("legal_sales.status_inactive")}</option>
                </select>
                <ChevronDown size={16} className="exact-select-chevron" />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">{t("legal_sales.add_new_attachments")}</label>
            <label className="file-upload-box">
              <Upload size={18} />
              <span>{t("legal_sales.choose_files")}</span>
              <input
                type="file"
                name="attachments"
                ref={editFileRef}
                onChange={handleEditChange}
                accept="image/*,application/pdf"
                multiple
                style={{ display: "none" }}
              />
            </label>

            {editForm.attachments.length > 0 && (
              <div className="attachments-list">
                {editForm.attachments.map((file, idx) => (
                  <div key={idx} className="attachment-chip">
                    <span>{file.name}</span>
                    <X
                      size={14}
                      onClick={() => removeEditAttachment(idx)}
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
                setEditOpen(false);
                resetEditForm();
              }}
              disabled={updating}
            >
              {t("legal_sales.cancel")}
            </Button>

            <Button
              type="submit"
              className="exact-primary-btn"
              disabled={updating}
            >
              <Pencil size={16} />
              <span>{updating ? t("legal_sales.updating") : t("legal_sales.save_changes")}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: تفاصيل البيع ================= */}
      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={firstValue(getUnitNumber(selectedItem), t("legal_sales.sale_details"))}
        description={t("legal_sales.sale_details_desc")}
        size="lg"
      >
        {selectedItem ? (
          <div className="legal-sales-details">
            {selectedFirstImage ? (
              <div className="legal-sales-preview-image">
                <img
                  src={selectedFirstImage}
                  alt={getUnitNumber(selectedItem)}
                />
              </div>
            ) : null}

            <div className="legal-sales-details-grid">
              <div><strong>{t("legal_sales.client_name")}</strong><span>{getClientName(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.email")}</strong><span>{getClientEmail(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.phone")}</strong><span>{getClientPhone(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.address")}</strong><span>{getClientAddress(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.job_title")}</strong><span>{getClientJobTitle(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.social_status")}</strong><span>{getClientSocialStatus(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.national_id")}</strong><span>{getClientNationalId(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.role")}</strong><span>{getClientRole(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.unit_number")}</strong><span>{getUnitNumber(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.unit_type")}</strong><span>{getUnitType(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.area")}</strong><span>{getUnitArea(selectedItem)} m²</span></div>
              <div><strong>{t("legal_sales.rooms_count")}</strong><span>{getRoomsCount(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.unit_price")}</strong><span>{formatNumber(getUnitPrice(selectedItem))}</span></div>
              <div><strong>{t("legal_sales.purchase_price")}</strong><span>{getPurchasePrice(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.ownership_date")}</strong><span>{getOwnedAt(selectedItem)}</span></div>
              <div><strong>{t("legal_sales.created_at")}</strong><span>{getCreatedAt(selectedItem)}</span></div>
            </div>

            <div className="legal-sales-preview-description">
              <h4>{t("legal_sales.unit_description")}</h4>
              <p>{getUnitDescription(selectedItem)}</p>
            </div>

            {selectedItem?.attachments?.length ? (
              <div className="legal-sales-attachments">
                {selectedItem.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="legal-sales-attachment-pill"
                  >
                    <FileText size={12} />
                    {attachment.original_name || attachment.file_name}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* ================= MODAL: وحدات العميل ================= */}
      <Modal
        open={clientUnitsOpen}
        onClose={() => {
          setClientUnitsOpen(false);
          dispatch(clearClientUnitsError());
        }}
        title={t("legal_sales.client_units_title")}
        description={
          clientUnitsOwner
            ? `${t("legal_sales.client_units_desc")} ${clientUnitsOwner}`
            : t("legal_sales.view_client_units_desc")
        }
        size="lg"
      >
        <div className="legal-sales-client-units">
          {clientUnitsLoading ? (
            <div className="table-state">{t("legal_sales.loading_units")}</div>
          ) : clientUnitsError ? (
            <div className="table-state is-error">{clientUnitsError}</div>
          ) : clientUnits.length === 0 ? (
            <div className="table-state">{t("legal_sales.no_units_found")}</div>
          ) : (
            <div className="table-scroll">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>{t("legal_sales.unit")}</th>
                    <th>{t("legal_sales.purchase_price")}</th>
                    <th>{t("legal_sales.status")}</th>
                    <th>{t("legal_sales.ownership_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {clientUnits.map((row) => (
                    <tr
                      key={
                        row.id ||
                        `${firstValue(getUnitNumber(row), row?.unit?.unit_number)}-${firstValue(row?.owned_at)}`
                      }
                    >
                      <td>{firstValue(getUnitNumber(row), row?.unit?.unit_number)}</td>
                      <td>{firstValue(row?.purchase_price)}</td>
                      <td>
                        <StatusBadge
                          status={getOwnershipStatusMeta(row).label}
                          type={getOwnershipStatusMeta(row).type}
                        />
                      </td>
                      <td>{firstValue(row?.owned_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}