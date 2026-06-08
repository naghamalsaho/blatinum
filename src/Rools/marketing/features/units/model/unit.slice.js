import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUnits,
  fetchUnitsByBuilding,
  createUnit,
  updateUnit,
  deleteUnit,
} from "./unit.thunks";

const initialState = {
  units: [],
  buildingUnits: [],
  loading: false,
  buildingLoading: false,
  creating: false,
  updating: false,
  error: null,
};

const unitSlice = createSlice({
  name: "units",
  initialState,
  reducers: {
    clearUnitError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(fetchUnitsByBuilding.pending, (state) => {
        state.buildingLoading = true;
        state.error = null;
      })
      .addCase(fetchUnitsByBuilding.fulfilled, (state, action) => {
        state.buildingLoading = false;
        state.buildingUnits = action.payload;
      })
      .addCase(fetchUnitsByBuilding.rejected, (state, action) => {
        state.buildingLoading = false;
        state.error = action.payload || "فشل في جلب وحدات البناء";
      })

      .addCase(createUnit.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createUnit.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          state.units.unshift(action.payload);
          if (action.payload.building_id) {
            state.buildingUnits.unshift(action.payload);
          }
        }
      })
      .addCase(createUnit.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في إضافة الوحدة";
      })

      .addCase(updateUnit.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateUnit.fulfilled, (state, action) => {
        state.updating = false;
        const updated = action.payload;
        if (!updated) return;

        const updateList = (list) => {
          const index = list.findIndex((item) => item.id === updated.id);
          if (index !== -1) list[index] = updated;
        };

        updateList(state.units);
        updateList(state.buildingUnits);
      })
      .addCase(updateUnit.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "فشل في تحديث الوحدة";
      })

      .addCase(deleteUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.units = state.units.filter((item) => item.id !== action.payload);
        state.buildingUnits = state.buildingUnits.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حذف الوحدة";
      });
  },
});

export const { clearUnitError } = unitSlice.actions;
export default unitSlice.reducer;