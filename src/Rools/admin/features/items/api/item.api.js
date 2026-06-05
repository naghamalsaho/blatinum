import { api } from "@/shared/api/crud";

const ITEM_ENDPOINT = "/item";

export const getItemsRequest = () => {
  return api.get(ITEM_ENDPOINT);
};

const buildItemFormData = (payload) => {
  const formData = new FormData();

  formData.append("warehouse_id", String(payload.warehouse_id || "").trim());
  formData.append("sku", String(payload.sku || "").trim());
  formData.append("name", String(payload.name || "").trim());
  formData.append("description", String(payload.description || "").trim());
  formData.append("quantity", String(payload.quantity ?? "").trim());
  formData.append("status", String(payload.status || "").trim());
  formData.append("expiry_date", String(payload.expiry_date || "").trim());
  formData.append("purchase_date", String(payload.purchase_date || "").trim());
  formData.append("received_date", String(payload.received_date || "").trim());

  return formData;
};

export const createItemRequest = (payload) => {
  return api.upload(ITEM_ENDPOINT, buildItemFormData(payload));
};

const buildItemStatusFormData = (payload) => {
  const formData = new FormData();

  formData.append("status", payload.status);

  return formData;
};

export const updateItemRequest = (id, payload) => {
  return api.putForm(`${ITEM_ENDPOINT}/${id}`, buildItemStatusFormData(payload));
};

export const deleteItemRequest = (id) => {
  return api.delete(`${ITEM_ENDPOINT}/${id}`);
};
