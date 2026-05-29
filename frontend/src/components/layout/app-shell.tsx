import {
  BarChart3, BookOpen, ChevronDown, Database, Download, FileEdit, Film, Goal,
  KeyRound, LayoutDashboard, LogOut, Menu, MonitorPlay, Search,
  Send, Settings, Shield, Sparkles, Timer, Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import KeepAliveRouteOutlet from "keepalive-for-react-router";

import { Dialog, DialogBody } from "../../components/ui/dialog";
import { Avatar } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../hooks/use-auth";
import { useMediaQuery } from "../../hooks/use-media-query";
import { SearchContext } from "./search-context";
import { globalSearch } from "../../lib/api";
import type { SearchResult } from "../../types";
import { cn } from "../../lib/utils";

// KeepAlive route patterns (defined outside component to avoid JSX/regex parsing conflicts)
const keepAlivePatterns = [/\/platforms\/xhs\/discovery/, /\/platforms\/xhs\/crawler/];

// ===== Nav data =====

type NavItem = {
  key: string;
  icon: ReactNode;
  label: string;
  accent: string; // CSS variable for icon color
  iconBg: string; // background tint class
};

type NavGroup = {
  label: string;
  icon: ReactNode;
  items: NavItem[];
  accent: string;
  iconBg: string;
};

const navGroups: NavGroup[] = [
  {
    label: "运营分析", icon: <BarChart3 size={18} />, accent: "var(--nav-analytics)", iconBg: "bg-[var(--nav-analytics)]/10",
    items: [
      { key: "/platforms/xhs/analytics", icon: <BarChart3 size={16} />, label: "数据洞察", accent: "var(--nav-analytics)", iconBg: "bg-[var(--nav-analytics)]/10" },
      { key: "/platforms/xhs/benchmarks", icon: <Goal size={16} />, label: "竞品监控", accent: "var(--nav-benchmarks)", iconBg: "bg-[var(--nav-benchmarks)]/10" },
      { key: "/platforms/xhs/keywords", icon: <KeyRound size={16} />, label: "关键词组", accent: "var(--nav-keywords)", iconBg: "bg-[var(--nav-keywords)]/10" },
    ],
  },
  {
    label: "内容创作", icon: <Sparkles size={18} />, accent: "var(--nav-image-studio)", iconBg: "bg-[var(--nav-image-studio)]/10",
    items: [
      { key: "/platforms/xhs/image-studio", icon: <Sparkles size={16} />, label: "图片工坊", accent: "var(--nav-image-studio)", iconBg: "bg-[var(--nav-image-studio)]/10" },
      { key: "/platforms/xhs/video-studio", icon: <Film size={16} />, label: "视频工坊", accent: "var(--nav-video-studio)", iconBg: "bg-[var(--nav-video-studio)]/10" },
      { key: "/platforms/xhs/library", icon: <Database size={16} />, label: "内容库", accent: "var(--nav-library)", iconBg: "bg-[var(--nav-library)]/10" },
      { key: "/platforms/xhs/drafts", icon: <FileEdit size={16} />, label: "草稿工坊", accent: "var(--nav-drafts)", iconBg: "bg-[var(--nav-drafts)]/10" },
      { key: "/platforms/xhs/publish", icon: <Send size={16} />, label: "发布中心", accent: "var(--nav-publish)", iconBg: "bg-[var(--nav-publish)]/10" },
    ],
  },
  {
    label: "自动化", icon: <MonitorPlay size={18} />, accent: "var(--nav-auto-ops)", iconBg: "bg-[var(--nav-auto-ops)]/10",
    items: [
      { key: "/platforms/xhs/crawler", icon: <Download size={16} />, label: "数据抓取", accent: "var(--nav-crawler)", iconBg: "bg-[var(--nav-crawler)]/10" },
      { key: "/platforms/xhs/discovery", icon: <Search size={16} />, label: "笔记发现", accent: "var(--nav-discovery)", iconBg: "bg-[var(--nav-discovery)]/10" },
      { key: "/platforms/xhs/auto-ops", icon: <MonitorPlay size={16} />, label: "自动运营", accent: "var(--nav-auto-ops)", iconBg: "bg-[var(--nav-auto-ops)]/10" },
    ],
  },
];

const mainNavItems: NavItem[] = [
  { key: "/platforms/xhs/dashboard", icon: <LayoutDashboard size={18} />, label: "总览", accent: "var(--nav-dashboard)", iconBg: "bg-[var(--nav-dashboard)]/10" },
];

const footerNavItems: NavItem[] = [
  { key: "/settings", icon: <Settings size={18} />, label: "设置", accent: "var(--nav-settings)", iconBg: "bg-[var(--nav-settings)]/10" },
];

const adminNavItem: NavItem[] = [
  { key: "/admin/users", icon: <Users size={18} />, label: "用户管理", accent: "var(--nav-users)", iconBg: "bg-[var(--nav-users)]/10" },
];

// ===== Helpers =====

function levelColor(level: string): string {
  if (level === "error") return "var(--destructive)";
  if (level === "warning") return "var(--warning)";
  return "var(--muted-foreground)";
}

// ===== Search Modal =====

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(query.trim());
        setResults(res);
      } catch { setResults(null); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const flatItems = (() => {
    if (!results) return [];
    const items: { label: string; url: string; group: string }[] = [];
    results.notes.forEach((n) => items.push({ label: `📝 ${n.title}`, url: n.url, group: "笔记" }));
    results.accounts.forEach((a) => items.push({ label: `🔗 ${a.nickname} (${a.sub_type})`, url: a.url, group: "账号" }));
    results.publish_jobs.forEach((j) => items.push({ label: `🚀 ${j.title} [${j.status}]`, url: j.url, group: "发布" }));
    results.tasks.forEach((t) => items.push({ label: `⚡ ${t.task_type} [${t.status}]`, url: t.url, group: "任务" }));
    return items;
  })();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && flatItems[selectedIndex]) { onClose(); navigate(flatItems[selectedIndex].url); }
  };

  const hasAnyResult = results && (results.notes.length > 0 || results.accounts.length > 0 || results.publish_jobs.length > 0 || results.tasks.length > 0);

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-4 pb-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="搜索笔记、账号、发布任务..."
            className="w-full h-11 pl-10 pr-16 rounded-xl border border-input bg-background/50 text-sm focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all"
            autoFocus
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-mono">ESC</kbd>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {loading && <div className="text-center py-8 text-sm text-muted-foreground">搜索中...</div>}
        {!loading && query && !hasAnyResult && (
          <div className="text-center py-8 text-sm text-muted-foreground">没有找到 "{query}" 的相关结果</div>
        )}
        {!loading && results && (() => {
          const groups = [
            { key: "笔记", items: results.notes, icon: "📝", labelKey: "title" as const, dot: "var(--nav-discovery)" },
            { key: "账号", items: results.accounts, icon: "🔗", labelKey: "nickname" as const, dot: "var(--nav-accounts)" },
            { key: "发布", items: results.publish_jobs, icon: "🚀", labelKey: "title" as const, dot: "var(--nav-publish)" },
            { key: "任务", items: results.tasks, icon: "⚡", labelKey: "task_type" as const, dot: "var(--nav-tasks)" },
          ].filter((g) => g.items.length > 0);

          return groups.length > 0 ? (
            <div>
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.dot }} />
                    <span className="text-muted-foreground">{group.key}</span>
                  </div>
                  {group.items.map((item: any) => {
                    const label = item[group.labelKey] || "";
                    const flatIdx = flatItems.findIndex((f) => f.label.includes(label));
                    const isSelected = flatIdx === selectedIndex;
                    return (
                      <div
                        key={`${group.key}-${item.id}`}
                        onClick={() => { onClose(); navigate(item.url || ""); }}
                        onMouseEnter={() => setSelectedIndex(flatIdx)}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2.5 cursor-pointer rounded-lg transition-all",
                          isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent",
                        )}
                      >
                        <span className="flex-1 text-sm truncate">{label}</span>
                        {item.status && <span className="text-xs text-muted-foreground shrink-0">{item.status}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null;
        })()}
      </div>

      {results && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
          <span>↑↓ 导航</span>
          <span>↵ 跳转</span>
          <span>Esc 关闭</span>
        </div>
      )}
    </Dialog>
  );
}

// ===== Color Dot =====

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: color }}
    />
  );
}

// ===== Nav Group (Feigua Style) =====

function NavGroupItem({ group, collapsed, isMobile, navigate, isSelected, onMobileClose }: {
  group: NavGroup;
  collapsed: boolean;
  isMobile: boolean;
  navigate: (path: string) => void;
  isSelected: (key: string) => boolean;
  onMobileClose: () => void;
}) {
  const [expanded, setExpanded] = useState(() => group.items.some((item) => isSelected(item.key)));
  const needsPadding = !collapsed;
  // Find if any child is selected to highlight the group header
  const hasActiveChild = group.items.some((item) => isSelected(item.key));

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center w-full gap-2.5 px-4 py-2.5 text-sm font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors rounded-lg"
        style={{ color: hasActiveChild ? group.accent : undefined }}
      >
        <span className="shrink-0 opacity-70" style={{ color: group.accent }}>{group.icon}</span>
        {needsPadding && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`} />
          </>
        )}
      </button>
      {expanded && (
        <div className="mt-1 ml-2 space-y-0.5">
          {group.items.map((item) => {
            const selected = isSelected(item.key);
            return (
              <button
                key={item.key}
                onClick={() => { navigate(item.key); if (isMobile) onMobileClose(); }}
                className={cn(
                  "flex items-center w-full text-sm transition-all duration-200",
                  collapsed ? "justify-center" : "gap-3 pl-[44px]",
                )}
                style={{
                  background: selected ? `color-mix(in srgb, ${item.accent} 12%, transparent)` : undefined,
                  color: selected ? item.accent : 'var(--muted-foreground)',
                  fontWeight: selected ? 600 : 400,
                  fontSize: '13.5px',
                  borderRadius: '10px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  paddingRight: collapsed ? 0 : '12px',
                  paddingLeft: collapsed ? 0 : '12px',
                }}
                onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.background = 'var(--sidebar-bg-hover)'; e.currentTarget.style.color = 'var(--foreground)'; } }}
                onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; } }}
              >
                <span className="shrink-0" style={{ opacity: selected ? 1 : 0.5 }}>
                  {item.icon}
                </span>
                {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== App Shell =====

export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isSelected = (key: string) => location.pathname === key || location.pathname.startsWith(key + "/");

  // Nav item render
  const NavItem = ({ item, isFooter }: { item: NavItem; isFooter?: boolean }) => {
    const selected = isSelected(item.key) || (item.key === "/platforms/xhs/drafts" && location.pathname.startsWith("/platforms/xhs/drafts"));
    const accentColor = item.accent;
    return (
      <button
        onClick={() => { navigate(item.key); if (isMobile) setMobileMenuOpen(false); }}
        className={cn(
          "flex items-center w-full transition-all duration-200 group",
          collapsed && !isMobile ? "justify-center" : "gap-3",
        )}
        title={collapsed && !isMobile ? item.label : undefined}
        style={selected ? {
          background: selected ? `color-mix(in srgb, ${accentColor} 12%, transparent)` : undefined,
          color: accentColor,
          fontWeight: 600,
          fontSize: '14px',
          borderRadius: '9999px',
          marginLeft: collapsed ? 0 : '10px',
          marginRight: collapsed ? 0 : '10px',
          paddingTop: collapsed ? '12px' : '10px',
          paddingBottom: collapsed ? '12px' : '10px',
          paddingLeft: collapsed ? 0 : '14px',
          paddingRight: collapsed ? 0 : '14px',
        } : {
          borderRadius: '9999px',
          fontSize: '14px',
          marginLeft: collapsed ? 0 : '10px',
          marginRight: collapsed ? 0 : '10px',
          paddingTop: collapsed ? '12px' : '10px',
          paddingBottom: collapsed ? '12px' : '10px',
          paddingLeft: collapsed ? 0 : '14px',
          paddingRight: collapsed ? 0 : '14px',
        }}
        onMouseEnter={(e) => {
          if (!selected) {
            e.currentTarget.style.background = 'var(--sidebar-bg-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (!selected) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <span
          className={cn(
            "shrink-0 transition-all duration-200 flex items-center justify-center",
            collapsed && !isMobile ? "w-10 h-10" : "w-8 h-8",
          )}
          style={{
            color: selected ? accentColor : 'var(--muted-foreground)',
          }}
        >
          <span className={collapsed ? 'scale-100' : 'scale-110'}>{item.icon}</span>
        </span>
        {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-5 py-5 border-b shrink-0 cursor-pointer group" onClick={() => { navigate("/"); if (isMobile) setMobileMenuOpen(false); }} style={{ borderColor: `var(--sidebar-border)` }}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff2442] to-[#ff6b81] flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M9 8h6" />
              <path d="M9 12h6" />
              <path d="M9 16h3" />
            </svg>
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <div className="font-bold text-base leading-tight" style={{ color: 'var(--sidebar-text-active)' }}>
                小红书助手
              </div>
              <div className="text-[12px] mt-1.5 opacity-60" style={{ color: 'var(--sidebar-text)' }}>创作管理平台</div>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }} className="ml-auto p-1 rounded-lg text-muted-foreground transition-all opacity-0 group-hover:opacity-100" style={{ background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sidebar-bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <Menu size={13} />
          </button>
        )}
      </div>

      {/* Rainbow gradient divider */}
      <div className="gradient-divider mx-2.5 my-0" style={{ opacity: 0.5 }} />

      {/* Main Nav - Top items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 scrollbar-thin">
        <div className="py-1.5 space-y-0.5">
          {mainNavItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </div>

        {/* Grouped Nav - Feigua Style */}
        {!collapsed && navGroups.map((group) => (
          <NavGroupItem key={group.label} group={group} collapsed={collapsed} isMobile={isMobile} navigate={navigate} isSelected={isSelected} onMobileClose={() => setMobileMenuOpen(false)} />
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t" style={{ borderColor: `var(--sidebar-border)` }}>
        {auth.user?.is_admin && (
          <div className="px-3 pt-3 space-y-0.5">
            {adminNavItem.map((item) => (
              <NavItem key={item.key} item={item} isFooter />
            ))}
          </div>
        )}
        <div className="px-3 py-2.5 space-y-0.5">
          {footerNavItems.map((item) => (
            <NavItem key={item.key} item={item} isFooter />
          ))}
        </div>
        <div className="flex items-center gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="relative">
            <Avatar className="w-8 h-8 text-sm ring-2 ring-[var(--primary)]/20" fallback={auth.user?.username?.charAt(0)?.toUpperCase() || "U"} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--success)] border-2 border-[var(--background)]" />
          </div>
          {(!collapsed || isMobile) && (
            <>
              <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--sidebar-text-active)' }}>{auth.user?.username ?? "用户"}</span>
              <button onClick={() => void auth.logout()} className="text-muted-foreground hover:text-[var(--destructive)] transition-all p-2 rounded-lg hover:bg-[var(--destructive)]/10" title="退出">
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">

      {/* Mobile Drawer */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ animation: "fadeIn 0.15s ease-out" }} onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[260px] bg-[color-mix(in_srgb,var(--card)_95%,transparent)] backdrop-blur-2xl border-r border-border z-50 shadow-2xl"
            style={{ animation: "slideUp 0.2s ease-out" }}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "fixed left-0 top-0 bottom-0 z-30 border-r border-border overflow-hidden transition-all duration-300 ease-out",
            collapsed ? "w-[64px]" : "w-[260px]",
          )}
        >
          <div className="h-full" style={{ background: 'var(--sidebar-bg)' }}>
            {sidebarContent}
          </div>
        </aside>
      )}

      {/* Main area */}
      <div className={cn("flex-1 flex flex-col transition-all duration-300 ease-out", !isMobile && (collapsed ? "ml-[64px]" : "ml-[260px]"))}>
        {/* Mobile header only */}
        {isMobile && (
          <header className="flex items-center justify-between px-4 h-13 border-b border-border glass">
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <Menu size={18} />
              </button>
              <span className="text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--purple)] bg-clip-text text-transparent">
                小红书助手
              </span>
            </div>
          </header>
        )}

        {/* Content */}
        <main className={cn("flex-1", isMobile ? "p-4" : "p-8")}>
          <SearchContext.Provider value={{ openSearch: () => setSearchOpen(true) }}>
            <KeepAliveRouteOutlet include={keepAlivePatterns} />
          </SearchContext.Provider>
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

/**
 * 统一的页面外壳组件 — 提供渐变色页头 + 内容容器。
 * 所有页面（shadcn / antd）都应使用此组件保持视觉一致性。
 */
export function PageShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function PageHeader(props: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  const { eyebrow, title, description, action } = props;
  return (
    <div className="flex items-start justify-between mb-8">
      <div style={{ animation: "slideUp 0.3s ease-out" }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1.5">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
