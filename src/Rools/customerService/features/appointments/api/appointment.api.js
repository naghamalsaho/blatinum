import { api } from "@/shared/api/crud";

const APPOINTMENT_ENDPOINT = "/appointment";
const CLIENT_ENDPOINT = "/client";
const ORDER_ENDPOINT = "/order/ordersForAppointments";
const AVAILABLE_SLOT_ENDPOINT = "/availableSlot";

const buildAppointmentFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      formData.append(key, String(value).trim());
    }
  });

  return formData;
};

export const getAppointmentsRequest = () => {
  return api.get(APPOINTMENT_ENDPOINT);
};

export const getAppointmentClientsRequest = () => {
  return api.get(CLIENT_ENDPOINT);
};

export const getAppointmentOrdersRequest = () => {
  return api.get(ORDER_ENDPOINT);
};

export const getAppointmentAvailableSlotsRequest = () => {
  return api.get(AVAILABLE_SLOT_ENDPOINT, {}, { skipAuthRefresh: true });
};

export const createAppointmentRequest = (payload = {}) => {
  return api.upload(APPOINTMENT_ENDPOINT, buildAppointmentFormData(payload));
};

export const updateAppointmentRequest = (id, payload = {}) => {
  return api.putForm(`${APPOINTMENT_ENDPOINT}/${id}`, buildAppointmentFormData(payload));
};

export const cancelAppointmentRequest = (id) => {
  return api.put(`${APPOINTMENT_ENDPOINT}/cancel/${id}`, undefined);
};

export const completeAppointmentRequest = (id) => {
  return api.put(`${APPOINTMENT_ENDPOINT}/markAsDone/${id}`, undefined);
};
