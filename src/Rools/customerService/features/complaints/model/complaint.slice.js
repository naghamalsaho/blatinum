import { createSlice } from "@reduxjs/toolkit";
import {
  changeCustomerServiceComplaintStatus,
  createCustomerServiceComplaintType,
  fetchCustomerServiceComplaints,
  fetchCustomerServiceComplaintTypes,
  removeCustomerServiceComplaint,
  removeCustomerServiceComplaintType,
} from "./complaint.thunks";

const initialState = {
  items: [],
  links: null,
  meta: null,
  message: "",
  loading: false,
  error: null,
  types: {
    items: [],
    loading: false,
    error: null,
    message: "",
  },
  actionLoading: false,
  actionError: null,
  actionMessage: "",
};

const complaintSlice = createSlice({
  name: "customerServiceComplaints",
  initialState,
  reducers: {
    clearCustomerServiceComplaintActionState(state) {
      state.actionError = null;
      state.actionMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerServiceComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerServiceComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.links = action.payload.links;
        state.meta = action.payload.meta;
        state.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load complaints";
      })
      .addCase(fetchCustomerServiceComplaintTypes.pending, (state) => {
        state.types.loading = true;
        state.types.error = null;
      })
      .addCase(fetchCustomerServiceComplaintTypes.fulfilled, (state, action) => {
        state.types.loading = false;
        state.types.items = action.payload.items;
        state.types.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceComplaintTypes.rejected, (state, action) => {
        state.types.loading = false;
        state.types.error = action.payload || "Failed to load complaint types";
      })
      .addMatcher(
        (action) =>
          [
            changeCustomerServiceComplaintStatus.pending.type,
            removeCustomerServiceComplaint.pending.type,
            createCustomerServiceComplaintType.pending.type,
            removeCustomerServiceComplaintType.pending.type,
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
            changeCustomerServiceComplaintStatus.fulfilled.type,
            removeCustomerServiceComplaint.fulfilled.type,
            createCustomerServiceComplaintType.fulfilled.type,
            removeCustomerServiceComplaintType.fulfilled.type,
          ].includes(action.type),
        (state) => {
          state.actionLoading = false;
          state.actionMessage = "Complaint action completed successfully";
        }
      )
      .addMatcher(
        (action) =>
          [
            changeCustomerServiceComplaintStatus.rejected.type,
            removeCustomerServiceComplaint.rejected.type,
            createCustomerServiceComplaintType.rejected.type,
            removeCustomerServiceComplaintType.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.actionLoading = false;
          state.actionError = action.payload || "Complaint action failed";
        }
      );
  },
});

export const { clearCustomerServiceComplaintActionState } = complaintSlice.actions;
export default complaintSlice.reducer;
