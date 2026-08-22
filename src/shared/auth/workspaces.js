const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const roleName = (role) =>
  typeof role === "object"
    ? role?.slug || role?.name || role?.title || role?.display_name || role?.role?.name || role?.role || ""
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

  const selected =
    candidates.find((roles) => roles.some((role) => roleId(role) != null)) ||
    candidates[0] ||
    [];

  return selected
    .map((role) => ({
      id: roleId(role),
      name: roleName(role),
      slug: role?.slug || roleName(role),
    }))
    .filter((role) => role.name);
}

// ------------------------------------------------------
// تعريف مساحات العمل مع دعم المسميات العربية والإنجليزية
// ------------------------------------------------------
export const WORKSPACES = [
  {
    key: "admin",
    labelKey: "workspace_admin",
    path: "/admin",
    roles: ["admin", "administrator", "مدير", "ادمن"],
  },
  {
    key: "customer-service",
    labelKey: "workspace_customer_service",
    path: "/customer-service",
    roles: [
      "customer_service",
      "customer_service_staff",
      "customer_support",
      "support",
      "خدمة_العملاء",
      "خدمة العملاء",
      "خدمه العملاء",
      "عملاء",
    ],
  },
  {
    key: "engineering",
    labelKey: "workspace_engineering",
    path: "/engineering",
    roles: [
      "engineering",
      "engineer",
      "engineering_staff",
      "هندسة",
      "هندسه",
      "مهندس",
    ],
  },
  {
    key: "financial",
    labelKey: "workspace_financial",
    path: "/financial",
    roles: [
      "finance",
      "financial",
      "finance_staff",
      "financial_staff",
      "accounting",
      "accountant",
      "مالية",
      "مالي",
      "محاسب",
      "محاسبة",
      "محاسبه",
    ],
  },
  {
    key: "marketing",
    labelKey: "workspace_marketing",
    path: "/marketing",
    roles: [
      "marketing",
      "marketer",
      "marketing_staff",
      "تسويق",
      "مسوق",
    ],
  },
  {
    key: "legal",
    labelKey: "workspace_legal",
    path: "/legal/slots",
    roles: [
      "legal",
      "law",
      "legal_staff",
      "قانون",
      "قانوني",
      "محامي",
      "مكتب_قانوني",
    ],
  },
];

export function extractAssignedRoles(user) {
  const candidates = [
    ...(Array.isArray(user?.account?.roles) ? user.account.roles : []),
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.data?.user?.account?.roles) ? user.data.user.account.roles : []),
    user?.role,
    user?.type,
    user?.position,
    user?.job_title,
    user?.department?.slug,
    user?.department?.name,
  ];

  return [...new Set(candidates.map(roleName).map(normalize).filter(Boolean))];
}

export function getAssignedWorkspaces(user) {
  const userRoles = extractAssignedRoles(user);
  return WORKSPACES.filter((workspace) =>
    workspace.roles.some((workspaceRole) => {
      const normalizedWsRole = normalize(workspaceRole);
      return userRoles.some(
        (userRole) =>
          userRole === normalizedWsRole ||
          userRole.includes(normalizedWsRole) ||
          normalizedWsRole.includes(userRole)
      );
    })
  );
}

export function getWorkspaceForRole(role) {
  const rawName = roleName(role);
  const normalizedRole = normalize(rawName);

  if (!normalizedRole) return null;

  return (
    WORKSPACES.find((workspace) =>
      workspace.roles.some((candidate) => {
        const normalizedCandidate = normalize(candidate);
        return (
          normalizedRole === normalizedCandidate ||
          normalizedRole.includes(normalizedCandidate) ||
          normalizedCandidate.includes(normalizedRole)
        );
      })
    ) || null
  );
}

export function hasAssignedRole(user, allowedRoles = []) {
  const userRoles = extractAssignedRoles(user);
  const normalizedAllowed = allowedRoles.map(normalize);

  return userRoles.some((userRole) =>
    normalizedAllowed.some(
      (allowed) => userRole === allowed || userRole.includes(allowed)
    )
  );
}

export function getWorkspaceByPath(pathname = "") {
  return WORKSPACES.find(
    (workspace) =>
      pathname === workspace.path ||
      pathname.startsWith(`${workspace.path}/`) ||
      (workspace.key === "legal" && pathname.startsWith("/legal"))
  );
}