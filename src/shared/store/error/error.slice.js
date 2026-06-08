// shared/store/error/error.slice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  open: false,
  message: "",
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    showError(state, action) {
      state.open = true;
      state.message = action.payload;
    },

    closeError(state) {
      state.open = false;
      state.message = "";
    },
  },
});

export const { showError, closeError } = errorSlice.actions;
export default errorSlice.reducer;