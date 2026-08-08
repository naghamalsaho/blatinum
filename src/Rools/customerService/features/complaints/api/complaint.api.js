import { api } from "@/shared/api/crud";

const COMPLAINT_ENDPOINT = "/complaint";
const COMPLAINT_TYPE_ENDPOINT = "/complaint/type";

const cleanPayload = (payload = {}) =>
  Object.entries(payload).reduce((result, [key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      result[key] = String(value).trim();
    }

    return result;
  }, {});

export const getComplaintsRequest = () => api.get(COMPLAINT_ENDPOINT);

export const updateComplaintStatusRequest = (complaintId, status) =>
  api.put(`${COMPLAINT_ENDPOINT}/updateStatus/${complaintId}`, cleanPayload({ status }));

export const deleteComplaintRequest = (complaintId) =>
  api.delete(`${COMPLAINT_ENDPOINT}/${complaintId}`);

export const getComplaintTypesRequest = async () => {
  const result = await api.get(`${COMPLAINT_TYPE_ENDPOINT}/read`);

  if (result.ok || result.status !== 404) {
    return result;
  }

  return api.get(COMPLAINT_TYPE_ENDPOINT);
};

export const createComplaintTypeRequest = (title) =>
  api.post(`${COMPLAINT_TYPE_ENDPOINT}/create`, cleanPayload({ title }));

export const deleteComplaintTypeRequest = (typeId) =>
  api.delete(`${COMPLAINT_TYPE_ENDPOINT}/delete/${typeId}`);
