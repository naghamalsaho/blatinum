import { createSlice } from "@reduxjs/toolkit";
import {
  deactivateCustomerServiceClient,
  fetchCustomerServiceClients,
} from "./client.thunks";

const initialState = {
  items: [],
  message: "",
  loading: false,
  actionLoading: false,
  error: null,
};

const clientSlice = createSlice({
  name: "customerServiceClients",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerServiceClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerServiceClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load clients";
      })
      .addCase(deactivateCustomerServiceClient.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deactivateCustomerServiceClient.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deactivateCustomerServiceClient.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to deactivate client";
      });
  },
});

export default clientSlice.reducer;
