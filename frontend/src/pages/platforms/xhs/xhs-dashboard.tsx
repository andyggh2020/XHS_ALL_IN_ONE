import {
  BarChartOutlined, DatabaseOutlined, HeartOutlined, RobotOutlined,
  SafetyCertificateOutlined, ScheduleOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, List, Row, Statistic, Tag, Timeline, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { PageHeader } from "../../../components/layout/app-shell";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { fetchXhsOverview } from "../../../lib/api";
import type { DashboardOverview } from "../../../types";

const { Text } = Typography;

const COLORS = ["#1668dc", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#f59e0b"];

const fallbackOverview: DashboardOverview = {
  platform: "xhs", today_crawls: 0, saved_notes: 0, pending_publishes: 0,
  healthy_accounts: 0, at_risk_accounts: 0, hot_topics: [], recent_activity: [],
};

const quickActions = [
  { label: "搜索笔记", icon: <BarChartOutlined />, to: "/platforms/xhs/discovery", color: "#1668dc" },
  { label: "内容库", icon: <DatabaseOutlined />, to: "/platforms/xhs/library", color: "#10b981" },
  { label: "AI 生成", icon: <RobotOutlined />, to: "/platforms/xhs/image-studio", color: "#a855f7" },
  { label: "自动运营", icon: <ThunderboltOutlined />, to: "/platforms/xhs/auto-ops", color: "#06b6d4" },
];

export function XhsDashboard() {
  const [overview, setOverview] = useState<DashboardOverview>(fallbackOverview);
  const c = useThemeColors();

  useEffect(() => {
    fetchXhsOverview()
      .then(setOverview)
      .catch(() => setOverview(fallbackOverview));
  }, []);

  const chartGrid = c.isDark ? "#2a2a2a" : "#e8e8e8";
  const chartText = c.isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  const healthData = [
    { name: "健康", value: overview.healthy_accounts, color: "#22c55e" },
    { name: "风险", value: overview.at_risk_accounts, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const topicChartData = overview.hot_topics.slice(0, 6).map((t, i) => ({
    name: t.keyword.length > 8 ? t.keyword.slice(0, 8) + "…" : t.keyword,
    互动量: t.engagement,
    fill: COLORS[i % COLORS.length],
  }));

  const metrics = [
    { label: "今日抓取", value: overview.today_crawls, icon: <DatabaseOutlined />, color: "#1668dc" },
    { label: "内容库笔记", value: overview.saved_notes, icon: <HeartOutlined />, color: "#22c55e" },
    { label: "待发布", value: overview.pending_publishes, icon: <ScheduleOutlined />, color: "#eab308" },
    { label: "健康账号", value: overview.healthy_accounts, icon: <SafetyCertificateOutlined />, color: "#a855f7" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="小红书运营"
        title="工作台总览"
        description="采集、洞察、AI 创作和发布任务一屏管理。"
        action={
          <Link to="/platforms/xhs/discovery">
            <Button type="primary" icon={<BarChartOutlined />}>开始发现</Button>
          </Link>
        }
      />

      {/* Quick Actions */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {quickActions.map((action) => (
          <Col key={action.label}>
            <Link to={action.to}>
              <Button
                icon={action.icon}
                style={{
                  borderRadius: 10, height: 40,
                  background: `${action.color}10`, border: `1px solid ${action.color}20`,
                  color: action.color, fontWeight: 500,
                }}
              >
                {action.label}
              </Button>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {metrics.map((metric) => (
          <Col xs={12} sm={12} md={6} key={metric.label}>
            <Card size="small" hoverable style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
              <Statistic
                title={<span style={{ color: c.textSecondary }}>{metric.label}</span>}
                value={metric.value}
                prefix={<span style={{ color: metric.color }}>{metric.icon}</span>}
                valueStyle={{ color: c.textPrimary, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Topic Engagement Bar Chart */}
        {topicChartData.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="话题互动排行" size="small" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicChartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="name" tick={{ fill: chartText, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartText, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: c.isDark ? "#1f1f1f" : "#fff",
                      border: `1px solid ${c.cardBorder}`, borderRadius: 8, fontSize: 12,
                    }}
                  />
                  <Bar dataKey="互动量" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {topicChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* Account Health Pie Chart */}
        {healthData.length > 0 && (
          <Col xs={24} md={12}>
            <Card title="账号健康分布" size="small" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={healthData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {healthData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: c.isDark ? "#1f1f1f" : "#fff",
                        border: `1px solid ${c.cardBorder}`, borderRadius: 8, fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {healthData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                      <Text style={{ color: c.textSecondary, fontSize: 13, flex: 1 }}>{d.name}</Text>
                      <Text strong style={{ color: c.textPrimary, fontSize: 14 }}>{d.value}</Text>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${c.cardBorder}` }}>
                    <Text style={{ color: c.textTertiary, fontSize: 12 }}>
                      总互动: {(overview.total_engagement ?? 0).toLocaleString()} · 评论: {overview.comment_count ?? 0}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Bottom Row */}
      <Row gutter={[16, 16]}>
        {/* Hot Topics */}
        <Col xs={24} md={12}>
          <Card
            title="高潜话题"
            size="small"
            extra={<Link to="/platforms/xhs/analytics"><Button type="link" size="small">查看洞察</Button></Link>}
            style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}
          >
            {overview.hot_topics.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: c.textTertiary, fontSize: 13 }}>
                采集笔记后会自动分析高潜话题
              </div>
            ) : (
              <List
                size="small"
                dataSource={overview.hot_topics}
                renderItem={(topic) => (
                  <List.Item
                    extra={
                      <Tag color="blue" style={{ borderRadius: 6 }}>
                        {topic.engagement.toLocaleString()}
                      </Tag>
                    }
                  >
                    <List.Item.Meta
                      title={<Text style={{ fontSize: 13, color: c.textPrimary }}>{topic.keyword}</Text>}
                      description={<Text style={{ fontSize: 12, color: c.textTertiary }}>{topic.notes} 篇笔记</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} md={12}>
          <Card
            title="最近动态"
            size="small"
            extra={<RobotOutlined style={{ color: c.textTertiary }} />}
            style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}
          >
            {overview.recent_activity.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: c.textTertiary, fontSize: 13 }}>
                还没有动态，开始采集吧
              </div>
            ) : (
              <Timeline
                items={overview.recent_activity.slice(0, 6).map((item) => ({
                  color: "#1668dc",
                  children: (
                    <div>
                      <Text style={{ fontSize: 13, color: c.textPrimary, display: "block" }}>{item.title}</Text>
                      <Tag color="default" style={{ fontSize: 11, marginTop: 2 }}>
                        {item.type === "note" ? "笔记" : item.type}
                      </Tag>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
