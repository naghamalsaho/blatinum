import { api } from "@/shared/api/crud";

const WAREHOUSE_ENDPOINT = "/warehouse";
const LOCATION_ENDPOINT = "/location";

export const getWarehousesRequest = () => {
  return api.get(WAREHOUSE_ENDPOINT);
};

export const getLocationsRequest = () => {
  return api.get(LOCATION_ENDPOINT);
};

const buildWarehouseFormData = (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("location_id", payload.location_id ?? payload.location);

  if (Object.hasOwn(payload, "address")) {
    formData.append("address", payload.address);
  }

  if (payload.description) {
    formData.append("description", payload.description);
  }

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
