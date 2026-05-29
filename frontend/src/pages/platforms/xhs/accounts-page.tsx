import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, User, RotateCw } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Spinner } from "../../../components/ui/skeletons";
import { AddAccountDrawer } from "../../../components/account/add-account-drawer";
import { checkAccount, deleteAccount, fetchAccounts } from "../../../lib/api";
import { formatShanghaiTime } from "../../../lib/time";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import { ErrorBanner } from "../../../components/ui/status-banners";
import { ListSkeleton } from "../../../components/ui/skeletons";
import { GuideEmpty } from "../../../components/ui/empty-states";
import type { PlatformAccount } from "../../../types";

function formatDate(value?: string): string {
  return formatShanghaiTime(value);
}

function profileValue(account: PlatformAccount, key: string): string | null {
  const value = account.profile?.[key];
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

const statusColorMap: Record<string, string> = { active: "green", healthy: "green", expired: "red", unknown: "default" };
const statusLabelMap: Record<string, string> = { active: "正常", healthy: "正常", expired: "过期", unknown: "未知" };

function StatusBadge({ status }: { status: string }) {
  const label = statusLabelMap[status] || status;
  const color = statusColorMap[status] || "default";
  const variantMap: Record<string, "success" | "destructive" | "default"> = {
    green: "success",
    red: "destructive",
    default: "default",
  };
  return <Badge variant={variantMap[color] || "default"}>{label}</Badge>;
}

export function XhsAccountsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingAccountIds, setCheckingAccountIds] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const c = useThemeColors();

  async function loadAccounts() {
    setIsLoading(true);
    setError(null);
    try {
      setAccounts(await fetchAccounts("xhs"));
    } catch {
      setError("账号列表加载失败。");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheck(accountId: number) {
    if (checkingAccountIds.has(accountId)) return;
    setError(null);
    setCheckingAccountIds((cur) => new Set(cur).add(accountId));
    try {
      const checked = await checkAccount(accountId);
      setAccounts((cur) => cur.map((a) => (a.id === checked.id ? checked : a)));
    } catch {
      setError("账号健康检查失败。");
    } finally {
      setCheckingAccountIds((cur) => { const n = new Set(cur); n.delete(accountId); return n; });
    }
  }

  async function handleDelete(account: PlatformAccount) {
    const confirmed = window.confirm(
      `删除账号「${account.nickname || account.external_user_id || account.id}」？`
    );
    if (!confirmed) return;
    setError(null);
    try {
      await deleteAccount(account.id);
      setAccounts((cur) => cur.filter((a) => a.id !== account.id));
    } catch {
      setError("账号删除失败。");
    }
  }

  useEffect(() => { void loadAccounts(); }, []);

  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* Gradient header area */}
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-6 mb-6 border-b border-border/50">
        <div style={{ marginBottom: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1.5">账号矩阵</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                管理 PC 与 Creator 账号、Cookie 状态、健康检查和账号作用域。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setDrawerOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                绑定账号
              </Button>
              <HeaderControls />
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: `1px solid ${c.cardBorder}`,
          }}
        >
          <span style={{ color: c.textPrimary, fontWeight: 600, fontSize: 14 }}>已绑定账号</span>
          <Button variant="outline" size="sm" onClick={loadAccounts} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
        <div style={{ padding: 24 }}>
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : accounts.length === 0 ? (
            <div style={{ padding: "32px 0" }}>
              <GuideEmpty
                icon="🔗"
                title="还没有绑定小红书账号"
                description="先绑定 PC 端账号用于搜索抓取，Creator 账号用于发布。"
                actions={[{ label: "添加账号", icon: <Plus className="h-4 w-4" />, onClick: () => setDrawerOpen(true) }]}
                tips={["PC 账号用于搜索和抓取笔记数据", "Creator 账号用于发布笔记到小红书", "支持 Cookie 导入和扫码登录"]}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => {
                const isChecking = checkingAccountIds.has(account.id);
                const isCreator = account.sub_type === "creator";
                const accentColor = isCreator ? "#8b5cf6" : "#6366f1";
                const statusColor = statusColorMap[account.status] || "default";

                return (
                  <div
                    key={account.id}
                    className="feigua-card"
                    style={{
                      borderLeft: `3px solid ${accentColor}`,
                    }}
                  >
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: c.isDark ? "#262626" : "#f0f0f0",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            color: c.textMuted,
                          }}
                        >
                          {account.avatar_url ? (
                            <img src={account.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: "block",
                              color: c.textPrimary,
                              fontSize: 15,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {account.nickname || "未命名账号"}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: c.textTertiary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {account.external_user_id || "external id pending"}
                          </span>
                        </div>
                        <StatusBadge status={account.status} />
                      </div>

                      {isCreator ? (
                        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 12 }}>
                          <div>
                            <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>类型</p>
                            <p style={{ color: c.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>Creator</p>
                          </div>
                          {profileValue(account, "red_id") && (
                            <div>
                              <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>小红书号</p>
                              <p style={{ color: c.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
                                {profileValue(account, "red_id") as string}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
                          <div>
                            <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>类型</p>
                            <p style={{ color: c.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>PC</p>
                          </div>
                          <div>
                            <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>粉丝</p>
                            <p style={{ color: c.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
                              {profileValue(account, "followers") || "-"}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>关注</p>
                            <p style={{ color: c.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
                              {profileValue(account, "following") || "-"}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: c.textSecondary, fontSize: 12, margin: 0, marginBottom: 2 }}>获赞</p>
                            <p style={{ color: c.textPrimary, fontSize: 14, fontWeight: 600, margin: 0 }}>
                              {profileValue(account, "likes") || "-"}
                            </p>
                          </div>
                        </div>
                      )}

                      {account.status_message && (
                        <span style={{ display: "block", fontSize: 12, marginBottom: 12, color: c.textTertiary }}>
                          {account.status_message}
                        </span>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 12,
                          borderTop: `1px solid ${c.cardBorder2}`,
                        }}
                      >
                        <span style={{ fontSize: 11, color: c.textMuted }}>
                          更新时间：{formatDate(account.updated_at || account.created_at)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheck(account.id)}
                            disabled={isChecking}
                          >
                            {isChecking ? (
                              <RotateCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            )}
                            {isChecking ? "检查中" : "检查"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDelete(account)}
                            title="删除账号"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <AddAccountDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onBound={loadAccounts} />
    </div>
  );
}
