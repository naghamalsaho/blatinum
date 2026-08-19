import { api } from "@/shared/api/crud";

const LOTTERY_ENDPOINT = "/lottery";

const cleanRule = (rule = {}) =>
  Object.entries(rule).reduce((result, [key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      result[key] = String(value).trim();
    }

    return result;
  }, {});

const cleanPayload = (payload = {}) => {
  const result = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "rules") {
      const rules = Array.isArray(value)
        ? value.map(cleanRule).filter((rule) => Object.keys(rule).length > 0)
        : [];

      if (rules.length > 0) {
        result.rules = rules;
      }

      return;
    }

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      result[key] = key === "unit_id" ? Number(value) : String(value).trim();
    }
  });

  return result;
};

export const getCustomerServiceLotteriesRequest = () => api.get(LOTTERY_ENDPOINT);

export const getCustomerServiceLotteryRequest = (lotteryId) =>
  api.get(`${LOTTERY_ENDPOINT}/${lotteryId}`);

export const createCustomerServiceLotteryRequest = (payload) =>
  api.post(LOTTERY_ENDPOINT, cleanPayload(payload));

export const updateCustomerServiceLotteryRequest = (lotteryId, payload) =>
  api.put(`${LOTTERY_ENDPOINT}/${lotteryId}`, cleanPayload(payload));

export const cancelCustomerServiceLotteryRequest = (lotteryId) =>
  api.put(`${LOTTERY_ENDPOINT}/cancel/${lotteryId}`, {});

export const drawCustomerServiceLotteryWinnerRequest = (lotteryId) =>
  api.put(`${LOTTERY_ENDPOINT}/drawWinner/${lotteryId}`, {});
