import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Phone, ShieldOff, UserCheck, UsersRound } from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import PageHeader from "@/shared/components/PageHeader";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import {
  deactivateCustomerServiceClient,
  fetchCustomerServiceClients,
} from "../features/clients/model/client.thunks";

import "../styles/customer-service.css";

const CLIENT_FILTERS = [
  { value: "all", label: "All", dotClass: "" },
  { value: "verified", label: "Verified", dotClass: "ok" },
  { value: "unverified", label: "Unverified", dotClass: "busy" },
  { value: "married", label: "Married", dotClass: "" },
  { value: "single", label: "Single", dotClass: "" },
];

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const getAccount = (client) => client?.account || {};
const getInfo = (client) => client?.additional_info || {};
const getClientId = (client) =>
  readNested(client, ["additional_info.client_id", "client_id", "id"]);
const getAccountId = (client) => readNested(client, ["account.id", "id"]);
const getClientName = (client) => getAccount(client).full_name || "-";
const getClientEmail = (client) => getAccount(client).email || "-";
const getClientPhone = (client) => getAccount(client).phone || "-";
const getClientAddress = (client) => getAccount(client).address || "-";
const getClientStatus = (client) => (getAccount(client).verified_at ? "verified" : "unverified");
const getSocialStatus = (client) => String(getInfo(client).social_status || "-").toLowerCase();

export default function CustomerServiceClientsPage() {
  const dispatch = useDispatch();
  const {
    items: clients = [],
    message,
    loading,
    actionLoading,
    error,
  } = useSelector((state) => state.customerServiceClients || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomerServiceClients());
  }, [dispatch]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const status = getClientStatus(client);
      const socialStatus = getSocialStatus(client);
      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter ||
        socialStatus === statusFilter;
      const searchable = [
        getClientId(client),
        getAccountId(client),
        getClientName(client),
        getClientEmail(client),
        getClientPhone(client),
        getClientAddress(client),
        getInfo(client).job_title,
        getInfo(client).national_id,
        socialStatus,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [clients, searchTerm, statusFilter]);

  const verified = clients.filter((client) => getClientStatus(client) === "verified").length;
  const married = clients.filter((client) => getSocialStatus(client) === "married").length;
  const withJobs = clients.filter((client) => Boolean(getInfo(client).job_title)).length;

  const openDeactivateModal = (client) => {
    setSelectedClient(client);
    setDeactivateOpen(true);
  };

  const closeDeactivateModal = () => {
    setSelectedClient(null);
    setDeactivateOpen(false);
  };

  const handleDeactivate = async () => {
    const clientId = getClientId(selectedClient);
    if (!clientId) return;

    const result = await dispatch(deactivateCustomerServiceClient(clientId));

    if (deactivateCustomerServiceClient.fulfilled.match(result)) {
      closeDeactivateModal();
    }
  };

  return (
    <div className="customer-service-page" dir="ltr">
      <PageHeader kicker="Customer Service" title="Clients" />

      <section className="legal-stats-grid">
        <StatCard title="Total" value={clients.length} note="Clients from API" icon={UsersRound} />
        <StatCard title="Verified" value={verified} note="Confirmed accounts" icon={UserCheck} />
        <StatCard title="Married" value={married} note="Client profile info" icon={UsersRound} />
        <StatCard title="With Jobs" value={withJobs} note="Known occupations" icon={Mail} />
      </section>

      <Toolbar
        placeholder="Search clients..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={CLIENT_FILTERS}
      />

      <TableCard title="Client List" count={filteredClients.length}>
        {loading ? (
          <div className="table-state">Loading clients...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Job</th>
                <th>Social</th>
                <th>National ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const account = getAccount(client);
                  const info = getInfo(client);
                  const status = getClientStatus(client);

                  return (
                    <tr key={getClientId(client) || getAccountId(client)}>
                      <td data-label="Client">
                        <div className="customer-service-name-cell">
                          <strong>{getClientName(client)}</strong>
                          <span>
                            Client #{getClientId(client) || "-"} / Account #{getAccountId(client) || "-"}
                          </span>
                        </div>
                      </td>
                      <td data-label="Contact">
                        <div className="customer-service-name-cell">
                          <span>
                            <Mail size={13} /> {getClientEmail(client)}
                          </span>
                          <span>
                            <Phone size={13} /> {getClientPhone(client)}
                          </span>
                        </div>
                      </td>
                      <td data-label="Address">{getClientAddress(client)}</td>
                      <td data-label="Job">{info.job_title || "-"}</td>
                      <td data-label="Social">{info.social_status || "-"}</td>
                      <td data-label="National ID">{info.national_id || "-"}</td>
                      <td data-label="Status">
                        <span className={`customer-service-pill ${status}`}>
                          {status}
                        </span>
                      </td>
                      <td data-label="Created">{account.created_at || "-"}</td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => openDeactivateModal(client)}
                          disabled={actionLoading}
                          title="Deactivate client"
                        >
                          <ShieldOff size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    {message || "No clients found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={deactivateOpen}
        onClose={closeDeactivateModal}
        title="Deactivate client"
        size="sm"
      >
        <div className="modal-form">
          <p className="customer-service-confirm-copy">
            Deactivate {selectedClient ? getClientName(selectedClient) : "this client"}?
          </p>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeDeactivateModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleDeactivate}
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Deactivate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
