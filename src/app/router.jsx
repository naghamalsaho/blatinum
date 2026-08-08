import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/pages/LoginPage";
import ChooseWorkspacePage from "@/pages/ChooseWorkspacePage";
import DashboardPage from "@/pages/DashboardPage.jsx";

import AdminLayout from "./layouts/adminLayout";
import LegalLayout from "@/app/layouts/LegalLayout";
import EngineeringLayout from "@/app/layouts/EngineeringLayout";
import MarketingLayout from "@/app/layouts/MarketingLayout";
import CustomerServiceLayout from "@/app/layouts/CustomerServiceLayout";
import FinancialLayout from "@/app/layouts/FinancialLayout";

import RequireAuth from "./guards/RequireAuth";
import RequireRole from "./guards/RequireRole";

import AdminDepartmentsPage from "@/Rools/admin/pages/AdminDepartmentsPage";
import AdminEmployeesPage from "@/Rools/admin/pages/AdminEmployeesPage";
import AdminWarehousesPage from "@/Rools/admin/pages/AdminWarehousesPage";
import AdminItemsPage from "@/Rools/admin/pages/AdminItemsPage";
import AdminRolesPermissionsPage from "@/Rools/admin/pages/AdminRolesPermissionsPage";

import LegalDashboardPage from "@/Rools/legal/pages/LegalDashboardPage";
import LegalAvailableSlotsPage from "@/Rools/legal/pages/LegalAvailableSlotsPage";
import LegalContractsPage from "@/Rools/legal/pages/LegalContractsPage";
import LegalSalesPage from "@/Rools/legal/pages/LegalSalesPage";

import EngineeringDashboardPage from "@/Rools/engineering/pages/EngineeringDashboardPage";
import EngineeringEngineersPage from "@/Rools/engineering/pages/EngineeringEngineersPage";

import MarketingDashboardPage from "@/Rools/marketing/pages/MarketingDashboardPage";
import MarketingAdsPage from "@/Rools/marketing/pages/MarketingAdsPage";
import MarketingProjectsPage from "@/Rools/marketing/pages/MarketingProjectsPage";
import MarketingOffersPage from "@/Rools/marketing/pages/MarketingOffersPage";
import MarketingServicesPage from "@/Rools/marketing/pages/MarketingServicesPage";

import CustomerServiceDashboardPage from "@/Rools/customerService/pages/CustomerServiceDashboardPage";
import CustomerServiceClientsPage from "@/Rools/customerService/pages/CustomerServiceClientsPage";
import CustomerServiceAppointmentsPage from "@/Rools/customerService/pages/CustomerServiceAppointmentsPage";
import CustomerServiceChatPage from "@/Rools/customerService/pages/CustomerServiceChatPage";
import CustomerServiceComplaintsPage from "@/Rools/customerService/pages/CustomerServiceComplaintsPage";
import CustomerServiceLotteryPage from "@/Rools/customerService/pages/CustomerServiceLotteryPage";
import CustomerServiceOrdersPage from "@/Rools/customerService/pages/CustomerServiceOrdersPage";

import FinancialDashboardPage from "@/Rools/financial/pages/FinancialDashboardPage";
import FinancialPaymentsPage from "@/Rools/financial/pages/FinancialPaymentsPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage />} />

      {/* Choose workspace after login */}
     

      {/* Protected routes */}
      <Route element={<RequireAuth />}>
      <Route
  path="/choose-workspace"
  element={<ChooseWorkspacePage />}
/>
        {/* Generic dashboard if still needed */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={<RequireRole allowedRoles={["admin"]} />}
        >
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="departments" element={<AdminDepartmentsPage />} />
            <Route path="employees" element={<AdminEmployeesPage />} />
            <Route path="warehouses" element={<AdminWarehousesPage />} />
            <Route path="items" element={<AdminItemsPage />} />
            <Route
              path="roles-permissions"
              element={<AdminRolesPermissionsPage />}
            />
          </Route>
        </Route>

        {/* Legal */}
        <Route
          path="/legal"
          element={
            <RequireRole
              allowedRoles={["admin", "legal", "law", "legal_staff"]}
            />
          }
        >
          <Route element={<LegalLayout />}>
            <Route index element={<LegalDashboardPage />} />
            <Route path="slots" element={<LegalAvailableSlotsPage />} />
            <Route path="sales" element={<LegalSalesPage />} />
            <Route path="contracts" element={<LegalContractsPage />} />
          </Route>
        </Route>

        {/* Engineering */}
        <Route
          path="/engineering"
          element={
            <RequireRole
              allowedRoles={[
                "admin",
                "engineering",
                "engineer",
                "engineering_staff",
              ]}
            />
          }
        >
          <Route element={<EngineeringLayout />}>
            <Route index element={<EngineeringDashboardPage />} />
            <Route path="engineers" element={<EngineeringEngineersPage />} />
          </Route>
        </Route>

        {/* Marketing */}
        <Route
          path="/marketing"
          element={
            <RequireRole
              allowedRoles={["admin", "marketing", "marketing_staff"]}
            />
          }
        >
          <Route element={<MarketingLayout />}>
            <Route index element={<MarketingDashboardPage />} />
            <Route path="ads" element={<MarketingAdsPage />} />
            <Route path="offers" element={<MarketingOffersPage />} />
            <Route path="projects" element={<MarketingProjectsPage />} />
            <Route path="services" element={<MarketingServicesPage />} />
          </Route>
        </Route>

        {/* Customer Service */}
        <Route
          path="/customer-service"
          element={
            <RequireRole
              allowedRoles={[
                "admin",
                "customer_service",
                "customer_service_staff",
              ]}
            />
          }
        >
          <Route element={<CustomerServiceLayout />}>
            <Route index element={<CustomerServiceDashboardPage />} />
            <Route path="clients" element={<CustomerServiceClientsPage />} />
            <Route
              path="appointments"
              element={<CustomerServiceAppointmentsPage />}
            />
            <Route path="chat" element={<CustomerServiceChatPage />} />
            <Route
              path="complaints"
              element={<CustomerServiceComplaintsPage />}
            />
            <Route path="lottery" element={<CustomerServiceLotteryPage />} />
            <Route path="orders" element={<CustomerServiceOrdersPage />} />
          </Route>
        </Route>

        {/* Financial */}
        <Route
          path="/financial"
          element={
            <RequireRole
              allowedRoles={[
                "admin",
                "financial",
                "finance",
                "financial_staff",
                "finance_staff",
                "accounting",
                "accountant",
                "finance_manager",
                "financial_manager",
              ]}
            />
          }
        >
          <Route element={<FinancialLayout />}>
            <Route index element={<FinancialDashboardPage />} />
            <Route path="payments" element={<FinancialPaymentsPage />} />

            <Route
              path="transactions"
              element={<FinancialDashboardPage />}
            />
            <Route
              path="exceptions"
              element={<FinancialDashboardPage />}
            />
            <Route
              path="department-orders"
              element={<FinancialDashboardPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}