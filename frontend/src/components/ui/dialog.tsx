"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// ===== Dialog (Modal) Component =====

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  width?: number | string;
};

export function Dialog({ open, onClose, children, className, width = 520 }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handler);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" onClick={onClose}>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
        style={{ animation: "fadeIn 0.15s ease-out" }}
      />
      <div
        className={cn(
          "relative z-50 w-full rounded-2xl border shadow-2xl overflow-hidden",
          "bg-[color-mix(in_srgb,var(--card)_95%,var(--border))]",
          "dark:bg-[color-mix(in_srgb,var(--card)_85%,var(--border))]",
          "border-[var(--border)]",
          "max-sm:rounded-none max-sm:min-h-[60vh] max-sm:mt-auto max-sm:mb-0 max-sm:border-b-0 max-sm:border-x-0",
          "sm:mt-[5vh] sm:mb-8",
          className,
        )}
        style={{
          maxWidth: typeof width === "number" ? `${Math.min(width, window.innerWidth - 32)}px` : width,
          animation: "scaleIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===== Sub-components =====

export function DialogHeader({ children, className, onClose }: { children: React.ReactNode; className?: string; onClose?: () => void }) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-4 border-b border-border", className)}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent hover:scale-105 active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h2>;
}

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5 overflow-y-auto max-h-[65vh]", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-3 px-6 py-4 border-t border-border", className)}>{children}</div>;
}
