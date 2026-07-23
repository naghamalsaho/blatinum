import { api } from "@/shared/api/crud";

export const contractApi = {
  createContract: (formData) => api.postForm("/contract", formData),
   getOrders: () =>
    api.get("/order"),
    getContracts: (page = 1) =>
    api.get("/contract", { page }),
      getContractById: (id) =>
    api.get(`/contract/${id}`),
        getContractByClient: (clientId) =>
    api.get(`/contract/client/${clientId}`),

        changeContractStatus: (id, status) =>
  api.put(`/contract/changeStatus/${id}`, {
    status,
  }),
};