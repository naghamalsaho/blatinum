import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  claimChatRoomRequest,
  getChatMessagesRequest,
  getChatRoomsRequest,
  getUnassignedChatsRequest,
  sendChatMessageRequest,
} from "../api/chat.api";

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");

  if (typeof message === "object") {
    return Object.entries(message)
      .map(([key, value]) => {
        const text = Array.isArray(value)
          ? value.join(" ")
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : value;

        return `${key}: ${text}`;
      })
      .join(" ");
  }

  return String(message);
};

const readDataArray = (payload) => {
  const data = payload?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(payload?.rooms)) return payload.rooms;
  if (Array.isArray(data?.rooms)) return data.rooms;
  if (Array.isArray(payload?.messages)) return payload.messages;
  if (Array.isArray(data?.messages)) return data.messages;

  return [];
};

const readDataObject = (payload) => {
  const data = payload?.data;

  if (data?.data && !Array.isArray(data.data)) return data.data;
  if (data && !Array.isArray(data)) return data;
  if (payload && !Array.isArray(payload)) return payload;

  return null;
};

const buildListPayload = (payload) => ({
  items: readDataArray(payload),
  message: payload?.message || payload?.data?.message || "",
  links: payload?.links || payload?.data?.links || null,
  meta: payload?.meta || payload?.data?.meta || null,
});

const rejectApiError = (result, thunkAPI, fallback) => {
  if (result.status === 401) {
    return thunkAPI.rejectWithValue("Unauthorized. Please login again.");
  }

  return thunkAPI.rejectWithValue(normalizeErrorMessage(result.message) || fallback);
};

export const fetchCustomerServiceChatRooms = createAsyncThunk(
  "customerServiceChat/fetchRooms",
  async (_, thunkAPI) => {
    const result = await getChatRoomsRequest();

    if (result.ok) {
      return buildListPayload(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to load active chats");
  }
);

export const fetchCustomerServiceUnassignedChats = createAsyncThunk(
  "customerServiceChat/fetchUnassigned",
  async (_, thunkAPI) => {
    const result = await getUnassignedChatsRequest();

    if (result.ok) {
      return buildListPayload(result.data);
    }

    return rejectApiError(result, thunkAPI, "Failed to load unassigned chats");
  }
);

export const fetchCustomerServiceChatMessages = createAsyncThunk(
  "customerServiceChat/fetchMessages",
  async (roomId, thunkAPI) => {
    const result = await getChatMessagesRequest(roomId);

    if (result.ok) {
      return {
        roomId,
        ...buildListPayload(result.data),
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to load messages");
  }
);

export const syncCustomerServiceChatMessages = createAsyncThunk(
  "customerServiceChat/syncMessages",
  async (roomId, thunkAPI) => {
    const result = await getChatMessagesRequest(roomId);

    if (result.ok) {
      return {
        roomId,
        ...buildListPayload(result.data),
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to sync messages");
  }
);

export const claimCustomerServiceChatRoom = createAsyncThunk(
  "customerServiceChat/claimRoom",
  async (roomId, thunkAPI) => {
    const result = await claimChatRoomRequest(roomId);

    if (result.ok) {
      await thunkAPI.dispatch(fetchCustomerServiceUnassignedChats());
      await thunkAPI.dispatch(fetchCustomerServiceChatRooms());

      return readDataObject(result.data) || { id: roomId };
    }

    return rejectApiError(result, thunkAPI, "Failed to claim chat");
  }
);

export const sendCustomerServiceChatMessage = createAsyncThunk(
  "customerServiceChat/sendMessage",
  async ({ roomId, content }, thunkAPI) => {
    const result = await sendChatMessageRequest({
      chat_room_id: roomId,
      content,
    });

    if (result.ok) {
      const message = readDataObject(result.data);

      return message || {
        room_id: roomId,
        content,
        sender_type: "employee",
        created_at: new Date().toISOString(),
      };
    }

    return rejectApiError(result, thunkAPI, "Failed to send message");
  }
);
