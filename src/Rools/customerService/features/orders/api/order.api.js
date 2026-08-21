import { api } from "@/shared/api/crud";

const ORDER_ENDPOINT = "/order";

const buildFormData = (payload = {}) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      formData.append(key, String(value).trim());
    }
  });

  return formData;
};

const cleanPayload = (payload = {}) =>
  Object.entries(payload).reduce((result, [key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      result[key] = String(value).trim();
    }

    return result;
  }, {});

export const getCustomerServiceOrdersRequest = () => {
  return api.get(ORDER_ENDPOINT);
};

export const getCustomerServiceOrderRequest = (orderId) => {
  return api.get(`${ORDER_ENDPOINT}/${orderId}`);
};

export const getDepartmentOrdersRequest = (departmentId) => {
  return api.get(`${ORDER_ENDPOINT}/departmentOrders/${departmentId}`);
};

export const getClientUnitOrdersRequest = (clientId) => {
  return api.get(`${ORDER_ENDPOINT}/getClientUnitOrders/${clientId}`);
};

export const getClientSolutionOrdersRequest = (clientId) => {
  return api.get(`${ORDER_ENDPOINT}/getClientSolutionOrders/${clientId}`);
};

export const transferCustomerServiceOrderRequest = (orderId, payload = {}) => {
  const departmentId =
    typeof payload === "object" && payload !== null ? payload.departmentId : payload;

  return api.putForm(
    `${ORDER_ENDPOINT}/transfer/${orderId}`,
    buildFormData({
      department_id: departmentId,
      status: payload?.status || "initially_accepted",
      note: payload?.note || "Transfer order",
    })
  );
};

export const changeCustomerServiceOrderStatusRequest = (orderId, status) => {
  return api.put(
    `${ORDER_ENDPOINT}/changeStatus/${orderId}`,
    cleanPayload({ status })
  );
};

export const addCustomerServiceOrderNoteRequest = async (orderId, note) => {
  return api.postForm(`${ORDER_ENDPOINT}/note/add/${orderId}`, buildFormData({ note }));
};

export const updateCustomerServiceOrderNoteRequest = async (noteId, note) => {
  return api.putForm(`/note/${noteId}`, buildFormData({ note }));
};

export const deleteCustomerServiceOrderNoteRequest = async (noteId) => {
  return api.delete(`/note/${noteId}`);
};
