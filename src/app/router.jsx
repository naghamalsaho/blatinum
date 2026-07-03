import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage.jsx";

import AdminLayout from "./layouts/adminLayout";
import LegalLayout from "@/app/layouts/LegalLayout";
import EngineeringLayout from "@/app/layouts/EngineeringLayout";
import MarketingLayout from "@/app/layouts/MarketingLayout";
import CustomerServiceLayout from "@/app/layouts/CustomerServiceLayout";

import RequireAuth from "./guards/RequireAuth";
import RequireRole from "./guards/RequireRole";

import AdminDepartmentsPage from "@/Rools/admin/pages/AdminDepartmentsPage";
import AdminEmployeesPage from "@/Rools/admin/pages/AdminEmployeesPage";
import AdminWarehousesPage from "@/Rools/admin/pages/AdminWarehousesPage";
import AdminItemsPage from "@/Rools/admin/pages/AdminItemsPage";

import LegalDashboardPage from "@/Rools/legal/pages/LegalDashboardPage";
import LegalAvailableSlotsPage from "@/Rools/legal/pages/LegalAvailableSlotsPage";


import EngineeringDashboardPage from "@/Rools/engineering/pages/EngineeringDashboardPage";
import EngineeringEngineersPage from "@/Rools/engineering/pages/EngineeringEngineersPage";

import MarketingDashboardPage from "@/Rools/marketing/pages/MarketingDashboardPage";
import MarketingAdsPage from "@/Rools/marketing/pages/MarketingAdsPage";
import MarketingProjectsPage from "@/Rools/marketing/pages/MarketingProjectsPage";

import MarketingServicesPage from "@/Rools/marketing/pages/MarketingServicesPage";
import LegalSalesPage from "@/Rools/legal/pages/LegalSalesPage";

import CustomerServiceDashboardPage from "@/Rools/customerService/pages/CustomerServiceDashboardPage";
import CustomerServiceClientsPage from "@/Rools/customerService/pages/CustomerServiceClientsPage";
import CustomerServiceAppointmentsPage from "@/Rools/customerService/pages/CustomerServiceAppointmentsPage";
import CustomerServiceOrdersPage from "@/Rools/customerService/pages/CustomerServiceOrdersPage";

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
            <Route path="sales" element={<LegalSalesPage />} />
            
          </Route>
        </Route>

        <Route
          path="/engineering"
          element={
            <RequireRole
              allowedRoles={["engineering", "engineer", "engineering_staff"]}
            />
          }
        >
          <Route element={<EngineeringLayout />}>
            <Route index element={<EngineeringDashboardPage />} />
            <Route path="engineers" element={<EngineeringEngineersPage />} />
          </Route>
        </Route>

        <Route
          path="/marketing"
          element={
            <RequireRole
              allowedRoles={["marketing", "marketing_staff"]}
            />
          }
        >
          <Route element={<MarketingLayout />}>
            <Route index element={<MarketingDashboardPage />} />
            <Route path="ads" element={<MarketingAdsPage />} />
            <Route path="projects" element={<MarketingProjectsPage />} />
            <Route path="/marketing/services" element={<MarketingServicesPage />} />
          </Route>
        </Route>

        <Route
          path="/customer-service"
          element={
            <RequireRole
              allowedRoles={["customer_service", "customer_service_staff"]}
            />
          }
        >
          <Route element={<CustomerServiceLayout />}>
            <Route index element={<CustomerServiceDashboardPage />} />
            <Route path="clients" element={<CustomerServiceClientsPage />} />
            <Route path="appointments" element={<CustomerServiceAppointmentsPage />} />
            <Route path="orders" element={<CustomerServiceOrdersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
