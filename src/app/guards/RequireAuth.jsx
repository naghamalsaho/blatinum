import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireAuth() {
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}