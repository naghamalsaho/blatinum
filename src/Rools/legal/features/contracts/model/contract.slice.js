import { createSlice } from "@reduxjs/toolkit";
import {
    createContract,
    fetchOrders,
    fetchContracts,
    fetchContractById,
    fetchClientContracts,
    changeContractStatus
} from "./contract.thunks";

const initialState = {
  items: [],
  links: {},
  meta: {
    current_page:1,
    last_page:1,
    total:0
  },
clientContracts: [],
clientContractsLoading:false,
statusUpdating:false,
  creating: false,

  orders: [],
  ordersLoading: false,
 contractDetails: null,
  detailsLoading: false,
  error: null,
  ordersError: null,

};
const contractSlice = createSlice({
  name: "contract",
  initialState,
  reducers: {
    clearContractError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createContract.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createContract.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في إنشاء العقد";
      })
      .addCase(fetchOrders.pending, (state) => {
    state.ordersLoading = true;
    state.ordersError = null;
})

.addCase(fetchOrders.fulfilled, (state, action) => {
    state.ordersLoading = false;
    state.orders = action.payload;
})

.addCase(fetchOrders.rejected, (state, action) => {
    state.ordersLoading = false;
    state.ordersError = action.payload;
}).addCase(fetchContracts.pending,(state)=>{
    state.loading=true;
    state.error=null;
})

.addCase(fetchContracts.fulfilled,(state,action)=>{

    state.loading=false;

    state.items = action.payload.items;

    state.links = action.payload.links;

    state.meta = action.payload.meta;
})

.addCase(fetchContracts.rejected,(state,action)=>{
    state.loading=false;
    state.error = action.payload;
})
.addCase(fetchContractById.pending, (state)=>{
  state.detailsLoading = true;
  state.error = null;
})


.addCase(fetchContractById.fulfilled, (state, action)=>{

  state.detailsLoading = false;

  state.contractDetails = action.payload;

})


.addCase(fetchContractById.rejected,(state,action)=>{

  state.detailsLoading = false;

  state.error =
    action.payload || "فشل في جلب تفاصيل العقد";

})
.addCase(fetchClientContracts.pending,(state)=>{
    state.clientContractsLoading=true;
})


.addCase(fetchClientContracts.fulfilled,(state,action)=>{

    state.clientContractsLoading=false;

    state.clientContracts=action.payload;

})


.addCase(fetchClientContracts.rejected,(state)=>{

    state.clientContractsLoading=false;

})
.addCase(changeContractStatus.pending,(state)=>{

    state.statusUpdating=true;

})

.addCase(changeContractStatus.fulfilled,(state,action)=>{

    state.statusUpdating=false;

    const updated =
      action.payload;

    const contract =
      state.items.find(
        c=>c.id===updated.id
      );

    if(contract){

      contract.status=
        updated.status;

    }

    if(
      state.contractDetails &&
      state.contractDetails.id===updated.id
    ){

      state.contractDetails.status=
        updated.status;

    }

})

.addCase(changeContractStatus.rejected,(state)=>{

    state.statusUpdating=false;

})
  },
});

export const { clearContractError } = contractSlice.actions;

export default contractSlice.reducer;