import {
  AimOutlined,
  BarChartOutlined,
  BellOutlined,
  CloudDownloadOutlined,
  CrownOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  StarOutlined,
  SunOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Col,
  Drawer,
  Dropdown,
  Layout,
  List,
  Menu,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
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
const { Title, Text } = Typography;

const mainNavItems: MenuProps["items"] = [
  { key: "/platforms/xhs/dashboard", icon: <DashboardOutlined />, label: "总览" },
  { key: "/platforms/xhs/accounts", icon: <SafetyCertificateOutlined />, label: "账号矩阵" },
  { key: "/platforms/xhs/discovery", icon: <SearchOutlined />, label: "笔记发现" },
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
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const colors = {
    border: isDark ? "#303030" : "#e8e8e8",
    borderSecondary: isDark ? "#262626" : "#f0f0f0",
    logoText: isDark ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.85)",
    iconMuted: isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)",
    badgeBg: isDark ? "rgba(22,104,220,0.06)" : "rgba(22,104,220,0.06)",
    dropdownBg: isDark ? "#1f1f1f" : "#ffffff",
    headerBg: isDark ? "#141414" : "#ffffff",
    emptyText: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
  };

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications({ page_size: 20 });
      setNotifications(res.items);
      setUnreadCount(res.items.filter((n) => !n.read).length);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = setInterval(() => void loadNotifications(), 30_000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => { await markNotificationRead(id); void loadNotifications(); };
  const handleMarkAllRead = async () => { await markAllNotificationsRead(); void loadNotifications(); };
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => { navigate(key); };
  const selectedKeys = [location.pathname];

  const notificationDropdownContent = (
    <div style={{ width: isMobile ? "calc(100vw - 32px)" : 360, maxWidth: 360, background: colors.dropdownBg, borderRadius: 8, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${colors.border}` }}>
        <Text strong style={{ fontSize: 14 }}>通知</Text>
        {unreadCount > 0 && <Button type="link" size="small" onClick={() => void handleMarkAllRead()}>全部已读</Button>}
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: colors.emptyText }}>暂无通知</div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(n) => (
              <List.Item key={n.id} style={{ padding: "10px 16px", cursor: n.read ? "default" : "pointer", background: n.read ? "transparent" : colors.badgeBg, borderBottom: `1px solid ${colors.borderSecondary}` }} onClick={() => !n.read && void handleMarkRead(n.id)}>
                <List.Item.Meta
                  avatar={<span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: levelColor(n.level), marginTop: 6 }} />}
                  title={<Text style={{ fontSize: 13 }}>{n.title}</Text>}
                  description={<div>{n.body && <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{n.body}</Text>}<Text type="secondary" style={{ fontSize: 11 }}>{new Date(n.created_at).toLocaleString("zh-CN")}</Text></div>}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  const siderWidth = collapsed ? 64 : 240;

  // 侧栏内容（可复用到 Drawer 和桌面 Sider）
  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div
        style={{ padding: collapsed || isMobile ? "16px 0" : "16px 16px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${colors.border}`, flexShrink: 0, cursor: "pointer" }}
        onClick={() => { navigate("/"); if (isMobile) setMobileMenuOpen(false); }}
      >
        <Space align="center" size={8}>
          <div
            style={{
              width: collapsed ? 30 : 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #1668dc 0%, #4e8ff7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, color: "#fff",
              boxShadow: "0 2px 8px rgba(22,104,220,0.3)",
            }}
          >X</div>
          {(!collapsed || isMobile) && <span style={{ fontWeight: 600, fontSize: 14, color: colors.logoText, letterSpacing: 0.5 }}>小红书矩阵运营</span>}
        </Space>
        {!isMobile && !collapsed && (
          <Button type="text" size="small" icon={<MenuFoldOutlined style={{ fontSize: 14 }} />} onClick={(e) => { e.stopPropagation(); setCollapsed(true); }} style={{ color: colors.iconMuted, opacity: 0.6 }} />
        )}
      </div>

      {/* Main nav — scrollable */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginTop: 4 }}>
        <Menu theme={isDark ? "dark" : "light"} mode="inline" selectedKeys={selectedKeys} onClick={(info) => { handleMenuClick(info); if (isMobile) setMobileMenuOpen(false); }} items={mainNavItems} style={{ borderRight: 0 }} />
      </div>

      {/* Footer — pinned to bottom */}
      <div style={{ flexShrink: 0 }}>
        {auth.user?.is_admin && (
          <Menu theme={isDark ? "dark" : "light"} mode="inline" selectedKeys={selectedKeys} onClick={(info) => { handleMenuClick(info); if (isMobile) setMobileMenuOpen(false); }} items={adminNavItem} style={{ borderRight: 0 }} />
        )}
        <Menu theme={isDark ? "dark" : "light"} mode="inline" selectedKeys={selectedKeys} onClick={(info) => { handleMenuClick(info); if (isMobile) setMobileMenuOpen(false); }} items={footerNavItems} style={{ borderRight: 0 }} />
        <div style={{
          padding: "10px 14px",
          borderTop: `1px solid ${colors.borderSecondary}`,
          display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-start",
        }}>
          <div style={{ position: "relative" }}>
            <Avatar size={26} style={{ background: "linear-gradient(135deg, #1668dc, #4e8ff7)", flexShrink: 0, fontSize: 11, border: "2px solid rgba(22,104,220,0.2)" }}>
              {(auth.user?.username ?? "U")[0].toUpperCase()}
            </Avatar>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: `2px solid ${isDark ? "#0f0f0f" : "#ffffff"}` }} />
          </div>
          <Text ellipsis style={{ fontSize: 12, flex: 1, lineHeight: "26px", color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)" }}>
            {auth.user?.username ?? "用户"}
          </Text>
          {!isMobile && collapsed && (
            <Button type="text" size="small" icon={<MenuUnfoldOutlined />} onClick={() => setCollapsed(false)} style={{ color: colors.iconMuted, flexShrink: 0 }} title="展开侧栏" />
          )}
          {!collapsed && <Button type="text" icon={<LogoutOutlined />} onClick={() => void auth.logout()} size="small" style={{ color: colors.iconMuted, flexShrink: 0, opacity: 0.5 }} title="退出登录" />}
        </div>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isMobile ? (
        // 移动端：Hamburger 菜单 → Drawer
        <>
          <Drawer
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            placement="left"
            width={260}
            styles={{ body: { padding: 0, background: isDark ? "#0f0f0f" : "#ffffff" } }}
            closeIcon={null}
          >
            {sidebarContent}
          </Drawer>
          <Layout>
            <Header style={{
              padding: "0 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: `1px solid ${colors.border}`,
              height: 50, lineHeight: "50px",
              backdropFilter: "blur(12px)",
              position: "sticky", top: 0, zIndex: 10,
            }}>
              <Space>
                <Button type="text" icon={<MenuOutlined style={{ fontSize: 16 }} />} onClick={() => setMobileMenuOpen(true)} style={{ opacity: 0.65 }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: colors.logoText }}>小红书矩阵运营</span>
              </Space>
              <Space size={8}>
                <Button type="text" icon={<SearchOutlined style={{ fontSize: 15 }} />} onClick={() => setSearchOpen(true)} style={{ opacity: 0.65 }} />
                <Button type="text" icon={themeMode === "dark" ? <SunOutlined style={{ fontSize: 15 }} /> : <MoonOutlined style={{ fontSize: 15 }} />} onClick={toggleTheme} style={{ opacity: 0.65 }} />
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <Button type="text" icon={<BellOutlined style={{ fontSize: 15 }} />} style={{ opacity: 0.65 }} />
                </Badge>
              </Space>
            </Header>
            <Content style={{ padding: 16, minHeight: "calc(100vh - 50px)", overflow: "auto" }}>
              <KeepAliveRouteOutlet include={[/\/platforms\/xhs\/discovery/, /\/platforms\/xhs\/crawler/]} />
            </Content>
          </Layout>
        </>
      ) : (
        // 桌面端：固定侧栏
        <>
          <Sider
            collapsed={collapsed}
            width={220}
            collapsedWidth={64}
            theme={isDark ? "dark" : "light"}
            trigger={null}
            style={{
              height: "100vh", position: "fixed", left: 0, top: 0, bottom: 0,
              borderRight: `1px solid ${colors.border}`, overflow: "hidden",
            }}
          >
            {sidebarContent}
          </Sider>
          <Layout style={{ marginLeft: siderWidth, transition: "margin-left 0.2s" }}>
            <Header style={{
              padding: "0 24px",
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              borderBottom: `1px solid ${colors.border}`,
              height: 50, lineHeight: "50px",
              backdropFilter: "blur(12px)",
              position: "sticky", top: 0, zIndex: 10,
            }}>
              <Space size={10}>
                <Button type="text" icon={<SearchOutlined style={{ fontSize: 15 }} />} onClick={() => setSearchOpen(true)} style={{ opacity: 0.65 }} title="搜索 (Cmd+K)" />
                <Button type="text" icon={themeMode === "dark" ? <SunOutlined style={{ fontSize: 15 }} /> : <MoonOutlined style={{ fontSize: 15 }} />} onClick={toggleTheme} style={{ opacity: 0.65 }} />
                <Dropdown dropdownRender={() => notificationDropdownContent} trigger={["click"]} placement="bottomRight">
                  <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                    <Button type="text" icon={<BellOutlined style={{ fontSize: 15 }} />} style={{ opacity: 0.65 }} />
                  </Badge>
                </Dropdown>
              </Space>
            </Header>
            <Content style={{ padding: 32, minHeight: "calc(100vh - 50px)", overflow: "auto" }}>
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
    <Row justify="space-between" align="top" style={{ marginBottom: 24 }}>
      <Col>
        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{eyebrow}</Text>
        <Title level={3} style={{ margin: "4px 0 4px" }}>{title}</Title>
        <Text type="secondary">{description}</Text>
      </Col>
      {action && <Col>{action}</Col>}
    </Row>
  );
}
