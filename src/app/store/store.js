import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../Rools/admin/features/auth/model/auth.slice";
import availableSlotReducer from "@/Rools/legal/features/availableSlots/model/availableSlot.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    availableSlots: availableSlotReducer,
  },
});