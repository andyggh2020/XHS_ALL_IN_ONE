import { Button, Empty, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

type Action = {
  label: string;
  onClick: () => void;
  type?: "primary" | "default";
  icon?: ReactNode;
};

type GuideEmptyProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: Action[];
  tips?: string[];
};

/** 带操作引导的空状态组件 */
export function GuideEmpty({ icon, title, description, actions, tips }: GuideEmptyProps) {
  return (
    <Empty
      image={icon ? <div style={{ fontSize: 48, opacity: 0.4 }}>{icon}</div> : Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <Title level={4} style={{ margin: "16px 0 8px", fontWeight: 600 }}>
            {title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 20, lineHeight: 1.6 }}>
            {description}
          </Text>
          {actions && actions.length > 0 && (
            <Space size={12} wrap style={{ justifyContent: "center" }}>
              {actions.map((action, i) => (
                <Button key={i} type={action.type || "primary"} icon={action.icon} onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}
            </Space>
          )}
          {tips && tips.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "left", background: "rgba(22,104,220,0.04)", borderRadius: 8, padding: "12px 16px" }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
                快速上手
              </Text>
              {tips.map((tip, i) => (
                <Text key={i} type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4, lineHeight: 1.6 }}>
                  {i + 1}. {tip}
                </Text>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}

// ===== 预定义空状态 =====

export function AccountsEmpty() {
  const navigate = useNavigate();
  return (
    <GuideEmpty
      icon="🔗"
      title="还没有绑定账号"
      description="添加小红书 PC 端或创作者平台的 Cookie 账号，开始运营管理。"
      actions={[{ label: "添加账号", onClick: () => {} /* open drawer */ }]}
      tips={["点击「添加账号」按钮", "选择 PC 或 Creator 账号类型", "用扫码或 Cookie 导入绑定"]}
    />
  );
}

export function DiscoveryEmpty() {
  return (
    <GuideEmpty
      icon="🔍"
      title="搜索你感兴趣的内容"
      description="输入关键词，从海量小红书笔记中发现优质内容。"
      tips={["在上方搜索框输入关键词", "支持按排序、类型、时间筛选", "采集后存入内容库供 AI 改写"]}
    />
  );
}

export function KeywordGroupsEmpty() {
  return (
    <GuideEmpty
      icon="📋"
      title="还没有关键词组"
      description="创建关键词组，用于批量搜索采集和自动运营任务。"
      tips={["点击「新建关键词组」", "添加多个关键词", "在自动运营任务中引用关键词组"]}
    />
  );
}

export function DraftsEmpty() {
  return (
    <GuideEmpty
      icon="✍️"
      title="还没有草稿"
      description="从内容库中选取笔记，通过 AI 改写生成新草稿后发布。"
      tips={["在笔记发现中搜索内容", "采集到内容库中", "从内容库选择笔记进行 AI 改写"]}
    />
  );
}

export function LibraryEmpty() {
  return (
    <GuideEmpty
      icon="📚"
      title="内容库还是空的"
      description="从发现页采集笔记后，内容会自动存入这里。"
      tips={["前往「笔记发现」搜索内容", "点击采集按钮保存到内容库", "内容库中的笔记可用于 AI 改写"]}
    />
  );
}

export function PublishEmpty() {
  return (
    <GuideEmpty
      icon="🚀"
      title="暂无发布任务"
      description="在草稿工坊中将草稿送入发布中心，或通过自动运营生成发布任务。"
      tips={["完成 AI 改写生成草稿", "在草稿工坊中推送到发布中心", "配置发布参数后点击发布"]}
    />
  );
}

export function AutoOpsEmpty() {
  return (
    <GuideEmpty
      icon="⚡"
      title="还没有自动运营任务"
      description="创建自动化任务，实现搜索→采集→改写→发布全自动运营。"
      tips={["点击「新建任务」配置任务", "选择关键词组和发布频率", "系统将自动执行全流程"]}
    />
  );
}

export function BenchmarksEmpty() {
  return (
    <GuideEmpty
      icon="🎯"
      title="还没有竞品监控"
      description="添加竞品账号，系统自动追踪数据变化。"
      tips={["添加竞品小红书账号", "系统自动采集笔记数据", "查看数据变化趋势和分析报告"]}
    />
  );
}

export function ImageStudioEmpty() {
  return (
    <GuideEmpty
      icon="🎨"
      title="图片工坊"
      description="AI 图片处理功能即将上线，敬请期待。"
    />
  );
}
