import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAdvertisements,
  fetchActiveAdvertisements,
  deleteAdvertisement,
  createAdvertisement,
  
} from "./advertisement.thunks";

const initialState = {
  advertisements: [],
  activeAdvertisements: [],
  loading: false,
  activeLoading: false,
  error: null,
};

const advertisementSlice = createSlice({
  name: "advertisements",
  initialState,
  reducers: {
    clearAdvertisementError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdvertisements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdvertisements.fulfilled, (state, action) => {
        state.loading = false;
        state.advertisements = action.payload;
      })
      .addCase(fetchAdvertisements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(fetchActiveAdvertisements.pending, (state) => {
  state.activeLoading = true;
  state.error = null;
})
.addCase(fetchActiveAdvertisements.fulfilled, (state, action) => {
  state.activeLoading = false;
  state.activeAdvertisements = action.payload;
})
.addCase(fetchActiveAdvertisements.rejected, (state, action) => {
  state.activeLoading = false;
  state.error = action.payload || "فشل في جلب الإعلانات النشطة";
})

      .addCase(deleteAdvertisement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdvertisement.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.advertisements = state.advertisements.filter(
          (item) => item.id !== deletedId
        );
        state.activeAdvertisements = state.activeAdvertisements.filter(
          (item) => item.id !== deletedId
        );
      })
      .addCase(deleteAdvertisement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل إجراء الحذف";
      })

      .addCase(createAdvertisement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdvertisement.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.advertisements.unshift(action.payload);
        }
      })
      .addCase(createAdvertisement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حفظ الإعلان الجديد";
      });
  },
});

export const { clearAdvertisementError } = advertisementSlice.actions;
export default advertisementSlice.reducer;