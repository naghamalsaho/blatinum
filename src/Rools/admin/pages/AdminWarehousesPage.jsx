import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  Archive,
  Building2,
  Eye,
  MapPin,
  PackageSearch,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Field from "@/shared/components/Field";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import StatusDropdown from "@/shared/components/StatusDropdown";
import { getLocationsRequest } from "../features/warehouses/api/warehouse.api";
import { createItem, deleteItem, updateItem } from "../features/items/model/item.thunks";
import {
  createWarehouse,
  deleteWarehouse,
  fetchWarehouses,
  updateWarehouse,
} from "../features/warehouses/model/warehouse.thunks";

import "../features/warehouses/styles/warehouses.css";

const FILTER_OPTIONS = [
  {
    value: "all",
    label: "All",
    dotClass: "",
  },
  {
    value: "stocked",
    label: "With items",
    dotClass: "ok",
  },
  {
    value: "empty",
    label: "Empty",
    dotClass: "off",
  },
];

const ITEM_STATUS_OPTIONS = [
  {
    value: "in_stock",
    label: "In stock",
    dotClass: "ok",
  },
  {
    value: "out_of_stock",
    label: "Out of stock",
    dotClass: "off",
  },
  {
    value: "discontinued",
    label: "Discontinued",
    dotClass: "off",
  },
];

const getWarehouseItems = (warehouse) => warehouse.items || [];
const getWarehouseLocationId = (warehouse) => {
  const location = warehouse?.location;

  return typeof location === "object" && location !== null ? location.id : location || "";
};
const getWarehouseLocationName = (warehouse) => {
  const location = warehouse?.location;

  if (typeof location === "object" && location !== null) {
    return [location.name, location.type].filter(Boolean).join(" - ") || "-";
  }

  return location || "-";
};
const getWarehouseDescription = (warehouse) =>
  warehouse.description || warehouse.address || getWarehouseLocationName(warehouse);

const getItemTotals = (warehouses) =>
  warehouses.reduce((sum, warehouse) => sum + getWarehouseItems(warehouse).length, 0);

const INITIAL_ITEM_FORM = {
  sku: "",
  name: "",
  description: "",
  quantity: "",
  expiry_date: "",
  purchase_date: "",
  received_date: "",
};

const getItemFieldErrors = (formData, existingItems = []) => {
  const errors = {};
  const quantity = Number(formData.quantity);
  const sku = formData.sku.trim().toLowerCase();
  const purchaseTime = formData.purchase_date ? new Date(formData.purchase_date).getTime() : null;
  const receivedTime = formData.received_date ? new Date(formData.received_date).getTime() : null;
  const expiryTime = formData.expiry_date ? new Date(formData.expiry_date).getTime() : null;

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

const getItemFormErrors = (formData, existingItems = []) =>
  Object.values(getItemFieldErrors(formData, existingItems));

const getTouchedFields = (formData) =>
  Object.keys(formData).reduce(
    (fields, key) => ({
      ...fields,
      [key]: true,
    }),
    {}
  );

const getLocationLabel = (location) => {
  if (!location) return "";

  return [
    `#${location.id}`,
    location.name,
    location.type,
  ]
    .filter(Boolean)
    .join(" - ");
};

const getWarehouseLocation = (warehouse) => {
  const location = warehouse?.location;

  return typeof location === "object" && location !== null ? location : null;
};

const getUniqueLocations = (warehouses) => {
  const locationsById = new Map();

  warehouses.forEach((warehouse) => {
    const location = getWarehouseLocation(warehouse);

    if (location?.id) {
      locationsById.set(String(location.id), location);
    }
  });

  return Array.from(locationsById.values());
};

function LocationSelect({ name, value, onChange, locations, disabled = false }) {
  return (
    <div className="field-group">
      <div className="field-wrapper">
        <select
          name={name}
          required
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <option value="">Select location</option>
          {locations.map((location) => (
            <option key={location.id} value={String(location.id)}>
              {getLocationLabel(location)}
            </option>
          ))}
        </select>
        <label>Location</label>
        <i className="fa-solid fa-location-dot"></i>
      </div>
    </div>
  );
}

LocationSelect.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
      type: PropTypes.string,
    })
  ).isRequired,
  disabled: PropTypes.bool,
};

export default function AdminWarehousesPage() {
  const dispatch = useDispatch();
  const {
    items: warehouses = [],
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.warehouses || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [itemFilter, setItemFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [itemsWarehouse, setItemsWarehouse] = useState(null);
  const [itemCreateWarehouse, setItemCreateWarehouse] = useState(null);
  const [itemDeleteOpen, setItemDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const itemActionLoading = useSelector((state) => state.items?.actionLoading || false);
  const itemError = useSelector((state) => state.items?.error || "");
  const [createFormData, setCreateFormData] = useState({
    name: "",
    location_id: "",
    address: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    location_id: "",
    address: "",
    description: "",
  });
  const [itemFormData, setItemFormData] = useState(INITIAL_ITEM_FORM);
  const [itemTouched, setItemTouched] = useState({});
  const [itemCreateError, setItemCreateError] = useState("");

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    let ignore = false;

    const loadLocations = async () => {
      setLocationsLoading(true);

      const result = await getLocationsRequest();

      if (!ignore && result.ok) {
        const locationPayload = result.data?.data;
        setLocations(
          Array.isArray(locationPayload)
            ? locationPayload
            : Array.isArray(locationPayload?.data)
              ? locationPayload.data
              : []
        );
      }

      if (!ignore) {
        setLocationsLoading(false);
      }
    };

    loadLocations();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredWarehouses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      const warehouseItems = getWarehouseItems(warehouse);
      const hasItems = warehouseItems.length > 0;
      const searchableText = [
        warehouse.id,
        warehouse.name,
        warehouse.description,
        warehouse.address,
        getWarehouseLocationId(warehouse),
        getWarehouseLocationName(warehouse),
        warehouse.location?.parent_id,
        warehouse.location?.created_at,
        warehouse.created_at,
        warehouse.updated_at,
        ...warehouseItems.flatMap((item) => [
          item.id,
          item.sku,
          item.name,
          item.description,
          item.quantity,
          item.status,
          item.expiry_date,
          item.purchase_date,
          item.received_date,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesFilter =
        itemFilter === "all" ||
        (itemFilter === "stocked" && hasItems) ||
        (itemFilter === "empty" && !hasItems);

      return matchesSearch && matchesFilter;
    });
  }, [warehouses, searchTerm, itemFilter]);

  const total = warehouses.length;
  const withItems = warehouses.filter((warehouse) => getWarehouseItems(warehouse).length > 0).length;
  const empty = total - withItems;
  const totalItems = getItemTotals(warehouses);
  const locationOptions = useMemo(() => {
    const optionsById = new Map();

    getUniqueLocations(warehouses).forEach((location) => {
      optionsById.set(String(location.id), location);
    });

    locations.forEach((location) => {
      if (location?.id) {
        optionsById.set(String(location.id), location);
      }
    });

    return Array.from(optionsById.values());
  }, [warehouses, locations]);
  const activeItemsWarehouse = useMemo(() => {
    if (!itemsWarehouse) return null;

    return warehouses.find((warehouse) => warehouse.id === itemsWarehouse.id) || itemsWarehouse;
  }, [warehouses, itemsWarehouse]);
  const allWarehouseItems = useMemo(
    () => warehouses.flatMap((warehouse) => getWarehouseItems(warehouse)),
    [warehouses]
  );
  const itemFieldErrors = useMemo(
    () => getItemFieldErrors(itemFormData, allWarehouseItems),
    [itemFormData, allWarehouseItems]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePreviewChange = (event) => {
    const { name, value } = event.target;

    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (event) => {
    const { name, value } = event.target;

    setItemCreateError("");
    setItemFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemBlur = (event) => {
    const { name } = event.target;

    setItemTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const openEditModal = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      name: warehouse.name || "",
      location_id: String(getWarehouseLocationId(warehouse) || ""),
      address: warehouse.address || "",
      description: warehouse.description || "",
    });
    setEditOpen(true);
  };

  const openDeleteModal = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteOpen(true);
  };

  const openItemsModal = (warehouse) => {
    setItemsWarehouse(warehouse);
  };

  const openItemCreateModal = (warehouse) => {
    setItemCreateWarehouse(warehouse);
    setItemsWarehouse(null);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setSelectedWarehouse(null);
    setFormData({
      name: "",
      location_id: "",
      address: "",
      description: "",
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedWarehouse) return;

    const result = await dispatch(
      updateWarehouse({
        id: selectedWarehouse.id,
        payload: {
          name: formData.name,
          location_id: formData.location_id,
          address: formData.address,
          description: formData.description,
        },
      })
    );

    if (updateWarehouse.fulfilled.match(result)) {
      closeEditModal();
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const result = await dispatch(
      createWarehouse({
        name: createFormData.name,
        location_id: createFormData.location_id,
        address: createFormData.address,
        description: createFormData.description,
      })
    );

    if (createWarehouse.fulfilled.match(result)) {
      setCreateOpen(false);
      setCreateFormData({
        name: "",
        location_id: "",
        address: "",
        description: "",
      });
    }
  };

  const closeItemCreateModal = () => {
    setItemCreateWarehouse(null);
    setItemFormData(INITIAL_ITEM_FORM);
    setItemTouched({});
    setItemCreateError("");
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();

    if (!itemCreateWarehouse) return;

    const validationErrors = getItemFormErrors(itemFormData, allWarehouseItems);

    if (validationErrors.length > 0) {
      const message = validationErrors.join("\n");
      setItemTouched(getTouchedFields(itemFormData));
      setItemCreateError(message);
      return;
    }

    const result = await dispatch(
      createItem({
        warehouse_id: itemCreateWarehouse.id,
        ...itemFormData,
        status: Number(itemFormData.quantity || 0) > 0 ? "in_stock" : "out_of_stock",
      })
    );

    if (createItem.fulfilled.match(result)) {
      await dispatch(fetchWarehouses());
      closeItemCreateModal();
    } else {
      setItemCreateError(result.payload || itemError || "Failed to create item.");
    }
  };

  const handleItemStatusChange = async (item, status) => {
    if (!item?.id || item.status === status) return;

    const result = await dispatch(
      updateItem({
        id: item.id,
        payload: {
          ...item,
          warehouse_id: item.warehouse_id || item.warehouse?.id || activeItemsWarehouse?.id,
          status,
        },
      })
    );

    if (updateItem.fulfilled.match(result)) {
      await dispatch(fetchWarehouses());
    }
  };

  const openItemDeleteModal = (item) => {
    setSelectedItem(item);
    setItemDeleteOpen(true);
  };

  const closeItemDeleteModal = () => {
    setItemDeleteOpen(false);
    setSelectedItem(null);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem?.id) return;

    const result = await dispatch(deleteItem(selectedItem.id));

    if (deleteItem.fulfilled.match(result)) {
      const deletedItemId = selectedItem.id;

      setItemsWarehouse((prev) =>
        prev
          ? {
              ...prev,
              items: getWarehouseItems(prev).filter((item) => item.id !== deletedItemId),
            }
          : prev
      );
      closeItemDeleteModal();
      await dispatch(fetchWarehouses());
    }
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) return;

    const result = await dispatch(deleteWarehouse(selectedWarehouse.id));

    if (deleteWarehouse.fulfilled.match(result)) {
      setDeleteOpen(false);
      setSelectedWarehouse(null);
    }
  };

  return (
    <div className="warehouse-page">
      <div className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Warehouses" icon={Building2} />
        <StatCard title="With items" value={withItems} note="Stocked stores" icon={MapPin} />
        <StatCard title="Empty" value={empty} note="No items" icon={PackageSearch} />
        <StatCard title="Items" value={totalItems} note="Assigned" icon={Archive} />
      </div>

      <Toolbar
        placeholder="Search warehouses..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={itemFilter}
        onFilterChange={setItemFilter}
        selectOptions={FILTER_OPTIONS}
        action={
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} />
            <span>New warehouse</span>
          </button>
        }
      />

      <TableCard title="Warehouse List" count={filteredWarehouses.length}>
        {loading ? (
          <div className="table-state">Loading warehouses...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Address</th>
                <th>Description</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredWarehouses.length > 0 ? (
                filteredWarehouses.map((warehouse) => {
                  const warehouseItems = getWarehouseItems(warehouse);

                  return (
                    <tr key={warehouse.id}>
                      <td data-label="ID">{warehouse.id}</td>
                      <td data-label="Name">{warehouse.name || "-"}</td>
                      <td data-label="Location">
                        {getWarehouseLocationName(warehouse)}
                      </td>
                      <td data-label="Address">{warehouse.address || "-"}</td>
                      <td data-label="Description">
                        {getWarehouseDescription(warehouse)}
                      </td>
                      <td data-label="Items">{warehouseItems.length}</td>
                      <td data-label="Actions">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => openItemsModal(warehouse)}
                            title="View items"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => openEditModal(warehouse)}
                            title="Edit warehouse"
                          >
                            <PencilLine size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() => openDeleteModal(warehouse)}
                            title="Delete warehouse"
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
                    No warehouses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal className="warehouse-modal"
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFormData({
            name: "",
            location_id: "",
            address: "",
            description: "",
          });
        }}
        title="Create warehouse"
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreate}>
          <div className="modal-grid">
            <Field
              name="name"
              value={createFormData.name}
              onChange={handleCreatePreviewChange}
              label="Name"
              iconClass="fa-solid fa-warehouse"
            />

            <LocationSelect
              name="location_id"
              value={createFormData.location_id}
              onChange={handleCreatePreviewChange}
              locations={locationOptions}
              disabled={locationsLoading && locationOptions.length === 0}
            />

            <Field
              name="address"
              value={createFormData.address}
              onChange={handleCreatePreviewChange}
              label="Address"
              iconClass="fa-solid fa-map"
            />

            <Field
              name="description"
              value={createFormData.description}
              onChange={handleCreatePreviewChange}
              label="Description"
              iconClass="fa-solid fa-align-left"
              required={false}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setCreateOpen(false);
                setCreateFormData({
                  name: "",
                  location_id: "",
                  address: "",
                  description: "",
                });
              }}
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

      <Modal className="warehouse-modal"
        open={Boolean(activeItemsWarehouse)}
        onClose={() => setItemsWarehouse(null)}
        title={activeItemsWarehouse?.name || "Warehouse items"}
        description={`${getWarehouseItems(activeItemsWarehouse || {}).length} items assigned`}
        size="lg"
      >
        <section className="warehouse-items-panel">
          <div className="warehouse-items-toolbar">
            <div>
              <strong>{getWarehouseDescription(activeItemsWarehouse || {})}</strong>
              <span>Manage the items stored in this warehouse.</span>
            </div>

            <button
              type="button"
              className="primary-action-btn"
              onClick={() => openItemCreateModal(activeItemsWarehouse)}
            >
              <Plus size={16} />
              <span>Add item</span>
            </button>
          </div>

          {getWarehouseItems(activeItemsWarehouse || {}).length > 0 ? (
            <div className="warehouse-item-list">
              {getWarehouseItems(activeItemsWarehouse).map((item) => (
                <article className="warehouse-item-card" key={item.id}>
                  <div className="warehouse-item-topline">
                    <div>
                      <strong>{item.name || "-"}</strong>
                      <small>{item.sku || "-"}</small>
                    </div>

                    <StatusDropdown
                      trigger="button"
                      value={item.status || "out_of_stock"}
                      options={ITEM_STATUS_OPTIONS}
                      onChange={(status) => handleItemStatusChange(item, status)}
                    />
                  </div>

                  <p>{item.description || "-"}</p>

                  <div className="warehouse-item-meta">
                    <span>Qty: {item.quantity ?? "-"}</span>
                    <span>Purchased: {item.purchase_date || "-"}</span>
                    <span>Received: {item.received_date || "-"}</span>
                    <span>Expires: {item.expiry_date || "-"}</span>
                  </div>

                  <div className="warehouse-item-actions">
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      title="Delete item"
                      onClick={() => openItemDeleteModal(item)}
                      disabled={itemActionLoading}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-cell">No items assigned</div>
          )}
        </section>
      </Modal>

      <Modal className="warehouse-modal"
        open={itemDeleteOpen}
        onClose={closeItemDeleteModal}
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
              onClick={closeItemDeleteModal}
              disabled={itemActionLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleDeleteItem}
              disabled={itemActionLoading}
            >
              {itemActionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal className="warehouse-modal"
        open={Boolean(itemCreateWarehouse)}
        onClose={closeItemCreateModal}
        title="Create item"
        description={
          itemCreateWarehouse
            ? `Warehouse: ${itemCreateWarehouse.name || `#${itemCreateWarehouse.id}`}`
            : undefined
        }
        size="md"
      >
        <form className="modal-form" onSubmit={handleCreateItem}>
          {itemCreateError ? <div className="form-alert">{itemCreateError}</div> : null}

          <div className="modal-grid">
            <Field
              name="sku"
              value={itemFormData.sku}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="SKU"
              iconClass="fa-solid fa-barcode"
              error={itemTouched.sku ? itemFieldErrors.sku : ""}
            />

            <Field
              name="name"
              value={itemFormData.name}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="Name"
              iconClass="fa-solid fa-box"
              error={itemTouched.name ? itemFieldErrors.name : ""}
            />

            <Field
              name="description"
              value={itemFormData.description}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="Description"
              iconClass="fa-solid fa-align-left"
              error={itemTouched.description ? itemFieldErrors.description : ""}
            />

            <Field
              type="number"
              name="quantity"
              value={itemFormData.quantity}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="Quantity"
              iconClass="fa-solid fa-hashtag"
              error={itemTouched.quantity ? itemFieldErrors.quantity : ""}
            />

            <Field
              type="date"
              name="expiry_date"
              value={itemFormData.expiry_date}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="Expiry date"
              iconClass="fa-solid fa-calendar-xmark"
              error={itemTouched.expiry_date ? itemFieldErrors.expiry_date : ""}
            />

            <Field
              type="date"
              name="purchase_date"
              value={itemFormData.purchase_date}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="Purchase date"
              iconClass="fa-solid fa-calendar-day"
              error={itemTouched.purchase_date ? itemFieldErrors.purchase_date : ""}
            />

            <Field
              type="date"
              name="received_date"
              value={itemFormData.received_date}
              onChange={handleItemChange}
              onBlur={handleItemBlur}
              label="Received date"
              iconClass="fa-solid fa-calendar-check"
              error={itemTouched.received_date ? itemFieldErrors.received_date : ""}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeItemCreateModal}
              disabled={itemActionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={itemActionLoading}
            >
              {itemActionLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal className="warehouse-modal"
        open={editOpen}
        onClose={closeEditModal}
        title="Update warehouse"
        size="md"
      >
        <form className="modal-form" onSubmit={handleUpdate}>
          <div className="modal-grid">
            <Field
              name="name"
              value={formData.name}
              onChange={handleChange}
              label="Name"
              iconClass="fa-solid fa-warehouse"
            />

            <LocationSelect
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              locations={locationOptions}
              disabled={locationsLoading && locationOptions.length === 0}
            />

            <Field
              name="address"
              value={formData.address}
              onChange={handleChange}
              label="Address"
              iconClass="fa-solid fa-map"
            />

            <Field
              name="description"
              value={formData.description}
              onChange={handleChange}
              label="Description"
              iconClass="fa-solid fa-align-left"
              required={false}
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeEditModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal className="warehouse-modal"
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedWarehouse(null);
        }}
        title="Delete warehouse"
        size="sm"
      >
        <div className="modal-form">
          <p className="warehouse-delete-copy">
            {selectedWarehouse
              ? `Delete ${selectedWarehouse.name || `warehouse #${selectedWarehouse.id}`}?`
              : "Delete this warehouse?"}
          </p>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={() => {
                setDeleteOpen(false);
                setSelectedWarehouse(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleDelete}
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
