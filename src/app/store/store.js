import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../../Rools/admin/features/auth/model/auth.slice";
import availableSlotReducer from "@/Rools/legal/features/availableSlots/model/availableSlot.slice";
import departmentReducer from "@/Rools/admin/features/departments/model/department.slice";
import employeeReducer from "@/Rools/admin/features/employees/model/employee.slice";
import warehouseReducer from "@/Rools/admin/features/warehouses/model/warehouse.slice";
import itemReducer from "@/Rools/admin/features/items/model/item.slice";

import projectEngineerReducer from "@/Rools/engineering/features/engineerProjects/model/engineerProject.slice";
import engineerReducer from "@/Rools/engineering/features/engineers/model/engineer.slice";

import advertisementReducer from "@/Rools/marketing/features/advertisements/model/advertisement.slice";
import projectReducer from "@/Rools/marketing/features/projects/model/project.slice";
import buildingReducer from "@/Rools/marketing/features/buildings/model/building.slice";
import unitReducer from "@/Rools/marketing/features/units/model/unit.slice";
import locationReducer from "@/Rools/marketing/features/locations/model/location.slice";
import serviceReducer from "@/Rools/marketing/features/services/model/service.slice";
import offerReducer from "@/Rools/marketing/features/offer/model/offer.slice";
import customerServiceAppointmentReducer from "@/Rools/customerService/features/appointments/model/appointment.slice";
import customerServiceChatReducer from "@/Rools/customerService/features/chat/model/chat.slice";
import customerServiceClientReducer from "@/Rools/customerService/features/clients/model/client.slice";
import customerServiceComplaintReducer from "@/Rools/customerService/features/complaints/model/complaint.slice";
import customerServiceLotteryReducer from "@/Rools/customerService/features/lottery/model/lottery.slice";
import customerServiceOrderReducer from "@/Rools/customerService/features/orders/model/order.slice";

import rolePermissionReducer from "@/Rools/admin/features/roles/model/role.slice";

import soldUnitOwnershipReducer from "@/Rools/legal/features/soldUnits/model/soldUnitOwnership.slice";
import contractReducer from "@/Rools/legal/features/contracts/model/contract.slice";

import transferReducer from "@/Rools/financial/features/transfers/model/transfer.slice";
import paymentReducer from "@/Rools/financial/features/payments/model/payment.slice";
import contractExceptionReducer from "@/Rools/financial/features/exceptions/model/contractException.slice";
import errorReducer from "@/shared/store/error/error.slice";


import appointmentReducer from "@/Rools/legal/features/availableSlots/model/appointment.slice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    error: errorReducer,

    availableSlots: availableSlotReducer,

    departments: departmentReducer,
    employees: employeeReducer,
    warehouses: warehouseReducer,
    items: itemReducer,
    rolePermission: rolePermissionReducer,

    projectEngineer: projectEngineerReducer,
    engineers: engineerReducer,

    advertisements: advertisementReducer,
    projects: projectReducer,
    buildings: buildingReducer,
    units: unitReducer,
    locations: locationReducer,
    services: serviceReducer,
    offer: offerReducer,

  soldUnitOwnership: soldUnitOwnershipReducer,
  contract: contractReducer,

  customerServiceAppointments: customerServiceAppointmentReducer,
  customerServiceChat: customerServiceChatReducer,
  customerServiceClients: customerServiceClientReducer,
  customerServiceComplaints: customerServiceComplaintReducer,
  customerServiceLotteries: customerServiceLotteryReducer,
  customerServiceOrders: customerServiceOrderReducer,




  appointments: appointmentReducer,
  transfers: transferReducer,
    payments: paymentReducer,
    contractExceptions: contractExceptionReducer,
  },
});