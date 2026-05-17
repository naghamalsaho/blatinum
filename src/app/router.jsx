import { Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "./layouts/adminLayout";
import DashboardPage from "@/pages/DashboardPage.jsx";
import AdminDepartmentsPage from "@/Rools/admin/pages/AdminDepartmentsPage";
import AdminEmployeesPage from "@/Rools/admin/pages/AdminEmployeesPage";
import AdminWarehousesPage from "@/Rools/admin/pages/AdminWarehousesPage";
import AdminItemsPage from "@/Rools/admin/pages/AdminItemsPage";
import LegalLayout from "@/app/layouts/LegalLayout";
import LegalDashboardPage from "@/Rools/legal/pages/LegalDashboardPage";
import LegalAvailableSlotsPage from "@/Rools/legal/pages/LegalAvailableSlotsPage";
import LegalEngineersPage from "@/Rools/legal/pages/LegalEngineersPage";
import EngineeringLayout from "@/app/layouts/EngineeringLayout";
import EngineeringDashboardPage from "@/Rools/engineering/pages/EngineeringDashboardPage";
import EngineeringProjectsAssignPage from "@/Rools/engineering/pages/EngineeringProjectsAssignPage";
import EngineeringProjectsUpdatePage from "@/Rools/engineering/pages/EngineeringProjectsUpdatePage";
import EngineeringProjectsWithEngineersPage from "@/Rools/engineering/pages/EngineeringProjectsWithEngineersPage";
import EngineeringProjectsForEngineerPage from "@/Rools/engineering/pages/EngineeringProjectsForEngineerPage";
import EngineeringProjectEngineersPage from "@/Rools/engineering/pages/EngineeringProjectEngineersPage";
import EngineeringEngineersPage from "@/Rools/engineering/pages/EngineeringEngineersPage";
import EngineeringReportsPage from "@/Rools/engineering/pages/EngineeringReportsPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="warehouses" element={<AdminWarehousesPage />} />
        <Route path="items" element={<AdminItemsPage />} />
      </Route>

      <Route path="/legal" element={<LegalLayout />}>
        <Route index element={<LegalDashboardPage />} />
        <Route path="slots" element={<LegalAvailableSlotsPage />} />
        <Route path="engineers" element={<LegalEngineersPage />} />
      </Route>
      <Route path="/engineering" element={<EngineeringLayout />}>
  <Route index element={<EngineeringDashboardPage />} />
  <Route path="projects/assign" element={<EngineeringProjectsAssignPage />} />
  <Route path="projects/update" element={<EngineeringProjectsUpdatePage />} />
  <Route path="projects/with-engineers" element={<EngineeringProjectsWithEngineersPage />} />
  <Route path="projects/for-engineer" element={<EngineeringProjectsForEngineerPage />} />
  <Route path="projects/project-engineers" element={<EngineeringProjectEngineersPage />} />
  <Route path="engineers" element={<EngineeringEngineersPage />} />
  <Route path="reports" element={<EngineeringReportsPage />} />
</Route>
    </Routes>
  );
}
