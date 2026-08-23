import { api } from "@/shared/api/crud";

const ACTIVITY_LOG_ENDPOINT = "/admin/activity-logs";

export const getActivityLogsRequest = ({ page = 1, perPage = 15 } = {}) =>
  api.get(ACTIVITY_LOG_ENDPOINT, { page, per_page: perPage });

export const getActivityLogRequest = (logId) =>
  api.get(`${ACTIVITY_LOG_ENDPOINT}/${logId}`);
