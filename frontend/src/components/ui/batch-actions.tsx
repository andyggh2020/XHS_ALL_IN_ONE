import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useThemeColors } from "../../hooks/use-theme-colors";
import { cn } from "../../lib/utils";

type BatchAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: (selectedIds: number[]) => void | Promise<void>;
  confirm?: string;
};

type BatchActionsBarProps = {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  allIds: number[];
  actions: BatchAction[];
};

export function BatchActionsBar({ selectedIds, onSelectionChange, allIds, actions }: BatchActionsBarProps) {
  const c = useThemeColors();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const allSelected = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length;

  if (allIds.length === 0) return null;

  const handleAction = async (action: BatchAction) => {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setLoadingAction(action.key);
    try {
      await action.onClick(selectedIds);
    } catch {
      // error handled by parent
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-xl border shadow-sm transition-all"
      style={{
        background: `color-mix(in srgb, var(--primary) 8%, var(--surface))`,
        borderColor: `color-mix(in srgb, var(--primary) 15%, var(--border))`,
      }}
    >
      {/* Checkbox */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = indeterminate; }}
          onChange={(e) => { onSelectionChange(e.target.checked ? [...allIds] : []); }}
          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/30"
        />
        <span className="text-xs text-muted-foreground">
          {selectedIds.length > 0 ? `已选 ${selectedIds.length}` : "全选"}
        </span>
      </label>

      {selectedIds.length > 0 && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {actions.map((action) => {
            const isLoading = loadingAction === action.key;
            return (
              <button
                key={action.key}
                onClick={() => void handleAction(action)}
                disabled={isLoading || loadingAction !== null}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-105 active:scale-95 cursor-pointer",
                )}
                style={{
                  background: action.danger
                    ? "color-mix(in srgb, var(--destructive) 12%, transparent)"
                    : "color-mix(in srgb, var(--foreground) 6%, transparent)",
                  color: action.danger ? "var(--destructive)" : "var(--foreground)",
                }}
              >
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : action.icon}
                {isLoading ? "处理中..." : action.label}
              </button>
            );
          })}
          <button
            onClick={() => onSelectionChange([])}
            className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
