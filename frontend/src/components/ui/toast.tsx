"use client";

import { useCallback, useEffect, useState } from "react";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

// ===== Toast Types =====

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

// ===== Provider =====

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
  };

  const iconMap: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const styles: Record<ToastType, string> = {
    success: "text-emerald-400 border-emerald-500/20",
    error: "text-red-400 border-red-500/20",
    warning: "text-amber-400 border-amber-500/20",
    info: "text-blue-400 border-blue-500/20",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed z-[9999] flex flex-col gap-2.5 pointer-events-none"
        style={{ top: 16, right: 16, animation: "slideDown 0.2s ease-out" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl min-w-[300px] max-w-[420px]",
              "bg-[color-mix(in_srgb,var(--card)_90%,transparent)] backdrop-blur-2xl text-foreground",
              styles[t.type],
            )}
            style={{ animation: "slideUp 0.25s ease-out" }}
            onClick={() => removeToast(t.id)}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-current/10 text-sm font-bold shrink-0">
              {iconMap[t.type]}
            </span>
            <span className="text-sm flex-1 leading-relaxed">{t.message}</span>
            <button
              className="text-xs opacity-40 hover:opacity-100 shrink-0 transition-opacity p-0.5"
              onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ===== Hook =====

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ===== Standalone message API (for api.ts interceptor) =====

type MessageFn = {
  (message: string, type?: ToastType, duration?: number): void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

let _globalToast: ToastContextValue | null = null;

export function setGlobalToast(instance: ToastContextValue) {
  _globalToast = instance;
}

export const message: MessageFn = ((msg: string, type: ToastType = "error", duration?: number) => {
  _globalToast?.toast(msg, type, duration);
}) as MessageFn;

message.success = (msg: string) => _globalToast?.success(msg);
message.error = (msg: string) => _globalToast?.error(msg);
message.info = (msg: string) => _globalToast?.info(msg);
message.warning = (msg: string) => _globalToast?.warning(msg);
