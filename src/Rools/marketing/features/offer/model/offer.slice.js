import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOffers,
  createOffer,
  deleteOffer,
  changeOfferStatus,
  fetchActiveOffers,
} from "./offer.thunks";

const initialState = {
  items: [],
  activeItems: [],
  loading: false,
  error: null,
};

const offerSlice = createSlice({
  name: "offer",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // Fetch Offers
      .addCase(fetchOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch offers";
      })

      // Create Offer
      .addCase(createOffer.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload); // إضافة العرض الجديد لأول القائمة
        }
      })

      // Delete Offer
      .addCase(deleteOffer.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })

      // Change Offer Status
      .addCase(changeOfferStatus.fulfilled, (state, action) => {
        const updatedOffer = action.payload;
        if (updatedOffer && updatedOffer.id) {
          const index = state.items.findIndex(
            (item) => Number(item.id) === Number(updatedOffer.id)
          );
          if (index !== -1) {
            state.items[index] = {
              ...state.items[index],
              ...updatedOffer,
            };
          }
        }
      })
      .addCase(fetchActiveOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.activeItems = action.payload;
        // إذا كنتِ تريدين استبدال القائمة الرئيسية بالعروض النشطة مباشرة:
        state.items = action.payload; 
      })
      .addCase(fetchActiveOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في جلب العروض النشطة";
      });
  },
});

export default offerSlice.reducer;