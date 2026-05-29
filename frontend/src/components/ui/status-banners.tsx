import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Spinner } from "./skeletons";

// ===== ErrorBanner =====
type ErrorBannerProps = {
  message: string;
  onClose?: () => void;
};

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-300 shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ===== MessageBanner =====
type MessageBannerProps = {
  message: string;
  onClose?: () => void;
};

export function MessageBanner({ message, onClose }: MessageBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm">
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-emerald-400 hover:text-emerald-300 shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ===== InfoBanner =====
type InfoBannerProps = {
  message: string;
  icon?: ReactNode;
};

export function InfoBanner({ message, icon }: InfoBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500 text-sm">
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{message}</span>
    </div>
  );
}

// ===== PageLoading =====
type PageLoadingProps = {
  text?: string;
};

export function PageLoading({ text = "加载中..." }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground mt-4">{text}</p>
    </div>
  );
}
