import { useThemeColors } from "../../hooks/use-theme-colors";

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
  const allSelected = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length;

  if (allIds.length === 0) return null;

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
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => action.onClick(selectedIds)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
              style={{
                background: action.danger
                  ? "color-mix(in srgb, var(--destructive) 12%, transparent)"
                  : "color-mix(in srgb, var(--foreground) 6%, transparent)",
                color: action.danger ? "var(--destructive)" : "var(--foreground)",
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
