import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getEngineersRequest,
  createEngineerRequest,
  deleteEngineerRequest,
  getAllocatedLocationsRequest,
} from "../api/engineer.api";

export const fetchEngineers = createAsyncThunk(
  "engineers/fetchAll",
  async (_, thunkAPI) => {
    console.log("[fetchEngineers] request -> GET /engineer");

    const result = await getEngineersRequest();

    console.log("[fetchEngineers] response:", result);

    if (result.ok) {
      return result.data?.data ?? [];
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const createEngineer = createAsyncThunk(
  "engineers/create",
  async (payload, thunkAPI) => {
    console.log("[createEngineer] request body:", payload);

    const result = await createEngineerRequest(payload);

    console.log("[createEngineer] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchEngineers());
      return result.data?.data ?? true;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const deleteEngineer = createAsyncThunk(
  "engineers/delete",
  async (id, thunkAPI) => {
    console.log("[deleteEngineer] request id:", id);

    const result = await deleteEngineerRequest(id);

    console.log("[deleteEngineer] response:", result);

    if (result.ok) {
      await thunkAPI.dispatch(fetchEngineers());
      return id;
    }

    return thunkAPI.rejectWithValue(result.message);
  }
);

export const fetchAllocatedLocations = createAsyncThunk(
  "engineers/fetchAllocatedLocations",
  async (engineerId, thunkAPI) => {
    console.log(`[fetchAllocatedLocations] request -> GET /project-engineer/allocatedLocations/${engineerId}`);
    const result = await getAllocatedLocationsRequest(engineerId);
    console.log("[fetchAllocatedLocations] response:", result);

    if (result.ok) {
      return result.data?.data ?? [];
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);