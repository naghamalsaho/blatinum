import { api } from "@/shared/api/crud";

const CLIENT_ENDPOINT = "/client";

export const getCustomerServiceClientsRequest = () => {
  return api.get(CLIENT_ENDPOINT);
};

export const deactivateCustomerServiceClientRequest = (clientId) => {
  return api.delete(`${CLIENT_ENDPOINT}/${clientId}`);
};
