import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage.jsx";

import AdminLayout from "./layouts/adminLayout";
import LegalLayout from "@/app/layouts/LegalLayout";
import EngineeringLayout from "@/app/layouts/EngineeringLayout";

import RequireAuth from "./guards/RequireAuth";
import RequireRole from "./guards/RequireRole";

import AdminDepartmentsPage from "@/Rools/admin/pages/AdminDepartmentsPage";
import AdminEmployeesPage from "@/Rools/admin/pages/AdminEmployeesPage";
import AdminWarehousesPage from "@/Rools/admin/pages/AdminWarehousesPage";
import AdminItemsPage from "@/Rools/admin/pages/AdminItemsPage";

import LegalDashboardPage from "@/Rools/legal/pages/LegalDashboardPage";
import LegalAvailableSlotsPage from "@/Rools/legal/pages/LegalAvailableSlotsPage";
import LegalEngineersPage from "@/Rools/legal/pages/LegalEngineersPage";

import EngineeringDashboardPage from "@/Rools/engineering/pages/EngineeringDashboardPage";
import EngineeringEngineersPage from "@/Rools/engineering/pages/EngineeringEngineersPage";


import MarketingLayout from "@/app/layouts/MarketingLayout";

import MarketingDashboardPage from "@/Rools/marketing/pages/MarketingDashboardPage";
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<RequireRole allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="departments" element={<AdminDepartmentsPage />} />
            <Route path="employees" element={<AdminEmployeesPage />} />
            <Route path="warehouses" element={<AdminWarehousesPage />} />
            <Route path="items" element={<AdminItemsPage />} />
          </Route>
        </Route>

        <Route
          path="/legal"
          element={<RequireRole allowedRoles={["legal", "law", "legal_staff"]} />}
        >
          <Route element={<LegalLayout />}>
            <Route index element={<LegalDashboardPage />} />
            <Route path="slots" element={<LegalAvailableSlotsPage />} />
            <Route path="engineers" element={<LegalEngineersPage />} />
          </Route>
        </Route>

        <Route
          path="/engineering"
          element={<RequireRole allowedRoles={["engineering", "engineer", "engineering_staff"]} />}
        >
          <Route element={<EngineeringLayout />}>
            <Route index element={<EngineeringDashboardPage />} />
            <Route path="engineers" element={<EngineeringEngineersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />


      <Route
  path="/marketing"
  element={
    <RequireRole
      allowedRoles={[
        "marketing",
        "marketing_staff",
      ]}
    />
  }
>
  <Route element={<MarketingLayout />}>
    <Route
      index
      element={<MarketingDashboardPage />}
    />
  </Route>
</Route>
    </Routes>
  );
}