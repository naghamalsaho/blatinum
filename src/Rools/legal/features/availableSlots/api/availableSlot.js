import { api } from "@/shared/api/crud";

const AVAILABLE_SLOT_ENDPOINT = "/availableSlot";

export const getAvailableSlotsRequest = () => {
  return api.get(AVAILABLE_SLOT_ENDPOINT);
};

export const createAvailableSlotRequest = (payload) => {
  return api.post(AVAILABLE_SLOT_ENDPOINT, payload);
};

export const updateAvailableSlotRequest = (id, payload) => {
  return api.put(`${AVAILABLE_SLOT_ENDPOINT}/${id}`, payload);
};

export const deleteAvailableSlotRequest = (id) => {
  return api.delete(`${AVAILABLE_SLOT_ENDPOINT}/${id}`);
};