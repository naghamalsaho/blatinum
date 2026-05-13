import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Archive,
  Building2,
  PencilLine,
  Plus,
  MapPin,
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
    label: "All warehouses",
    dotClass: "",
  },
  {
    value: "with-location",
    label: "With location",
    dotClass: "ok",
  },
  {
    value: "without-location",
    label: "No location",
    dotClass: "off",
  },
];


export default function AdminWarehousesPage() {
  const dispatch = useDispatch();
  const {
    items: warehouses = [],
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.warehouses || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
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
      const hasLocation = Boolean(warehouse.location);
      const searchableText = [
        warehouse.id,
        warehouse.name,
        warehouse.location,
        warehouse.created_at,
        warehouse.updated_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || searchableText.includes(q);
      const matchesFilter =
        locationFilter === "all" ||
        (locationFilter === "with-location" && hasLocation) ||
        (locationFilter === "without-location" && !hasLocation);

      return matchesSearch && matchesFilter;
    });
  }, [warehouses, searchTerm, locationFilter]);

  const total = warehouses.length;
  const withLocation = warehouses.filter((warehouse) => warehouse.location).length;
  const withoutLocation = total - withLocation;
  const latestWarehouse = warehouses[0]?.id ? `#${warehouses[0].id}` : "-";

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
        kicker="Admin Core"
        title="Warehouses"
        subtitle="Review every warehouse registered in the system with its name, location, and latest update details."
        action={
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} />
            <span>Create warehouse</span>
          </button>
        }
      />

      <div className="legal-stats-grid">
        <StatCard
          title="Total warehouses"
          value={total}
          note="All storage records"
          icon={Building2}
        />
        <StatCard
          title="With location"
          value={withLocation}
          note="Ready for tracking"
          icon={MapPin}
        />
        <StatCard
          title="Missing location"
          value={withoutLocation}
          note="Needs completion"
          icon={PackageSearch}
        />
        <StatCard
          title="Latest record"
          value={latestWarehouse}
          note="Newest item in the list"
          icon={Archive}
        />
      </div>

      <Toolbar
        placeholder="Search by name, location, or date..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={locationFilter}
        onFilterChange={setLocationFilter}
        selectOptions={FILTER_OPTIONS}
      />

      <TableCard title="Warehouse list" count={filteredWarehouses.length}>
        {loading ? (
          <div style={{ padding: "16px" }}>Loading warehouses...</div>
        ) : error ? (
          <div style={{ padding: "16px", color: "red" }}>{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredWarehouses.length > 0 ? (
                filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td>{warehouse.id}</td>
                    <td>{warehouse.name || "-"}</td>
                    <td>{warehouse.location || "-"}</td>
                    <td>
                      <div className="row-actions">
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
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "16px", textAlign: "center" }}>
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
        description="The create endpoint is ready to be connected. This form matches the warehouse fields."
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
        open={editOpen}
        onClose={closeEditModal}
        title="Update warehouse"
        description="Edit the warehouse name and location, then save the changes."
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
        description="This action will remove the selected warehouse from the system."
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
