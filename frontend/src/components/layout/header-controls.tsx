import { Bell, Moon, Search, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AppNotification } from "../../types";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/api";
import { useThemeMode } from "../../app/providers";
import { useSearch } from "./search-context";
import { cn } from "../../lib/utils";

export function HeaderControls() {
  const { mode, toggle: toggleTheme } = useThemeMode();
  const { openSearch } = useSearch();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications({ page_size: 20 });
      setNotifications(res.items);
      setUnreadCount(res.items.filter((n: AppNotification) => !n.read).length);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = setInterval(() => void loadNotifications(), 30_000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    void loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    void loadNotifications();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <button
        onClick={openSearch}
        className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm text-muted-foreground border border-input bg-background/50 hover:border-primary/30 hover:text-foreground transition-all shadow-sm"
      >
        <Search size={16} />
        <span>搜索</span>
        <kbd className="px-1.5 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-mono leading-none">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-10 h-10 rounded-xl border border-input bg-background/50 hover:border-primary/30 hover:bg-accent transition-all hover:scale-105 active:scale-95"
        title={mode === "dark" ? "浅色模式" : "暗色模式"}
      >
        {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-input bg-background/50 hover:border-primary/30 hover:bg-accent transition-all hover:scale-105 active:scale-95 relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--destructive)] text-[10px] font-bold flex items-center justify-center shadow-sm text-white"
              style={{ animation: "scaleIn 0.2s ease-out" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div onClick={(e) => e.stopPropagation()} className="absolute top-full right-0 mt-2 z-50">
              <div
                className="w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-[color-mix(in_srgb,var(--card)_95%,transparent)] backdrop-blur-2xl shadow-2xl overflow-hidden"
                style={{ animation: "slideDown 0.15s ease-out" }}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <span className="text-sm font-semibold">通知</span>
                  {unreadCount > 0 && (
                    <button onClick={() => void handleMarkAllRead()} className="text-xs text-primary hover:underline">
                      全部已读
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">暂无通知</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && void handleMarkRead(n.id)}
                        className={cn(
                          "flex gap-3 px-5 py-3.5 cursor-pointer border-b border-border/50 transition-colors last:border-0",
                          "hover:bg-accent/50",
                          n.read ? "" : "bg-[var(--primary)]/[0.03]",
                        )}
                      >
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 mt-1" style={{ background: n.level === "error" ? "var(--destructive)" : n.level === "warning" ? "var(--warning)" : "var(--muted-foreground)", opacity: 0.8 }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("zh-CN")}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
