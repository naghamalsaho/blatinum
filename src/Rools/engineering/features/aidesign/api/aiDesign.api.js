import { api } from "@/shared/api/crud";

export const generateDesignFromTextRequest = (payload) => {
  return api.post("/ai-design/from-text", payload);
};