import { createSlice } from "@reduxjs/toolkit";
import { 
  generateDesignFromText, 
  generateDesignFromImage, 
  togglePublishDesign 
} from "./aiDesign.thunks";

const initialState = {
  result: null,
  loading: false,
  publishing: false,
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
      state.publishing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // generateFromText
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
      })

      // generateFromImage
      .addCase(generateDesignFromImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateDesignFromImage.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(generateDesignFromImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء توليد التصميم من الصورة";
      })

      // togglePublishDesign
      .addCase(togglePublishDesign.pending, (state) => {
        state.publishing = true;
        state.error = null;
      })
      .addCase(togglePublishDesign.fulfilled, (state) => {
        state.publishing = false;
        if (state.result) {
          const isPublished = state.result.is_published ?? state.result.data?.is_published;
          if (state.result.data) {
            state.result.data.is_published = !isPublished;
          } else {
            state.result.is_published = !isPublished;
          }
        }
      })
      .addCase(togglePublishDesign.rejected, (state, action) => {
        state.publishing = false;
        state.error = action.payload || "حدث خطأ أثناء اعتماد التصميم";
      });
  },
});

export const { clearAiDesignState } = aiDesignSlice.actions;
export default aiDesignSlice.reducer;