import { api } from "@/shared/api/crud";

// طلب توليد المخطط من وصف نصي
export const generateDesignFromTextRequest = async (payload) => {
  const response = await api.post("/ai-design/from-text", payload);
  return response.data;
};

// طلب توليد وتعديل التصميم من صورة
export const generateDesignFromImageRequest = async (formDataPayload) => {
  const response = await api.postForm("/ai-design/from-image", formDataPayload);
  return response.data;
};

// طلب اعتماد / تبديل حالة نشر التصميم
export const togglePublishDesignRequest = async (designId) => {
  const response = await api.patch(`/apartment-designs/${designId}/toggle-publish`);
  return response.data;
};

export const aiDesignApi = {
  generateFromText: generateDesignFromTextRequest,
  generateFromImage: generateDesignFromImageRequest,
  togglePublish: togglePublishDesignRequest,
};

export default aiDesignApi;