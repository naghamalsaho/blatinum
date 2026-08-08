const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const roleName = (role) =>
  typeof role === "object"
    ? role?.name || role?.title || role?.display_name || role?.role || ""
    : role;

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

export function hasAssignedRole(user, allowedRoles = []) {
  const roles = extractAssignedRoles(user);
  return allowedRoles.map(normalize).some((role) => roles.includes(role));
}

export function getWorkspaceByPath(pathname = "") {
  return WORKSPACES.find((workspace) =>
    pathname === workspace.path || pathname.startsWith(`${workspace.path}/`)
  );
}
