import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Boxes,
  CircleSlash2,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  Trash2,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Toolbar from "@/shared/components/Toolbar";
import TableCard from "@/shared/components/TableCard";
import Button from "@/shared/components/Button";
import Field from "@/shared/components/Field";
import Modal from "@/shared/components/Modal";
import StatusDropdown from "@/shared/components/StatusDropdown";
import { getWarehousesRequest } from "../features/warehouses/api/warehouse.api";
import {
  createItem,
  deleteItem,
  fetchItems,
  updateItem,
} from "../features/items/model/item.thunks";

import "../features/items/styles/items.css";

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All statuses",
    dotClass: "",
  },
  {
    value: "in_stock",
    label: "In stock",
    dotClass: "ok",
  },
  {
    value: "out_of_stock",
    label: "Out of stock",
    dotClass: "busy",
  },
  {
    value: "discontinued",
    label: "Discontinued",
    dotClass: "off",
  },
];

const ITEM_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value !== "all");

const INITIAL_CREATE_FORM = {
  warehouse_id: "",
  sku: "",
  name: "",
  description: "",
  quantity: "",
  expiry_date: "",
  purchase_date: "",
  received_date: "",
};

const getItemFieldErrors = (formData, existingItems = [], { requireWarehouse = false } = {}) => {
  const errors = {};
  const quantity = Number(formData.quantity);
  const sku = formData.sku.trim().toLowerCase();
  const purchaseTime = formData.purchase_date ? new Date(formData.purchase_date).getTime() : null;
  const receivedTime = formData.received_date ? new Date(formData.received_date).getTime() : null;
  const expiryTime = formData.expiry_date ? new Date(formData.expiry_date).getTime() : null;

  if (requireWarehouse && !formData.warehouse_id) errors.warehouse_id = "Warehouse is required.";
  if (!formData.sku.trim()) errors.sku = "SKU is required.";
  if (!formData.name.trim()) errors.name = "Name is required.";
  if (!formData.description.trim()) errors.description = "Description is required.";
  if (sku && existingItems.some((item) => String(item.sku || "").trim().toLowerCase() === sku)) {
    errors.sku = "SKU must be unique.";
  }
  if (formData.quantity === "") errors.quantity = "Quantity is required.";
  if (formData.quantity !== "" && (!Number.isFinite(quantity) || quantity < 0)) {
    errors.quantity = "Quantity must be zero or more.";
  }
  if (!formData.expiry_date) errors.expiry_date = "Expiry date is required.";
  if (!formData.purchase_date) errors.purchase_date = "Purchase date is required.";
  if (!formData.received_date) errors.received_date = "Received date is required.";
  if (purchaseTime && receivedTime && receivedTime < purchaseTime) {
    errors.received_date = "Received date cannot be before purchase date.";
  }
  if (receivedTime && expiryTime && expiryTime < receivedTime) {
    errors.expiry_date = "Expiry date cannot be before received date.";
  }

  return errors;
};

const getItemFormErrors = (formData, existingItems = [], options = {}) =>
  Object.values(getItemFieldErrors(formData, existingItems, options));

const getTouchedFields = (formData) =>
  Object.keys(formData).reduce(
    (fields, key) => ({
      ...fields,
      [key]: true,
    }),
    {}
  );

const getDateValue = (value) => {
  if (!value) return "";
  if (typeof value === "object" && value !== null) return value.date || "";
  return value;
};

const formatDate = (value) => {
  const dateValue = getDateValue(value);

  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-GB");
};

const getItemWarehouseId = (item) => item.warehouse?.id ?? item.warehouse_id ?? "";
const getItemWarehouseName = (item) => item.warehouse?.name || "";
const getItemWarehouseLocation = (item) => {
  const location = item.warehouse?.location;

  if (typeof location === "object" && location !== null) {
    return [location.name, location.type].filter(Boolean).join(" - ");
  }

  return location || "";
};
const getItemWarehouseLabel = (item) => {
  const warehouseId = getItemWarehouseId(item);
  const warehouseName = getItemWarehouseName(item);

  if (!warehouseId && !warehouseName) return "-";

  return [`#${warehouseId}`, warehouseName].filter(Boolean).join(" - ");
};

const getWarehouseLocationLabel = (warehouse) => {
  const location = warehouse?.location;

  if (typeof location === "object" && location !== null) {
    return [location.name, location.type].filter(Boolean).join(" - ");
  }

  return location || "";
};

const getWarehouseOptionLabel = (warehouse) => {
  const parts = [`#${warehouse.id}`, warehouse.name, getWarehouseLocationLabel(warehouse)];

  return parts.filter(Boolean).join(" - ");
};

export default function AdminItemsPage() {
  const dispatch = useDispatch();
  const {
    items = [],
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.items || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [createFormData, setCreateFormData] = useState(INITIAL_CREATE_FORM);
  const [createTouched, setCreateTouched] = useState({});
  const [createError, setCreateError] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  useEffect(() => {
    let ignore = false;

    const loadWarehouses = async () => {
      setWarehousesLoading(true);

      const result = await getWarehousesRequest();

      if (!ignore && result.ok) {
        setWarehouses(result.data?.data ?? []);
      }

      if (!ignore) {
        setWarehousesLoading(false);
      }
    };

    loadWarehouses();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const searchableText = [
        item.id,
        getItemWarehouseId(item),
        getItemWarehouseName(item),
        getItemWarehouseLocation(item),
        item.warehouse?.address,
        item.warehouse?.description,
        item.sku,
        item.name,
        item.description,
        item.status,
        item.quantity,
        getDateValue(item.purchase_date),
        getDateValue(item.received_date),
        getDateValue(item.expiry_date),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const total = items.length;
  const inStock = items.filter((item) => item.status === "in_stock").length;
  const unavailable = items.filter((item) =>
    ["out_of_stock", "discontinued"].includes(item.status)
  ).length;
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const warehouseOptions = useMemo(() => {
    const optionsById = new Map();

    items.forEach((item) => {
      if (item.warehouse?.id) {
        optionsById.set(String(item.warehouse.id), item.warehouse);
      }
    });

    warehouses.forEach((warehouse) => {
      if (warehouse?.id) {
        optionsById.set(String(warehouse.id), warehouse);
      }
    });

    return Array.from(optionsById.values());
  }, [items, warehouses]);
  const createFieldErrors = useMemo(
    () => getItemFieldErrors(createFormData, items, { requireWarehouse: true }),
    [createFormData, items]
  );

  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setCreateError("");
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBlur = (event) => {
    const { name } = event.target;

    setCreateTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateFormData(INITIAL_CREATE_FORM);
    setCreateTouched({});
    setCreateError("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const validationErrors = getItemFormErrors(createFormData, items, {
      requireWarehouse: true,
    });

    if (validationErrors.length > 0) {
      const message = validationErrors.join("\n");
      setCreateTouched(getTouchedFields(createFormData));
      setCreateError(message);
      return;
    }

    const quantity = Number(createFormData.quantity || 0);
    const result = await dispatch(
      createItem({
        ...createFormData,
        status: quantity > 0 ? "in_stock" : "out_of_stock",
      })
    );

    if (createItem.fulfilled.match(result)) {
      closeCreateModal();
    } else {
      const message = result.payload || "Failed to create item.";
      setCreateError(message);
    }
  };

  const handleStatusChange = async (item, status) => {
    if (!item?.id || item.status === status) return;

    await dispatch(
      updateItem({
        id: item.id,
        payload: { status },
      })
    );
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem?.id) return;

    const result = await dispatch(deleteItem(selectedItem.id));

    if (deleteItem.fulfilled.match(result)) {
      closeDeleteModal();
    }
  };

  return (
    <div className="items-page" dir="ltr">
      <PageHeader
        kicker="Admin Core"
        title="Warehouse Items"
        subtitle="Track every item stored across company warehouses with quantity, status, dates, and warehouse ownership."
        action={
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => setCreateOpen(true)}
          >
            <PackagePlus size={18} />
            <span>New item</span>
          </button>
        }
      />

      <div className="legal-stats-grid">
        <StatCard
          title="Total items"
          value={total}
          note="All item records"
          icon={Boxes}
        />
        <StatCard
          title="In stock"
          value={inStock}
          note="Ready to use"
          icon={PackageCheck}
        />
        <StatCard
          title="Unavailable"
          value={unavailable}
          note="Out or discontinued"
          icon={CircleSlash2}
        />
        <StatCard
          title="Total quantity"
          value={totalQuantity}
          note="Units across warehouses"
          icon={PackageSearch}
        />
      </div>

      <Toolbar
        placeholder="Search by SKU, item, warehouse, status, or date..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={STATUS_OPTIONS}
      />

      <TableCard title="Item list" count={filteredItems.length}>
        {loading ? (
          <div style={{ padding: "16px" }}>Loading items...</div>
        ) : error ? (
          <div style={{ padding: "16px", color: "red" }}>{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Item</th>
                <th>Warehouse</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Purchase</th>
                <th>Received</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td data-label="ID">{item.id}</td>
                      <td data-label="SKU">{item.sku || "-"}</td>
                      <td data-label="Item">
                        <div className="item-name-cell">
                          <strong>{item.name || "-"}</strong>
                          <span>{item.description || "No description"}</span>
                        </div>
                      </td>
                      <td data-label="Warehouse">
                        <div className="item-warehouse-cell">
                          <strong>{getItemWarehouseLabel(item)}</strong>
                          <span>{getItemWarehouseLocation(item) || "-"}</span>
                        </div>
                      </td>
                      <td data-label="Quantity">{item.quantity ?? "-"}</td>
                      <td data-label="Status">
                        <StatusDropdown
                          trigger="button"
                          value={item.status || "out_of_stock"}
                          options={ITEM_STATUS_OPTIONS}
                          onChange={(status) => handleStatusChange(item, status)}
                        />
                      </td>
                      <td data-label="Purchase">{formatDate(item.purchase_date)}</td>
                      <td data-label="Received">{formatDate(item.received_date)}</td>
                      <td data-label="Expiry">{formatDate(item.expiry_date)}</td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => openDeleteModal(item)}
                          disabled={actionLoading}
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ padding: "16px", textAlign: "center" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={createOpen}
        onClose={closeCreateModal}
        title="Create item"
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreate}>
          {createError ? <div className="form-alert">{createError}</div> : null}

          <div className="modal-grid">
            <div className="field-group">
              <div className="field-wrapper">
                <select
                  name="warehouse_id"
                  required
                  value={createFormData.warehouse_id}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  disabled={warehousesLoading && warehouseOptions.length === 0}
                >
                  <option value="">Select warehouse</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={String(warehouse.id)}>
                      {getWarehouseOptionLabel(warehouse)}
                    </option>
                  ))}
                </select>
                <label>Warehouse</label>
                <i className="fa-solid fa-warehouse"></i>
              </div>
              {createTouched.warehouse_id && createFieldErrors.warehouse_id ? (
                <p className="field-error">{createFieldErrors.warehouse_id}</p>
              ) : null}
            </div>

            <Field
              name="sku"
              value={createFormData.sku}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="SKU"
              iconClass="fa-solid fa-barcode"
              error={createTouched.sku ? createFieldErrors.sku : ""}
            />

            <Field
              name="name"
              value={createFormData.name}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="Name"
              iconClass="fa-solid fa-box"
              error={createTouched.name ? createFieldErrors.name : ""}
            />

            <Field
              name="description"
              value={createFormData.description}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="Description"
              iconClass="fa-solid fa-align-left"
              error={createTouched.description ? createFieldErrors.description : ""}
            />

            <Field
              type="number"
              name="quantity"
              value={createFormData.quantity}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="Quantity"
              iconClass="fa-solid fa-hashtag"
              error={createTouched.quantity ? createFieldErrors.quantity : ""}
            />

            <Field
              type="date"
              name="expiry_date"
              value={createFormData.expiry_date}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="Expiry date"
              iconClass="fa-solid fa-calendar-xmark"
              error={createTouched.expiry_date ? createFieldErrors.expiry_date : ""}
            />

            <Field
              type="date"
              name="purchase_date"
              value={createFormData.purchase_date}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="Purchase date"
              iconClass="fa-solid fa-calendar-day"
              error={createTouched.purchase_date ? createFieldErrors.purchase_date : ""}
            />

            <Field
              type="date"
              name="received_date"
              value={createFormData.received_date}
              onChange={handleCreateChange}
              onBlur={handleCreateBlur}
              label="Received date"
              iconClass="fa-solid fa-calendar-check"
              error={createTouched.received_date ? createFieldErrors.received_date : ""}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeCreateModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={closeDeleteModal}
        title="Delete item"
        size="sm"
      >
        <div className="modal-form">
          <p className="warehouse-delete-copy">
            {selectedItem
              ? `Delete ${selectedItem.name || selectedItem.sku || `item #${selectedItem.id}`}?`
              : "Delete this item?"}
          </p>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeDeleteModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleDeleteItem}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
