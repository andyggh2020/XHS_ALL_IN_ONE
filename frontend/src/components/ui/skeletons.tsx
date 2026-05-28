import { Skeleton } from "antd";

/** 卡片骨架 — 标题 + 多行内容 */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: 24, borderRadius: 12, border: "1px solid #f0f0f0" }}>
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}

/** 统计卡片骨架 — 图标 + 数字 + 标签 */
export function StatCardSkeleton() {
  return (
    <div style={{ padding: 24, borderRadius: 12, border: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: 12 }}>
      <Skeleton.Avatar active shape="square" size="large" />
      <Skeleton.Input active block size="small" />
      <Skeleton.Input active block size="small" style={{ width: "60%" }} />
    </div>
  );
}

/** 列表骨架 — 多行头像+文字 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <Skeleton.Avatar active shape="circle" size="large" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton.Input active block size="small" />
            <Skeleton.Input active block size="small" style={{ width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 表格骨架 — 表头 + 多行 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0" }}>
      {/* 表头 */}
      <div style={{ display: "flex", gap: 16, padding: "12px 16px", background: "#fafafa" }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} style={{ flex: 1 }}><Skeleton.Input active size="small" /></div>
        ))}
      </div>
      {/* 行 */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 16, padding: "14px 16px", borderTop: "1px solid #f0f0f0" }}>
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} style={{ flex: 1 }}><Skeleton.Input active size="small" /></div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** 仪表盘骨架 — 统计行 + 图表区 */
export function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: 24, borderRadius: 12, border: "1px solid #f0f0f0" }}>
            <Skeleton.Input active block size="small" style={{ marginBottom: 12 }} />
            <Skeleton.Input active block size="large" style={{ width: "50%", height: 32 }} />
          </div>
        ))}
      </div>
      <div style={{ padding: 24, borderRadius: 12, border: "1px solid #f0f0f0", height: 300 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    </div>
  );
}
