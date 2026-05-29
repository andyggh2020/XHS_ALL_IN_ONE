import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "./button";
import { cn } from "../../lib/utils";

type Action = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "gradient";
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
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--purple)]/10 flex items-center justify-center mb-6 ring-1 ring-[var(--primary)]/5 shadow-sm">
        {icon ? (
          <span className="text-3xl opacity-60">{icon}</span>
        ) : (
          <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">{description}</p>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, i) => (
            <Button key={i} variant={action.variant || "default"} onClick={action.onClick}>
              {action.icon && <span className="mr-1.5">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {tips && tips.length > 0 && (
        <div className="mt-8 text-left max-w-sm w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-title mb-0 text-[11px]">快速上手</span>
          </div>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
      actions={[{ label: "添加账号", onClick: () => navigate("/platforms/xhs/accounts") }]}
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
