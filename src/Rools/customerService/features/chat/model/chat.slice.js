import { createSlice } from "@reduxjs/toolkit";
import {
  claimCustomerServiceChatRoom,
  fetchCustomerServiceChatMessages,
  fetchCustomerServiceChatRooms,
  fetchCustomerServiceUnassignedChats,
  sendCustomerServiceChatMessage,
} from "./chat.thunks";

const getMessageKey = (message) =>
  message?.id || `${message?.room_id || message?.chat_room_id}-${message?.created_at}-${message?.content}`;

const getRoomId = (item) => item?.id || item?.room_id || item?.chat_room_id;

const getMessageRoomId = (message) =>
  message?.room_id || message?.chat_room_id || message?.chatRoomId;

const appendUniqueMessage = (state, message) => {
  if (!message) return;

  const key = getMessageKey(message);
  const exists = state.messages.items.some((item) => getMessageKey(item) === key);

  if (!exists) {
    state.messages.items.push(message);
  }
};

const updateRoomLatestMessage = (rooms, message) => {
  const roomId = getMessageRoomId(message);

  if (!roomId) return;

  rooms.forEach((room) => {
    if (String(getRoomId(room)) === String(roomId)) {
      room.latestMessage = message;
      room.latest_message = message;
    }
  });
};

const initialState = {
  rooms: {
    items: [],
    loading: false,
    error: null,
    message: "",
  },
  unassigned: {
    items: [],
    loading: false,
    error: null,
    message: "",
  },
  messages: {
    roomId: null,
    items: [],
    loading: false,
    sending: false,
    error: null,
    message: "",
  },
  claimLoadingId: null,
};

const chatSlice = createSlice({
  name: "customerServiceChat",
  initialState,
  reducers: {
    clearCustomerServiceChatMessages: (state) => {
      state.messages = initialState.messages;
    },
    receiveCustomerServiceChatMessage: (state, action) => {
      const message = action.payload?.message || action.payload;
      const selectedRoomId = action.payload?.selectedRoomId;
      const messageRoomId = getMessageRoomId(message);

      updateRoomLatestMessage(state.rooms.items, message);
      updateRoomLatestMessage(state.unassigned.items, message);

      if (selectedRoomId && (!messageRoomId || String(selectedRoomId) === String(messageRoomId))) {
        appendUniqueMessage(state, message);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerServiceChatRooms.pending, (state) => {
        state.rooms.loading = true;
        state.rooms.error = null;
      })
      .addCase(fetchCustomerServiceChatRooms.fulfilled, (state, action) => {
        state.rooms.loading = false;
        state.rooms.items = action.payload.items;
        state.rooms.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceChatRooms.rejected, (state, action) => {
        state.rooms.loading = false;
        state.rooms.error = action.payload || "Failed to load active chats";
      })
      .addCase(fetchCustomerServiceUnassignedChats.pending, (state) => {
        state.unassigned.loading = true;
        state.unassigned.error = null;
      })
      .addCase(fetchCustomerServiceUnassignedChats.fulfilled, (state, action) => {
        state.unassigned.loading = false;
        state.unassigned.items = action.payload.items;
        state.unassigned.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceUnassignedChats.rejected, (state, action) => {
        state.unassigned.loading = false;
        state.unassigned.error = action.payload || "Failed to load unassigned chats";
      })
      .addCase(fetchCustomerServiceChatMessages.pending, (state, action) => {
        state.messages.loading = true;
        state.messages.error = null;
        state.messages.roomId = action.meta.arg;
      })
      .addCase(fetchCustomerServiceChatMessages.fulfilled, (state, action) => {
        state.messages.loading = false;
        state.messages.roomId = action.payload.roomId;
        state.messages.items = [...action.payload.items].reverse();
        state.messages.message = action.payload.message;
      })
      .addCase(fetchCustomerServiceChatMessages.rejected, (state, action) => {
        state.messages.loading = false;
        state.messages.error = action.payload || "Failed to load messages";
      })
      .addCase(claimCustomerServiceChatRoom.pending, (state, action) => {
        state.claimLoadingId = action.meta.arg;
        state.unassigned.error = null;
      })
      .addCase(claimCustomerServiceChatRoom.fulfilled, (state) => {
        state.claimLoadingId = null;
      })
      .addCase(claimCustomerServiceChatRoom.rejected, (state, action) => {
        state.claimLoadingId = null;
        state.unassigned.error = action.payload || "Failed to claim chat";
      })
      .addCase(sendCustomerServiceChatMessage.pending, (state) => {
        state.messages.sending = true;
        state.messages.error = null;
      })
      .addCase(sendCustomerServiceChatMessage.fulfilled, (state, action) => {
        state.messages.sending = false;
        appendUniqueMessage(state, action.payload);
      })
      .addCase(sendCustomerServiceChatMessage.rejected, (state, action) => {
        state.messages.sending = false;
        state.messages.error = action.payload || "Failed to send message";
      });
  },
});

export const {
  clearCustomerServiceChatMessages,
  receiveCustomerServiceChatMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
