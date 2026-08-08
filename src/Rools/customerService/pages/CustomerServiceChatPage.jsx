import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import {
  Hash,
  Inbox,
  MessageCircle,
  Send,
  UserCheck,
} from "lucide-react";

import { receiveCustomerServiceChatMessage } from "../features/chat/model/chat.slice";
import {
  claimCustomerServiceChatRoom,
  fetchCustomerServiceChatMessages,
  fetchCustomerServiceChatRooms,
  fetchCustomerServiceUnassignedChats,
  sendCustomerServiceChatMessage,
} from "../features/chat/model/chat.thunks";
import { fetchCustomerServiceClients } from "../features/clients/model/client.thunks";
import "../styles/customer-service.css";

const getRoomId = (room) => room?.id || room?.room_id || room?.chat_room_id;

const getMessageRoomId = (message) =>
  message?.room_id ||
  message?.chat_room_id ||
  message?.chatRoomId ||
  message?.room?.id ||
  message?.chat_room?.id;

const getLatestMessageText = (room) => {
  const latest = room?.latestMessage || room?.latest_message;

  if (!latest) return "No latest message";
  if (typeof latest === "string") return latest;

  return latest.content || latest.message || "No latest message";
};

const getRoomStatus = (room) => String(room?.status || "active").toLowerCase();

const joinName = (...parts) =>
  parts
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");

const getPersonName = (person) => {
  if (!person) return "";

  const directName =
    person.full_name ||
    person.fullName ||
    person.name ||
    person.username ||
    person.client_name ||
    person.customer_name ||
    person.user_name;

  if (directName) return directName;

  return joinName(
    person.first_name || person.firstName || person.fname,
    person.last_name || person.lastName || person.lname || person.family_name
  );
};

const getClientName = (room, clientNameById = {}) => {
  const client = room?.client || room?.customer || room?.user || room?.client_data;
  const account = client?.account || room?.account || room?.client_account;
  const name =
    getPersonName(account) ||
    getPersonName(client) ||
    getPersonName(room?.client_profile) ||
    getPersonName(room);

  if (name) return name;

  const clientId = room?.client_id || room?.clientId || room?.additional_info?.client_id;
  const mappedName = clientId ? clientNameById[String(clientId)] : "";

  if (mappedName) return mappedName;
  if (clientId) return `Client #${clientId}`;

  return "";
};

const getClientRecordId = (client) =>
  client?.additional_info?.client_id ||
  client?.client_id ||
  client?.id ||
  client?.account?.client_id;

const getClientDisplayName = (client) =>
  getPersonName(client?.account) || getPersonName(client) || getPersonName(client?.client);

const getRoomTitle = (room, clientNameById = {}) => {
  const id = getRoomId(room);
  return getClientName(room, clientNameById) || `Room #${id}`;
};

const formatMessageTime = (value) => {
  if (!value) return "";

  const normalized = String(value).includes("T")
    ? String(value)
    : String(value).replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return String(value);

  const now = new Date();
  const dateKey = date.toDateString();
  const todayKey = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (dateKey === todayKey) return `Today, ${time}`;
  if (dateKey === yesterday.toDateString()) return `Yesterday, ${time}`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getInitials = (value) => {
  const words = String(value || "CS")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "CS";
};

const getToken = (fallbackToken = "") => {
  const raw = localStorage.getItem("token") || fallbackToken;

  if (!raw || raw === "undefined" || raw === "null") return "";

  try {
    const parsed = JSON.parse(raw);
    const token =
      parsed.token ||
      parsed.access_token ||
      parsed.accessToken ||
      parsed.plainTextToken ||
      parsed.plain_text_token ||
      parsed.auth_token ||
      parsed.value;

    return String(token || "").replace(/^Bearer\s+/i, "").trim();
  } catch {
    return String(raw).replace(/^Bearer\s+/i, "").trim();
  }
};

const getEchoEventMessage = (event) =>
  event?.message ||
  event?.chatMessage ||
  event?.chat_message ||
  event?.data?.message ||
  event?.data?.chatMessage ||
  event?.data?.chat_message ||
  event?.data ||
  event;

const getApiUrl = () =>
  import.meta.env.VITE_API_URL ||
  "https://platinum-back-end.onrender.com/api/v1";

const getPusherKey = () =>
  import.meta.env.VITE_PUSHER_APP_KEY || "2e531002c977039de473";

const getPusherCluster = () =>
  import.meta.env.VITE_PUSHER_APP_CLUSTER || "us3";

const createBroadcastAuthorizer = (token) => (channel) => ({
  authorize: async (socketId, callback) => {
    const authUrl = `${getApiUrl()}/broadcasting/auth`;

    try {
      const response = await fetch(authUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: new URLSearchParams({
          socket_id: socketId,
          channel_name: channel.name,
        }).toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("broadcasting/auth failed", {
          status: response.status,
          channel: channel.name,
          response: data,
        });
        callback(true, data || { status: response.status });
        return;
      }

      console.log("broadcasting/auth succeeded", {
        channel: channel.name,
        socketId,
      });
      callback(false, data);
    } catch (error) {
      console.error("broadcasting/auth failed", error);
      callback(true, error);
    }
  },
});

function ChatRoomButton({ room, active, onClick, action, clientNameById }) {
  const id = getRoomId(room);
  const title = getRoomTitle(room, clientNameById);
  const status = getRoomStatus(room);

  return (
    <article className={`chat-room-card ${active ? "active" : ""}`}>
      <button type="button" onClick={onClick} className="chat-room-main">
        <span className="chat-room-avatar">{getInitials(title)}</span>
        <span className="chat-room-copy">
          <span>
            <strong>{title}</strong>
            <em>#{id}</em>
          </span>
          <small>{getLatestMessageText(room)}</small>
        </span>
        <span className={`chat-room-status ${status}`}>{status}</span>
      </button>
      {action}
    </article>
  );
}

ChatRoomButton.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    room_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    chat_room_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    client_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    employee_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    latestMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    latest_message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    client: PropTypes.shape({
      full_name: PropTypes.string,
      account: PropTypes.shape({
        full_name: PropTypes.string,
      }),
    }),
  }).isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  action: PropTypes.node,
  clientNameById: PropTypes.objectOf(PropTypes.string),
};

ChatRoomButton.defaultProps = {
  active: false,
  action: null,
  clientNameById: {},
};

export default function CustomerServiceChatPage() {
  const dispatch = useDispatch();
  const {
    rooms = {},
    unassigned = {},
    messages = {},
    claimLoadingId,
  } = useSelector((state) => state.customerServiceChat || {});
  const clients = useSelector((state) => state.customerServiceClients?.items || []);
  const authToken = useSelector((state) => state.auth?.token || "");

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState("REST mode");
  const messageEndRef = useRef(null);
  const echoRef = useRef(null);
  const channelRef = useRef(null);
  const selectedRoomIdRef = useRef(null);

  const selectedRoomId = getRoomId(selectedRoom);
  const activeRooms = useMemo(() => rooms.items || [], [rooms.items]);
  const unassignedRooms = useMemo(() => unassigned.items || [], [unassigned.items]);
  const roomMessages = messages.items || [];
  const clientNameById = useMemo(() => {
    return clients.reduce((map, client) => {
      const id = getClientRecordId(client);
      const name = getClientDisplayName(client);

      if (id && name) {
        map[String(id)] = name;
      }

      return map;
    }, {});
  }, [clients]);

  const selectedRoomFromState = useMemo(
    () =>
      activeRooms.find((room) => String(getRoomId(room)) === String(selectedRoomId)) ||
      unassignedRooms.find((room) => String(getRoomId(room)) === String(selectedRoomId)) ||
      selectedRoom,
    [activeRooms, selectedRoom, selectedRoomId, unassignedRooms]
  );

  useEffect(() => {
    dispatch(fetchCustomerServiceChatRooms());
    dispatch(fetchCustomerServiceUnassignedChats());
    dispatch(fetchCustomerServiceClients());
  }, [dispatch]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [roomMessages.length, selectedRoomId]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    const token = getToken(authToken);

    if (!token) {
      console.warn("[CHAT REALTIME] Missing auth token. Echo was not initialized.");
      return undefined;
    }

    try {
      Pusher.logToConsole = true;
      window.Pusher = Pusher;

      const echo = new Echo({
        broadcaster: "pusher",
        key: getPusherKey(),
        cluster: getPusherCluster(),
        forceTLS: true,
        encrypted: true,
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${getApiUrl()}/broadcasting/auth`,
        authorizer: createBroadcastAuthorizer(token),
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      });

      echoRef.current = echo;

      const pusher = echo.connector?.pusher;

      pusher?.connection?.bind("connected", () => {
        console.log("Pusher connected");
        setRealtimeStatus("Realtime connected");
      });

      pusher?.connection?.bind("error", (error) => {
        console.error("Pusher connection error", error);
        setRealtimeStatus("Realtime error");
      });

      pusher?.connection?.bind("state_change", (state) => {
        console.log("Pusher state changed", state);
      });

      return () => {
        if (channelRef.current && selectedRoomIdRef.current) {
          echo.leave(`chat.${selectedRoomIdRef.current}`);
        }

        echo.disconnect();
        echoRef.current = null;
        channelRef.current = null;
      };
    } catch (error) {
      console.error("[CHAT REALTIME] Echo initialization failed", error);
      return undefined;
    }
  }, [authToken]);

  useEffect(() => {
    const echo = echoRef.current;

    if (!selectedRoomId || !echo) return undefined;

    if (channelRef.current) {
      echo.leave(`chat.${selectedRoomIdRef.current}`);
      channelRef.current = null;
    }

    const channelName = `chat.${selectedRoomId}`;
    const pusherChannelName = `private-${channelName}`;
    const channel = echo.private(channelName);
    channelRef.current = channel;

    const handleMessageSent = (event) => {
      console.log("MessageSent received", event);
      console.log("REALTIME MESSAGE RECEIVED:", event);

      const message = getEchoEventMessage(event);
      const messageRoomId = getMessageRoomId(message);

      if (String(messageRoomId) === String(selectedRoomIdRef.current)) {
        dispatch(
          receiveCustomerServiceChatMessage({
            message,
            selectedRoomId: selectedRoomIdRef.current,
          })
        );
      } else {
        dispatch(receiveCustomerServiceChatMessage({ message }));
      }
    };

    channel
      .listen(".MessageSent", handleMessageSent)
      .listen("MessageSent", handleMessageSent)
      .listen(".message.new", handleMessageSent)
      .listen("message.new", handleMessageSent);

    const rawChannel = echo.connector?.pusher?.channel(pusherChannelName);

    rawChannel?.bind("MessageSent", handleMessageSent);
    rawChannel?.bind("App\\Events\\MessageSent", handleMessageSent);
    rawChannel?.bind("message.new", handleMessageSent);
    rawChannel?.bind_global?.((eventName, event) => {
      console.log("Pusher raw channel event received", {
        channel: pusherChannelName,
        eventName,
        event,
      });

      if (
        String(eventName).includes("MessageSent") ||
        String(eventName).includes("message.new")
      ) {
        handleMessageSent(event);
      }
    });

    channel.subscription?.bind_global?.((eventName, event) => {
      console.log("Pusher channel event received", {
        channel: pusherChannelName,
        eventName,
        event,
      });

      if (
        String(eventName).includes("MessageSent") ||
        String(eventName).includes("message.new")
      ) {
        handleMessageSent(event);
      }
    });

    channel.subscribed(() => {
      console.log(`Channel subscription succeeded: ${pusherChannelName}`);
    });

    channel.error((error) => {
      console.error(`Channel subscription error: ${pusherChannelName}`, error);
      console.error("broadcasting/auth failed if this is an auth error", error);
      setRealtimeStatus("Realtime error");
    });

    return () => {
      echo.leave(channelName);
      channelRef.current = null;
    };
  }, [authToken, dispatch, selectedRoomId]);

  const openRoom = (room) => {
    const roomId = getRoomId(room);

    setSelectedRoom(room);
    setDraftError("");

    if (roomId) {
      dispatch(fetchCustomerServiceChatMessages(roomId));
    }
  };

  const claimRoom = async (room) => {
    const roomId = getRoomId(room);

    if (!roomId) return;

    const result = await dispatch(claimCustomerServiceChatRoom(roomId));

    if (claimCustomerServiceChatRoom.fulfilled.match(result)) {
      const claimedRoom = result.payload?.id ? result.payload : { ...room, employee_id: "Me" };
      openRoom({ ...claimedRoom, id: roomId });
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    const content = draft.trim();

    if (!selectedRoomId) {
      setDraftError("Select a chat room first.");
      return;
    }

    if (!content) {
      setDraftError("Message text is required.");
      return;
    }

    setDraftError("");

    const result = await dispatch(
      sendCustomerServiceChatMessage({
        roomId: selectedRoomId,
        content,
      })
    );

    if (sendCustomerServiceChatMessage.fulfilled.match(result)) {
      setDraft("");
    }
  };

  return (
    <div className="customer-service-page customer-service-chat-page">
      <section className="chat-workspace">
        <aside className="chat-sidebar">
          <div className="chat-panel">
            <div className="chat-panel-head">
              <h2>
                <Inbox size={16} />
                Unassigned
              </h2>
              <span>{unassignedRooms.length}</span>
            </div>

            {unassigned.loading ? (
              <div className="table-state">Loading unassigned chats...</div>
            ) : unassigned.error ? (
              <div className="table-state is-error">{unassigned.error}</div>
            ) : unassignedRooms.length > 0 ? (
              <div className="chat-room-list">
                {unassignedRooms.map((room) => {
                  const id = getRoomId(room);

                  return (
                    <ChatRoomButton
                      key={id}
                      room={room}
                      active={String(id) === String(selectedRoomId)}
                      onClick={() => openRoom(room)}
                      clientNameById={clientNameById}
                      action={
                        <button
                          type="button"
                          className="chat-claim-btn"
                          onClick={() => claimRoom(room)}
                          disabled={String(claimLoadingId) === String(id)}
                        >
                          {String(claimLoadingId) === String(id) ? "Claiming..." : "Claim"}
                        </button>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <p className="customer-service-empty-note">No unassigned chats right now.</p>
            )}
          </div>

          <div className="chat-panel">
            <div className="chat-panel-head">
              <h2>
                <MessageCircle size={16} />
                Active
              </h2>
              <span>{activeRooms.length}</span>
            </div>

            {rooms.loading ? (
              <div className="table-state">Loading active chats...</div>
            ) : rooms.error ? (
              <div className="table-state is-error">{rooms.error}</div>
            ) : activeRooms.length > 0 ? (
              <div className="chat-room-list">
                {activeRooms.map((room) => {
                  const id = getRoomId(room);

                  return (
                    <ChatRoomButton
                      key={id}
                      room={room}
                      active={String(id) === String(selectedRoomId)}
                      onClick={() => openRoom(room)}
                      clientNameById={clientNameById}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="customer-service-empty-note">No active chats yet.</p>
            )}
          </div>
        </aside>

        <main className="chat-thread-panel">
          <div className="chat-thread-head">
            <div className="chat-thread-title">
              <span className="chat-room-avatar large">
                {getInitials(
                  selectedRoomFromState ? getRoomTitle(selectedRoomFromState, clientNameById) : "CS"
                )}
              </span>
              <div>
                <p>Chat Room</p>
                <h2>
                  {selectedRoomFromState
                    ? getRoomTitle(selectedRoomFromState, clientNameById)
                    : "Select a room"}
                </h2>
                <small>
                  {selectedRoomId ? `Room #${selectedRoomId}` : "Choose a room to view messages"}
                  {selectedRoomId ? ` - ${realtimeStatus}` : ""}
                </small>
              </div>
            </div>
            {selectedRoomFromState ? (
              <span className={`chat-room-status ${getRoomStatus(selectedRoomFromState)}`}>
                {getRoomStatus(selectedRoomFromState)}
              </span>
            ) : null}
          </div>

          <div className="chat-message-list">
            {messages.loading ? (
              <div className="table-state">Loading messages...</div>
            ) : messages.error ? (
              <div className="table-state is-error">{messages.error}</div>
            ) : !selectedRoomId ? (
              <div className="chat-empty-state">Choose an active or unassigned chat to view messages.</div>
            ) : roomMessages.length > 0 ? (
              roomMessages.map((message) => {
                const isEmployee = message.sender_type === "employee";

                return (
                  <article
                    key={message.id || `${message.created_at}-${message.content}`}
                    className={`chat-message ${isEmployee ? "employee" : "client"}`}
                  >
                    {!isEmployee ? (
                      <span className="chat-message-avatar">
                        {getInitials(
                          selectedRoomFromState
                            ? getRoomTitle(selectedRoomFromState, clientNameById)
                            : "CL"
                        )}
                      </span>
                    ) : null}
                    <div className="chat-message-bubble">
                      <p>{message.content}</p>
                      {message.created_at ? (
                        <span className="chat-message-meta">{formatMessageTime(message.created_at)}</span>
                      ) : null}
                    </div>
                    {isEmployee ? <span className="chat-message-avatar employee">CS</span> : null}
                  </article>
                );
              })
            ) : (
              <div className="chat-empty-state">No messages yet.</div>
            )}
            <div ref={messageEndRef} />
          </div>

          <form className="chat-composer" onSubmit={sendMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your reply..."
              disabled={!selectedRoomId || messages.sending}
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={!selectedRoomId || messages.sending}
            >
              <Send size={16} />
              <span>{messages.sending ? "Sending..." : "Send"}</span>
            </button>
          </form>
          {draftError ? <p className="chat-form-error">{draftError}</p> : null}
        </main>

        <aside className="chat-info-panel">
          <section className="chat-side-card">
            <div className="chat-panel-head">
              <h2>
                <UserCheck size={16} />
                Room Info
              </h2>
            </div>

            {selectedRoomFromState ? (
              <dl className="chat-room-info">
                <div>
                  <dt>Room id</dt>
                  <dd>
                    <Hash size={13} />
                    {getRoomId(selectedRoomFromState)}
                  </dd>
                </div>
                <div>
                  <dt>Client</dt>
                  <dd>{getClientName(selectedRoomFromState, clientNameById) || "-"}</dd>
                </div>
                <div>
                  <dt>Client id</dt>
                  <dd>{selectedRoomFromState.client_id || "-"}</dd>
                </div>
                <div>
                  <dt>Employee id</dt>
                  <dd>{selectedRoomFromState.employee_id || "-"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{getRoomStatus(selectedRoomFromState)}</dd>
                </div>
                <div>
                  <dt>Latest message</dt>
                  <dd>{getLatestMessageText(selectedRoomFromState)}</dd>
                </div>
              </dl>
            ) : (
              <p className="customer-service-empty-note">Open a room to see its details.</p>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
