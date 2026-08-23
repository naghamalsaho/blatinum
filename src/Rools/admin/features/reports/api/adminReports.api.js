import { api } from "@/shared/api/crud";

export const getAdminDashboardReportRequest = () =>
  api.get("/reports/admin/dashboard");

export const downloadAdminReportPdfRequest = () =>
  api.get("/reports/admin/download-pdf", {}, { responseType: "blob" });

export const getInventoryDashboardReportRequest = () =>
  api.get("/reports/inventory/dashboard");

export const downloadInventoryReportPdfRequest = () =>
  api.get("/reports/inventory/download-pdf", {}, { responseType: "blob" });
