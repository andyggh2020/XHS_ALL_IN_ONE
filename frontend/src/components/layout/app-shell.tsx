import { Bell, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { Avatar, Badge, Button, Drawer, Layout, List, Menu as AntMenu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  AimOutlined, BarChartOutlined, CloudDownloadOutlined,
  DashboardOutlined, DatabaseOutlined, FileTextOutlined, KeyOutlined,
  RobotOutlined, SafetyCertificateOutlined, ScheduleOutlined,
  SearchOutlined as SearchIcon, SendOutlined, SettingOutlined,
  StarOutlined, TeamOutlined, ThunderboltOutlined, UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import KeepAliveRouteOutlet from "keepalive-for-react-router";

import { SearchModal } from "../../components/ui/search-modal";
import { useAuth } from "../../hooks/use-auth";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useThemeMode } from "../../app/providers";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/api";
import type { AppNotification } from "../../types";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const mainNavItems: MenuProps["items"] = [
  { key: "/platforms/xhs/dashboard", icon: <DashboardOutlined />, label: "总览" },
  { key: "/platforms/xhs/accounts", icon: <SafetyCertificateOutlined />, label: "账号矩阵" },
  { key: "/platforms/xhs/discovery", icon: <SearchIcon />, label: "笔记发现" },
  { key: "/platforms/xhs/crawler", icon: <CloudDownloadOutlined />, label: "数据抓取" },
  { key: "/platforms/xhs/keywords", icon: <KeyOutlined />, label: "关键词组" },
  { key: "/platforms/xhs/analytics", icon: <BarChartOutlined />, label: "数据洞察" },
  { key: "/platforms/xhs/benchmarks", icon: <AimOutlined />, label: "竞品监控" },
  { key: "/platforms/xhs/image-studio", icon: <StarOutlined />, label: "图片工坊" },
  { key: "/platforms/xhs/video-studio", icon: <VideoCameraOutlined />, label: "视频工坊" },
  { key: "/platforms/xhs/library", icon: <DatabaseOutlined />, label: "内容库" },
  { key: "/platforms/xhs/drafts", icon: <FileTextOutlined />, label: "草稿工坊" },
  { key: "/platforms/xhs/publish", icon: <SendOutlined />, label: "发布中心" },
  { key: "/platforms/xhs/auto-ops", icon: <ThunderboltOutlined />, label: "自动运营" },
];

const footerNavItems: MenuProps["items"] = [
  { key: "/tasks", icon: <ScheduleOutlined />, label: "任务中心" },
  { key: "/models", icon: <RobotOutlined />, label: "模型配置" },
  { key: "/settings", icon: <SettingOutlined />, label: "设置" },
];

const adminNavItem: MenuProps["items"] = [
  { key: "/admin/users", icon: <TeamOutlined />, label: "用户管理" },
];

function levelColor(level: string): string {
  if (level === "error") return "#ef4444";
  if (level === "warning") return "#eab308";
  return "#666";
}

export function AppShell() {
  const auth = useAuth();
  const { mode: themeMode, toggle: toggleTheme } = useThemeMode();
  const isDark = themeMode === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications({ page_size: 20 });
      setNotifications(res.items);
      setUnreadCount(res.items.filter((n) => !n.read).length);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadNotifications(); const timer = setInterval(() => void loadNotifications(), 30_000); return () => clearInterval(timer); }, [loadNotifications]);

  const handleMarkRead = async (id: number) => { await markNotificationRead(id); void loadNotifications(); };
  const handleMarkAllRead = async () => { await markAllNotificationsRead(); void loadNotifications(); };
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => { navigate(key); if (isMobile) setMobileMenuOpen(false); };
  const selectedKeys = [location.pathname];

  const colors = {
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    iconMuted: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
  };

  const siderWidth = collapsed ? 64 : 240;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b shrink-0 cursor-pointer"
        style={{ borderColor: colors.border }}
        onClick={() => { navigate("/"); if (isMobile) setMobileMenuOpen(false); }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1668dc] to-[#7c3aed] flex items-center justify-center font-extrabold text-xs text-white shadow-lg shadow-[#1668dc]/30">
            X
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-semibold text-sm dark:text-white/85 text-black/85">小红书矩阵运营</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
        <AntMenu theme={isDark ? "dark" : "light"} mode="inline" selectedKeys={selectedKeys} onClick={handleMenuClick} items={mainNavItems} style={{ borderRight: 0, background: "transparent" }} />
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t" style={{ borderColor: colors.border }}>
        {auth.user?.is_admin && (
          <AntMenu theme={isDark ? "dark" : "light"} mode="inline" selectedKeys={selectedKeys} onClick={handleMenuClick} items={adminNavItem} style={{ borderRight: 0, background: "transparent" }} />
        )}
        <AntMenu theme={isDark ? "dark" : "light"} mode="inline" selectedKeys={selectedKeys} onClick={handleMenuClick} items={footerNavItems} style={{ borderRight: 0, background: "transparent" }} />
        <div className="flex items-center gap-2.5 px-4 py-3 border-t" style={{ borderColor: colors.border }}>
          <div className="relative">
            <Avatar size={26} icon={<UserOutlined />} style={{ background: "linear-gradient(135deg, #1668dc, #7c3aed)", border: "2px solid rgba(22,104,220,0.2)" }} />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2" style={{ borderColor: isDark ? "#08080f" : "#fff" }} />
          </div>
          {(!collapsed || isMobile) && (
            <>
              <span className="text-xs flex-1 truncate dark:text-white/65 text-black/65">{auth.user?.username ?? "用户"}</span>
              <button onClick={() => void auth.logout()} className="text-[#666] hover:text-red-400 transition-colors p-1" title="退出">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const notificationDropdownContent = (
    <div className="w-[360px] max-w-[calc(100vw-32px)] rounded-xl border shadow-xl overflow-hidden" style={{ background: isDark ? "#111118" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <span className="text-sm font-semibold dark:text-white/85 text-black/85">通知</span>
        {unreadCount > 0 && <button onClick={() => void handleMarkAllRead()} className="text-xs text-[#1668dc] hover:underline">全部已读</button>}
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs dark:text-white/35 text-black/35">暂无通知</div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(n) => (
              <List.Item key={n.id} style={{ padding: "10px 16px", cursor: n.read ? "default" : "pointer", background: n.read ? "transparent" : isDark ? "rgba(22,104,220,0.04)" : "rgba(22,104,220,0.03)", borderBottom: `1px solid ${colors.border}` }} onClick={() => !n.read && void handleMarkRead(n.id)}>
                <List.Item.Meta
                  avatar={<span className="inline-block w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: levelColor(n.level) }} />}
                  title={<span className="text-xs">{n.title}</span>}
                  description={<div>{n.body && <span className="text-xs text-muted-foreground block">{n.body}</span>}<span className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("zh-CN")}</span></div>}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {isMobile ? (
        <>
          <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} placement="left" width={260} styles={{ body: { padding: 0, background: isDark ? "#08080f" : "#fff" } }} closeIcon={null}>
            {sidebarContent}
          </Drawer>
          <Layout style={{ background: "transparent" }}>
            <Header className="flex items-center justify-between px-4 h-12 border-b sticky top-0 z-10" style={{ background: isDark ? "rgba(8,8,15,0.8)" : "rgba(255,255,255,0.8)", borderColor: colors.border, backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-2">
                <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <Menu size={18} className="dark:text-white/65 text-black/65" />
                </button>
                <span className="text-sm font-semibold dark:text-white/85 text-black/85">小红书矩阵运营</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSearchOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5" title="搜索"><Search size={16} className="dark:text-white/45 text-black/45" /></button>
                <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-white/5">
                  {themeMode === "dark" ? <Sun size={16} className="text-white/45" /> : <Moon size={16} className="text-black/45" />}
                </button>
                <Badge count={unreadCount} size="small">
                  <Bell size={16} className="dark:text-white/45 text-black/45" style={{ margin: 6 }} />
                </Badge>
              </div>
            </Header>
            <Content className="p-4" style={{ background: "transparent" }}>
              <KeepAliveRouteOutlet include={[/\/platforms\/xhs\/discovery/, /\/platforms\/xhs\/crawler/]} />
            </Content>
          </Layout>
        </>
      ) : (
        <>
          <Sider collapsed={collapsed} width={240} collapsedWidth={64} theme={isDark ? "dark" : "light"} trigger={null}
            style={{ height: "100vh", position: "fixed", left: 0, top: 0, bottom: 0, borderRight: `1px solid ${colors.border}`, overflow: "hidden", background: isDark ? "rgba(8,8,15,0.6)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)" }}
          >
            {sidebarContent}
          </Sider>
          <Layout style={{ marginLeft: siderWidth, transition: "margin-left 0.2s", background: "transparent" }}>
            <Header className="flex items-center justify-end px-6 h-12 border-b sticky top-0 z-10 gap-3" style={{ background: isDark ? "rgba(8,8,15,0.6)" : "rgba(255,255,255,0.6)", borderColor: colors.border, backdropFilter: "blur(16px)" }}>
              <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs dark:text-white/35 text-black/35 border dark:border-white/5 border-black/5 hover:border-[#1668dc]/30 transition-colors">
                <Search size={14} />
                <span>搜索</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] dark:bg-white/5 bg-black/5 dark:text-white/35 text-black/35 font-mono">⌘K</kbd>
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title={themeMode === "dark" ? "浅色模式" : "暗色模式"}>
                {themeMode === "dark" ? <Sun size={16} className="text-white/45" /> : <Moon size={16} className="text-black/45" />}
              </button>
              <div className="relative">
                <Badge count={unreadCount} size="small">
                  <Bell size={18} className="dark:text-white/45 text-black/45 cursor-pointer" />
                </Badge>
              </div>
            </Header>
            <Content className="p-8" style={{ background: "transparent", minHeight: "calc(100vh - 48px)" }}>
              <KeepAliveRouteOutlet include={[/\/platforms\/xhs\/discovery/, /\/platforms\/xhs\/crawler/]} />
            </Content>
          </Layout>
        </>
      )}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Layout>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <p className="text-[11px] font-medium tracking-widest uppercase dark:text-white/35 text-black/35 mb-1">{eyebrow}</p>
        <h2 className="text-2xl font-bold dark:text-white/92 text-black/88 mb-1">{title}</h2>
        <p className="text-sm dark:text-white/45 text-black/45">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
