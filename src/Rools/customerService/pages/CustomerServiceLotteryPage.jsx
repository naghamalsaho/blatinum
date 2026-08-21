import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  BadgeCheck,
  Eye,
  ListChecks,
  PencilLine,
  Plus,
  RefreshCcw,
  SearchX,
  ShieldX,
  Ticket,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import Button from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import StatCard from "@/shared/components/StatCard";
import TableCard from "@/shared/components/TableCard";
import Toolbar from "@/shared/components/Toolbar";
import { formatStatus } from "../constants/customerServiceData";
import {
  clearCustomerServiceLotteryActionState,
  clearCustomerServiceSelectedLottery,
} from "../features/lottery/model/lottery.slice";
import { getCustomerServiceLotteryRequest } from "../features/lottery/api/lottery.api";
import {
  cancelCustomerServiceLottery,
  createCustomerServiceLottery,
  drawCustomerServiceLotteryWinner,
  fetchCustomerServiceLotteries,
  fetchCustomerServiceLottery,
  updateCustomerServiceLottery,
} from "../features/lottery/model/lottery.thunks";

import "../styles/customer-service.css";

const LOTTERY_FILTERS = [
  { value: "all", label: "All", dotClass: "" },
  { value: "active", label: "Active", dotClass: "ok" },
  { value: "pending", label: "Pending", dotClass: "busy" },
  { value: "completed", label: "Completed", dotClass: "ok" },
  { value: "cancelled", label: "Cancelled", dotClass: "off" },
  { value: "canceled", label: "Canceled", dotClass: "off" },
];

const DEFAULT_RULE = {
  rule_key: "social_status",
  operator: "=",
  rule_value: "",
};

const INITIAL_FORM = {
  unit_id: "",
  title: "",
  rules: [{ ...DEFAULT_RULE }],
};

const DRAW_STAGES = [
  {
    key: "preparing",
    title: "Preparing the draw...",
    subtitle: "Getting everything ready",
    footer: "Please wait a moment",
    progress: 28,
  },
  {
    key: "drawing",
    title: "Drawing a winner...",
    subtitle: "Good luck to everyone!",
    footer: "Selecting the winner",
    progress: 62,
  },
  {
    key: "finalizing",
    title: "Almost there...",
    subtitle: "Finalizing the result",
    footer: "Please wait a moment",
    progress: 88,
  },
];

let lotteryAudioContext;
let stopCurrentLotterySound = null;

const getLotteryAudioContext = () => {
  if (typeof window === "undefined") return null;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!lotteryAudioContext || lotteryAudioContext.state === "closed") {
    lotteryAudioContext = new AudioContext();
  }

  if (lotteryAudioContext.state === "suspended") {
    lotteryAudioContext.resume().catch(() => {});
  }

  return lotteryAudioContext;
};

const playTone = (context, {
  frequency,
  start,
  duration = 0.18,
  type = "sine",
  volume = 0.12,
  destination = context.destination,
}) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
};

const stopLotteryDrawSound = () => {
  stopCurrentLotterySound?.();
  stopCurrentLotterySound = null;
};

const playDrawSuspenseSound = () => {
  const context = getLotteryAudioContext();
  if (!context) return;

  stopLotteryDrawSound();

  const now = context.currentTime + 0.02;
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const pulse = context.createOscillator();
  const pulseGain = context.createGain();

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.12);
  master.gain.linearRampToValueAtTime(0.28, now + 3.3);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 4.45);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(560, now);
  filter.frequency.exponentialRampToValueAtTime(2200, now + 3.8);
  pulse.type = "sine";
  pulse.frequency.setValueAtTime(5.2, now);
  pulseGain.gain.setValueAtTime(0.035, now);
  pulse.connect(pulseGain);
  pulseGain.connect(master.gain);
  master.connect(filter);
  filter.connect(context.destination);
  pulse.start(now);
  pulse.stop(now + 4.45);

  [146.83, 164.81, 196, 220].forEach((frequency) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency * 1.65, now + 4.1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.45);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 4.5);
  });

  [293.66, 329.63, 392, 493.88, 587.33, 698.46, 880, 1174.66].forEach((frequency, index) => {
    playTone(context, {
      frequency,
      start: now + 0.25 + index * 0.38,
      duration: 0.12,
      type: "triangle",
      volume: 0.095 + index * 0.006,
      destination: master,
    });
  });

  [523.25, 659.25, 783.99, 987.77, 1174.66].forEach((frequency, index) => {
    playTone(context, {
      frequency,
      start: now + 3.22 + index * 0.1,
      duration: 0.09,
      type: "square",
      volume: 0.055,
      destination: master,
    });
  });

  stopCurrentLotterySound = () => {
    const stopAt = context.currentTime;
    master.gain.cancelScheduledValues(stopAt);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), stopAt);
    master.gain.exponentialRampToValueAtTime(0.0001, stopAt + 0.12);
  };
};

const playWinnerSound = () => {
  const context = getLotteryAudioContext();
  if (!context) return;

  stopLotteryDrawSound();

  const now = context.currentTime + 0.03;
  const master = context.createGain();
  master.gain.setValueAtTime(0.9, now);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.25);
  master.connect(context.destination);

  [392, 523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((frequency, index) => {
    playTone(context, {
      frequency,
      start: now + index * 0.095,
      duration: 0.24,
      type: "triangle",
      volume: 0.18,
      destination: master,
    });
  });

  [1046.5, 1567.98, 2093, 2637.02].forEach((frequency, index) => {
    playTone(context, {
      frequency,
      start: now + 0.68 + index * 0.08,
      duration: 0.42,
      type: "sine",
      volume: 0.14,
      destination: master,
    });
  });

  [1760, 2093, 2349.32, 2637.02, 3135.96].forEach((frequency, index) => {
    playTone(context, {
      frequency,
      start: now + 1.1 + index * 0.055,
      duration: 0.16,
      type: "square",
      volume: 0.045,
      destination: master,
    });
  });
};

const playDrawStageCue = (stage) => {
  const context = getLotteryAudioContext();
  if (!context) return;

  const notes = {
    preparing: [220, 329.63],
    drawing: [329.63, 493.88, 659.25],
    finalizing: [523.25, 783.99, 1046.5],
  }[stage];

  if (!notes) return;
  const now = context.currentTime + 0.015;
  notes.forEach((frequency, index) => {
    playTone(context, {
      frequency,
      start: now + index * 0.075,
      duration: 0.14 + index * 0.025,
      type: index === notes.length - 1 ? "triangle" : "sine",
      volume: 0.055 + index * 0.012,
    });
  });
};

const RULE_KEY_OPTIONS = [
  { value: "social_status", label: "Social status" },
  { value: "age", label: "Age (years)" },
  { value: "gender", label: "Gender" },
  { value: "salary", label: "Salary" },
];

const NUMERIC_RULE_KEYS = new Set(["age", "salary"]);

const readNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const displayValue = toDisplayText(value);
      if (displayValue.trim() !== "") {
        return displayValue;
      }
      continue;
    }

    return value;
  }

  return "";
};

const readObjectNested = (item, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], item);

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }

  return null;
};

const toDisplayText = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toDisplayText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    if (value.first_name || value.last_name) {
      return [value.first_name, value.last_name].filter(Boolean).join(" ");
    }

    if (value.firstName || value.lastName) {
      return [value.firstName, value.lastName].filter(Boolean).join(" ");
    }

    return (
      value.en ||
      value.ar ||
      value.name ||
      value.title ||
      value.full_name ||
      value.fullName ||
      value.unit_number ||
      value.value ||
      JSON.stringify(value)
    );
  }

  return String(value);
};

const getLotteryId = (lottery) => readNested(lottery, ["id", "lottery_id"]);
const getLotteryTitle = (lottery) =>
  toDisplayText(readNested(lottery, ["title", "name"])) || `Lottery #${getLotteryId(lottery) || "-"}`;
const getLotteryStatus = (lottery) =>
  toDisplayText(readNested(lottery, ["status", "state"]) || "active").toLowerCase();
const canDrawLottery = (lottery) =>
  ["active", "open", "pending"].includes(getLotteryStatus(lottery));
const getLotteryUnitId = (lottery) =>
  readNested(lottery, ["unit_id", "unit.id", "unit.unit_id"]);
const getLotteryUnitLabel = (lottery) =>
  toDisplayText(readNested(lottery, ["unit.unit_number", "unit.name", "unit_id"])) || "-";
const getLotteryWinner = (lottery) =>
  toDisplayText(
    readNested(lottery, [
      "winner_name",
      "winnerFullName",
      "winner.full_name",
      "winner.name",
      "winner.account.full_name",
      "winner.user.full_name",
      "winner.user.name",
      "winner.customer.full_name",
      "winner.customer.name",
      "winner.client.account.full_name",
      "winner.client.full_name",
      "winner.client.name",
      "winner_account.full_name",
      "winnerClient.account.full_name",
      "winnerClient.full_name",
      "winnerClient.name",
      "winner_client.account.full_name",
      "winner_client.full_name",
      "winner_client.name",
      "winner.data.full_name",
      "winner.data.name",
      "winner_info.full_name",
      "winner_info.name",
      "winner_info.client.full_name",
      "winner_info.client.name",
      "winner_details.full_name",
      "winner_details.name",
      "winner_details.client.full_name",
      "winner_details.client.name",
      "winner",
      "winner_client",
      "winnerClient",
      "winner_data",
      "winner.details",
      "winner.choosen_name",
      "winner.selected_name",
      "winner_id",
      "winner.id",
      "winner.client_id",
      "client_id",
    ])
  ) || "";

const getWinnerLabel = (lottery) => {
  const winner = getLotteryWinner(lottery) || getLotteryWinnerFromParticipants(lottery);
  if (winner) return winner;

  const status = getLotteryStatus(lottery);
  if (["completed", "done", "drawn", "closed"].includes(status)) {
    const fallbackParticipant = getFallbackParticipant(lottery);
    return fallbackParticipant ? getParticipantName(fallbackParticipant) : "Winner selected";
  }

  return "Pending draw";
};

const getLotteryListWinner = (lottery) =>
  getLotteryWinner(lottery) || getLotteryWinnerFromParticipants(lottery) || "-";

const getLotteryTableWinner = (lottery) => {
  const winner = getLotteryListWinner(lottery);
  if (winner !== "-") return winner;

  return ["completed", "done", "drawn", "closed"].includes(getLotteryStatus(lottery))
    ? "Loading winner..."
    : "-";
};

const getLotteryCreatedAt = (lottery) =>
  toDisplayText(readNested(lottery, ["created_at", "createdAt"])) || "-";
const getLotteryUpdatedAt = (lottery) =>
  toDisplayText(readNested(lottery, ["updated_at", "updatedAt", "created_at"])) || "-";
const getLotteryRules = (lottery) => {
  const rules = readNested(lottery, ["rules", "conditions"]);
  return Array.isArray(rules) ? rules : [];
};

const getLotteryParticipants = (lottery) => {
  const participants = readNested(lottery, ["participants", "clients", "entries"]);
  return Array.isArray(participants) ? participants : [];
};

const getWinningParticipant = (lottery) =>
  getLotteryParticipants(lottery).find((participant) => {
    const value = readNested(participant, ["is_winner", "winner", "isWinner"]);
    return value === true || value === 1 || value === "1" || value === "true";
  }) || null;

const getFallbackParticipant = (lottery) => {
  const participants = getLotteryParticipants(lottery);
  return getWinningParticipant(lottery) || (participants.length === 1 ? participants[0] : null);
};

const getParticipantName = (participant) =>
  toDisplayText(readNested(participant, [
    "client.account.full_name",
    "account.full_name",
    "full_name",
    "name",
    "client.name",
    "client_id",
    "id",
  ])) || "Eligible participant";

const getParticipantMeta = (participant) =>
  [
    toDisplayText(readNested(participant, ["client.account.email", "account.email", "email"])),
    toDisplayText(readNested(participant, ["client.account.phone", "account.phone", "phone"])),
    formatStatus(
      toDisplayText(readNested(participant, ["client.additional_info.social_status", "social_status"]))
    ),
  ]
    .filter(Boolean)
    .join(" - ");

const getLotteryWinnerFromParticipants = (lottery) => {
  const winnerParticipant = getWinningParticipant(lottery);
  return winnerParticipant ? getParticipantName(winnerParticipant) : "";
};

const getWinnerDetails = (lottery) =>
  getWinningParticipant(lottery) ||
  getFallbackParticipant(lottery) ||
  readObjectNested(lottery, ["winner.client", "winner", "winner_client", "client"]) ||
  null;

const getWinnerAvatar = (winner) =>
  readNested(winner, [
    "client.account.avatar",
    "client.account.image",
    "client.account.profile_image",
    "account.avatar",
    "account.image",
    "avatar",
    "image",
    "profile_image",
  ]);

const normalizeDrawResult = (payload, fallbackLottery) => {
  const resultLottery = payload || fallbackLottery;
  const mergedLottery = {
    ...(fallbackLottery || {}),
    ...(resultLottery || {}),
  };
  const winnerDetails = getWinnerDetails(mergedLottery);
  const fallbackParticipant = getFallbackParticipant(fallbackLottery);
  const winnerName =
    getWinnerName(mergedLottery) ||
    (winnerDetails ? getParticipantName(winnerDetails) : "") ||
    (fallbackParticipant ? getParticipantName(fallbackParticipant) : "");

  return {
    lottery: mergedLottery,
    winnerDetails,
    winnerName: winnerName && winnerName !== "Eligible participant" ? winnerName : "Winner selected",
  };
};

const extractLotteryDetailsPayload = (payload) =>
  payload?.data?.data || payload?.data || payload || null;

const getWinnerName = (lottery) => {
  const winner = getLotteryWinner(lottery) || getLotteryWinnerFromParticipants(lottery);
  if (winner) return winner;

  const status = getLotteryStatus(lottery);
  return ["completed", "done", "drawn", "closed"].includes(status)
    ? ""
    : "";
};

const normalizeRulesForForm = (rules = []) =>
  rules.length > 0
    ? rules.map((rule) => ({
        rule_key: toDisplayText(readNested(rule, ["rule_key", "key", "field"])) || "",
        operator: toDisplayText(readNested(rule, ["operator", "op"])) || "=",
        rule_value: toDisplayText(readNested(rule, ["rule_value", "value"])) || "",
      }))
    : [{ ...DEFAULT_RULE }];

function EmptyLotteryState({ message }) {
  return (
    <div className="customer-service-empty-state lottery-empty-state">
      <div className="customer-service-empty-icon">
        <SearchX size={24} />
      </div>
      <strong>No lotteries found</strong>
      <p>{message || "Create a lottery or adjust the current search and status filter."}</p>
    </div>
  );
}

EmptyLotteryState.propTypes = {
  message: PropTypes.string,
};

EmptyLotteryState.defaultProps = {
  message: "",
};

function LotteryFormFields({ form, onChange, onRuleChange, onAddRule, onRemoveRule, disabled }) {
  return (
    <div className="lottery-form-grid">
      <label>
        Lottery title
        <input
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Example: Social housing lottery"
          disabled={disabled}
        />
      </label>

      <label>
        Unit ID
        <input
          type="number"
          min="1"
          value={form.unit_id}
          onChange={(event) => onChange("unit_id", event.target.value)}
          placeholder="Example: 2"
          disabled={disabled}
        />
      </label>

      <section className="lottery-rules-editor">
        <div className="lottery-rules-head">
          <div>
            <strong>Eligibility rules</strong>
            <span>Matches the API payload: rule_key, operator, rule_value</span>
          </div>
          <button type="button" onClick={onAddRule} disabled={disabled}>
            <Plus size={15} />
            Add rule
          </button>
        </div>

        {form.rules.map((rule, index) => (
          <div className="lottery-rule-row" key={`${index}-${rule.rule_key}`}>
            <select
              value={rule.rule_key}
              onChange={(event) => onRuleChange(index, "rule_key", event.target.value)}
              disabled={disabled}
              aria-label="Rule key"
            >
              <option value="">Select rule</option>
              {!RULE_KEY_OPTIONS.some((option) => option.value === rule.rule_key) &&
              rule.rule_key ? (
                <option value={rule.rule_key}>{rule.rule_key}</option>
              ) : null}
              {RULE_KEY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={rule.operator}
              onChange={(event) => onRuleChange(index, "operator", event.target.value)}
              disabled={disabled}
            >
              <option value="=">=</option>
              <option value="!=">!=</option>
              <option value=">">&gt;</option>
              <option value=">=">&gt;=</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
              <option value="in">in</option>
            </select>
            {rule.rule_key === "social_status" ? (
              <select
                value={rule.rule_value}
                onChange={(event) => onRuleChange(index, "rule_value", event.target.value)}
                disabled={disabled}
                aria-label="Social status"
              >
                <option value="">Select social status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </select>
            ) : rule.rule_key === "gender" ? (
              <select
                value={rule.rule_value}
                onChange={(event) => onRuleChange(index, "rule_value", event.target.value)}
                disabled={disabled}
                aria-label="Gender"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            ) : (
              <input
                type={NUMERIC_RULE_KEYS.has(rule.rule_key) ? "number" : "text"}
                min={rule.rule_key === "age" ? "0" : undefined}
                step={rule.rule_key === "age" ? "1" : "any"}
                value={rule.rule_value}
                onChange={(event) => onRuleChange(index, "rule_value", event.target.value)}
                placeholder={
                  rule.rule_key === "age"
                    ? "Age in years"
                    : rule.rule_key === "salary"
                      ? "Salary amount"
                      : "Rule value"
                }
                disabled={disabled}
              />
            )}
            <button
              type="button"
              className="lottery-remove-rule"
              onClick={() => onRemoveRule(index)}
              disabled={disabled || form.rules.length === 1}
              aria-label="Remove rule"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

LotteryFormFields.propTypes = {
  form: PropTypes.shape({
    title: PropTypes.string.isRequired,
    unit_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rules: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onRuleChange: PropTypes.func.isRequired,
  onAddRule: PropTypes.func.isRequired,
  onRemoveRule: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

LotteryFormFields.defaultProps = {
  disabled: false,
};

function LotteryDetailsDrawer({
  open,
  lottery,
  loading,
  error,
  drawWinnerName,
  onClose,
}) {
  const status = getLotteryStatus(lottery);
  const rules = getLotteryRules(lottery);
  const participants = getLotteryParticipants(lottery);
  const winnerDisplay = drawWinnerName || getWinnerLabel(lottery);
  const winnerDetails = getWinnerDetails(lottery);
  const visibleWinnerName = drawWinnerName || getWinnerName(lottery);

  if (!open) return null;

  return (
    <div className="lottery-details-modal-shell">
      <button
        type="button"
        className="lottery-details-modal-backdrop"
        onClick={onClose}
        aria-label="Close lottery details"
      />

      <section className="lottery-details-modal" aria-busy={loading}>
        <header className="lottery-details-header">
          <span className="lottery-details-icon">
            <Ticket size={26} />
          </span>
          <div className="lottery-details-title">
            <span>Lottery workspace</span>
            <h2>{lottery ? getLotteryTitle(lottery) : "Lottery details"}</h2>
            <p>{lottery ? `Lottery #${getLotteryId(lottery)} - Unit ${getLotteryUnitLabel(lottery)}` : ""}</p>
          </div>
          <button
            type="button"
            className="lottery-details-close"
            onClick={onClose}
            aria-label="Close lottery details"
          >
            <X size={20} />
          </button>
        </header>

        <div className="lottery-details-body">
          {loading && !lottery ? <div className="table-state">Loading lottery details...</div> : null}
          {error ? <div className="table-state is-error">{error}</div> : null}

          {lottery ? (
            <>
              <section className="lottery-details-summary">
                <div>
                  <Ticket size={19} />
                  <span>
                    <small>Status</small>
                    <strong>
                      <span className={`customer-service-pill ${status}`}>
                        {formatStatus(status)}
                      </span>
                    </strong>
                  </span>
                </div>
                <div>
                  <Trophy size={19} />
                  <span>
                    <small>Winner</small>
                    <strong className={winnerDisplay !== "Pending draw" ? "lottery-winner-name" : ""}>
                      {winnerDisplay}
                    </strong>
                  </span>
                </div>
                <div>
                  <RefreshCcw size={19} />
                  <span>
                    <small>Updated</small>
                    <strong>{getLotteryUpdatedAt(lottery)}</strong>
                  </span>
                </div>
                <div>
                  <BadgeCheck size={19} />
                  <span>
                    <small>Eligible entries</small>
                    <strong>{participants.length}</strong>
                  </span>
                </div>
              </section>

              <main className="lottery-details-grid">
                <section className="lottery-details-card">
                  <header>
                    <Ticket size={18} />
                    <h3>Lottery Details</h3>
                  </header>
                  <dl className="lottery-details-facts">
                    <div>
                      <dt>ID</dt>
                      <dd>{getLotteryId(lottery) || "-"}</dd>
                    </div>
                    <div>
                      <dt>Title</dt>
                      <dd>{getLotteryTitle(lottery)}</dd>
                    </div>
                    <div>
                      <dt>Unit</dt>
                      <dd>{getLotteryUnitLabel(lottery)}</dd>
                    </div>
                    <div>
                      <dt>Unit ID</dt>
                      <dd>{getLotteryUnitId(lottery) || "-"}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{getLotteryCreatedAt(lottery)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{getLotteryUpdatedAt(lottery)}</dd>
                    </div>
                  </dl>
                </section>

                <section className={`lottery-details-card lottery-winner-card ${visibleWinnerName ? "has-winner" : ""}`}>
                  <header>
                    <Trophy size={18} />
                    <h3>Winner Result</h3>
                  </header>
                  <div className="lottery-winner-content">
                    <span className="lottery-winner-medal">
                      <Trophy size={24} />
                    </span>
                    <div>
                      <small>{visibleWinnerName ? "Selected winner" : "Draw status"}</small>
                      <strong>{visibleWinnerName || "Waiting for official draw"}</strong>
                      {winnerDetails ? (
                        <p>{getParticipantMeta(winnerDetails) || "Winner details returned by API"}</p>
                      ) : (
                        <p>{visibleWinnerName ? "The backend marked this lottery as drawn." : "Use Draw Winner to run the official draw."}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="lottery-details-card">
                  <header>
                    <ListChecks size={18} />
                    <h3>Eligibility Rules</h3>
                    <span>{rules.length}</span>
                  </header>
                  {rules.length > 0 ? (
                    <div className="lottery-rule-list refined">
                      {rules.map((rule, index) => (
                        <article className="lottery-rule-card" key={rule.id || index}>
                          <strong>{toDisplayText(readNested(rule, ["rule_key", "key", "field"])) || "Rule"}</strong>
                          <span>
                            {toDisplayText(readNested(rule, ["operator", "op"])) || "="}
                            {" "}
                            {toDisplayText(readNested(rule, ["rule_value", "value"])) || "-"}
                          </span>
                        </article>
                      ))}
                    </div>

                  ) : (
                    <p className="customer-service-empty-note">No eligibility rules returned.</p>
                  )}
                </section>

                <section className="lottery-details-card">
                  <header>
                    <UserRound size={18} />
                    <h3>Participants</h3>
                    <span>{participants.length}</span>
                  </header>
                  {participants.length > 0 ? (
                    <div className="lottery-participant-list refined">
                      {participants.slice(0, 10).map((participant, index) => (
                        <div className="lottery-participant" key={participant.id || index}>
                          <span>{index + 1}</span>
                          <div>
                            <strong>{getParticipantName(participant)}</strong>
                            <small>{getParticipantMeta(participant) || "Eligible participant"}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="customer-service-empty-note">No participants returned by the API.</p>
                  )}
                </section>
              </main>

            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

LotteryDetailsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  lottery: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  drawWinnerName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

LotteryDetailsDrawer.defaultProps = {
  lottery: null,
  loading: false,
  error: "",
  drawWinnerName: "",
};

function LotteryDrumIllustration({ active }) {
  return (
    <div className={`lottery-draw-drum ${active ? "is-active" : ""}`} aria-hidden="true">
      <div className="lottery-draw-drum-glow" />
      <div className="lottery-draw-drum-ring">
        {Array.from({ length: 12 }).map((_, index) => (
          <span className="lottery-draw-ball" key={index} />
        ))}
      </div>
      <span className="lottery-draw-handle" />
      <span className="lottery-draw-leg left" />
      <span className="lottery-draw-leg right" />
      <span className="lottery-draw-base" />
    </div>
  );
}

LotteryDrumIllustration.propTypes = {
  active: PropTypes.bool,
};

LotteryDrumIllustration.defaultProps = {
  active: false,
};

function LotteryStarResult() {
  return (
    <div className="lottery-draw-star-scene" aria-hidden="true">
      <span className="lottery-draw-sparkle one" />
      <span className="lottery-draw-sparkle two" />
      <span className="lottery-draw-sparkle three" />
      <div className="lottery-draw-star-ball">
        <span />
      </div>
      <div className="lottery-draw-platform" />
    </div>
  );
}

function LotteryDrawModal({
  open,
  lottery,
  running,
  error,
  result,
  onClose,
  onRunDraw,
  onViewDetails,
  onDone,
}) {
  const modalRef = useRef(null);
  const [stage, setStage] = useState("preparing");
  const [drawResult, setDrawResult] = useState(null);
  const [drawError, setDrawError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const drawPromiseRef = useRef({ key: "", promise: null });
  const lotteryId = getLotteryId(lottery);

  const activeStage = DRAW_STAGES.find((item) => item.key === stage) || DRAW_STAGES[0];
  const showSuccess = stage === "success" && (drawResult || result);
  const showError = stage === "error";
  const finalResult = drawResult || result;
  const winnerName = finalResult?.winnerName || "";
  const winnerDetails = finalResult?.winnerDetails;
  const winnerAvatar = getWinnerAvatar(winnerDetails);
  const metadataLottery = finalResult?.lottery || lottery;

  const restartDraw = useCallback(() => {
    playDrawSuspenseSound();
    setRunId((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!open || !lottery) return undefined;

    const timers = [];
    let cancelled = false;
    const runKey = `${lotteryId || "lottery"}-${runId}`;

    const schedule = (callback, ms) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) callback();
      }, ms);
      timers.push(timer);
    };

    const run = async () => {
      setStage("preparing");
      setDrawResult(null);
      setDrawError("");
      setIsRunning(true);

      schedule(() => setStage("drawing"), 1450);
      schedule(() => setStage("finalizing"), 3200);

      const minimumFlow = new Promise((resolve) => {
        schedule(resolve, 4700);
      });
      if (drawPromiseRef.current.key !== runKey || !drawPromiseRef.current.promise) {
        drawPromiseRef.current = {
          key: runKey,
          promise: onRunDraw(lottery),
        };
      }
      const apiResultPromise = drawPromiseRef.current.promise;

      try {
        const [apiResult] = await Promise.all([apiResultPromise, minimumFlow]);
        if (cancelled) return;

        setDrawResult(apiResult);
        setStage("success");
        setIsRunning(false);
        playWinnerSound();
      } catch (drawException) {
        if (cancelled) return;

        timers.forEach((timer) => window.clearTimeout(timer));
        stopLotteryDrawSound();
        setDrawError(drawException?.message || "The draw could not be completed.");
        setStage("error");
        setIsRunning(false);
      } finally {
        if (drawPromiseRef.current.key === runKey) {
          drawPromiseRef.current = { key: "", promise: null };
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      stopLotteryDrawSound();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  // Updating the same lottery with its winner/status must not start a second draw.
  // A new run happens only for another lottery or an explicit retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotteryId, onRunDraw, open, runId]);

  useEffect(() => {
    if (open && ["preparing", "drawing", "finalizing"].includes(stage)) {
      playDrawStageCue(stage);
    }
  }, [open, stage]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector =
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    const previousActive = document.activeElement;

    window.setTimeout(() => {
      modalRef.current
        ?.querySelector(focusableSelector)
        ?.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(modalRef.current.querySelectorAll(focusableSelector)).filter(
        (element) => !element.disabled && element.offsetParent !== null
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus?.({ preventScroll: true });
    };
  }, [modalRef, onClose, open]);

  if (!open) return null;

  return (
    <div className="lottery-live-modal-shell">
      <button
        type="button"
        className="lottery-live-backdrop"
        onClick={onClose}
        aria-label="Close lottery draw"
      />

      <section
        className={`lottery-live-modal lottery-live-${stage}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lottery-live-title"
        ref={modalRef}
      >
        <header className="lottery-live-header">
          <span className="lottery-live-label">
            <span className="lottery-live-signal" />
            LIVE LOTTERY DRAW
          </span>
          <button type="button" onClick={onClose} aria-label="Close draw modal">
            <X size={19} />
          </button>
        </header>

        {!showSuccess && !showError ? (
          <div className="lottery-live-loading">
            <div className="lottery-live-stage-count">
              {String(DRAW_STAGES.findIndex((item) => item.key === stage) + 1).padStart(2, "0")}
              <span>/ 03</span>
            </div>
            <h2 id="lottery-live-title">{activeStage.title}</h2>
            <p>{activeStage.subtitle}</p>

            <div className="lottery-live-stage-track" aria-label="Draw progress">
              {DRAW_STAGES.map((item, index) => {
                const activeIndex = DRAW_STAGES.findIndex((entry) => entry.key === stage);
                return (
                  <span
                    key={item.key}
                    className={index < activeIndex ? "is-done" : index === activeIndex ? "is-current" : ""}
                  >
                    <i>{index < activeIndex ? "✓" : index + 1}</i>
                    <small>{item.key}</small>
                  </span>
                );
              })}
            </div>

            <div className="lottery-live-visual">
              {stage === "finalizing" ? (
                <LotteryStarResult />
              ) : (
                <LotteryDrumIllustration active={stage === "drawing"} />
              )}
            </div>

            {stage === "drawing" ? (
              <div className="lottery-live-dots" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            ) : (
              <div className="lottery-live-progress" aria-hidden="true">
                <span style={{ width: `${activeStage.progress}%` }} />
              </div>
            )}

            <small>{activeStage.footer}</small>
          </div>
        ) : null}

        {showSuccess ? (
          <div className="lottery-live-result">
            <div className="lottery-winner-burst" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="lottery-live-confetti" aria-hidden="true">
              {Array.from({ length: 72 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    "--confetti-index": index,
                    "--confetti-x": `${(index * 47) % 100}%`,
                    "--confetti-delay": `${(index % 12) * 0.055}s`,
                    "--confetti-drift": `${((index * 37) % 180) - 90}px`,
                  }}
                />
              ))}
            </div>
            <div className="lottery-live-emoji-confetti" aria-hidden="true">
              <span>{"🎊"}</span>
              <span>{"🎉"}</span>
              <span>{"✨"}</span>
              <span>{"🏆"}</span>
            </div>
            <div className="lottery-live-winner-crown" aria-hidden="true">
              <Trophy size={30} />
            </div>
            <h2 id="lottery-live-title">And the winner is...</h2>

            <div className="lottery-winner-avatar">
              {winnerAvatar ? (
                <img src={winnerAvatar} alt="" />
              ) : (
                <span>
                  <UserRound size={54} />
                </span>
              )}
              <em>
                <Trophy size={18} />
              </em>
            </div>

            <div className="lottery-winner-name-reveal">
              <small>Congratulations</small>
              <strong className="lottery-live-winner-name">{winnerName}</strong>
              <span aria-hidden="true">WINNER</span>
            </div>

            <div className="lottery-live-meta">
              <span>Lottery: {getLotteryTitle(metadataLottery)}</span>
              <span>Unit: {getLotteryUnitLabel(metadataLottery)}</span>
              <span>Draw ID: #{getLotteryId(metadataLottery) || "-"}</span>
              <span>Date: {getLotteryUpdatedAt(metadataLottery)}</span>
            </div>

            <footer className="lottery-live-actions">
              <Button type="button" className="ghost-filter-btn" onClick={() => onViewDetails(finalResult?.lottery)}>
                View Details
              </Button>
              <Button type="button" className="primary-action-btn" onClick={onDone}>
                Done
              </Button>
            </footer>
          </div>
        ) : null}

        {showError ? (
          <div className="lottery-live-error">
            <span className="lottery-live-error-icon">
              <ShieldX size={34} />
            </span>
            <h2 id="lottery-live-title">Draw failed</h2>
            <p>{drawError || error || "The draw could not be completed."}</p>
            <footer className="lottery-live-actions">
              <Button type="button" className="ghost-filter-btn" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                className="primary-action-btn"
                onClick={restartDraw}
                disabled={isRunning || running || !canDrawLottery(lottery)}
              >
                Try Again
              </Button>
            </footer>
          </div>
        ) : null}
      </section>
    </div>
  );
}

LotteryDrawModal.propTypes = {
  open: PropTypes.bool.isRequired,
  lottery: PropTypes.object,
  running: PropTypes.bool,
  error: PropTypes.string,
  result: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onRunDraw: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

LotteryDrawModal.defaultProps = {
  lottery: null,
  running: false,
  error: "",
  result: null,
};

export default function CustomerServiceLotteryPage() {
  const dispatch = useDispatch();
  const {
    items: lotteries = [],
    meta,
    message,
    loading,
    error,
    selectedLottery,
    actionLoading,
    actionError,
    actionMessage,
  } = useSelector((state) => state.customerServiceLotteries || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [drawingLotteryId, setDrawingLotteryId] = useState("");
  const [drawWinnerName, setDrawWinnerName] = useState("");
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [drawModalLottery, setDrawModalLottery] = useState(null);
  const [drawModalResult, setDrawModalResult] = useState(null);
  const [drawResultsById, setDrawResultsById] = useState({});
  const winnerHydrationRef = useRef(new Set());

  useEffect(() => {
    dispatch(fetchCustomerServiceLotteries());
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const completedMissingWinners = lotteries.filter((lottery) => {
      const id = getLotteryId(lottery);
      if (!id) return false;

      const idText = String(id);
      const completedStatus = ["completed", "done", "drawn", "closed"].includes(
        getLotteryStatus(lottery)
      );

      return (
        completedStatus &&
        getLotteryListWinner(lottery) === "-" &&
        !winnerHydrationRef.current.has(idText)
      );
    });

    if (completedMissingWinners.length === 0) return undefined;

    Promise.all(
      completedMissingWinners.map(async (lottery) => {
        const id = getLotteryId(lottery);
        const idText = String(id);
        winnerHydrationRef.current.add(idText);

        const result = await getCustomerServiceLotteryRequest(id);

        if (!result.ok) {
          winnerHydrationRef.current.delete(idText);
          return null;
        }

        const details = extractLotteryDetailsPayload(result.data);
        const normalized = normalizeDrawResult(details, lottery);
        const winnerName =
          normalized.winnerName && normalized.winnerName !== "Winner selected"
            ? normalized.winnerName
            : getLotteryListWinner(normalized.lottery);

        if (!winnerName || winnerName === "-") {
          winnerHydrationRef.current.delete(idText);
          return null;
        }

        return [
          idText,
          {
            ...normalized.lottery,
            winner_name: winnerName,
          },
        ];
      })
    ).then((entries) => {
      if (!active) return;

      const hydratedWinners = entries.filter(Boolean);
      if (hydratedWinners.length === 0) return;

      setDrawResultsById((current) => ({
        ...current,
        ...Object.fromEntries(hydratedWinners),
      }));
    });

    return () => {
      active = false;
    };
  }, [lotteries]);

  const currentLottery = selectedLottery?.item || selectedItem;

  const filteredLotteries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return lotteries.filter((lottery) => {
      const id = getLotteryId(lottery);
      const displayLottery = drawResultsById[String(id)] || lottery;
      const status = getLotteryStatus(displayLottery);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const searchable = [
        id,
        getLotteryTitle(displayLottery),
        status,
        getLotteryUnitLabel(displayLottery),
        getLotteryUnitId(displayLottery),
        getWinnerLabel(displayLottery),
        getLotteryCreatedAt(displayLottery),
        getLotteryUpdatedAt(displayLottery),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!q || searchable.includes(q));
    });
  }, [drawResultsById, lotteries, searchTerm, statusFilter]);

  const total = meta?.total ?? lotteries.length;
  const active = lotteries.filter((item) =>
    ["active", "open", "pending"].includes(getLotteryStatus(item))
  ).length;
  const completed = lotteries.filter((item) =>
    ["completed", "done", "drawn", "closed"].includes(getLotteryStatus(item))
  ).length;
  const cancelled = lotteries.filter((item) =>
    ["cancelled", "canceled"].includes(getLotteryStatus(item))
  ).length;

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedItem(null);
    dispatch(clearCustomerServiceSelectedLottery());
    dispatch(clearCustomerServiceLotteryActionState());
  }, [dispatch]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDrawer, drawerOpen]);

  const openDetails = (lottery) => {
    const id = getLotteryId(lottery);
    dispatch(clearCustomerServiceSelectedLottery());
    setSelectedItem(lottery);
    setDrawerOpen(true);
    dispatch(clearCustomerServiceLotteryActionState());

    if (id) {
      dispatch(fetchCustomerServiceLottery(id));
    }
  };

  const openCreateForm = () => {
    setFormMode("create");
    setSelectedItem(null);
    setForm(INITIAL_FORM);
    setFormOpen(true);
    dispatch(clearCustomerServiceLotteryActionState());
  };

  const openEditForm = (lottery) => {
    setDrawerOpen(false);
    dispatch(clearCustomerServiceSelectedLottery());
    setFormMode("edit");
    setSelectedItem(lottery);
    setForm({
      unit_id: toDisplayText(getLotteryUnitId(lottery)),
      title: getLotteryTitle(lottery),
      rules: normalizeRulesForForm(getLotteryRules(lottery)),
    });
    setFormOpen(true);
    dispatch(clearCustomerServiceLotteryActionState());
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormMode("create");
    setSelectedItem(null);
    setForm(INITIAL_FORM);
    dispatch(clearCustomerServiceLotteryActionState());
  };

  const updateFormField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRuleField = (index, field, value) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) => {
        if (ruleIndex !== index) return rule;

        if (field === "rule_key") {
          return {
            ...rule,
            rule_key: value,
            operator: ["social_status", "gender"].includes(value) ? "=" : rule.operator,
            rule_value: "",
          };
        }

        return { ...rule, [field]: value };
      }),
    }));
  };

  const addRule = () => {
    setForm((current) => ({
      ...current,
      rules: [...current.rules, { ...DEFAULT_RULE }],
    }));
  };

  const removeRule = (index) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    const payload = {
      unit_id: form.unit_id,
      title: form.title,
      rules: form.rules,
    };

    const result =
      formMode === "edit"
        ? await dispatch(
            updateCustomerServiceLottery({
              lotteryId: getLotteryId(selectedItem),
              payload,
            })
          )
        : await dispatch(createCustomerServiceLottery(payload));

    if (
      createCustomerServiceLottery.fulfilled.match(result) ||
      updateCustomerServiceLottery.fulfilled.match(result)
    ) {
      closeForm();
    }
  };

  const submitCancel = async (lottery) => {
    const id = getLotteryId(lottery);
    if (!id) return;

    await dispatch(cancelCustomerServiceLottery(id));
  };

  const openDrawModal = (lottery) => {
    const id = getLotteryId(lottery);
    if (!id) return;

    setSelectedItem(lottery);
    setDrawModalLottery(lottery);
    setDrawModalResult(null);
    setDrawWinnerName("");
    playDrawSuspenseSound();
    setDrawModalOpen(true);
    dispatch(clearCustomerServiceLotteryActionState());
  };

  const closeDrawModal = () => {
    stopLotteryDrawSound();
    setDrawModalOpen(false);
    setDrawModalLottery(null);
    setDrawModalResult(null);
    setDrawingLotteryId("");
    dispatch(clearCustomerServiceLotteryActionState());
  };

  const runDrawWinner = useCallback(async (lottery) => {
    const id = getLotteryId(lottery);
    if (!id) {
      throw new Error("Lottery id is missing.");
    }

    const idText = String(id);

    const detailsResult = await dispatch(fetchCustomerServiceLottery(id));
    const detailedLottery = fetchCustomerServiceLottery.fulfilled.match(detailsResult)
      ? detailsResult.payload.item
      : lottery;

    if (!canDrawLottery(detailedLottery)) {
      throw new Error(
        `This lottery cannot be drawn because its status is “${formatStatus(getLotteryStatus(detailedLottery))}”. Only open lotteries can be drawn.`
      );
    }

    const participants = getLotteryParticipants(detailedLottery);
    if (Array.isArray(detailedLottery?.participants) && participants.length === 0) {
      throw new Error("This lottery has no eligible participants. Review its eligibility rules before drawing a winner.");
    }

    setDrawingLotteryId(idText);
    setSelectedItem(detailedLottery);
    setDrawWinnerName("");
    dispatch(clearCustomerServiceLotteryActionState());

    const result = await dispatch(drawCustomerServiceLotteryWinner(id));

    if (drawCustomerServiceLotteryWinner.fulfilled.match(result)) {
      const refreshedDetailsResult = await dispatch(fetchCustomerServiceLottery(id));
      const refreshedLottery = fetchCustomerServiceLottery.fulfilled.match(refreshedDetailsResult)
        ? refreshedDetailsResult.payload.item
        : result.payload;
      const normalized = normalizeDrawResult(refreshedLottery, detailedLottery);
      const normalizedLottery = {
        ...normalized.lottery,
        winner_name: normalized.winnerName,
      };
      setDrawWinnerName(normalized.winnerName);
      setDrawModalResult({
        ...normalized,
        lottery: normalizedLottery,
      });
      setDrawModalLottery(normalizedLottery);
      setDrawResultsById((current) => ({
        ...current,
        [idText]: normalizedLottery,
      }));
      setDrawingLotteryId("");
      return normalized;
    }

    const fallbackDetailsResult = await dispatch(fetchCustomerServiceLottery(id));
    if (fetchCustomerServiceLottery.fulfilled.match(fallbackDetailsResult)) {
      const normalized = normalizeDrawResult(fallbackDetailsResult.payload.item, detailedLottery);
      const hasSavedWinner =
        getLotteryListWinner(normalized.lottery) !== "-" ||
        ["completed", "done", "drawn", "closed"].includes(getLotteryStatus(normalized.lottery));

      if (hasSavedWinner) {
        dispatch(clearCustomerServiceLotteryActionState());
        const normalizedLottery = {
          ...normalized.lottery,
          winner_name: normalized.winnerName,
        };
        setDrawWinnerName(normalized.winnerName);
        setDrawModalResult({
          ...normalized,
          lottery: normalizedLottery,
        });
        setDrawModalLottery(normalizedLottery);
        setDrawResultsById((current) => ({
          ...current,
          [idText]: normalizedLottery,
        }));
        setDrawingLotteryId("");
        return normalized;
      }
    }

    setDrawingLotteryId("");
    throw new Error(result.payload || "Failed to draw winner");
  }, [dispatch]);

  const openDrawResultDetails = (lottery) => {
    const targetLottery = lottery || drawModalResult?.lottery || drawModalLottery;
    closeDrawModal();

    if (targetLottery) {
      openDetails(targetLottery);
    }
  };

  return (
    <div className="customer-service-page lottery-page">
      <section className="legal-stats-grid">
        <StatCard title="Total" value={total} note="Lottery records" icon={Ticket} />
        <StatCard title="Active" value={active} note="Open or pending" icon={RefreshCcw} />
        <StatCard title="Completed" value={completed} note="Winner selected" icon={BadgeCheck} />
        <StatCard title="Cancelled" value={cancelled} note="Stopped rounds" icon={ShieldX} />
      </section>

      <Toolbar
        placeholder="Search lotteries by title, unit, winner, status, or date..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        selectOptions={LOTTERY_FILTERS}
        action={
          <Button type="button" className="primary-action-btn" onClick={openCreateForm}>
            <Plus size={16} />
            Create Lottery
          </Button>
        }
      />

      {actionError ? <p className="customer-service-form-error">{actionError}</p> : null}
      {actionMessage ? <p className="customer-service-form-success">{actionMessage}</p> : null}

      <TableCard title="Lottery List" count={meta?.total ?? filteredLotteries.length}>
        {loading ? (
          <div className="table-state">Loading lotteries...</div>
        ) : error ? (
          <div className="table-state is-error">{error}</div>
        ) : filteredLotteries.length === 0 ? (
          <EmptyLotteryState message={message} />
        ) : (
          <table className="legal-table lottery-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lottery</th>
                <th>Unit</th>
                <th>Rules</th>
                <th>Winner</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLotteries.map((lottery) => {
                const id = getLotteryId(lottery);
                const displayLottery = drawResultsById[String(id)] || lottery;
                const status = getLotteryStatus(displayLottery);
                const rules = getLotteryRules(displayLottery);
                const drawing = String(id) === drawingLotteryId;

                return (
                  <tr key={id || JSON.stringify(lottery)}>
                    <td data-label="ID">
                      <strong>{id || "-"}</strong>
                    </td>
                    <td data-label="Lottery">
                      <div className="customer-service-name-cell">
                        <strong>{getLotteryTitle(displayLottery)}</strong>
                        <span>Created {getLotteryCreatedAt(displayLottery)}</span>
                      </div>
                    </td>
                    <td data-label="Unit">
                      <div className="customer-service-name-cell">
                        <strong className="lottery-unit-label">{getLotteryUnitLabel(displayLottery)}</strong>
                        <span>{getLotteryUnitId(displayLottery) ? `Unit #${getLotteryUnitId(displayLottery)}` : "No unit id"}</span>
                      </div>
                    </td>
                    <td data-label="Rules">
                      <span className="lottery-count-pill">{rules.length} rules</span>
                    </td>
                    <td data-label="Winner">{getLotteryTableWinner(displayLottery)}</td>
                    <td data-label="Status">
                      <span className={`customer-service-pill ${status}`}>
                        {formatStatus(status)}
                      </span>
                    </td>
                    <td data-label="Updated">
                      <span className="customer-service-muted-time">{getLotteryUpdatedAt(displayLottery)}</span>
                    </td>
                    <td data-label="Actions">
                      <div className="customer-service-row-actions">
                        <button
                          type="button"
                          className="customer-service-action-btn primary"
                          onClick={() => openDetails(lottery)}
                          disabled={!id}
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className="customer-service-action-btn lottery-edit-action"
                          onClick={() => openEditForm(displayLottery)}
                          disabled={!id || actionLoading || drawing}
                          title="Edit lottery"
                        >
                          <PencilLine size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className={`customer-service-action-btn ${drawing ? "is-drawing" : ""}`}
                          onClick={() => openDrawModal(lottery)}
                          disabled={!id || !canDrawLottery(displayLottery) || actionLoading || drawing || drawModalOpen}
                          title={!canDrawLottery(displayLottery) ? "Only open lotteries can be drawn" : "Draw a winner"}
                        >
                          <Trophy size={16} />
                          <span>{drawing ? "Drawing" : "Draw"}</span>
                        </button>
                        <button
                          type="button"
                          className="customer-service-action-btn danger-soft"
                          onClick={() => submitCancel(lottery)}
                          disabled={!id || actionLoading}
                        >
                          <ShieldX size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      <LotteryDetailsDrawer
        open={drawerOpen}
        lottery={currentLottery}
        loading={selectedLottery?.loading}
        error={selectedLottery?.error}
        drawWinnerName={drawWinnerName}
        onClose={closeDrawer}
      />

      <LotteryDrawModal
        open={drawModalOpen}
        lottery={drawModalLottery}
        running={Boolean(drawingLotteryId)}
        error={actionError}
        result={drawModalResult}
        onClose={closeDrawModal}
        onRunDraw={runDrawWinner}
        onViewDetails={openDrawResultDetails}
        onDone={closeDrawModal}
      />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={formMode === "edit" ? "Update lottery" : "Create lottery"}
        description={
          formMode === "edit" && selectedItem
            ? `Update Lottery #${getLotteryId(selectedItem)}`
            : "Create a lottery using the same API payload from the collection."
        }
        size="lg"
      >
        <form className="customer-service-order-action-form lottery-form" onSubmit={submitForm}>
          <LotteryFormFields
            form={form}
            onChange={updateFormField}
            onRuleChange={updateRuleField}
            onAddRule={addRule}
            onRemoveRule={removeRule}
            disabled={actionLoading}
          />

          {actionError ? <p className="customer-service-form-error">{actionError}</p> : null}
          {actionMessage ? <p className="customer-service-form-success">{actionMessage}</p> : null}

          <div className="modal-actions">
            <Button type="button" className="ghost-filter-btn" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" className="primary-action-btn" disabled={actionLoading}>
              {actionLoading ? "Saving..." : formMode === "edit" ? "Update Lottery" : "Create Lottery"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
