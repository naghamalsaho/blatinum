import { createAsyncThunk } from "@reduxjs/toolkit";
import { generateDesignFromTextRequest } from "../api/aiDesign.api";

export const generateDesignFromText = createAsyncThunk(
  "aiDesign/generateFromText",
  async (payload, thunkAPI) => {
    console.log("[generateDesignFromText] request payload:", payload);

    const result = await generateDesignFromTextRequest(payload);

    console.log("[generateDesignFromText] response:", result);

    if (result.ok) {
      return result.data;
    }

    return thunkAPI.rejectWithValue(result.message || "فشل الاتصال بسيرفر الذكاء الاصطناعي");
  }
);