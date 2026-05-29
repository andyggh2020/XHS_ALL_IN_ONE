import { ArrowDown, ArrowUp, BarChart3, Database, Heart, Search, Shield, Sparkles, TrendingUp, Zap, Target, FileText, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { HeaderControls } from "../../../components/layout/header-controls";
import { fetchXhsOverview } from "../../../lib/api";
import type { DashboardOverview } from "../../../types";

const COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--destructive)", "var(--purple)", "var(--pink)"];

const fallbackOverview: DashboardOverview = {
  platform: "xhs", today_crawls: 0, saved_notes: 0, pending_publishes: 0,
  healthy_accounts: 0, at_risk_accounts: 0, hot_topics: [], recent_activity: [],
};

const quickActions = [
  { label: "搜索笔记", icon: <Search size={16} />, to: "/platforms/xhs/discovery", color: "var(--primary)" },
  { label: "内容库", icon: <Database size={16} />, to: "/platforms/xhs/library", color: "var(--success)" },
  { label: "AI 图片", icon: <Sparkles size={16} />, to: "/platforms/xhs/image-studio", color: "var(--purple)" },
  { label: "自动运营", icon: <Zap size={16} />, to: "/platforms/xhs/auto-ops", color: "var(--cyan)" },
];

export function XhsDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview>(fallbackOverview);
  const [activeCapsule, setActiveCapsule] = useState("总览");

  useEffect(() => {
    fetchXhsOverview().then(setOverview).catch(() => setOverview(fallbackOverview));
  }, []);

  // Time greeting
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "凌晨好" : hour < 12 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  const dateStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const capsuleOptions = ["总览", "趋势", "对比"];

  const healthData = [
    { name: "健康", value: overview.healthy_accounts, color: "var(--success)" },
    { name: "风险", value: overview.at_risk_accounts, color: "var(--destructive)" },
  ].filter((d) => d.value > 0);

  const topicChartData = overview.hot_topics.slice(0, 6).map((t, i) => ({
    name: t.keyword.length > 8 ? t.keyword.slice(0, 8) + "…" : t.keyword,
    互动量: t.engagement,
    fill: COLORS[i % COLORS.length],
  }));

  const weekTrendData = [
    { name: "周一", 浏览量: 2400, 互动: 1800 },
    { name: "周二", 浏览量: 3200, 互动: 2200 },
    { name: "周三", 浏览量: 2800, 互动: 1900 },
    { name: "周四", 浏览量: 4100, 互动: 2800 },
    { name: "周五", 浏览量: 3800, 互动: 2600 },
    { name: "周六", 浏览量: 4600, 互动: 3400 },
    { name: "周日", 浏览量: 3600, 互动: 2500 },
  ];

  const metrics = [
    {
      label: "今日抓取", value: overview.today_crawls, icon: <Database size={18} />,
      color: "var(--primary)", bg: "#e8f0fe", trend: "+12%", up: true,
    },
    {
      label: "内容库笔记", value: overview.saved_notes, icon: <Heart size={18} />,
      color: "var(--success)", bg: "#e6f7ed", trend: "+5%", up: true,
    },
    {
      label: "待发布", value: overview.pending_publishes, icon: <Zap size={18} />,
      color: "var(--warning)", bg: "#fef6e0", trend: "-2%", up: false,
    },
    {
      label: "健康账号", value: overview.healthy_accounts, icon: <Shield size={18} />,
      color: "var(--purple)", bg: "#f0ecfe", trend: "—", up: true,
    },
  ];

  return (
    <div>
      {/* Welcome Banner - Feigua Style */}
      <div className="relative overflow-hidden rounded-2xl mb-8 bg-feigua-header">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.15\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative px-8 py-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl font-bold text-white">{greeting}</span>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-white/70 text-sm">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3 bg-white/15 rounded-xl px-5 py-3 backdrop-blur-sm border border-white/10">
            <TrendingUp className="h-5 w-5 text-white/90" />
            <div>
              <p className="text-white/65 text-[11px] font-medium">今日数据</p>
              <p className="text-white font-bold text-sm">{overview.today_crawls + overview.saved_notes} 条</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card Header - Feigua Style */}
      <div className="info-card-header">
        <div className="info-card-icon">
          <TrendingUp size={20} />
        </div>
        <div className="info-card-content">
          <div className="info-card-title">小红书运营总览</div>
          <div className="info-card-subtitle">监控账号健康度、内容表现和竞品趋势，掌握运营全局</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="capsule-tabs">
            {capsuleOptions.map((opt) => (
              <button key={opt} className={`capsule-tab ${activeCapsule === opt ? 'active' : ''}`}
                onClick={() => setActiveCapsule(opt)}>
                {opt}
              </button>
            ))}
          </div>
          <HeaderControls />
        </div>
      </div>

      {/* Quick Access Grid - Feigua Style */}
      <div className="quick-access-grid mb-8">
        {quickActions.map((action) => (
          <div key={action.label} className="quick-access-item" onClick={() => navigate(action.to)}>
            <div className="quick-access-icon" style={{ background: `color-mix(in srgb, ${action.color} 12%, transparent)`, color: action.color }}>
              {action.icon}
            </div>
            <span className="quick-access-label">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions (old style removed) */}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="stat-card-clean p-4">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: metric.bg, color: metric.color }}
              >
                {metric.icon}
              </div>
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${metric.up ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
                {metric.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {metric.trend}
              </span>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: metric.color }}>{metric.value}</div>
            <div className="text-xs text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Area Chart - Weekly Trend */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <span className="section-title mb-0">本周趋势</span>
            <Badge variant="secondary" className="text-[10px]">近 7 天</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekTrendData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "color-mix(in srgb, var(--card) 95%, transparent)",
                  border: "1px solid var(--border)",
                  borderRadius: 10, fontSize: 12,
                  backdropFilter: "blur(12px)",
                }}
              />
              <Area type="monotone" dataKey="浏览量" stroke="var(--primary)" strokeWidth={2} fill="url(#pvGradient)" dot={false} />
              <Area type="monotone" dataKey="互动" stroke="var(--purple)" strokeWidth={2} fill="url(#uvGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Topic Engagement Bar Chart */}
        {topicChartData.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <span className="section-title mb-0">话题互动排行</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topicChartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "color-mix(in srgb, var(--card) 95%, transparent)",
                    border: "1px solid var(--border)",
                    borderRadius: 10, fontSize: 12,
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Bar dataKey="互动量" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {topicChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Ranking Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Left: Content Value Ranking */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="section-title mb-0">高潜话题</span>
              <Badge variant="secondary" className="text-[10px] px-1.5">TOP</Badge>
            </div>
            <Link to="/platforms/xhs/analytics"><Button size="sm" variant="ghost">查看洞察</Button></Link>
          </div>
          {overview.hot_topics.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">采集笔记后会自动分析高潜话题</div>
          ) : (
            <div className="divide-y divide-border/40">
              {overview.hot_topics.map((topic, i) => (
                <div key={topic.keyword} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`rank-badge ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'rank-default'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{topic.keyword}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{topic.engagement.toLocaleString()} 互动</span>
                    <div className="w-20 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (topic.engagement / 100))}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Recent Activity - Feigua Style */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="section-title mb-0">最近动态</span>
            <Badge variant="secondary" className="text-[10px] px-1.5">最新</Badge>
          </div>
          {overview.recent_activity.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">还没有动态，开始采集吧</div>
          ) : (
            <table className="data-table-feigua">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>标题</th>
                  <th style={{ width: '25%' }}>类型</th>
                  <th style={{ width: '20%' }}>趋势</th>
                  <th style={{ width: '15%' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent_activity.slice(0, 6).map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className={`rank-badge ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'rank-default'}`}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-sm truncate max-w-[180px]">{item.title}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {item.type === "note" ? "笔记" : item.type}
                      </Badge>
                    </td>
                    <td>
                      <span className="trend-up inline-flex items-center gap-0.5">
                        <ArrowUp size={12} />
                        {(Math.random() * 15 + 2).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <div className="sparkline-line">
                        {Array.from({ length: 7 }, (_, j) => (
                          <div key={j} className="sparkline-bar" style={{ height: `${8 + Math.random() * 16}px` }} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
