import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllProjectEngineersRequest,
  getEngineersAllocatedToProjectRequest,
  getAllocatedLocationsForEngineerRequest,
  getEngineersAllocatedToBuildingRequest,
  assignEngineerProjectRequest,
} from "../api/engineerProject.api";

// دالة مساعدة موحدة لترتيب وتحويل البيانات بشكل آمن ومقاوم للبيانات الناقصة
const transformAllocations = (allocations) => {
  return allocations.map((allocation) => {
    // إحداثيات افتراضية تعتمد على السجل لضمان عدم اختفاء ماب الخريطة
    const coords = {
      latitude: allocation.latitude,
      longitude: allocation.longitude,
      radius: allocation.allowed_radius || 500
    };

    return {
      ...allocation,
      // 1. معالجة كائن المشروع: إذا كان موجوداً نأخذه بالكامل مع أبنيته
      project: allocation.project ? {
        ...allocation.project,
        name: allocation.project_name || allocation.project.name,
        coordinates: allocation.project.coordinates || coords
      } : (allocation.project_id ? {
        id: allocation.project_id,
        name: allocation.project_name || "مشروع غير مسمى",
        coordinates: coords,
        buildings: []
      } : null),
      
      // 2. معالجة كائن البناء: التمرير المباشر للأبنية ومرفقاتها
      building: allocation.building ? {
        ...allocation.building,
        building_number: allocation.building_number || allocation.building.building_number,
        coordinates: allocation.building.coordinates || coords
      } : (allocation.building_id ? {
        id: allocation.building_id,
        building_number: allocation.building_number || "بناء مخصص",
        coordinates: coords
      } : null),

      // 3. الحل الذكي للمهندس: إذا رجع كائن المهندس الحقيقي (مثل راوت الديالوغ) نأخذه فوراً
      // وإذا لم يرجع (مثل الراوت العام) نؤمن كائن مرن يحمل المعرف الفرعي لمنع الكراش
      engineer: allocation.engineer ? {
        ...allocation.engineer,
        engineer_id: allocation.engineer_id || allocation.engineer.engineer_id
      } : {
        engineer_id: allocation.engineer_id || allocation.id,
        account: {
          id: allocation.engineer_id || allocation.id,
          full_name: `مهندس #${allocation.engineer_id || allocation.id}`
        }
      }
    };
  });
};

export const fetchProjectEngineers = createAsyncThunk(
  "projectEngineer/fetchAll",
  async (_, thunkAPI) => {
    const result = await getAllProjectEngineersRequest();
    if (result.ok) {
      const allocations = result.data?.data ?? [];
      return transformAllocations(allocations);
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const fetchEngineersAllocatedToProject = createAsyncThunk(
  "projectEngineer/fetchEngineersAllocatedToProject",
  async (projectId, thunkAPI) => {
    const result = await getEngineersAllocatedToProjectRequest(projectId);
    if (result.ok) {
      const allocations = result.data?.data ?? [];
      return transformAllocations(allocations);
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const fetchAllocatedLocationsForEngineer = createAsyncThunk(
  "projectEngineer/fetchAllocatedLocationsForEngineer",
  async (engineerId, thunkAPI) => {
    const result = await getAllocatedLocationsForEngineerRequest(engineerId);
    if (result.ok) {
      const allocations = result.data?.data ?? [];
      return transformAllocations(allocations);
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const fetchEngineersAllocatedToBuilding = createAsyncThunk(
  "projectEngineer/fetchEngineersAllocatedToBuilding",
  async (buildingId, thunkAPI) => {
    const result = await getEngineersAllocatedToBuildingRequest(buildingId);
    if (result.ok) {
      const allocations = result.data?.data ?? [];
      return transformAllocations(allocations);
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);

export const assignEngineerProject = createAsyncThunk(
  "projectEngineer/assign",
  async (payload, thunkAPI) => {
    const result = await assignEngineerProjectRequest(payload);
    if (result.ok) {
      return result.data?.data ?? true;
    }
    return thunkAPI.rejectWithValue(result.message);
  }
);