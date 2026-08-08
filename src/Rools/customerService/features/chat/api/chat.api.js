import { api } from "@/shared/api/crud";

const CHAT_ENDPOINT = "/chat";

export const getChatRoomsRequest = () => {
  return api.get(`${CHAT_ENDPOINT}/rooms`);
};

export const getUnassignedChatsRequest = () => {
  return api.get(`${CHAT_ENDPOINT}/unassigned`);
};

export const claimChatRoomRequest = (roomId) => {
  return api.post(`${CHAT_ENDPOINT}/rooms/${roomId}/claim`);
};

export const getChatMessagesRequest = (roomId) => {
  return api.get(`${CHAT_ENDPOINT}/rooms/${roomId}/messages`);
};

export const sendChatMessageRequest = (payload = {}) => {
  return api.post(`${CHAT_ENDPOINT}/message`, payload);
};
