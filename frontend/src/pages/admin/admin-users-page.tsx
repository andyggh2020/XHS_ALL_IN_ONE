import { Crown, Edit3, RefreshCw, Search, User, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "../../components/layout/app-shell";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useToast } from "../../components/ui/toast";
import { fetchAdminUsers, fetchMembershipPlans, updateUserMembership } from "../../lib/api";
import type { AdminUserItem, MembershipLevel, MembershipPlan } from "../../types";

const levelConfig: Record<string, { color: string; label: string }> = {
  free: { color: "secondary", label: "免费版" },
  pro: { color: "default", label: "专业版" },
  enterprise: { color: "default", label: "企业版" },
};

const levelOptions = [
  { value: "free", label: "免费版 — 基础功能" },
  { value: "pro", label: "专业版 — ¥99/月" },
  { value: "enterprise", label: "企业版 — ¥299/月" },
];

export function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMembershipLevel, setEditMembershipLevel] = useState("free");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editExpiresInDays, setEditExpiresInDays] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers({ q: search || undefined, page, page_size: 20 });
      setUsers(res.items); setTotal(res.total);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { fetchMembershipPlans().then(setPlans).catch(() => {}); }, []);

  const handleEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditMembershipLevel(user.membership_level);
    setEditIsAdmin(user.is_admin);
    setEditExpiresInDays("");
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      await updateUserMembership(editingUser.id, {
        membership_level: editMembershipLevel as MembershipLevel,
        is_admin: editIsAdmin,
        expires_in_days: editExpiresInDays ? parseInt(editExpiresInDays) : undefined,
      });
      toast.success("修改成功");
      setEditOpen(false);
      void load();
    } catch { /* handled by interceptor */ }
    finally { setEditLoading(false); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="ADMIN"
        title="用户管理"
        description="管理平台用户、会员等级和权限"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="搜索用户名"
                className="w-[200px] h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw size={14} className="mr-1" />刷新
            </Button>
          </div>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-medium text-muted-foreground">用户</th>
                <th className="p-4 font-medium text-muted-foreground">会员等级</th>
                <th className="p-4 font-medium text-muted-foreground">到期时间</th>
                <th className="p-4 font-medium text-muted-foreground">注册时间</th>
                <th className="p-4 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const cfg = levelConfig[user.membership_level] || { color: "secondary", label: user.membership_level };
                return (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-7 h-7 text-[10px]" fallback={user.username[0]?.toUpperCase() || "U"} />
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{user.username}</span>
                          {user.is_admin && <ShieldCheck size={14} className="text-amber-500" />}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {user.membership_level !== "free" && <Crown size={14} className={user.membership_level === "enterprise" ? "text-purple-500" : "text-primary"} />}
                        <Badge variant={cfg.color as any}>{cfg.label}</Badge>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {user.membership_expires_at ? (() => {
                        const d = new Date(user.membership_expires_at);
                        const expired = d.getTime() < Date.now();
                        return <span className={expired ? "text-destructive" : ""}>{d.toLocaleDateString("zh-CN")}{expired && <Badge variant="destructive" className="ml-1.5">已过期</Badge>}</span>;
                      })() : <span className="text-muted-foreground">永久</span>}
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(user.created_at).toLocaleDateString("zh-CN")}</td>
                    <td className="p-4">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                        <Edit3 size={14} className="mr-0.5" />编辑
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">暂无用户数据</div>
          )}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">共 {total} 个用户</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
              <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogHeader onClose={() => setEditOpen(false)}>
          <DialogTitle>编辑会员信息</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {editingUser && (
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <Avatar className="w-8 h-8 text-xs" fallback={editingUser.username[0]?.toUpperCase() || "U"} />
              <div>
                <p className="font-medium">{editingUser.username}</p>
                <p className="text-xs text-muted-foreground">ID: {editingUser.id}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">会员等级</label>
              <select
                value={editMembershipLevel}
                onChange={(e) => setEditMembershipLevel(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {levelOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">管理员权限</label>
              <select
                value={editIsAdmin ? "true" : "false"}
                onChange={(e) => setEditIsAdmin(e.target.value === "true")}
                className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="false">普通用户</option>
                <option value="true">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">会员有效期（天）</label>
              <input
                type="number"
                value={editExpiresInDays}
                onChange={(e) => setEditExpiresInDays(e.target.value)}
                placeholder="如：30 / 365"
                min={1} max={3650}
                className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">留空则不修改到期时间。免费版自动设为永久。</p>
            </div>
          </div>

          {plans.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground mb-2">方案对比</p>
              {plans.map((plan) => (
                <div key={plan.level} className="flex items-center gap-2 mb-1">
                  <Badge variant={(levelConfig[plan.level]?.color || "secondary") as any}>{plan.name}</Badge>
                  <span className="text-xs text-muted-foreground">¥{plan.price_monthly}/月 · {plan.features.slice(0, 3).join("、")}</span>
                </div>
              ))}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
          <Button onClick={handleSave} disabled={editLoading}>{editLoading ? "保存中..." : "保存"}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
