import { Shield, AlertTriangle, Bot, Clock, Lock, FileText, Server, Globe, ChevronRight, Shield as ShieldIcon, Timer, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeaderControls } from "../../components/layout/header-controls";

export function SettingsPage() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <ShieldIcon size={18} />,
      title: "账号矩阵",
      color: "#3b82f6",
      description: "管理 PC 与 Creator 账号、Cookie 状态、健康检查和账号作用域。",
      onClick: () => navigate("/platforms/xhs/accounts"),
      highlights: [
        { icon: <Users size={14} />, text: "多账号管理" },
        { icon: <Lock size={14} />, text: "Cookie 加密" },
        { icon: <ShieldIcon size={14} />, text: "健康检查" },
      ],
    },
    {
      icon: <Bot size={18} />,
      title: "模型配置",
      color: "#8b5cf6",
      description: "管理 AI 模型接入配置，支持 OpenAI 兼容、Anthropic、Gemini 等多个提供商。",
      onClick: () => navigate("/models"),
      highlights: [
        { icon: <Server size={14} />, text: "多提供商支持" },
        { icon: <Lock size={14} />, text: "Key 加密存储" },
        { icon: <Bot size={14} />, text: "默认模型设置" },
      ],
    },
    {
      icon: <Timer size={18} />,
      title: "任务中心",
      color: "#f59e0b",
      description: "查看系统后台任务执行状态、调度历史和日志详情。",
      onClick: () => navigate("/tasks"),
      highlights: [
        { icon: <Clock size={14} />, text: "调度历史" },
        { icon: <FileText size={14} />, text: "执行日志" },
        { icon: <Server size={14} />, text: "任务状态" },
      ],
    },
    {
      icon: <AlertTriangle size={18} />,
      title: "项目声明",
      color: "var(--warning)",
      alert: "Spider_XHS 为开源学习项目，仅供技术研究和个人学习使用",
      rules: [
        { text: "禁止任何形式的商业化使用", strong: true },
        { text: "禁止用于任何违法违规活动", strong: true },
        { text: "使用者需自行承担因使用本项目产生的一切法律责任" },
        { text: "请遵守小红书平台的用户协议和相关法律法规" },
      ],
    },
  ];

  return (
    <div>
      {/* Gradient header area */}
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">设置</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">用户空间、安全、模型配置和系统参数会集中在这里。</p>
          </div>
          <div className="flex items-center gap-2">
            <HeaderControls />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sections.map((section) => (
          <div
            key={section.title}
            className="feigua-card cursor-pointer"
            onClick={() => "onClick" in section && section.onClick ? section.onClick() : undefined}
          >
            <div className="p-6">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${section.color} 12%, transparent)`, color: section.color }}
                >
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                </div>
                {"onClick" in section && section.onClick && (
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                )}
              </div>

              {/* Alert */}
              {"alert" in section && section.alert && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border bg-[var(--warning)]/8 border-[var(--warning)]/20 text-sm mb-4">
                  <span className="text-[var(--warning)] shrink-0 mt-0.5">⚠</span>
                  <span className="text-muted-foreground leading-relaxed">{section.alert}</span>
                </div>
              )}

              {/* Highlights */}
              {"highlights" in section && section.highlights && (
                <div className="flex flex-wrap gap-2">
                  {section.highlights.map((h) => (
                    <span key={h.text} className="tag">
                      {h.icon}
                      {h.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Rules List */}
              {"rules" in section && section.rules && (
                <div className="space-y-3">
                  {section.rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--destructive)]/10 text-[var(--destructive)] text-[11px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">
                        {rule.strong ? <strong>{rule.text}</strong> : rule.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <Globe size={12} /> v2.0.0
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="flex items-center gap-1.5">
            <FileText size={12} /> MIT License
          </span>
        </div>
      </div>
    </div>
  );
}
