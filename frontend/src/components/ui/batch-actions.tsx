import { Button, Checkbox, Space, Typography } from "antd";
import { useThemeColors } from "../../hooks/use-theme-colors";

const { Text } = Typography;

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
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 16px", marginBottom: 12,
      background: c.isDark ? "rgba(22,104,220,0.08)" : "rgba(22,104,220,0.04)",
      borderRadius: 8, border: `1px solid ${c.isDark ? "rgba(22,104,220,0.2)" : "rgba(22,104,220,0.1)"}`,
    }}>
      <Checkbox
        checked={allSelected}
        indeterminate={indeterminate}
        onChange={(e) => { onSelectionChange(e.target.checked ? [...allIds] : []); }}
      />
      <Text style={{ fontSize: 13, color: c.textSecondary, minWidth: 80 }}>
        {selectedIds.length > 0 ? `已选 ${selectedIds.length}` : "全选"}
      </Text>
      {selectedIds.length > 0 && (
        <Space size={8}>
          {actions.map((action) => (
            <Button
              key={action.key}
              size="small"
              danger={action.danger}
              icon={action.icon}
              onClick={() => action.onClick(selectedIds)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      )}
    </div>
  );
}
