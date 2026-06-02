import { CheckCircle2, ChevronDown, ChevronUp, FileEdit, Key, MonitorPlay, Search, Send, Settings, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../ui/button";

const steps = [
  {
    icon: <Settings size={20} />,
    title: "配置 AI 模型",
    desc: "接入 OpenAI 兼容 API（火山引擎、百炼等），开启 AI 改写 / 图片能力",
    action: "/models",
    actionLabel: "去配置",
    color: "var(--purple)",
  },
  {
    icon: <Key size={20} />,
    title: "绑定小红书账号",
    desc: "导入 PC 端账号（搜索）和 Creator 账号（发布），Cookie 加密存储",
    action: "/platforms/xhs/accounts",
    actionLabel: "去绑定",
    color: "var(--primary)",
  },
  {
    icon: <Search size={20} />,
    title: "发现内容",
    desc: "搜索关键词或粘贴 URL，把感兴趣的笔记一键入库",
    action: "/platforms/xhs/discovery",
    actionLabel: "去搜索",
    color: "var(--cyan)",
  },
  {
    icon: <FileEdit size={20} />,
    title: "AI 创作",
    desc: "从内容库创建草稿，AI 改写正文 / 润色标题 / 生成标签",
    action: "/platforms/xhs/drafts",
    actionLabel: "去创作",
    color: "var(--success)",
  },
  {
    icon: <Send size={20} />,
    title: "发布笔记",
    desc: "选择 Creator 账号，立即或定时发布到小红书",
    action: "/platforms/xhs/publish",
    actionLabel: "去发布",
    color: "var(--pink)",
  },
  {
    icon: <MonitorPlay size={20} />,
    title: "自动运营",
    desc: "设置关键词 + 频率，系统自动搜索 → AI 改写 → 发布，全无人值守",
    action: "/platforms/xhs/auto-ops",
    actionLabel: "去看看",
    color: "var(--orange)",
  },
];

export function OnboardingGuide() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Persist dismissed state
  useEffect(() => {
    if (!visible) {
      document.cookie = "xhs_onboarding_dismissed=1; path=/; max-age=86400";
    }
  }, [visible]);

  const allDone = false; // can expand logic later based on real data

  if (!visible) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-indigo-500/20 mb-8"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--surface)), color-mix(in srgb, var(--purple) 4%, var(--surface)))",
      }}
    >
      {/* Decorative dots */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'%236366f1\'/%3E%3C/svg%3E")' }} />

      {/* Header */}
      <div className="relative px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-indigo-500/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">🚀 新手指南</h3>
            <p className="text-xs text-muted-foreground truncate">完成以下步骤，开始运营你的小红书矩阵</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="w-7 h-7 p-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-7 h-7 p-0 hover:text-destructive"
            onClick={() => setVisible(false)}
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="relative p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-surface-card/80 p-4 transition-all hover:border-indigo-500/20 hover:shadow-md"
              >
                {/* Step number badge */}
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>

                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${step.color} 12%, transparent)`, color: step.color }}
                  >
                    {step.icon}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>

                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto self-start text-xs h-8"
                  onClick={() => navigate(step.action)}
                >
                  {step.actionLabel}
                </Button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-indigo-500/10 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              💡 完成后可点击右上角 ✕ 关闭此引导
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
