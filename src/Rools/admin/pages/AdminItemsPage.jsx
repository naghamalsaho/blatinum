import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Boxes,
  CircleSlash2,
  PackageCheck,
  PackagePlus,
  PackageSearch,
} from "lucide-react";

import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import Toolbar from "@/shared/components/Toolbar";
import TableCard from "@/shared/components/TableCard";
import { fetchItems } from "../features/items/model/item.thunks";

import "../features/items/styles/items.css";

const STATUS_META = {
  in_stock: {
    label: "In stock",
    className: "in-stock",
  },
  out_of_stock: {
    label: "Out of stock",
    className: "out-of-stock",
  },
  discontinued: {
    label: "Discontinued",
    className: "discontinued",
  },
};

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

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
};

export default function AdminItemsPage() {
  const dispatch = useDispatch();
  const {
    items = [],
    loading,
    error,
  } = useSelector((state) => state.items || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const searchableText = [
        item.id,
        item.warehouse_id,
        item.sku,
        item.name,
        item.description,
        item.status,
        item.quantity,
        item.purchase_date,
        item.received_date,
        item.expiry_date,
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

  return (
    <div className="items-page" dir="ltr">
      <PageHeader
        kicker="Admin Core"
        title="Warehouse Items"
        subtitle="Track every item stored across company warehouses with quantity, status, dates, and warehouse ownership."
        action={
          <button type="button" className="primary-action-btn" disabled>
            <PackagePlus size={18} />
            <span>Create item soon</span>
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
              </tr>
            </thead>

            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const status = STATUS_META[item.status] || {
                    label: item.status || "-",
                    className: "",
                  };

                  return (
                    <tr key={item.id}>
                      <td data-label="ID">{item.id}</td>
                      <td data-label="SKU">{item.sku || "-"}</td>
                      <td data-label="Item">
                        <div className="item-name-cell">
                          <strong>{item.name || "-"}</strong>
                          <span>{item.description || "No description"}</span>
                        </div>
                      </td>
                      <td data-label="Warehouse">{item.warehouse_id ? `#${item.warehouse_id}` : "-"}</td>
                      <td data-label="Quantity">{item.quantity ?? "-"}</td>
                      <td data-label="Status">
                        <span className={`item-status ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td data-label="Purchase">{formatDate(item.purchase_date)}</td>
                      <td data-label="Received">{formatDate(item.received_date)}</td>
                      <td data-label="Expiry">{formatDate(item.expiry_date)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: "16px", textAlign: "center" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
