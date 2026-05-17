import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
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

const getWarehouseItems = (warehouse) => warehouse.items || [];
const getWarehouseDescription = (warehouse) =>
  warehouse.description || warehouse.location || "-";

const getItemTotals = (warehouses) =>
  warehouses.reduce((sum, warehouse) => sum + getWarehouseItems(warehouse).length, 0);

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
  const [createFormData, setCreateFormData] = useState({
    name: "",
    location: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const filteredWarehouses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      const warehouseItems = getWarehouseItems(warehouse);
      const hasItems = warehouseItems.length > 0;
      const searchableText = [
        warehouse.id,
        warehouse.name,
        warehouse.description,
        warehouse.location,
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

  const openEditModal = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      name: warehouse.name || "",
      location: warehouse.location || "",
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

  const closeEditModal = () => {
    setEditOpen(false);
    setSelectedWarehouse(null);
    setFormData({
      name: "",
      location: "",
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
          location: formData.location,
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
        location: createFormData.location,
      })
    );

    if (createWarehouse.fulfilled.match(result)) {
      setCreateOpen(false);
      setCreateFormData({
        name: "",
        location: "",
      });
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
    <div className="warehouse-page" dir="ltr">
      <PageHeader
        title="Warehouses"
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
                  <td colSpan="5" className="empty-cell">
                    No warehouses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFormData({
            name: "",
            location: "",
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

            <Field
              name="location"
              value={createFormData.location}
              onChange={handleCreatePreviewChange}
              label="Location"
              iconClass="fa-solid fa-location-dot"
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
                  location: "",
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

      <Modal
        open={Boolean(itemsWarehouse)}
        onClose={() => setItemsWarehouse(null)}
        title={itemsWarehouse?.name || "Warehouse items"}
        description={`${getWarehouseItems(itemsWarehouse || {}).length} items assigned`}
        size="lg"
      >
        <section className="warehouse-items-panel">
          <div className="warehouse-items-toolbar">
            <div>
              <strong>{getWarehouseDescription(itemsWarehouse || {})}</strong>
              <span>Manage the items stored in this warehouse.</span>
            </div>

            <button
              type="button"
              className="primary-action-btn"
              title="Add item endpoint pending"
              disabled
            >
              <Plus size={16} />
              <span>Add item</span>
            </button>
          </div>

          {getWarehouseItems(itemsWarehouse || {}).length > 0 ? (
            <div className="warehouse-item-list">
              {getWarehouseItems(itemsWarehouse).map((item) => (
                <article className="warehouse-item-card" key={item.id}>
                  <div className="warehouse-item-topline">
                    <div>
                      <strong>{item.name || "-"}</strong>
                      <small>{item.sku || "-"}</small>
                    </div>

                    <span className={`warehouse-item-status ${item.status || ""}`}>
                      {(item.status || "-").replaceAll("_", " ")}
                    </span>
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
                      className="icon-action-btn"
                      title="Edit item endpoint pending"
                      disabled
                    >
                      <PencilLine size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-action-btn danger"
                      title="Delete item endpoint pending"
                      disabled
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

      <Modal
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

            <Field
              name="location"
              value={formData.location}
              onChange={handleChange}
              label="Location"
              iconClass="fa-solid fa-location-dot"
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

      <Modal
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
