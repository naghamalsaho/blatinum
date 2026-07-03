import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCustomerServiceClientOrders,
  fetchCustomerServiceOrders,
} from "./order.thunks";

const initialState = {
  items: [],
  links: null,
  meta: null,
  message: "",
  loading: false,
  error: null,
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
      });
  },
});

export const { clearCustomerServiceClientOrders } = orderSlice.actions;
export default orderSlice.reducer;
