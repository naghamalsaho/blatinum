import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle2,
  Edit3,
  Eye,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
} from "lucide-react";

import StatCard from "@/shared/components/StatCard";
import {
  assignRolesToUser,
  fetchPermissions,
  fetchRoles,
  removePermission,
  removeRole,
  savePermission,
  saveRole,
  saveRolePermissions,
} from "../features/roles/model/role.thunks";
import { fetchEmployees } from "../features/employees/model/employee.thunks";

import "../features/roles/styles/roles.css";

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const getId = (item) => item?.id || item?.role_id || item?.permission_id;
const getName = (item) => item?.name || item?.title || item?.display_name || "-";

const getRolePermissions = (role) => {
  const permissions =
    role?.permissions ||
    role?.permission ||
    role?.role_permissions ||
    role?.permission_ids ||
    [];

  return Array.isArray(permissions) ? permissions : [];
};

const getPermissionIds = (role) =>
  getRolePermissions(role).map((permission) => String(getId(permission) || permission));

const getPermissionModule = (permission) =>
  permission?.module ||
  permission?.group ||
  permission?.category ||
  permission?.guard_name ||
  "General";

const formatLabel = (value) =>
  String(value || "-")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeRoleKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const formatDate = (value) => {
  if (!value) return "-";

  const normalized = String(value).includes("T")
    ? String(value)
    : String(value).replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getAccount = (item = {}) => item.employee?.account || item.account || {};
const getEmployeeId = (item) =>
  readNested(item, [
    "employee.additional_info.employee_id",
    "additional_info.employee_id",
    "employee_id",
  ]);
const getAccountId = (item) => readNested(item, ["employee.account.id", "account.id", "user_id"]);
const getAssignableUserId = (item) => getAccountId(item) || getEmployeeId(item) || item?.id;
const getUserName = (item) => getAccount(item).full_name || getAccount(item).email || "-";
const getUserRoles = (item) => getAccount(item).roles || [];
const getUserRoleKeys = (item) =>
  getUserRoles(item)
    .flatMap((role) => {
      if (typeof role === "object" && role !== null) {
        return [
          role.id ? String(role.id) : "",
          normalizeRoleKey(role.name || role.title || role.display_name || role.role),
        ];
      }

      return [normalizeRoleKey(role)];
    })
    .filter(Boolean);

const groupUsers = (items) => {
  const grouped = new Map();

  items.forEach((item) => {
    const account = getAccount(item);
    const key = getAssignableUserId(item) || account.email;

    if (!key || grouped.has(key)) return;

    grouped.set(key, item);
  });

  return Array.from(grouped.values());
};

const RoleForm = ({ form, onChange, onSubmit, onCancel, saving }) => (
  <form className="role-inline-form" onSubmit={onSubmit}>
    <label>
      Role name
      <input
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Customer Service"
      />
    </label>
    <div className="role-form-actions">
      <button type="button" className="role-btn ghost" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="role-btn primary" disabled={saving}>
        <Save size={15} />
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  </form>
);

const PermissionForm = ({ form, onChange, onSubmit, onCancel, saving }) => (
  <form className="role-inline-form two" onSubmit={onSubmit}>
    <label>
      Permission name
      <input
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="view_clients"
      />
    </label>
    <label>
      Module
      <input
        name="module"
        value={form.module}
        onChange={onChange}
        placeholder="Clients"
      />
    </label>
    <div className="role-form-actions">
      <button type="button" className="role-btn ghost" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="role-btn primary" disabled={saving}>
        <Save size={15} />
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  </form>
);

RoleForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

RoleForm.defaultProps = {
  saving: false,
};

PermissionForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string.isRequired,
    module: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

PermissionForm.defaultProps = {
  saving: false,
};

export default function AdminRolesPermissionsPage() {
  const dispatch = useDispatch();
  const {
    roles = {},
    permissions = {},
    actionLoading,
    actionError,
    actionMessage,
  } = useSelector((state) => state.rolePermissions || {});
  const { items: employeeRows = [] } = useSelector((state) => state.employees || {});

  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "" });
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({ name: "", module: "" });
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState([]);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const roleItems = roles.items || [];
  const permissionItems = permissions.items || [];
  const users = useMemo(() => groupUsers(employeeRows), [employeeRows]);
  const selectedRole = roleItems.find((role) => String(getId(role)) === String(selectedRoleId));

  const filteredRoles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roleItems;

    return roleItems.filter((role) => {
      const searchable = [
        getId(role),
        getName(role),
        ...getRolePermissions(role).map(getName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [roleItems, searchTerm]);

  const filteredPermissions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return permissionItems;

    return permissionItems.filter((permission) =>
      [getId(permission), getName(permission), getPermissionModule(permission)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [permissionItems, searchTerm]);

  const openRoleForm = (role = null) => {
    setEditingRole(role);
    setRoleForm({ name: role ? getName(role) : "" });
  };

  const closeRoleForm = () => {
    setEditingRole(null);
    setRoleForm({ name: "" });
  };

  const openPermissionForm = (permission = null) => {
    setEditingPermission(permission);
    setPermissionForm({
      name: permission ? getName(permission) : "",
      module: permission ? getPermissionModule(permission) : "",
    });
  };

  const closePermissionForm = () => {
    setEditingPermission(null);
    setPermissionForm({ name: "", module: "" });
  };

  const manageRolePermissions = (role) => {
    setSelectedRoleId(String(getId(role)));
    setSelectedPermissionIds(getPermissionIds(role));
    setActiveTab("permissions");
  };

  const selectUserForAssignment = (userId) => {
    const user = users.find((item) => String(getAssignableUserId(item)) === String(userId));
    const userRoleKeys = getUserRoleKeys(user);
    const ids = roleItems
      .filter((role) => {
        const roleId = String(getId(role));
        const roleKey = normalizeRoleKey(getName(role));

        return userRoleKeys.includes(roleId) || userRoleKeys.includes(roleKey);
      })
      .map((role) => String(getId(role)));

    setSelectedUserId(userId);
    setSelectedUserRoleIds(ids);
  };

  const submitRole = async (event) => {
    event.preventDefault();

    if (!roleForm.name.trim()) return;

    const result = await dispatch(
      saveRole({
        roleId: editingRole ? getId(editingRole) : null,
        name: roleForm.name.trim(),
      })
    );

    if (saveRole.fulfilled.match(result)) closeRoleForm();
  };

  const submitPermission = async (event) => {
    event.preventDefault();

    if (!permissionForm.name.trim()) return;

    const result = await dispatch(
      savePermission({
        permissionId: editingPermission ? getId(editingPermission) : null,
        name: permissionForm.name.trim(),
        module: permissionForm.module.trim(),
      })
    );

    if (savePermission.fulfilled.match(result)) closePermissionForm();
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissionIds((current) =>
      current.includes(String(permissionId))
        ? current.filter((id) => id !== String(permissionId))
        : [...current, String(permissionId)]
    );
  };

  const toggleUserRole = (roleId) => {
    setSelectedUserRoleIds((current) =>
      current.includes(String(roleId))
        ? current.filter((id) => id !== String(roleId))
        : [...current, String(roleId)]
    );
  };

  const submitRolePermissions = () => {
    if (!selectedRoleId) return;
    dispatch(
      saveRolePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermissionIds,
      })
    );
  };

  const submitAssignRoles = async () => {
    if (!selectedUserId) return;
    const result = await dispatch(
      assignRolesToUser({
        userId: selectedUserId,
        roleIds: selectedUserRoleIds,
      })
    );

    if (assignRolesToUser.fulfilled.match(result)) {
      dispatch(fetchEmployees());
    }
  };

  return (
    <div className="roles-page">
      <section className="roles-stats-grid">
        <StatCard title="Roles" value={roleItems.length} note="Access groups" icon={UsersRound} />
        <StatCard
          title="Permissions"
          value={permissionItems.length}
          note="Allowed actions"
          icon={KeyRound}
        />
        <StatCard
          title="Users"
          value={users.length}
          note="Assignable accounts"
          icon={UserCog}
        />
        <StatCard
          title="Selected"
          value={selectedPermissionIds.length}
          note="Permissions in editor"
          icon={ShieldCheck}
        />
      </section>

      <section className="roles-toolbar">
        <div className="roles-tabs" role="tablist" aria-label="Roles and permissions sections">
          {[
            ["roles", "Roles"],
            ["permissions", "Permissions"],
            ["assign", "Assign Roles"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="roles-search">
          <span>Search</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search roles, permissions..."
          />
        </label>
        {activeTab === "roles" ? (
          <button type="button" className="role-btn primary roles-toolbar-action" onClick={() => openRoleForm()}>
            <Plus size={15} />
            Add Role
          </button>
        ) : null}
      </section>

      {actionError ? <div className="roles-alert error">{actionError}</div> : null}
      {actionMessage ? <div className="roles-alert success">{actionMessage}</div> : null}

      {activeTab === "roles" ? (
        <section className="roles-grid roles-tab-panel">
          <article className="roles-card roles-table-card">
          <div className="roles-card-head">
            <div>
              <h2>Roles</h2>
              <p>{filteredRoles.length} roles available</p>
            </div>
          </div>

          {editingRole !== null || roleForm.name ? (
            <RoleForm
              form={roleForm}
              onChange={(event) => setRoleForm({ name: event.target.value })}
              onSubmit={submitRole}
              onCancel={closeRoleForm}
              saving={actionLoading}
            />
          ) : null}

          {roles.loading ? (
            <div className="roles-state">Loading roles...</div>
          ) : roles.error ? (
            <div className="roles-state error">{roles.error}</div>
          ) : (
            <div className="roles-table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={getId(role)}>
                      <td>#{getId(role)}</td>
                      <td>
                        <strong>{formatLabel(getName(role))}</strong>
                      </td>
                      <td>
                        <span className="roles-count-pill">
                          {getRolePermissions(role).length} permissions
                        </span>
                      </td>
                      <td>{formatDate(role.created_at)}</td>
                      <td>
                        <div className="role-row-actions">
                          <button type="button" onClick={() => manageRolePermissions(role)}>
                            <Eye size={15} />
                          </button>
                          <button type="button" onClick={() => openRoleForm(role)}>
                            <Edit3 size={15} />
                          </button>
                          <button type="button" className="danger" onClick={() => dispatch(removeRole(getId(role)))}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="roles-empty">
                        No roles found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          </article>

          <article className="roles-card roles-summary-card">
            <div className="roles-card-head">
              <div>
                <h2>Role Overview</h2>
                <p>Quick access summary</p>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="role-overview-list">
              {roleItems.slice(0, 6).map((role) => (
                <button
                  type="button"
                  key={getId(role)}
                  className={String(getId(role)) === String(selectedRoleId) ? "active" : ""}
                  onClick={() => manageRolePermissions(role)}
                >
                  <span>
                    <strong>{formatLabel(getName(role))}</strong>
                    <small>{getRolePermissions(role).length} permissions</small>
                  </span>
                  <Eye size={15} />
                </button>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "permissions" ? (
        <section className="roles-grid permissions-tab-panel">
          <article className="roles-card permissions-manager-card">
            <div className="roles-card-head">
              <div>
                <h2>Manage Permissions</h2>
                <p>
                  {selectedRole
                    ? `${formatLabel(getName(selectedRole))} role`
                    : "Select a role from the roles tab"}
                </p>
              </div>
              <button
                type="button"
                className="role-btn primary"
                disabled={!selectedRoleId || actionLoading}
                onClick={submitRolePermissions}
              >
                <Save size={15} />
                Save
              </button>
            </div>

            <div className="permission-checklist">
              {permissionItems.length > 0 ? (
                permissionItems.map((permission) => {
                  const id = String(getId(permission));
                  const checked = selectedPermissionIds.includes(id);

                  return (
                    <label className="permission-check-row" key={id}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectedRoleId}
                        onChange={() => togglePermission(id)}
                      />
                      <span>
                        <strong>{formatLabel(getName(permission))}</strong>
                        <small>{formatLabel(getPermissionModule(permission))}</small>
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="roles-state">No permissions yet.</div>
              )}
            </div>
          </article>

          <article className="roles-card">
          <div className="roles-card-head">
            <div>
              <h2>Permissions</h2>
              <p>{filteredPermissions.length} permission records</p>
            </div>
          </div>

          {permissions.loading ? (
            <div className="roles-state">Loading permissions...</div>
          ) : permissions.error ? (
            <div className="roles-state error">{permissions.error}</div>
          ) : (
            <div className="roles-table-wrap">
              <table className="roles-table compact">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Permission</th>
                    <th>Module</th>
                    <th>API</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr key={getId(permission)}>
                      <td>#{getId(permission)}</td>
                      <td>{formatLabel(getName(permission))}</td>
                      <td>{formatLabel(getPermissionModule(permission))}</td>
                      <td>
                        <span className="permission-readonly">Read only</span>
                      </td>
                    </tr>
                  ))}
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="roles-empty">
                        No permissions found
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          </article>
        </section>
      ) : null}

      {activeTab === "assign" ? (
        <section className="roles-grid assign-tab-panel">
          <article className="roles-card assign-card">
          <div className="roles-card-head">
            <div>
              <h2>Assign Role to User</h2>
              <p>Attach one or more roles to an account</p>
            </div>
            <CheckCircle2 size={22} />
          </div>

          <label className="role-select-label">
            Select user
            <select
              value={selectedUserId}
              onChange={(event) => selectUserForAssignment(event.target.value)}
            >
              <option value="">Choose a user</option>
              {users.map((user) => {
                const account = getAccount(user);
                const id = getAssignableUserId(user);

                return (
                  <option key={id} value={id}>
                    {getUserName(user)} ({account.email || `User #${id}`})
                  </option>
                );
              })}
            </select>
          </label>

          <div className="assign-role-list">
            {roleItems.map((role) => {
              const id = String(getId(role));

              return (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={selectedUserRoleIds.includes(id)}
                    disabled={!selectedUserId}
                    onChange={() => toggleUserRole(id)}
                  />
                  <span>{formatLabel(getName(role))}</span>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            className="role-btn primary wide"
            disabled={!selectedUserId || actionLoading}
            onClick={submitAssignRoles}
          >
            Save Assignment
          </button>
          </article>

          <article className="roles-card roles-summary-card">
            <div className="roles-card-head">
              <div>
                <h2>Available Roles</h2>
                <p>Roles that can be assigned</p>
              </div>
              <UsersRound size={22} />
            </div>
            <div className="role-overview-list">
              {roleItems.map((role) => (
                <div className="role-overview-row" key={getId(role)}>
                  <span>
                    <strong>{formatLabel(getName(role))}</strong>
                    <small>Role #{getId(role)}</small>
                  </span>
                  <span className="roles-count-pill">
                    {getRolePermissions(role).length}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
