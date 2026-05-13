import { api } from "@/shared/api/crud";

const WAREHOUSE_ENDPOINT = "/warehouse";

export const getWarehousesRequest = () => {
  return api.get(WAREHOUSE_ENDPOINT);
};

const buildWarehouseFormData = (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("location", payload.location);

  return formData;
};

export const createWarehouseRequest = (payload) => {
  return api.upload(WAREHOUSE_ENDPOINT, buildWarehouseFormData(payload));
};

export const updateWarehouseRequest = (id, payload) => {
  return api.putForm(`${WAREHOUSE_ENDPOINT}/${id}`, buildWarehouseFormData(payload));
};

export const deleteWarehouseRequest = (id) => {
  return api.delete(`${WAREHOUSE_ENDPOINT}/${id}`);
};
