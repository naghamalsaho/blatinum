import { createAsyncThunk } from "@reduxjs/toolkit";
import { getItemsRequest } from "../api/item.api";

export const fetchItems = createAsyncThunk(
  "items/fetchAll",
  async (_, thunkAPI) => {
    const result = await getItemsRequest();

    if (result.ok) {
      return result.data?.data ?? [];
    }

    if (result.status === 401) {
      return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);
