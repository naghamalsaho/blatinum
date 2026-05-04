import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../../Rools/admin/features/auth/model/auth.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});