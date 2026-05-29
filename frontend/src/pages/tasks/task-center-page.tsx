import { ListTodo, Play, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "../../components/layout/app-shell";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../components/ui/toast";
import { fetchSchedulerStatus, fetchTasks, runDueTasks, cancelTask, retryTask } from "../../lib/api";
import type { SchedulerStatus, TaskItem } from "../../types";

export function TaskCenterPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const [taskData, schedulerData] = await Promise.all([fetchTasks(), fetchSchedulerStatus()]);
      setTasks(taskData.items);
      setScheduler(schedulerData);
    } catch {
      toast.error("加载任务数据失败");
    } finally {
      setLoadingTasks(false);
    }
  }, [toast]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await runDueTasks();
      toast.success("到期任务已提交调度器");
      void loadAll();
    } catch {
      toast.error("触发失败");
    } finally {
      setTriggering(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("确定要取消这个任务吗？")) return;
    try { await cancelTask(id); toast.success("任务已取消"); void loadAll(); } catch { toast.error("取消失败"); }
  };

  const handleRetry = async (id: number) => {
    try { await retryTask(id); toast.success("任务已重新调度"); void loadAll(); } catch { toast.error("重试失败"); }
  };

  const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary" | "default" | "purple"> = {
    completed: "success",
    running: "purple",
    pending: "warning",
    failed: "destructive",
    cancelled: "secondary",
    exhausted: "secondary",
  };

  const statusLabel: Record<string, string> = {
    completed: "完成",
    running: "运行中",
    pending: "待执行",
    failed: "失败",
    cancelled: "已取消",
    exhausted: "耗尽",
  };

  const renderProgress = (item: TaskItem) => {
    if (item.status === "completed") return 100;
    if (item.status === "failed" || item.status === "cancelled" || item.status === "exhausted") return item.progress ?? 0;
    return item.progress ?? 0;
  };

  return (
    <div>
      {/* Gradient header area */}
      <div className="bg-[var(--background-alt)]/30 -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <PageHeader
        eyebrow="系统"
        title="任务中心"
        description="统一的任务队列管理，支持调度、重试和取消操作。"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadAll()} disabled={loadingTasks}>
              <RefreshCw size={14} className="mr-1.5" />刷新
            </Button>
            <Button variant="gradient" onClick={handleTrigger} loading={triggering}>
              <Play size={14} className="mr-1.5" />执行到期任务
            </Button>
          </div>
        }
      />

      {/* Scheduler Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card-clean p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">调度器状态</p>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${scheduler?.running ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]"}`} />
            <span className="text-lg font-bold" style={{ color: "var(--success)" }}>{scheduler?.running ? "运行中" : "已停止"}</span>
          </div>
        </div>
        <div className="stat-card-clean p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">调度间隔</p>
          <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>{scheduler?.interval_seconds ?? "—"}<span className="text-sm font-normal text-muted-foreground ml-1">秒</span></span>
        </div>
        <div className="stat-card-clean p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">注册任务数</p>
          <span className="text-lg font-bold" style={{ color: "var(--purple)" }}>{scheduler?.registered_task_count ?? 0}</span>
        </div>
        <div className="stat-card-clean p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">最近执行记录</p>
          <span className="text-lg font-bold" style={{ color: "var(--cyan)" }}>{scheduler?.recent_executions_count ?? 0}</span>
        </div>
      </div>

      </div>{/* end gradient header */}

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingTasks ? (
            <div className="text-center py-12 text-sm text-muted-foreground">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ListTodo size={40} className="text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">暂无任务</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>状态</th>
                    <th>进度</th>
                    <th>创建时间</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="font-medium">{task.task_type}</td>
                      <td>
                        <Badge variant={statusVariant[task.status] || "secondary"} className="text-[11px] px-2.5">
                          {statusLabel[task.status] || task.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${renderProgress(task)}%`,
                                background: task.status === "failed" ? "var(--destructive)" : "var(--primary)",
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{renderProgress(task)}%</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground">{new Date(task.created_at).toLocaleString("zh-CN")}</td>
                      <td className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          {["pending", "running"].includes(task.status) && (
                            <Button size="sm" variant="ghost" onClick={() => handleCancel(task.id)}>
                              <XCircle size={14} className="mr-1" />取消
                            </Button>
                          )}
                          {["failed", "exhausted"].includes(task.status) && (
                            <Button size="sm" variant="ghost" onClick={() => handleRetry(task.id)}>
                              <RotateCcw size={14} className="mr-1" />重试
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
