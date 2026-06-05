import PropTypes from "prop-types";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const normalize = (value) => String(value || "").trim().toLowerCase();

function extractRoles(user) {
  const accountRoles = user?.account?.roles || [];
  const directRoles = user?.roles || [];
  const nestedRoles = user?.data?.user?.account?.roles || [];

  return [
    ...accountRoles,
    ...directRoles,
    ...nestedRoles,
    user?.role,
    user?.type,
  ]
    .map(normalize)
    .filter(Boolean);
}

export default function RequireRole({ allowedRoles = [] }) {
  const storedUser = useSelector((state) => state.auth.user);
  const localUser = JSON.parse(localStorage.getItem("user") || "null");

  const user = storedUser || localUser;

  const roles = extractRoles(user);
  const allowed = allowedRoles.map(normalize);

  const hasAccess = allowed.some((role) => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

RequireRole.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};