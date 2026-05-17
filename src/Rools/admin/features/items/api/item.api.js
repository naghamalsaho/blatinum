import { api } from "@/shared/api/crud";

const ITEM_ENDPOINT = "/item";

export const getItemsRequest = () => {
  return api.get(ITEM_ENDPOINT);
};
