import { createSlice } from "@reduxjs/toolkit";
import { fetchPayments ,deletePayment,updatePayment,createPayment
  ,payCustomByContract,
  changePaymentStatus,
} from "./payment.thunks";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب قائمة المدفوعات";
      })
 .addCase(updatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في تعديل الدفعة";
      })
.addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.unshift(action.payload); // إضافة العنصر الجديد في أول القائمة
        }
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في إضافة الدفعة";
      })
      // Delete Payment
      .addCase(deletePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حذف الدفعة";
      })
      .addCase(payCustomByContract.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(payCustomByContract.fulfilled, (state) => {
    state.loading = false;
  })
  .addCase(payCustomByContract.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload || "فشل في تسديد الدفعة المخصصة";
  })
  .addCase(changePaymentStatus.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(changePaymentStatus.fulfilled, (state, action) => {
  state.loading = false;
  const index = state.items.findIndex(
    (item) => item.id === action.payload.id
  );
  if (index !== -1) {
    state.items[index] = action.payload;
  }
})
.addCase(changePaymentStatus.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload || "فشل في تغيير حالة الدفعة";
});
  },
});

export default paymentSlice.reducer;