import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  getAllProjectEngineersRequest,
  getProjectsForEngineerRequest,
  assignEngineerProjectRequest,
} from "../api/engineerProject.api";


// =======================================
// GET ALL PROJECT ENGINEERS
// =======================================
export const fetchProjectEngineers =
  createAsyncThunk(
    "projectEngineer/fetchAll",

    async (_, thunkAPI) => {
      console.log(
        "[fetchProjectEngineers] request"
      );

      const result =
        await getAllProjectEngineersRequest();

      console.log(
        "[fetchProjectEngineers] response:",
        result
      );

      if (result.ok) {
        return result.data?.data ?? [];
      }

      return thunkAPI.rejectWithValue(
        result.message
      );
    }
  );


// =======================================
// GET PROJECTS FOR ENGINEER
// =======================================
export const fetchProjectsForEngineer =
  createAsyncThunk(
    "projectEngineer/fetchProjectsForEngineer",

    async (engineerId, thunkAPI) => {
      console.log(
        "[fetchProjectsForEngineer] engineerId:",
        engineerId
      );

      const result =
        await getProjectsForEngineerRequest(
          engineerId
        );

      console.log(
        "[fetchProjectsForEngineer] response:",
        result
      );

      if (result.ok) {
        return result.data?.data ?? [];
      }

      return thunkAPI.rejectWithValue(
        result.message
      );
    }
  );


// =======================================
// ASSIGN ENGINEER TO PROJECT
// =======================================
export const assignEngineerProject =
  createAsyncThunk(
    "projectEngineer/assign",

    async (payload, thunkAPI) => {
      console.log(
        "[assignEngineerProject] payload:",
        payload
      );

      const result =
        await assignEngineerProjectRequest(
          payload
        );

      console.log(
        "[assignEngineerProject] response:",
        result
      );

      if (result.ok) {
        return result.data?.data ?? true;
      }

      return thunkAPI.rejectWithValue(
        result.message
      );
    }
  );