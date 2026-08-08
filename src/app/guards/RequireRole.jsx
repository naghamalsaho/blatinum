import PropTypes from "prop-types";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasAssignedRole } from "@/shared/auth/workspaces";

export default function RequireRole({ allowedRoles = [] }) {
  const { user, verifiedByBackend } = useSelector((state) => state.auth);
  const hasAccess = verifiedByBackend && hasAssignedRole(user, allowedRoles);

  if (!hasAccess) {
    return <Navigate to="/choose-workspace" replace />;
  }

  return <Outlet />;
}

RequireRole.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};
