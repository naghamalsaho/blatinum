import { createSlice } from "@reduxjs/toolkit";
import {
  fetchBuildings,
  fetchBuildingsByProject,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from "./building.thunks";

const initialState = {
  buildings: [],
  projectBuildings: [],
  loading: false,
  projectLoading: false,
  creating: false,
  updating: false,
  error: null,
};

const buildingSlice = createSlice({
  name: "buildings",
  initialState,
  reducers: {
    clearBuildingError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuildings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuildings.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings = action.payload;
      })
      .addCase(fetchBuildings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ غير متوقع";
      })

      .addCase(fetchBuildingsByProject.pending, (state) => {
        state.projectLoading = true;
        state.error = null;
      })
      .addCase(fetchBuildingsByProject.fulfilled, (state, action) => {
        state.projectLoading = false;
        state.projectBuildings = action.payload;
      })
      .addCase(fetchBuildingsByProject.rejected, (state, action) => {
        state.projectLoading = false;
        state.error = action.payload || "فشل في جلب أبنية المشروع";
      })

      .addCase(createBuilding.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createBuilding.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload) {
          state.buildings.unshift(action.payload);
          if (action.payload.project_id) {
            state.projectBuildings.unshift(action.payload);
          }
        }
      })
      .addCase(createBuilding.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "فشل في إضافة البناء";
      })

      .addCase(updateBuilding.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateBuilding.fulfilled, (state, action) => {
        state.updating = false;
        const updated = action.payload;
        if (!updated) return;

        const updateList = (list) => {
          const index = list.findIndex((item) => item.id === updated.id);
          if (index !== -1) list[index] = updated;
        };

        updateList(state.buildings);
        updateList(state.projectBuildings);
      })
      .addCase(updateBuilding.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "فشل في تحديث البناء";
      })

      .addCase(deleteBuilding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBuilding.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings = state.buildings.filter((item) => item.id !== action.payload);
        state.projectBuildings = state.projectBuildings.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteBuilding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "فشل في حذف البناء";
      });
  },
});

export const { clearBuildingError } = buildingSlice.actions;
export default buildingSlice.reducer;