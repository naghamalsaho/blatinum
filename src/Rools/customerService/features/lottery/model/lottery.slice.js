import { createSlice } from "@reduxjs/toolkit";
import {
  cancelCustomerServiceLottery,
  createCustomerServiceLottery,
  drawCustomerServiceLotteryWinner,
  fetchCustomerServiceLotteries,
  fetchCustomerServiceLottery,
  updateCustomerServiceLottery,
} from "./lottery.thunks";

const initialState = {
  items: [],
  links: null,
  meta: null,
  message: "",
  loading: false,
  error: null,
  selectedLottery: {
    item: null,
    loading: false,
    error: null,
    message: "",
  },
  actionLoading: false,
  actionError: null,
  actionMessage: "",
};

const lotterySlice = createSlice({
  name: "customerServiceLotteries",
  initialState,
  reducers: {
    clearCustomerServiceLotteryActionState(state) {
      state.actionError = null;
      state.actionMessage = "";
    },
    clearCustomerServiceSelectedLottery(state) {
      state.selectedLottery = {
        item: null,
        loading: false,
        error: null,
        message: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerServiceLotteries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerServiceLotteries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.links = action.payload.links;
        state.meta = action.payload.meta;
        state.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceLotteries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load lotteries";
      })
      .addCase(fetchCustomerServiceLottery.pending, (state) => {
        state.selectedLottery.loading = true;
        state.selectedLottery.error = null;
      })
      .addCase(fetchCustomerServiceLottery.fulfilled, (state, action) => {
        state.selectedLottery.loading = false;
        state.selectedLottery.item = action.payload.item;
        state.selectedLottery.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceLottery.rejected, (state, action) => {
        state.selectedLottery.loading = false;
        state.selectedLottery.error = action.payload || "Failed to load lottery";
      })
      .addMatcher(
        (action) =>
          [
            createCustomerServiceLottery.pending.type,
            updateCustomerServiceLottery.pending.type,
            cancelCustomerServiceLottery.pending.type,
            drawCustomerServiceLotteryWinner.pending.type,
          ].includes(action.type),
        (state) => {
          state.actionLoading = true;
          state.actionError = null;
          state.actionMessage = "";
        }
      )
      .addMatcher(
        (action) =>
          [
            createCustomerServiceLottery.fulfilled.type,
            updateCustomerServiceLottery.fulfilled.type,
            cancelCustomerServiceLottery.fulfilled.type,
            drawCustomerServiceLotteryWinner.fulfilled.type,
          ].includes(action.type),
        (state) => {
          state.actionLoading = false;
          state.actionMessage = "Lottery action completed successfully";
        }
      )
      .addMatcher(
        (action) =>
          [
            createCustomerServiceLottery.rejected.type,
            updateCustomerServiceLottery.rejected.type,
            cancelCustomerServiceLottery.rejected.type,
            drawCustomerServiceLotteryWinner.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.actionLoading = false;
          state.actionError = action.payload || "Lottery action failed";
        }
      );
  },
});

export const {
  clearCustomerServiceLotteryActionState,
  clearCustomerServiceSelectedLottery,
} = lotterySlice.actions;

export default lotterySlice.reducer;
