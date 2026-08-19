/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import "./toast.css";

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };

const readActionSignals = (state) => Object.entries(state).flatMap(([sliceName, slice]) => {
  if (!slice || typeof slice !== "object" || Array.isArray(slice)) return [];
  return [
    slice.actionMessage ? { key: `${sliceName}:success`, type: "success", message: slice.actionMessage } : null,
    slice.actionError ? { key: `${sliceName}:error`, type: "error", message: slice.actionError } : null,
  ].filter(Boolean);
});

export function ToastProvider({ children }) {
  const state = useSelector((current) => current);
  const signals = useMemo(() => readActionSignals(state), [state]);
  const previousSignals = useRef(new Map());
  const timers = useRef(new Map());
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const text = typeof message === "string" ? message : String(message || "Something went wrong");
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast = { id, message: text, type: options.type || "info", title: options.title || "" };
    setToasts((current) => [...current.slice(-3), toast]);
    const timer = window.setTimeout(() => dismiss(id), options.duration ?? 4000);
    timers.current.set(id, timer);
    return id;
  }, [dismiss]);

  useEffect(() => {
    const activeKeys = new Set(signals.map((signal) => signal.key));
    previousSignals.current.forEach((_, key) => {
      if (!activeKeys.has(key)) previousSignals.current.delete(key);
    });
    signals.forEach((signal) => {
      if (previousSignals.current.get(signal.key) === signal.message) return;
      previousSignals.current.set(signal.key, signal.message);
      showToast(signal.message, { type: signal.type });
    });
  }, [showToast, signals]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  const api = useMemo(() => ({
    show: showToast,
    success: (message, options) => showToast(message, { ...options, type: "success" }),
    error: (message, options) => showToast(message, { ...options, type: "error" }),
    warning: (message, options) => showToast(message, { ...options, type: "warning" }),
    info: (message, options) => showToast(message, { ...options, type: "info" }),
    dismiss,
  }), [dismiss, showToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="app-toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <article className={`app-toast app-toast--${toast.type}`} key={toast.id} role={toast.type === "error" ? "alert" : "status"}>
              <span className="app-toast__icon"><Icon size={20} /></span>
              <div className="app-toast__copy">
                {toast.title ? <strong>{toast.title}</strong> : null}
                <p>{toast.message}</p>
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Close notification"><X size={17} /></button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = { children: PropTypes.node.isRequired };

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
