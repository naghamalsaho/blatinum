const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const roleName = (role) =>
  typeof role === "object"
    ? role?.name || role?.title || role?.display_name || role?.role?.name || role?.role || ""
    : role;

const roleId = (role) =>
  typeof role === "object"
    ? role?.id ?? role?.role_id ?? role?.roleId ?? role?.role?.id ?? role?.pivot?.role_id ?? null
    : null;

const asRoleArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  if (Array.isArray(value.roles)) return value.roles;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;

  return Object.entries(value).map(([id, role]) =>
    typeof role === "object" ? role : { id, name: role }
  );
};

export function extractAvailableRoles(payload = {}) {
  const candidates = [
    payload?.available_roles,
    payload?.availableRoles,
    payload?.roles,
    payload?.data,
    payload?.data?.available_roles,
    payload?.data?.availableRoles,
    payload?.data?.roles,
    payload?.data?.data,
    payload?.user?.available_roles,
    payload?.user?.roles,
    payload?.user?.account?.roles,
    payload?.data?.user?.available_roles,
    payload?.data?.user?.roles,
    payload?.data?.user?.account?.roles,
  ].map(asRoleArray).filter((roles) => roles.length);

  const selected = candidates.find((roles) => roles.some((role) => roleId(role) != null)) || candidates[0] || [];
  return selected.map((role) => ({
    id: roleId(role),
    name: roleName(role),
  })).filter((role) => role.name);
}

export const WORKSPACES = [
  { key: "admin", labelKey: "workspace_admin", path: "/admin", roles: ["admin", "administrator"] },
  {
    key: "customer-service",
    labelKey: "workspace_customer_service",
    path: "/customer-service",
    roles: ["customer_service", "customer_service_staff", "customer_support", "support"],
  },
  { key: "engineering", labelKey: "workspace_engineering", path: "/engineering", roles: ["engineering", "engineer", "engineering_staff"] },
  { key: "marketing", labelKey: "workspace_marketing", path: "/marketing", roles: ["marketing", "marketing_staff"] },
  { key: "legal", labelKey: "workspace_legal", path: "/legal", roles: ["legal", "law", "legal_staff"] },
];

export function extractAssignedRoles(user) {
  const candidates = [
    ...(Array.isArray(user?.account?.roles) ? user.account.roles : []),
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.data?.user?.account?.roles) ? user.data.user.account.roles : []),
    user?.role,
    user?.type,
  ];

  return [...new Set(candidates.map(roleName).map(normalize).filter(Boolean))];
}

export function getAssignedWorkspaces(user) {
  const roles = extractAssignedRoles(user);
  return WORKSPACES.filter((workspace) =>
    workspace.roles.some((role) => roles.includes(normalize(role)))
  );
}

export function getWorkspaceForRole(role) {
  const normalizedRole = normalize(roleName(role));
  return WORKSPACES.find((workspace) =>
    workspace.roles.some((candidate) => normalize(candidate) === normalizedRole)
  ) || null;
}

export function hasAssignedRole(user, allowedRoles = []) {
  const roles = extractAssignedRoles(user);
  return allowedRoles.map(normalize).some((role) => roles.includes(role));
}

export function getWorkspaceByPath(pathname = "") {
  return WORKSPACES.find((workspace) =>
    pathname === workspace.path || pathname.startsWith(`${workspace.path}/`)
  );
}
