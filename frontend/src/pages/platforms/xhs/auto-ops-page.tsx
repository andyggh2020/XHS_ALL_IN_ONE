import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Spinner } from "../../../components/ui/skeletons";
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "../../../components/ui/dialog";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import {
  createAutoTask,
  deleteAutoTask,
  fetchAccounts,
  fetchAutoTasks,
  runAutoTask,
  updateAutoTask,
} from "../../../lib/api";
import { formatShanghaiTime } from "../../../lib/time";
import type { AutoTask, AutoTaskRunResult, PlatformAccount } from "../../../types";

const STATUS_CONFIG: Record<string, { variant: "success" | "default" | "secondary"; label: string }> = {
  active: { variant: "success", label: "运行中" },
  paused: { variant: "default", label: "已暂停" },
  completed: { variant: "secondary", label: "已完成" },
};

function getStatusBadge(s: string) {
  const cfg = STATUS_CONFIG[s] ?? { variant: "default" as const, label: s };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function usePanelStyle(c: ReturnType<typeof useThemeColors>): React.CSSProperties {
  return {
    background: c.cardBg2,
    borderRadius: 8,
    border: `1px solid ${c.cardBorder}`,
  };
}

const cardBodyStyle: React.CSSProperties = {
  padding: 16,
};

const scheduleOptions = [
  { value: "manual", label: "手动触发" },
  { value: "daily", label: "每日定时" },
  { value: "weekly", label: "每周定时" },
  { value: "interval", label: "自定义间隔" },
];

const dayOptions = [
  { label: "周一", value: "1" },
  { label: "周二", value: "2" },
  { label: "周三", value: "3" },
  { label: "周四", value: "4" },
  { label: "周五", value: "5" },
  { label: "周六", value: "6" },
  { label: "周日", value: "7" },
];

export function AutoOpsPage() {
  const c = useThemeColors();
  const panelStyle = usePanelStyle(c);
  const [tasks, setTasks] = useState<AutoTask[]>([]);
  const [pcAccounts, setPcAccounts] = useState<PlatformAccount[]>([]);
  const [creatorAccounts, setCreatorAccounts] = useState<PlatformAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createKeywords, setCreateKeywords] = useState("");
  const [createPcAccountId, setCreatePcAccountId] = useState<number | null>(null);
  const [createCreatorAccountId, setCreateCreatorAccountId] = useState<number | null>(null);
  const [createInstruction, setCreateInstruction] = useState("");
  const [createScheduleType, setCreateScheduleType] = useState<string>("manual");
  const [createScheduleTime, setCreateScheduleTime] = useState<string>("09:00");
  const [createScheduleDays, setCreateScheduleDays] = useState<string>("");
  const [createIntervalHours, setCreateIntervalHours] = useState<number>(24);
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal state
  const [editTask, setEditTask] = useState<AutoTask | null>(null);
  const [editName, setEditName] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editScheduleType, setEditScheduleType] = useState("manual");
  const [editScheduleTime, setEditScheduleTime] = useState("09:00");
  const [editScheduleDays, setEditScheduleDays] = useState("");
  const [editIntervalHours, setEditIntervalHours] = useState(24);
  const [isSaving, setIsSaving] = useState(false);

  // Run state
  const [runningTaskId, setRunningTaskId] = useState<number | null>(null);
  const [lastRunResult, setLastRunResult] = useState<AutoTaskRunResult | null>(null);

  function parseKeywords(text: string): string[] {
    return text
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [tasksRes, accountsRes] = await Promise.all([
        fetchAutoTasks(),
        fetchAccounts("xhs"),
      ]);
      setTasks(tasksRes.items);
      setPcAccounts(accountsRes.filter((a) => a.sub_type === "pc"));
      setCreatorAccounts(accountsRes.filter((a) => a.sub_type === "creator"));
    } catch {
      setError("加载自动运营任务失败。");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreate() {
    const keywords = parseKeywords(createKeywords);
    if (!createName.trim() || keywords.length === 0 || !createPcAccountId || !createCreatorAccountId) {
      setError("请填写任务名称、至少一个关键词，并选择 PC 和 Creator 账号。");
      return;
    }
    setIsCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createAutoTask({
        name: createName.trim(),
        keywords,
        pc_account_id: createPcAccountId,
        creator_account_id: createCreatorAccountId,
        ai_instruction: createInstruction,
        schedule_type: createScheduleType as "manual" | "daily" | "weekly" | "interval",
        schedule_time: createScheduleTime,
        schedule_days: createScheduleDays,
        schedule_interval_hours: createIntervalHours,
      });
      setTasks((prev) => [created, ...prev]);
      setShowCreate(false);
      setCreateName("");
      setCreateKeywords("");
      setCreatePcAccountId(null);
      setCreateCreatorAccountId(null);
      setCreateInstruction("");
      setCreateScheduleType("manual");
      setCreateScheduleTime("09:00");
      setCreateScheduleDays("");
      setCreateIntervalHours(24);
      setMessage(`自动任务"${created.name}"已创建。`);
    } catch {
      setError("创建自动任务失败。");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleStatus(task: AutoTask) {
    const newStatus = task.status === "active" ? "paused" : "active";
    setError(null);
    setMessage(null);
    try {
      const updated = await updateAutoTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setMessage(`任务"${updated.name}"已${newStatus === "active" ? "恢复" : "暂停"}。`);
    } catch {
      setError("更新任务状态失败。");
    }
  }

  async function handleDelete(taskId: number) {
    const confirmed = window.confirm("确认删除此自动任务？");
    if (!confirmed) return;
    setError(null);
    setMessage(null);
    try {
      await deleteAutoTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setMessage("自动任务已删除。");
    } catch {
      setError("删除自动任务失败。");
    }
  }

  async function handleRun(task: AutoTask) {
    setRunningTaskId(task.id);
    setError(null);
    setMessage(null);
    setLastRunResult(null);
    try {
      const result = await runAutoTask(task.id);
      setLastRunResult(result);
      setTasks((prev) => prev.map((t) => (t.id === result.auto_task.id ? result.auto_task : t)));
      setMessage(
        `任务"${task.name}"执行完成 -- 关键词: ${result.keyword}, 来源笔记: ${result.source_note.title}, 已创建发布任务 #${result.publish_job.id}。`
      );
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(`执行失败：${detail || "请检查账号和模型配置。"}`);
    } finally {
      setRunningTaskId(null);
    }
  }

  function openEdit(task: AutoTask) {
    setEditTask(task);
    setEditName(task.name);
    setEditKeywords((task.keywords || []).join("\n"));
    setEditInstruction(task.ai_instruction);
    setEditScheduleType(task.schedule_type || "manual");
    setEditScheduleTime(task.schedule_time || "09:00");
    setEditScheduleDays(task.schedule_days || "");
    setEditIntervalHours(task.schedule_interval_hours || 24);
  }

  async function handleSaveEdit() {
    if (!editTask) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const keywords = parseKeywords(editKeywords);
      const updated = await updateAutoTask(editTask.id, {
        name: editName.trim() || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        ai_instruction: editInstruction,
        schedule_type: editScheduleType as "manual" | "daily" | "weekly" | "interval",
        schedule_time: editScheduleTime,
        schedule_days: editScheduleDays,
        schedule_interval_hours: editIntervalHours,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditTask(null);
      setMessage(`任务"${updated.name}"已更新。`);
    } catch {
      setError("更新任务失败。");
    } finally {
      setIsSaving(false);
    }
  }

  function scheduleDesc(task: AutoTask): string {
    if (task.schedule_type === "daily") return `每日 ${task.schedule_time}`;
    if (task.schedule_type === "weekly") {
      const dayMap: Record<string, string> = { "1": "一", "2": "二", "3": "三", "4": "四", "5": "五", "6": "六", "7": "日" };
      const days = (task.schedule_days || "").split(",").map((d) => dayMap[d] || d).join("、");
      return `每周${days} ${task.schedule_time}`;
    }
    if (task.schedule_type === "interval") return `每 ${task.schedule_interval_hours} 小时`;
    return "手动触发";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header area with gradient */}
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-4 mb-4 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">自动运营</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">设置关键词、自动抓取热门笔记、AI 改写后自动创建发布任务，实现全自动内容生产管线。</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              新建任务
            </Button>
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              刷新
            </Button>
            <HeaderControls />
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #fca5a5",
            background: "rgba(239,68,68,0.08)",
            color: "#ef4444",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 0 }}>
            &times;
          </button>
        </div>
      )}
      {message && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #86efac",
            background: "rgba(34,197,94,0.08)",
            color: "#22c55e",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{message}</span>
          <button onClick={() => setMessage(null)} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: 16, padding: 0 }}>
            &times;
          </button>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <Card style={panelStyle}>
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spinner size="lg" />
            <p style={{ color: c.textMuted, marginTop: 16, fontSize: 14 }}>正在加载自动运营任务...</p>
          </div>
        </Card>
      ) : tasks.length === 0 && !showCreate ? (
        <Card style={panelStyle}>
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Zap className="h-12 w-12" style={{ color: c.textMuted, margin: "0 auto 16px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: c.textPrimary }}>
              暂无自动运营任务
            </p>
            <p style={{ color: c.textMuted, fontSize: 13, margin: 0 }}>
              点击"新建任务"开始配置关键词自动抓取、AI 改写和发布管线。
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} style={panelStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${c.cardBorder}`,
                }}
              >
                <div className="flex items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                  <Zap
                    className="h-4 w-4 shrink-0"
                    style={{ color: task.status === "active" ? "#52c41a" : c.textMuted }}
                  />
                  <span
                    style={{
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 14,
                      fontWeight: 600,
                      color: c.textPrimary,
                    }}
                  >
                    {task.name}
                  </span>
                </div>
                {getStatusBadge(task.status)}
              </div>
              <div style={{ padding: 16 }}>
                {/* Keywords */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 4 }}>关键词</p>
                  <div className="flex flex-wrap gap-1">
                    {(task.keywords || []).map((kw) => (
                      <Badge key={kw} variant="default">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4" style={{ marginBottom: 12 }}>
                  <div>
                    <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>已发布</p>
                    <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: c.textPrimary }}>
                      {task.total_published}
                    </p>
                  </div>
                </div>

                {/* Time info */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: "2px 0" }}>
                    <Clock className="h-3 w-3 inline mr-1" />
                    上次运行：{formatShanghaiTime(task.last_run_at)}
                  </p>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: "2px 0" }}>
                    <Clock className="h-3 w-3 inline mr-1" />
                    下次运行：{formatShanghaiTime(task.next_run_at)}
                  </p>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: "2px 0" }}>
                    创建时间：{formatShanghaiTime(task.created_at)}
                  </p>
                </div>

                {/* AI instruction preview */}
                {task.ai_instruction && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>AI 指令</p>
                    <p
                      style={{
                        fontSize: 12,
                        margin: 0,
                        color: c.textMuted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {task.ai_instruction}
                    </p>
                  </div>
                )}

                {/* Schedule info */}
                <p style={{ fontSize: 12, color: c.textMuted, margin: "4px 0 0" }}>
                  调度：{scheduleDesc(task)}
                </p>
                {task.next_run_at && (
                  <p style={{ fontSize: 11, color: c.textMuted, margin: 0 }}>
                    下次执行：{formatShanghaiTime(task.next_run_at)}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
                  <Button
                    size="sm"
                    onClick={() => handleRun(task)}
                    disabled={runningTaskId !== null && runningTaskId !== task.id}
                  >
                    {runningTaskId === task.id ? (
                      <Spinner size="sm" className="mr-1" />
                    ) : (
                      <PlayCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    立即执行
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(task)}
                  >
                    {task.status === "active" ? (
                      <PauseCircle className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <PlayCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    {task.status === "active" ? "暂停" : "恢复"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(task)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Last Run Result */}
      {lastRunResult && (
        <Card style={panelStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: `1px solid ${c.cardBorder}`,
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" style={{ color: "#52c41a" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>最近一次执行结果</span>
          </div>
          <div style={{ padding: 16 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 12 }}>
              <div>
                <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>关键词</p>
                <p style={{ color: c.textPrimary, fontSize: 14, margin: 0 }}>{lastRunResult.keyword}</p>
              </div>
              <div>
                <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>来源笔记</p>
                <p style={{ color: c.textPrimary, fontSize: 14, margin: 0 }}>{lastRunResult.source_note.title}</p>
              </div>
              <div>
                <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>互动量</p>
                <p style={{ color: c.textPrimary, fontSize: 14, margin: 0 }}>
                  {lastRunResult.source_note.likes + lastRunResult.source_note.collects + lastRunResult.source_note.comments}
                </p>
              </div>
              <div>
                <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>发布任务</p>
                <p style={{ color: c.textPrimary, fontSize: 14, margin: 0 }}>#{lastRunResult.publish_job.id}</p>
              </div>
            </div>
            <div>
              <p style={{ color: c.textMuted, fontSize: 12, margin: "0 0 4px" }}>
                改写后标题：{lastRunResult.draft.title}
              </p>
              <p
                style={{
                  color: c.textMuted,
                  fontSize: 12,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {lastRunResult.draft.body}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card style={panelStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: `1px solid ${c.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span style={{ fontSize: 14, fontWeight: 600, color: c.textPrimary }}>新建自动运营任务</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              取消
            </Button>
          </div>
          <div style={{ padding: 16 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  任务名称 <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <Input
                  placeholder="如：低卡早餐自动发布"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  maxLength={128}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  关键词（每行一个） <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  placeholder={"低卡早餐\n减脂食谱\n健康饮食"}
                  value={createKeywords}
                  onChange={(e) => setCreateKeywords(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: `1px solid ${c.cardBorder}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    background: c.cardBg2,
                    color: c.textPrimary,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  PC 账号（用于抓取） <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={createPcAccountId ?? ""}
                  onChange={(e) => setCreatePcAccountId(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 8,
                    border: `1px solid ${c.cardBorder}`,
                    padding: "0 12px",
                    fontSize: 13,
                    background: c.cardBg2,
                    color: c.textPrimary,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" disabled>选择 PC 账号</option>
                  {pcAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nickname || "PC"} (#{a.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  Creator 账号（用于发布） <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={createCreatorAccountId ?? ""}
                  onChange={(e) => setCreateCreatorAccountId(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    width: "100%",
                    height: 40,
                    borderRadius: 8,
                    border: `1px solid ${c.cardBorder}`,
                    padding: "0 12px",
                    fontSize: 13,
                    background: c.cardBg2,
                    color: c.textPrimary,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="" disabled>选择 Creator 账号</option>
                  {creatorAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nickname || "Creator"} (#{a.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                AI 改写指令（可选）
              </label>
              <textarea
                placeholder="如：改写为种草风格，加入个人体验感受，适合 25-35 岁女性阅读"
                value={createInstruction}
                onChange={(e) => setCreateInstruction(e.target.value)}
                rows={3}
                maxLength={2000}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: `1px solid ${c.cardBorder}`,
                  padding: "8px 12px",
                  fontSize: 13,
                  background: c.cardBg2,
                  color: c.textPrimary,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                调度方式
              </label>
              <select
                value={createScheduleType}
                onChange={(e) => setCreateScheduleType(e.target.value)}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: `1px solid ${c.cardBorder}`,
                  padding: "0 12px",
                  fontSize: 13,
                  background: c.cardBg2,
                  color: c.textPrimary,
                  boxSizing: "border-box",
                }}
              >
                {scheduleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {(createScheduleType === "daily" || createScheduleType === "weekly") && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  执行时间
                </label>
                <Input
                  value={createScheduleTime}
                  onChange={(e) => setCreateScheduleTime(e.target.value)}
                  placeholder="HH:MM"
                  style={{ width: 120 }}
                />
              </div>
            )}

            {createScheduleType === "weekly" && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  执行日期
                </label>
                <div className="flex flex-wrap gap-3">
                  {dayOptions.map((day) => {
                    const selected = createScheduleDays.split(",").filter(Boolean).includes(day.value);
                    return (
                      <label key={day.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: c.textPrimary, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const current = createScheduleDays.split(",").filter(Boolean);
                            const next = selected
                              ? current.filter((d) => d !== day.value)
                              : [...current, day.value];
                            setCreateScheduleDays(next.join(","));
                          }}
                          style={{ accentColor: "#1668dc" }}
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {createScheduleType === "interval" && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                  间隔小时
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={createIntervalHours}
                  onChange={(e) => setCreateIntervalHours(Number(e.target.value) || 24)}
                  style={{
                    height: 40,
                    width: 120,
                    borderRadius: 8,
                    border: `1px solid ${c.cardBorder}`,
                    padding: "0 12px",
                    fontSize: 13,
                    background: c.cardBg2,
                    color: c.textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? <Spinner size="sm" className="mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                创建任务
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!showCreate && (
        <Button onClick={() => setShowCreate(true)} className="w-full" style={{ marginTop: 16 }}>
          <Plus className="h-4 w-4 mr-1.5" />
          新建自动运营任务
        </Button>
      )}

      {/* Edit Modal */}
      <Dialog open={editTask !== null} onClose={() => setEditTask(null)}>
        <DialogHeader onClose={() => setEditTask(null)}>
          <DialogTitle>编辑自动运营任务</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
              任务名称
            </label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={128} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
              关键词（每行一个）
            </label>
            <textarea
              value={editKeywords}
              onChange={(e) => setEditKeywords(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${c.cardBorder}`,
                padding: "8px 12px",
                fontSize: 13,
                background: c.cardBg2,
                color: c.textPrimary,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
              AI 改写指令
            </label>
            <textarea
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              rows={3}
              maxLength={2000}
              style={{
                width: "100%",
                borderRadius: 8,
                border: `1px solid ${c.cardBorder}`,
                padding: "8px 12px",
                fontSize: 13,
                background: c.cardBg2,
                color: c.textPrimary,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
              调度方式
            </label>
            <select
              value={editScheduleType}
              onChange={(e) => setEditScheduleType(e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: `1px solid ${c.cardBorder}`,
                padding: "0 12px",
                fontSize: 13,
                background: c.cardBg2,
                color: c.textPrimary,
                boxSizing: "border-box",
              }}
            >
              {scheduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(editScheduleType === "daily" || editScheduleType === "weekly") && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                执行时间
              </label>
              <Input
                value={editScheduleTime}
                onChange={(e) => setEditScheduleTime(e.target.value)}
                placeholder="HH:MM"
                style={{ width: 120 }}
              />
            </div>
          )}

          {editScheduleType === "weekly" && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                执行日期
              </label>
              <div className="flex flex-wrap gap-3">
                {dayOptions.map((day) => {
                  const selected = editScheduleDays.split(",").filter(Boolean).includes(day.value);
                  return (
                    <label key={day.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: c.textPrimary, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const current = editScheduleDays.split(",").filter(Boolean);
                          const next = selected
                            ? current.filter((d) => d !== day.value)
                            : [...current, day.value];
                          setEditScheduleDays(next.join(","));
                        }}
                        style={{ accentColor: "#1668dc" }}
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {editScheduleType === "interval" && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: c.textSecondary, fontWeight: 500 }}>
                间隔小时
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={editIntervalHours}
                onChange={(e) => setEditIntervalHours(Number(e.target.value) || 24)}
                style={{
                  height: 40,
                  width: 120,
                  borderRadius: 8,
                  border: `1px solid ${c.cardBorder}`,
                  padding: "0 12px",
                  fontSize: 13,
                  background: c.cardBg2,
                  color: c.textPrimary,
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditTask(null)}>
            取消
          </Button>
          <Button onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving && <Spinner size="sm" className="mr-1.5" />}
            保存
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
