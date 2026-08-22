import { createSlice } from "@reduxjs/toolkit";
import { generateDesignFromText } from "./aiDesign.thunks";

const initialState = {
  result: null,
  loading: false,
  error: null,
};

const aiDesignSlice = createSlice({
  name: "aiDesign",
  initialState,
  reducers: {
    clearAiDesignState: (state) => {
      state.result = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDesignFromText.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateDesignFromText.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(generateDesignFromText.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء توليد التصميم";
      });
  },
});

export const { clearAiDesignState } = aiDesignSlice.actions;
export default aiDesignSlice.reducer;