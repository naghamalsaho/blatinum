import PropTypes from "prop-types";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireRole({ allowedRoles = [] }) {
  const user =
    useSelector((state) => state.auth.user) ||
    JSON.parse(localStorage.getItem("user") || "null");

  const roles = user?.account?.roles || user?.roles || [];

  const hasAccess = allowedRoles.some((role) =>
    roles.includes(role)
  );

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

RequireRole.propTypes = {
  allowedRoles: PropTypes.arrayOf(
    PropTypes.string
  ),
};