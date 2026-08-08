import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireAuth() {
  const { token, verifiedByBackend } = useSelector((state) => state.auth);

  if (!token || !verifiedByBackend) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
