import { createSlice } from "@reduxjs/toolkit";
import {
  addCustomerServiceOrderNote,
  changeCustomerServiceOrderStatus,
  fetchCustomerServiceClientOrders,
  fetchCustomerServiceOrder,
  fetchCustomerServiceOrders,
  transferCustomerServiceOrder,
} from "./order.thunks";

const initialState = {
  items: [],
  links: null,
  meta: null,
  message: "",
  loading: false,
  error: null,
  selectedOrder: {
    item: null,
    loading: false,
    error: null,
  },
  actionLoading: false,
  actionError: null,
  actionMessage: "",
  clientOrders: {
    clientId: null,
    unitOrders: {
      items: [],
      links: null,
      meta: null,
      message: "",
    },
    solutionOrders: {
      items: [],
      links: null,
      meta: null,
      message: "",
    },
    loading: false,
    error: null,
  },
};

const orderSlice = createSlice({
  name: "customerServiceOrders",
  initialState,
  reducers: {
    clearCustomerServiceClientOrders(state) {
      state.clientOrders = initialState.clientOrders;
    },
    clearCustomerServiceSelectedOrder(state) {
      state.selectedOrder = initialState.selectedOrder;
    },
    clearCustomerServiceOrderActionState(state) {
      state.actionError = null;
      state.actionMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerServiceOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerServiceOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.links = action.payload.links;
        state.meta = action.payload.meta;
        state.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load orders";
      })
      .addCase(fetchCustomerServiceClientOrders.pending, (state) => {
        state.clientOrders.loading = true;
        state.clientOrders.error = null;
      })
      .addCase(fetchCustomerServiceClientOrders.fulfilled, (state, action) => {
        state.clientOrders.loading = false;
        state.clientOrders.clientId = action.payload.clientId;
        state.clientOrders.unitOrders = action.payload.unitOrders;
        state.clientOrders.solutionOrders = action.payload.solutionOrders;
      })
      .addCase(fetchCustomerServiceClientOrders.rejected, (state, action) => {
        state.clientOrders.loading = false;
        state.clientOrders.error = action.payload || "Failed to load client orders";
      })
      .addCase(fetchCustomerServiceOrder.pending, (state) => {
        state.selectedOrder.loading = true;
        state.selectedOrder.error = null;
      })
      .addCase(fetchCustomerServiceOrder.fulfilled, (state, action) => {
        state.selectedOrder.loading = false;
        state.selectedOrder.item = action.payload;
      })
      .addCase(fetchCustomerServiceOrder.rejected, (state, action) => {
        state.selectedOrder.loading = false;
        state.selectedOrder.error = action.payload || "Failed to load order";
      })
      .addCase(transferCustomerServiceOrder.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionMessage = "";
      })
      .addCase(transferCustomerServiceOrder.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionMessage = "Order updated successfully";
      })
      .addCase(transferCustomerServiceOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Order action failed";
      })
      .addCase(changeCustomerServiceOrderStatus.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionMessage = "";
      })
      .addCase(changeCustomerServiceOrderStatus.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionMessage = "Order updated successfully";
      })
      .addCase(changeCustomerServiceOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Order action failed";
      })
      .addCase(addCustomerServiceOrderNote.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionMessage = "";
      })
      .addCase(addCustomerServiceOrderNote.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionMessage = "Order updated successfully";
      })
      .addCase(addCustomerServiceOrderNote.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload || "Order action failed";
      });
  },
});

export const {
  clearCustomerServiceClientOrders,
  clearCustomerServiceSelectedOrder,
  clearCustomerServiceOrderActionState,
} = orderSlice.actions;
export default orderSlice.reducer;
