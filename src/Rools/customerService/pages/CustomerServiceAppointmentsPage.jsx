import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleSlash2,
  PencilLine,
  Plus,
  XCircle,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import { getLanguage } from "@/shared/i18n";
import {
  getAppointmentAvailableSlotsRequest,
  getAppointmentClientsRequest,
  getAppointmentOrdersRequest,
} from "../features/appointments/api/appointment.api";
import {
  getClientSolutionOrdersRequest,
  getClientUnitOrdersRequest,
  getCustomerServiceOrderRequest,
} from "../features/orders/api/order.api";
import {
  cancelCustomerServiceAppointment,
  createCustomerServiceAppointment,
  fetchCustomerServiceAppointments,
  updateCustomerServiceAppointment,
} from "../features/appointments/model/appointment.thunks";
import { formatStatus } from "../constants/customerServiceData";

import "../styles/customer-service.css";

const APPOINTMENT_FILTERS = [
  { value: "all", label: "All", dotClass: "" },
  { value: "pending", label: "Pending", dotClass: "busy" },
  { value: "available", label: "Available Slot", dotClass: "ok" },
  { value: "scheduled", label: "Scheduled", dotClass: "busy" },
  { value: "confirmed", label: "Confirmed", dotClass: "ok" },
  { value: "completed", label: "Completed", dotClass: "ok" },
  { value: "done", label: "Done", dotClass: "ok" },
  { value: "cancelled", label: "Cancelled", dotClass: "off" },
  { value: "canceled", label: "Canceled", dotClass: "off" },
];

const INITIAL_CREATE_FORM = {
  order_id: "",
  av_slot_id: "",
  client_id: "",
  type: "sales",
  notes: "",
};

const APPOINTMENT_ORDER_CLIENTS_KEY = "customerServiceAppointmentOrderClients";

const readSavedAppointmentClients = () => {
  try {
    return JSON.parse(localStorage.getItem(APPOINTMENT_ORDER_CLIENTS_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveAppointmentClient = (orderId, client) => {
  try {
    const savedClients = readSavedAppointmentClients();
    localStorage.setItem(
      APPOINTMENT_ORDER_CLIENTS_KEY,
      JSON.stringify({ ...savedClients, [String(orderId)]: client })
    );
  } catch {
    // The name remains available in state when storage is unavailable.
  }
};

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const extractApiList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.data,
    payload?.items,
    payload?.results,
    payload?.records,
    payload?.slots,
    payload?.data?.data,
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.records,
    payload?.data?.slots,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const getAppointmentId = (appointment) =>
  readNested(appointment, ["id", "appointment_id"]);

const getClientName = (appointment) =>
  readNested(appointment, [
    "order.client.account.full_name",
    "order.client.full_name",
    "order.client.name",
    "client.account.full_name",
    "client.full_name",
    "client.name",
    "account.full_name",
    "user.account.full_name",
    "user.full_name",
    "client_name",
    "name",
  ]) || "-";

const getClientContact = (appointment) =>
  readNested(appointment, [
    "order.client.account.phone",
    "order.client.phone",
    "order.client.account.email",
    "order.client.email",
    "client.account.phone",
    "client.phone",
    "account.phone",
    "user.account.phone",
    "phone",
    "client.account.email",
    "client.email",
    "account.email",
    "email",
  ]) || "-";

const getAppointmentClientId = (appointment) =>
  readNested(appointment, [
    "client.id",
    "client.client_id",
    "order.client.id",
    "order.client.client_id",
    "client_id",
  ]);

const getOrderId = (appointment) =>
  readNested(appointment, ["order.id", "order_id"]) || "-";

const getOrderStatus = (appointment) =>
  String(readNested(appointment, ["order.status", "order_status"]) || "-").toLowerCase();

const getSlotId = (appointment) =>
  readNested(appointment, ["slot.id", "slot_id"]) || "-";

const getSlotStatus = (appointment) =>
  String(readNested(appointment, ["slot.status", "slot_status"]) || "-").toLowerCase();

const getAppointmentDateSource = (appointment) =>
  readNested(appointment, [
    "appointment_date",
    "date",
    "day",
    "scheduled_at",
    "starts_at",
    "start_at",
    "slot.date",
    "created_at",
  ]);

const getAppointmentDate = (appointment) => {
  const value = getAppointmentDateSource(appointment);
  if (!value) return "-";

  return String(value).split("T")[0].split(" ")[0] || "-";
};

const getAppointmentTime = (appointment) => {
  const explicitTime = readNested(appointment, [
    "slot.start_time",
    "appointment_time",
    "time",
    "start_time",
    "starts_time",
  ]);

  if (explicitTime) return explicitTime;

  const value = getAppointmentDateSource(appointment);
  const match = String(value || "").match(/(?:T|\s)(\d{2}:\d{2})/);

  return match?.[1] || "-";
};

const parseTimeToMinutes = (time) => {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
};

const formatMinutesToTime = (value) => {
  const minutesInDay = 24 * 60;
  const normalized = ((value % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const getTimeRange = (startTime, durationMinutes = 20) => {
  const start = parseTimeToMinutes(startTime);
  if (start === null) return startTime || "-";

  return `${formatMinutesToTime(start)} - ${formatMinutesToTime(start + durationMinutes)}`;
};

const getAppointmentType = (appointment) =>
  readNested(appointment, [
    "type",
    "appointment_type",
    "reason",
    "title",
    "subject",
    "description",
  ]) || "-";

const getAppointmentNotes = (appointment) =>
  readNested(appointment, ["notes.0.text", "notes_text", "note", "notes_text_value"]);

const getAppointmentStatus = (appointment) =>
  String(readNested(appointment, ["status", "state"]) || "pending").toLowerCase();

const getAssignee = (appointment) =>
  readNested(appointment, [
    "created_by.full_name",
    "created_by.email",
    "employee.account.full_name",
    "employee.full_name",
    "staff.account.full_name",
    "assignee.account.full_name",
    "assignee",
    "employee_name",
  ]) || "-";

const getCreatedBy = (appointment) =>
  readNested(appointment, [
    "created_by.full_name",
    "created_by.email",
    "created_by.phone",
  ]) || "-";

const getCreatedAt = (appointment) =>
  readNested(appointment, ["created_at", "createdAt"]) || "-";

const getClientOptionId = (client) =>
  readNested(client, [
    "additional_info.client_id",
    "client.additional_info.client_id",
    "client_id",
    "id",
    "account.id",
  ]);

const getOrderOptionId = (order) =>
  readNested(order, ["id", "order_id"]);

const getOrderOptionStatus = (order) =>
  String(readNested(order, ["status", "order_status", "order.status"]) || "")
    .trim()
    .toLowerCase();

const getSlotOptionId = (slot) =>
  readNested(slot, ["id", "slot_id", "av_slot_id", "available_slot_id"]);

const getSlotOptionDateValue = (slot) => {
  const value = readNested(slot, [
    "date",
    "slot_date",
    "available_date",
    "appointment_date",
    "day",
    "starts_at",
    "start_at",
    "batch.date",
    "batch.day",
    "batch.appointment_date",
  ]);

  if (!value) return "";
  return String(value).split("T")[0].split(" ")[0];
};

const getSlotOptionDate = (slot) => {
  const normalized = getSlotOptionDateValue(slot);
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return normalized;

  return new Intl.DateTimeFormat(getLanguage() === "ar" ? "ar-SY" : "en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getSlotOptionStatus = (slot) => {
  const directStatus = readNested(slot, [
    "status",
    "slot_status",
    "state",
    "availability",
    "available_status",
  ]);

  if (directStatus !== undefined && directStatus !== null && String(directStatus).trim() !== "") {
    return String(directStatus).trim().toLowerCase();
  }

  if (slot?.is_available !== undefined) {
    return slot.is_available ? "available" : "booked";
  }

  if (slot?.available !== undefined) {
    return slot.available ? "available" : "booked";
  }

  return "";
};

const isAvailableSlotStatus = (status) => {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (!normalized) return false;

  return [
    "available",
    "free",
    "open",
    "active",
    "متاح",
    "متوفر",
    "not_booked",
    "unbooked",
    "pending",
  ].includes(normalized);
};

const getClientOptionLabel = (client) => {
  const accountName = readNested(client, [
    "account.full_name",
    "full_name",
    "name",
    "client.account.full_name",
  ]);
  const email = readNested(client, [
    "account.email",
    "email",
    "client.account.email",
  ]);
  const phone = readNested(client, [
    "account.phone",
    "phone",
    "client.account.phone",
  ]);

  return [accountName || `Client #${getClientOptionId(client)}`, email || phone]
    .filter(Boolean)
    .join(" - ");
};

const getOrderClientId = (order) =>
  readNested(order, [
    "client.additional_info.client_id",
    "client_id",
    "client.id",
    "client.account.id",
    "account.id",
  ]);

const getOrderOptionLabel = (order) => {
  const id = getOrderOptionId(order);
  const status = readNested(order, ["status"]) || "unknown";
  const unit = readNested(order, [
    "unit.unit_number",
    "unit_number",
    "solution.name",
    "service.name",
  ]);

  return [`Order #${id}`, formatStatus(status), unit].filter(Boolean).join(" - ");
};

const getSlotOptionLabelWithRange = (slot) => {
  const time = readNested(slot, ["start_time", "time", "from_time", "starts_at"]) || "";
  const date = getSlotOptionDate(slot);
  const displayTime = String(time).slice(0, 5);

  const labeledTime = displayTime && getLanguage() === "ar" ? `الساعة ${displayTime}` : displayTime;
  return [date, labeledTime].filter(Boolean).join(" — ");
};

const getCompactSlotLabel = (slot) => {
  const date = getSlotOptionDate(slot);
  const time = String(readNested(slot, ["start_time", "time", "from_time", "starts_at"]) || "").slice(0, 5);
  const labeledTime = time && getLanguage() === "ar" ? `الساعة ${time}` : time;
  return [date, labeledTime].filter((value) => value && value !== "-").join(" — ");
};

const compareAvailableSlots = (first, second) => {
  const firstKey = `${getSlotOptionDateValue(first)} ${String(readNested(first, ["start_time", "time", "from_time", "starts_at"]) || "")}`;
  const secondKey = `${getSlotOptionDateValue(second)} ${String(readNested(second, ["start_time", "time", "from_time", "starts_at"]) || "")}`;
  return firstKey.localeCompare(secondKey);
};

const isFinalStatus = (status) =>
  ["completed", "done", "cancelled", "canceled"].includes(status);

export default function CustomerServiceAppointmentsPage() {
  const dispatch = useDispatch();
  const {
    items: appointments = [],
    meta,
    message,
    loading,
    actionLoading,
    error,
  } = useSelector((state) => state.customerServiceAppointments || {});
  const authToken = useSelector((state) => state.auth?.token);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmActionError, setConfirmActionError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [createFormData, setCreateFormData] = useState(INITIAL_CREATE_FORM);
  const [createTouched, setCreateTouched] = useState({});
  const [createError, setCreateError] = useState("");
  const [createOptions, setCreateOptions] = useState({
    clients: [],
    orders: [],
    slots: [],
  });
  const [createOptionsLoading, setCreateOptionsLoading] = useState(false);
  const [slotOptionsError, setSlotOptionsError] = useState("");
  const [orderDetailsById, setOrderDetailsById] = useState({});
  const [clientByOrderId, setClientByOrderId] = useState(readSavedAppointmentClients);
  const requestedOrderIds = useRef(new Set());
  const ownerResolutionKey = useRef("");

  useEffect(() => {
    dispatch(fetchCustomerServiceAppointments());
  }, [dispatch]);

  useEffect(() => {
    const orderIds = [
      ...new Set(
        appointments
          .map((appointment) => getOrderId(appointment))
          .filter((id) => id && id !== "-")
          .map(String)
      ),
    ].filter((id) => !requestedOrderIds.current.has(id));

    if (orderIds.length === 0) return;

    let ignore = false;
    orderIds.forEach((id) => requestedOrderIds.current.add(id));

    Promise.all(
      orderIds.map(async (id) => {
        const result = await getCustomerServiceOrderRequest(id);
        if (!result.ok) return null;

        return [id, result.data?.data ?? result.data];
      })
    ).then((entries) => {
      if (ignore) return;

      const validEntries = entries.filter(Boolean);
      if (validEntries.length === 0) return;

      setOrderDetailsById((current) => ({
        ...current,
        ...Object.fromEntries(validEntries),
      }));
    });

    return () => {
      ignore = true;
    };
  }, [appointments]);

  useEffect(() => {
    if (appointments.length === 0) return;

    const currentResolutionKey = appointments
      .map((appointment) => String(getOrderId(appointment)))
      .sort()
      .join(",");

    if (ownerResolutionKey.current === currentResolutionKey) return;
    ownerResolutionKey.current = currentResolutionKey;

    let ignore = false;

    const resolveOrderOwners = async () => {
      const clientsResult = await getAppointmentClientsRequest();
      if (!clientsResult.ok || ignore) return;

      const clients = extractApiList(clientsResult.data);
      const appointmentOrderIds = new Set(
        appointments.map((appointment) => String(getOrderId(appointment)))
      );

      const ownershipEntries = await Promise.all(
        clients.map(async (client) => {
          const clientId = getClientOptionId(client);
          if (!clientId) return [];

          const [unitOrdersResult, solutionOrdersResult] = await Promise.all([
            getClientUnitOrdersRequest(clientId),
            getClientSolutionOrdersRequest(clientId),
          ]);
          const clientOrders = [
            ...(unitOrdersResult.ok ? extractApiList(unitOrdersResult.data) : []),
            ...(solutionOrdersResult.ok ? extractApiList(solutionOrdersResult.data) : []),
          ];

          return clientOrders
            .map((order) => String(getOrderOptionId(order)))
            .filter((orderId) => appointmentOrderIds.has(orderId))
            .map((orderId) => [orderId, client]);
        })
      );

      if (ignore) return;

      const owners = Object.fromEntries(ownershipEntries.flat());
      if (Object.keys(owners).length > 0) {
        setClientByOrderId((current) => ({ ...current, ...owners }));
      }
    };

    resolveOrderOwners();

    return () => {
      ignore = true;
    };
  }, [appointments]);

  const displayAppointments = useMemo(
    () =>
      appointments.map((appointment) => {
        const orderId = getOrderId(appointment);
        const detailedOrder = orderDetailsById[String(orderId)];

        const client =
          clientByOrderId[String(orderId)] ||
          detailedOrder?.client ||
          appointment?.client;

        return {
          ...appointment,
          ...(client ? { client } : {}),
          order: {
            ...appointment.order,
            ...(detailedOrder || {}),
            ...(client ? { client } : {}),
          },
        };
      }),
    [appointments, clientByOrderId, orderDetailsById]
  );

  useEffect(() => {
    if (!createOpen) return;

    let ignore = false;

    const loadCreateOptions = async () => {
      setCreateOptionsLoading(true);
      setCreateError("");
      setSlotOptionsError("");

      const storedToken = localStorage.getItem("token");
      const token = authToken || storedToken;

      if (authToken && !storedToken) {
        localStorage.setItem("token", authToken);
      }

      if (!token) {
        setCreateError("Your session is not active. Please log in again, then create the appointment.");
        setCreateOptionsLoading(false);
        return;
      }

      const [clientsResult, ordersResult] = await Promise.all([
        getAppointmentClientsRequest(),
        getAppointmentOrdersRequest(),
      ]);
      const slotsResult = await getAppointmentAvailableSlotsRequest();

      if (ignore) return;

      setCreateOptions({
        clients: clientsResult.ok ? extractApiList(clientsResult.data) : [],
        orders: ordersResult.ok ? extractApiList(ordersResult.data) : [],
        slots: slotsResult.ok ? extractApiList(slotsResult.data) : [],
      });

      const requiredErrors = [
        !clientsResult.ok ? clientsResult.message || "Failed to load clients." : "",
        !ordersResult.ok ? ordersResult.message || "Failed to load orders." : "",
      ].filter(Boolean);

      if (!slotsResult.ok) {
        setSlotOptionsError(
          slotsResult.status === 401
            ? "This account cannot read available slots. Add the Read Available Slot permission to Customer Service, then reopen this form."
            : "Available slots could not be loaded. Please try again."
        );
      }

      if (requiredErrors.length > 0) {
        const isUnauthenticated = requiredErrors.some((text) =>
          String(text).toLowerCase().includes("unauthenticated")
        );

        setCreateError(
          isUnauthenticated
            ? "Your session expired or the token is invalid. Please log in again, then reopen this form."
            : requiredErrors.join("\n")
        );
      }

      setCreateOptionsLoading(false);
    };

    loadCreateOptions();

    return () => {
      ignore = true;
    };
  }, [authToken, createOpen]);

  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return displayAppointments.filter((appointment) => {
      const status = getAppointmentStatus(appointment);
      const orderStatus = getOrderStatus(appointment);
      const slotStatus = getSlotStatus(appointment);
      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter ||
        orderStatus === statusFilter ||
        slotStatus === statusFilter;
      const searchable = [
        getAppointmentId(appointment),
        getOrderId(appointment),
        orderStatus,
        getSlotId(appointment),
        slotStatus,
        getClientName(appointment),
        getClientContact(appointment),
        getAppointmentDate(appointment),
        getAppointmentTime(appointment),
        getAppointmentType(appointment),
        status,
        getCreatedBy(appointment),
        getCreatedAt(appointment),
        getAssignee(appointment),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [displayAppointments, searchTerm, statusFilter]);

  const total = meta?.total ?? appointments.length;
  const completed = appointments.filter((item) =>
    ["completed", "done"].includes(getAppointmentStatus(item)) ||
    ["completed", "done"].includes(getOrderStatus(item))
  ).length;
  const cancelled = appointments.filter((item) =>
    ["cancelled", "canceled"].includes(getAppointmentStatus(item)) ||
    ["cancelled", "canceled"].includes(getOrderStatus(item))
  ).length;
  const active = Math.max(total - completed - cancelled, 0);

  const closeConfirmModal = () => {
    setConfirmAction(null);
    setConfirmActionError("");
  };

  const slotDurationMinutes = useMemo(() => {
    const sortedTimes = appointments
      .map((appointment) => parseTimeToMinutes(getAppointmentTime(appointment)))
      .filter((time) => time !== null)
      .sort((a, b) => a - b);

    for (let index = 1; index < sortedTimes.length; index += 1) {
      const difference = sortedTimes[index] - sortedTimes[index - 1];

      if (difference > 0) {
        return difference;
      }
    }

    return 20;
  }, [appointments]);

  const bookedSlots = useMemo(() => {
    const slots = new Map();

    appointments.forEach((appointment) => {
      const slotId = getSlotId(appointment);
      const appointmentStatus = getAppointmentStatus(appointment);
      const orderStatus = getOrderStatus(appointment);

      if (!slotId || slotId === "-" || isFinalStatus(appointmentStatus) || isFinalStatus(orderStatus)) {
        return;
      }

      const key = String(slotId);

      if (!slots.has(key)) {
        const startTime = getAppointmentTime(appointment);

        slots.set(key, {
          id: key,
          date: getAppointmentDate(appointment),
          time: startTime,
          range: getTimeRange(startTime, slotDurationMinutes),
          appointmentId: getAppointmentId(appointment),
          orderId: getOrderId(appointment),
        });
      }
    });

    return Array.from(slots.values());
  }, [appointments, slotDurationMinutes]);

  const bookedSlotById = useMemo(
    () => new Map(bookedSlots.map((slot) => [String(slot.id), slot])),
    [bookedSlots]
  );
  const selectedSlotId = createFormData.av_slot_id.trim();
  const bookedSlotMatch = selectedSlotId
    ? bookedSlotById.get(String(selectedSlotId))
    : null;
  const selectedBookedSlot =
    bookedSlotMatch &&
    String(bookedSlotMatch.appointmentId) !== String(getAppointmentId(editingAppointment))
      ? bookedSlotMatch
      : null;
  const slotScheduleAnchor = useMemo(() => {
    const anchors = bookedSlots
      .map((slot) => ({
        id: Number(slot.id),
        start: parseTimeToMinutes(slot.time),
      }))
      .filter((slot) => Number.isFinite(slot.id) && slot.start !== null)
      .sort((a, b) => a.id - b.id);

    return anchors[0] || null;
  }, [bookedSlots]);

  const createFieldErrors = {
    order_id: createFormData.order_id.trim() ? "" : "Order ID is required.",
    av_slot_id: !selectedSlotId
      ? "Available slot ID is required."
      : selectedBookedSlot
        ? `Slot #${selectedBookedSlot.id} is already booked from ${selectedBookedSlot.range}.`
        : "",
    client_id: createFormData.client_id.trim() ? "" : "Client ID is required.",
    notes:
      createFormData.type !== "sales" && !createFormData.notes.trim()
        ? "Notes are required for legal consultation and general appointments."
        : "",
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setEditingAppointment(null);
    setCreateFormData(INITIAL_CREATE_FORM);
    setCreateTouched({});
    setCreateError("");
    setSlotOptionsError("");
  };

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    setCreateFormData({
      order_id: String(getOrderId(appointment) || "").replace("-", ""),
      av_slot_id: String(getSlotId(appointment) || "").replace("-", ""),
      client_id: String(getAppointmentClientId(appointment) || ""),
      type: String(getAppointmentType(appointment) || "sales").toLowerCase(),
      notes: String(getAppointmentNotes(appointment) || ""),
    });
    setCreateTouched({});
    setCreateError("");
    setCreateOpen(true);
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setCreateError("");
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "client_id" ? { order_id: "" } : {}),
    }));
  };

  const handleCreateBlur = (event) => {
    const { name } = event.target;

    setCreateTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();

    const errors = Object.values(createFieldErrors).filter(Boolean);

    if (errors.length > 0) {
      setCreateTouched({
        order_id: true,
        av_slot_id: true,
        client_id: true,
        type: true,
        notes: true,
      });
      setCreateError(errors.join("\n"));
      return;
    }
    const appointmentId = getAppointmentId(editingAppointment);
    const result = editingAppointment
      ? await dispatch(
          updateCustomerServiceAppointment({ id: appointmentId, payload: createFormData })
        )
      : await dispatch(createCustomerServiceAppointment(createFormData));

    const succeeded = editingAppointment
      ? updateCustomerServiceAppointment.fulfilled.match(result)
      : createCustomerServiceAppointment.fulfilled.match(result);

    if (succeeded) {
      const selectedClient = createOptions.clients.find(
        (client) => String(getClientOptionId(client)) === String(createFormData.client_id)
      );

      if (selectedClient) {
        saveAppointmentClient(createFormData.order_id, selectedClient);
        setClientByOrderId((current) => ({
          ...current,
          [String(createFormData.order_id)]: selectedClient,
        }));
      }
      closeCreateModal();
    } else {
      setCreateError(result.payload || "Failed to create appointment.");
    }
  };

  const availableOrderOptions = useMemo(() => {
    const initiallyAcceptedOrders = createOptions.orders.filter((order) => {
      const status = getOrderOptionStatus(order);
      return !status || status === "initially_accepted";
    });

    if (!createFormData.client_id) return initiallyAcceptedOrders;

    const selectedClientId = String(createFormData.client_id);
    const filtered = initiallyAcceptedOrders.filter(
      (order) => String(getOrderClientId(order)) === selectedClientId
    );

    return filtered;
  }, [createFormData.client_id, createOptions.orders]);

  const availableSlotOptions = useMemo(
    () =>
      createOptions.slots.filter((slot) => {
        const status = getSlotOptionStatus(slot);
        const id = getSlotOptionId(slot);

        if (slot?.is_available === false || slot?.available === false) {
          return false;
        }

        return isAvailableSlotStatus(status) && !bookedSlotById.has(String(id));
      }).sort(compareAvailableSlots),
    [bookedSlotById, createOptions.slots]
  );

  const selectedAvailableSlot = useMemo(
    () =>
      selectedSlotId
        ? availableSlotOptions.find(
            (slot) => String(getSlotOptionId(slot)) === String(selectedSlotId)
          )
        : null,
    [availableSlotOptions, selectedSlotId]
  );
  const selectedSlotRange = useMemo(() => {
    if (!selectedSlotId) return "";

    if (selectedBookedSlot?.range) {
      return selectedBookedSlot.range;
    }

    const selectedAvailableTime = readNested(selectedAvailableSlot, [
      "start_time",
      "time",
      "from_time",
      "starts_at",
    ]);
    const selectedAvailableEndTime = readNested(selectedAvailableSlot, [
      "end_time",
      "to_time",
      "ends_at",
    ]);

    if (selectedAvailableTime) {
      if (selectedAvailableEndTime) {
        return `${String(selectedAvailableTime).slice(0, 5)} - ${String(selectedAvailableEndTime).slice(0, 5)}`;
      }
      return getTimeRange(selectedAvailableTime, slotDurationMinutes);
    }

    const slotNumber = Number(selectedSlotId);

    if (!slotScheduleAnchor || !Number.isFinite(slotNumber)) {
      return "";
    }

    const inferredStart =
      slotScheduleAnchor.start +
      (slotNumber - slotScheduleAnchor.id) * slotDurationMinutes;

    if (inferredStart < 0) return "";

    return getTimeRange(formatMinutesToTime(inferredStart), slotDurationMinutes);
  }, [
    selectedAvailableSlot,
    selectedBookedSlot,
    selectedSlotId,
    slotDurationMinutes,
    slotScheduleAnchor,
  ]);

  const handleConfirmAction = async () => {
    if (!confirmAction?.appointment) return;

    const id = getAppointmentId(confirmAction.appointment);
    if (!id) return;

    setConfirmActionError("");

    const result = await dispatch(cancelCustomerServiceAppointment(id));

    if (cancelCustomerServiceAppointment.fulfilled.match(result)) {
      closeConfirmModal();
    } else {
      setConfirmActionError(result.payload || "Failed to update appointment.");
    }
  };

  return (
    <div className="customer-service-page">
      <section className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Appointments from API" icon={CalendarDays} />
        <StatCard title="Active" value={active} note="Need follow-up" icon={CalendarClock} />
        <StatCard title="Completed" value={completed} note="Done" icon={CheckCircle2} />
        <StatCard title="Cancelled" value={cancelled} note="Canceled records" icon={CircleSlash2} />
      </section>

      <Toolbar
        placeholder="Search appointments..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={APPOINTMENT_FILTERS}
        action={
          <Button type="button" className="primary-action-btn" onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            <span>New Appointment</span>
          </Button>
        }
      />

      <TableCard title="Appointment List" count={meta?.total ?? filteredAppointments.length}>
        {loading ? (
          <div className="table-state">Loading appointments...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : (
          <table className="legal-table customer-service-appointments-table">
            <thead>
              <tr>
                <th>Appointment</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Order</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const id = getAppointmentId(appointment);
                  const status = getAppointmentStatus(appointment);
                  const orderStatus = getOrderStatus(appointment);
                  const isLocked = isFinalStatus(status);

                  return (
                    <tr key={id || JSON.stringify(appointment)}>
                      <td data-label="Appointment">
                        <div className="customer-service-name-cell">
                          <strong>#{id || "-"}</strong>
                          <span>{formatStatus(getAppointmentType(appointment))}</span>
                        </div>
                      </td>
                      <td data-label="Customer">
                        <div className="customer-service-name-cell">
                          <strong>{getClientName(appointment)}</strong>
                          <span>{getClientContact(appointment)}</span>
                        </div>
                      </td>
                      <td data-label="Date & Time">
                        <div className="appointment-date-cell">
                          <strong>{getAppointmentDate(appointment)}</strong>
                          <span>
                            {getTimeRange(getAppointmentTime(appointment), slotDurationMinutes)}
                          </span>
                        </div>
                      </td>
                      <td data-label="Order">
                        <div className="customer-service-name-cell">
                          <strong>#{getOrderId(appointment)}</strong>
                          <span>{formatStatus(orderStatus)}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`customer-service-pill ${status}`}>
                          {formatStatus(status)}
                        </span>
                      </td>
                      <td data-label="Created At">{getCreatedAt(appointment)}</td>
                      <td data-label="Actions">
                        <div className="customer-service-row-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => openEditModal(appointment)}
                            disabled={actionLoading || isLocked || !id}
                            title="Edit appointment"
                          >
                            <PencilLine size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn danger"
                            onClick={() =>
                              setConfirmAction({ type: "cancel", appointment })
                            }
                            disabled={actionLoading || isLocked || !id}
                            title="Cancel appointment"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    {message || "No appointments found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={Boolean(confirmAction)}
        onClose={closeConfirmModal}
        title="Cancel appointment"
        size="sm"
      >
        <div className="modal-form">
          <p className="customer-service-confirm-copy">
            Cancel this appointment?
          </p>
          {confirmActionError ? (
            <div className="form-alert">{confirmActionError}</div>
          ) : null}

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeConfirmModal}
              disabled={actionLoading}
            >
              Back
            </Button>

            <Button
              type="button"
              className="primary-action-btn"
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={createOpen}
        onClose={closeCreateModal}
        title={editingAppointment ? "Edit appointment" : "Create appointment"}
        description={
          editingAppointment
            ? "Update the customer, order, slot, purpose, or appointment notes."
            : "Book an appointment by choosing the related order, available slot, and client."
        }
        size="lg"
      >
        <form className="modal-form appointment-create-form" onSubmit={handleCreateAppointment}>
          {createError ? <div className="form-alert">{createError}</div> : null}

          <div className="appointment-picker">
            <div className="appointment-picker-step">
              <span className="appointment-picker-index">1</span>
              <div className="appointment-picker-copy">
                <strong>Choose a client</strong>
                <span>Select the customer who requested the appointment.</span>
              </div>
              <select
                name="client_id"
                value={createFormData.client_id}
                onChange={handleCreateChange}
                onBlur={handleCreateBlur}
                disabled={createOptionsLoading}
              >
                <option value="">
                  {createOptionsLoading ? "Loading clients..." : "Select client"}
                </option>
                {createOptions.clients.map((client, index) => {
                  const id = getClientOptionId(client);

                  return (
                    <option key={id || `client-${index}`} value={id}>
                      {getClientOptionLabel(client)}
                    </option>
                  );
                })}
              </select>
              {createTouched.client_id && createFieldErrors.client_id ? (
                <p className="field-error">{createFieldErrors.client_id}</p>
              ) : null}
            </div>

            <div className="appointment-picker-step">
              <span className="appointment-picker-index">2</span>
              <div className="appointment-picker-copy">
                <strong>Choose an order</strong>
                <span>Pick the order that this appointment belongs to.</span>
              </div>
              <select
                name="order_id"
                value={createFormData.order_id}
                onChange={handleCreateChange}
                onBlur={handleCreateBlur}
                disabled={createOptionsLoading}
              >
                <option value="">
                  {createOptionsLoading ? "Loading orders..." : "Select order"}
                </option>
                {availableOrderOptions.map((order, index) => {
                  const id = getOrderOptionId(order);

                  return (
                    <option key={id || `order-${index}`} value={id}>
                      {getOrderOptionLabel(order)}
                    </option>
                  );
                })}
              </select>
              {createTouched.order_id && createFieldErrors.order_id ? (
                <p className="field-error">{createFieldErrors.order_id}</p>
              ) : null}
            </div>

            <div className="appointment-picker-step">
              <span className="appointment-picker-index">3</span>
              <div className="appointment-picker-copy">
                <strong>Choose an available slot</strong>
                <span>Select the time that should be reserved.</span>
              </div>
              {availableSlotOptions.length > 0 ? (
                <select
                  name="av_slot_id"
                  value={createFormData.av_slot_id}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  disabled={createOptionsLoading}
                >
                  <option value="">
                    {createOptionsLoading ? "Loading slots..." : "Select available slot"}
                  </option>
                  {availableSlotOptions.map((slot, index) => {
                    const id = getSlotOptionId(slot);

                    return (
                      <option key={id || `slot-${index}`} value={id}>
                        {getSlotOptionLabelWithRange(slot, slotDurationMinutes)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="number"
                  name="av_slot_id"
                  value={createFormData.av_slot_id}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  placeholder="Enter available slot ID"
                  disabled={createOptionsLoading}
                />
              )}
              {selectedSlotId ? (
                <div
                  className={`slot-preview-card ${selectedBookedSlot ? "is-booked" : ""}`}
                >
                  <span>{[getSlotOptionDate(selectedAvailableSlot), `Slot #${selectedSlotId}`].filter(Boolean).join(" • ")}</span>
                  <strong>{selectedSlotRange || "Time not available"}</strong>
                  <small>
                    {selectedBookedSlot
                      ? "Already booked"
                      : "Available to book if the backend accepts this slot"}
                  </small>
                </div>
              ) : null}
              {slotOptionsError ? (
                <p className="field-hint">{slotOptionsError}</p>
              ) : null}
              {selectedAvailableSlot ? (
                <p className="field-hint">
                  Selected time:{" "}
                  {getTimeRange(
                    readNested(selectedAvailableSlot, [
                      "start_time",
                      "time",
                      "from_time",
                      "starts_at",
                    ]),
                    slotDurationMinutes
                  )}
                </p>
              ) : null}
              {selectedBookedSlot ? (
                <p className="field-error">
                  Slot #{selectedBookedSlot.id} is already booked from {selectedBookedSlot.range}.
                </p>
              ) : null}
              {createTouched.av_slot_id && createFieldErrors.av_slot_id ? (
                <p className="field-error">{createFieldErrors.av_slot_id}</p>
              ) : null}
              {bookedSlots.length > 0 ? (
                <div className="booked-slots-panel">
                  <span>Booked now</span>
                  <div>
                    {bookedSlots.map((slot) => (
                      <span
                        key={slot.id}
                        className="booked-slot-chip"
                        title={`Booked by appointment #${slot.appointmentId}, order #${slot.orderId}`}
                      >
                        {getCompactSlotLabel(slot)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="appointment-picker-step">
              <span className="appointment-picker-index">4</span>
              <div className="appointment-picker-copy">
                <strong>Appointment purpose</strong>
                <span>Choose sales, legal consultation, or a general meeting.</span>
              </div>
              <select
                name="type"
                value={createFormData.type}
                onChange={handleCreateChange}
                onBlur={handleCreateBlur}
              >
                <option value="sales">Sales</option>
                <option value="legal_consultation">Legal consultation</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="appointment-picker-step">
              <span className="appointment-picker-index">5</span>
              <div className="appointment-picker-copy">
                <strong>Notes</strong>
                <span>
                  {createFormData.type === "sales"
                    ? "Optional for sales appointments."
                    : "Briefly explain the reason for this appointment."}
                </span>
              </div>
              <textarea
                name="notes"
                value={createFormData.notes}
                onChange={handleCreateChange}
                onBlur={handleCreateBlur}
                rows="3"
                placeholder="Add the appointment reason and useful context..."
              />
              {createTouched.notes && createFieldErrors.notes ? (
                <p className="field-error">{createFieldErrors.notes}</p>
              ) : null}
            </div>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              className="ghost-filter-btn"
              onClick={closeCreateModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="primary-action-btn"
              disabled={actionLoading}
            >
              {actionLoading
                ? editingAppointment
                  ? "Saving..."
                  : "Creating..."
                : editingAppointment
                  ? "Save changes"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
