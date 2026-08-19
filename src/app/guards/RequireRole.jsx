import PropTypes from "prop-types";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { getWorkspaceForRole } from "@/shared/auth/workspaces";

export default function RequireRole({ allowedRoles = [] }) {
  const { activeRole, verifiedByBackend } = useSelector((state) => state.auth);
  const workspace = getWorkspaceForRole(activeRole);
  const normalizedAllowed = allowedRoles.map((role) => String(role).toLowerCase().replace(/[\s-]+/g, "_"));
  const activeName = String(activeRole?.name || activeRole || "").toLowerCase().replace(/[\s-]+/g, "_");
  const hasAccess = verifiedByBackend && workspace && normalizedAllowed.includes(activeName);

  if (!hasAccess) {
    return <Navigate to="/choose-workspace" replace />;
  }

  return <Outlet />;
}

RequireRole.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};
