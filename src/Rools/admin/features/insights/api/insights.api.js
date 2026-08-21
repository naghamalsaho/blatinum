import { api } from "@/shared/api/crud";

const INSIGHTS_ENDPOINT = "/admin/construction-insights";

export const getConstructionInsightsRequest = (params = {}) =>
  api.get(INSIGHTS_ENDPOINT, params);

export const markConstructionInsightReadRequest = (insightId) =>
  api.patch(`${INSIGHTS_ENDPOINT}/${insightId}/read`, {});
