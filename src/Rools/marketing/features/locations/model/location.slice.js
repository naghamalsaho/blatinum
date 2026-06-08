import { createSlice } from "@reduxjs/toolkit";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation
} from "./location.thunks";

const initialState = {
  locations: [],
  loading: false,
  creating: false,
  updating: false,
  error: null,
};

const locationSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {
    clearLocationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(createLocation.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          state.locations.unshift(action.payload);
        }
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في حفظ الموقع";
      })

      .addCase(updateLocation.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.updating = false;
        if (!action.payload) return;

        const updated = action.payload;
        const index = state.locations.findIndex((item) => item.id === updated.id);

        if (index !== -1) {
          state.locations[index] = updated;
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "فشل في تحديث الموقع";
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
  state.loading = false;
  state.locations = state.locations.filter((item) => item.id !== action.payload);
})
.addCase(deleteLocation.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload || "فشل في حذف الموقع";
})
  },
});

export const { clearLocationError } = locationSlice.actions;
export default locationSlice.reducer;