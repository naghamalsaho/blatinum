import { Routes, Route } from "react-router-dom";
import LoginPage from "../Rools/admin/pages/LoginPage.jsx";
import AdminLayout from "./layouts/adminLayout";
import DashboardPage from "../Rools/admin/pages/DashboardPage.jsx"
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
       <Route path="/admin" element={<AdminLayout />}>
  <Route index element={<DashboardPage />} />

        
      </Route>

    </Routes>
  );
}