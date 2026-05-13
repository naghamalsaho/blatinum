import { Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "./layouts/adminLayout";
import DashboardPage from "@/pages/DashboardPage.jsx";
import AdminWarehousesPage from "@/Rools/admin/pages/AdminWarehousesPage";
import LegalLayout from "@/app/layouts/LegalLayout";
import LegalDashboardPage from "@/Rools/legal/pages/LegalDashboardPage";
import LegalAvailableSlotsPage from "@/Rools/legal/pages/LegalAvailableSlotsPage";
import LegalEngineersPage from "@/Rools/legal/pages/LegalEngineersPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="warehouses" element={<AdminWarehousesPage />} />
      </Route>

      <Route path="/legal" element={<LegalLayout />}>
        <Route index element={<LegalDashboardPage />} />
        <Route path="slots" element={<LegalAvailableSlotsPage />} />
        <Route path="engineers" element={<LegalEngineersPage />} />
      </Route>
    </Routes>
  );
}
