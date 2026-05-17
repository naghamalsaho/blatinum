import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../Rools/admin/features/auth/model/auth.slice";
import availableSlotReducer from "@/Rools/legal/features/availableSlots/model/availableSlot.slice";
import departmentReducer from "@/Rools/admin/features/departments/model/department.slice";
import employeeReducer from "@/Rools/admin/features/employees/model/employee.slice";
import warehouseReducer from "@/Rools/admin/features/warehouses/model/warehouse.slice";
import itemReducer from "@/Rools/admin/features/items/model/item.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    availableSlots: availableSlotReducer,
    departments: departmentReducer,
    employees: employeeReducer,
    warehouses: warehouseReducer,
    items: itemReducer,
  },
});
