import { api } from "@/shared/api/crud";

const ORDER_ENDPOINT = "/order";

export const getCustomerServiceOrdersRequest = () => {
  return api.get(`${ORDER_ENDPOINT}/`);
};

export const getClientUnitOrdersRequest = (clientId) => {
  return api.get(`${ORDER_ENDPOINT}/getClientUnitOrders/${clientId}`);
};

export const getClientSolutionOrdersRequest = (clientId) => {
  return api.get(`${ORDER_ENDPOINT}/getClientSolutionOrders/${clientId}`);
};
