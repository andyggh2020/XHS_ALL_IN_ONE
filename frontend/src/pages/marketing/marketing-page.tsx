import {
  RocketOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
  SearchOutlined,
  DatabaseOutlined,
  RobotOutlined,
  PictureOutlined,
  SendOutlined,
  ThunderboltOutlined,
  EditOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StarFilled,
  ArrowRightOutlined,
  DashboardOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  LineChartOutlined,
  ReloadOutlined,
  LayoutOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/use-auth";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useThemeMode } from "../../app/providers";

const { Title, Text, Paragraph } = Typography;

interface Feature {
  icon: React.ReactNode;
  title: string;
  tag: string;
  tagColor: string;
  intro: string;
  highlights: string[];
  gradient: string;
}

function FeatureIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ width: 56, height: 56, borderRadius: 14, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color }}>
      {children}
    </div>
  );
}

const FEATURES: { icon: React.ReactNode; title: string; tag: string; tagColor: string; intro: string; highlights: string[] }[] = [
  {
    icon: <SearchOutlined />,
    title: "智能数据采集",
    tag: "PC 端",
    tagColor: "#1668dc",
    intro: "基于小红书 PC 端接口，关键词搜索、用户主页、笔记详情、评论区等多维度数据采集。",
    highlights: ["关键词搜索全站笔记", "批量采集无水印原图和高清视频", "笔记评论和互动数据"],
  },
  {
    icon: <DatabaseOutlined />,
    title: "内容库管理",
    tag: "资产",
    tagColor: "#10b981",
    intro: "采集笔记统一沉淀到内容库，卡片/列表双视图，标签分类检索。",
    highlights: ["自动保存完整信息", "自定义标签分类", "JSON / CSV 批量导出"],
  },
  {
    icon: <RobotOutlined />,
    title: "AI 智能改写",
    tag: "大模型",
    tagColor: "#7c3aed",
    intro: "接入主流大模型，编辑器内完成标题、正文、标签全量改写。",
    highlights: ["支持多模型，自定义 API Key", "一键改写正文", "AI 生成吸睛标题和热门标签"],
  },
  {
    icon: <PictureOutlined />,
    title: "AI 图片润色",
    tag: "视觉",
    tagColor: "#f59e0b",
    intro: "AI 图片处理：风格迁移、背景替换、封面生成。",
    highlights: ["添加参考图和文字指令", "根据标题自动生成封面", "生成的图片直接关联草稿"],
  },
  {
    icon: <SendOutlined />,
    title: "一键发布",
    tag: "发布",
    tagColor: "#ef4444",
    intro: "对接创作者平台，支持图集和视频发布，多账号切换。",
    highlights: ["支持图集和视频作品发布", "立即发布和定时发布", "多账号一键切换"],
  },
  {
    icon: <ThunderboltOutlined />,
    title: "全自动运营",
    tag: "自动",
    tagColor: "#06b6d4",
    intro: "配置关键词和发布频率，搜索→采集→改写→发布全自动。",
    highlights: ["创建自动化任务", "设定发布频率和时段", "运行日志完整记录"],
  },
];

const PLANS = [
  { name: "免费版", subtitle: "个人体验", price: 0, accent: "#6b7280", features: ["单账号", "每日 50 条采集", "基础搜索", "内容库", "Excel 导出"] },
  { name: "专业版", subtitle: "中小团队", price: 99, accent: "#1668dc", popular: true, features: ["5 账号", "每日 500 条采集", "AI 改写", "AI 图片处理", "一键发布"] },
  { name: "企业版", subtitle: "矩阵霸屏", price: 299, accent: "#7c3aed", features: ["无限账号", "不限量采集", "AI 高级改写", "全自动运营", "API 接口"] },
];

const FAQ = [
  { q: "数据采集会被封号吗？", a: "使用官方接口模拟请求，配合合理频率有效降低风险。" },
  { q: "AI 改写效果如何？", a: "接入顶级模型，保留核心信息增强种草风格，支持自定义 Prompt。" },
  { q: "支持哪些发布类型？", a: "图集（最多 20 张）和视频均可发布，支持标题、正文、话题标签、定时发布。" },
  { q: "不满意可以退款吗？", a: "7 天免费试用，试用期内随时可取消。" },
];

export function MarketingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { mode: themeMode } = useThemeMode();
  const isDark = themeMode === "dark";
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const c = {
    bg: isDark ? "#09090b" : "#fafafa",
    heroBg: isDark ? "linear-gradient(135deg, #09090b 0%, #0f1729 40%, #09090b 100%)" : "linear-gradient(135deg, #fafafa 0%, #f0f5ff 40%, #fafafa 100%)",
    cardBg: isDark ? "#111113" : "#ffffff",
    cardBorder: isDark ? "#222226" : "#e5e5e5",
    navBg: isDark ? "rgba(9,9,11,0.85)" : "rgba(255,255,255,0.85)",
    navBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    t1: isDark ? "#ffffff" : "#18181b",
    t2: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
    t3: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
    statBg: isDark ? "#111113" : "#f9fafb",
    statBorder: isDark ? "#222226" : "#e5e5e5",
    faqBg: isDark ? "#111113" : "#f9fafb",
    btnOutlineBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    btnOutlineBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
    btnOutlineColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
    gradientText: "linear-gradient(135deg, #1668dc 0%, #7c3aed 50%, #f59e0b 100%)",
  };

  const handleCTA = () => {
    navigate(auth.isAuthenticated ? "/platforms/xhs/dashboard" : "/login", { replace: true });
  };

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif' }}>
      {/* Nav */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: isMobile ? "8px 12px" : "10px 28px",
        background: c.navBg, borderBottom: `1px solid ${c.navBorder}`,
        display: "flex", alignItems: "center",
      }}>
        <div style={{ flex: "0 0 auto", cursor: "pointer" }} onClick={() => navigate("/")}>
          <Space size={6}>
            <div style={{
              width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: 8,
              background: "linear-gradient(135deg, #1668dc, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: isMobile ? 14 : 18, color: "#fff",
            }}>X</div>
            {!isMobile && <Text strong style={{ color: c.t1, fontSize: 15 }}>小红书矩阵运营</Text>}
          </Space>
        </div>
        {!isMobile && <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {["功能", "定价", "FAQ"].map((n) => (
            <Text key={n} onClick={() => scrollTo(`#${n}`)} style={{ color: c.t2, fontSize: 14, cursor: "pointer", margin: "0 18px" }}>{n}</Text>
          ))}
        </div>}
        <div style={{ flex: "0 0 auto", marginLeft: "auto" }}>
          <Space size={isMobile ? 6 : 12}>
            <Button type="text" size={isMobile ? "small" : undefined} style={{ color: c.t2, fontSize: isMobile ? 13 : 14 }} onClick={() => navigate("/login")}>登录</Button>
            <Button type="primary" size={isMobile ? "small" : "small"} onClick={handleCTA} style={{ borderRadius: 8, fontWeight: 600 }}>
              {auth.isAuthenticated ? "工作台" : "免费注册"}
            </Button>
          </Space>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        padding: isMobile ? "100px 16px 60px" : "160px 28px 80px",
        textAlign: "center", background: c.heroBg,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: isDark ? "rgba(22,104,220,0.1)" : "rgba(22,104,220,0.06)",
          borderRadius: 20, padding: "5px 14px", marginBottom: isMobile ? 20 : 24,
        }}>
          <StarFilled style={{ color: "#f59e0b", fontSize: 12 }} />
          <Text style={{ color: "#1668dc", fontSize: isMobile ? 12 : 13, fontWeight: 600 }}>全新 2.0 · 十项能力升级</Text>
        </div>

        <Title level={1} style={{
          color: c.t1,
          fontSize: isMobile ? 32 : 52,
          fontWeight: 800, marginBottom: isMobile ? 16 : 24,
          lineHeight: 1.2,
        }}>
          小红书的<br />
          <span style={{ background: c.gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>自动化运营引擎</span>
        </Title>

        <Paragraph style={{
          color: c.t2, fontSize: isMobile ? 15 : 18,
          maxWidth: 600, margin: "0 auto 32px", padding: isMobile ? "0 8px" : 0,
        }}>
          把采集、分析、改写、发布装进一个面板。
        </Paragraph>

        <Space size={isMobile ? 8 : 16} wrap style={{ justifyContent: "center" }}>
          <Button type="primary" size={isMobile ? "middle" : "large"} icon={<RocketOutlined />} onClick={handleCTA}
            style={{
              height: isMobile ? 44 : 54, paddingInline: isMobile ? 28 : 44,
              fontSize: isMobile ? 14 : 17, fontWeight: 700, borderRadius: 14,
              background: "linear-gradient(135deg, #1668dc, #7c3aed)", border: "none",
              boxShadow: "0 8px 32px rgba(22,104,220,0.4)",
            }}>
            {auth.isAuthenticated ? "进入工作台" : "免费开始使用"}
          </Button>
          {!isMobile && (
            <Button size="large" icon={<PlayCircleOutlined />} onClick={() => scrollTo("#功能")}
              style={{
                height: 54, paddingInline: 32, fontSize: 16, borderRadius: 14,
                background: c.btnOutlineBg, border: `1px solid ${c.btnOutlineBorder}`, color: c.btnOutlineColor,
              }}>
              探索功能
            </Button>
          )}
        </Space>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 900, margin: "60px auto 0", padding: "0 28px" }}>
        <Row gutter={[16, 16]}>
          {[
            { v: "6", d: "大模块", color: "#1668dc" },
            { v: "12+", d: "签名逆向", color: "#7c3aed" },
            { v: "∞", d: "不限制采集", color: "#10b981" },
            { v: "24×7", d: "自动运行", color: "#f59e0b" },
          ].map((s, i) => (
            <Col xs={12} sm={6} key={i}>
              <div style={{ background: c.statBg, border: `1px solid ${c.statBorder}`, borderRadius: 16, padding: "28px 16px", textAlign: "center" }}>
                <Text strong style={{ color: s.color, fontSize: 36, fontWeight: 800, display: "block", marginBottom: 4 }}>{s.v}</Text>
                <Text style={{ color: c.t3, fontSize: 13 }}>{s.d}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Features */}
      <div id="功能" style={{ maxWidth: 1100, margin: "80px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Tag color="blue" style={{ borderRadius: 8, marginBottom: 16 }}>核心能力</Tag>
          <Title level={2} style={{ color: c.t1, fontWeight: 700 }}>一个面板，搞定全流程</Title>
        </div>

        <Row gutter={[20, 20]}>
          {FEATURES.map((f) => (
            <Col xs={24} sm={12} lg={8} key={f.title}>
              <Card style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 16, height: "100%" }} styles={{ body: { padding: "32px 28px" } }}>
                <FeatureIcon color={f.tagColor}>{f.icon}</FeatureIcon>
                <Tag color={f.tagColor} style={{ borderRadius: 6, marginBottom: 8 }}>{f.tag}</Tag>
                <Title level={4} style={{ color: c.t1, marginBottom: 8, fontSize: 18 }}>{f.title}</Title>
                <Paragraph style={{ color: c.t2, fontSize: 14, marginBottom: 16 }}>{f.intro}</Paragraph>
                <Space orientation="vertical" size={8}>
                  {f.highlights.map((h) => (
                    <Space key={h} size={8}><CheckCircleOutlined style={{ color: f.tagColor, fontSize: 13 }} /><Text style={{ color: c.t2, fontSize: 13 }}>{h}</Text></Space>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Workflow */}
      <div style={{ maxWidth: 1000, margin: "80px auto 0", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Tag color="blue" style={{ borderRadius: 8, marginBottom: 16 }}>四步上手</Tag>
          <Title level={2} style={{ color: c.t1, fontWeight: 700 }}>配置一次，长期自动运行</Title>
        </div>
        <Card style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 20 }} styles={{ body: { padding: "48px 32px" } }}>
          <Row gutter={[24, 32]}>
            {[
              { step: "01", icon: <SettingOutlined />, title: "绑定账号", desc: "Cookie 导入小红书 PC 端和创作者账号", color: "#1668dc" },
              { step: "02", icon: <SearchOutlined />, title: "搜索采集", desc: "输入关键词自动搜索并批量采集目标笔记", color: "#7c3aed" },
              { step: "03", icon: <EditOutlined />, title: "AI 改写", desc: "AI 自动改写标题正文，生成差异化原创内容", color: "#f59e0b" },
              { step: "04", icon: <RocketOutlined />, title: "自动发布", desc: "按设定频率自动发布，24×7 持续运营", color: "#10b981" },
            ].map((s, i) => (
              <Col xs={24} sm={12} md={6} key={i} style={{ textAlign: "center" }}>
                <Text style={{ color: s.color, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{s.step}</Text>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "16px auto" }}>
                  <Text style={{ color: s.color, fontSize: 22 }}>{s.icon}</Text>
                </div>
                <Title level={5} style={{ color: c.t1, marginBottom: 8, fontSize: 15 }}>{s.title}</Title>
                <Text style={{ color: c.t3, fontSize: 13 }}>{s.desc}</Text>
              </Col>
            ))}
          </Row>
        </Card>
      </div>

      {/* Pricing */}
      <div id="定价" style={{
        maxWidth: 1000,
        margin: isMobile ? "60px auto 0" : "80px auto 0",
        padding: isMobile ? "0 12px" : "0 28px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Tag color="blue" style={{ borderRadius: 8, marginBottom: 16 }}>定价</Tag>
          <Title level={2} style={{ color: c.t1, fontWeight: 700 }}>简单透明的方案选择</Title>
          <Paragraph style={{ color: c.t3 }}>7 天免费试用，随时升级或降级</Paragraph>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <div style={{ background: c.statBg, borderRadius: 14, padding: 4, display: "inline-flex", border: `1px solid ${c.statBorder}` }}>
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button key={cycle} onClick={() => setBillingCycle(cycle)}
                style={{ padding: "10px 28px", borderRadius: 11, border: "none", background: billingCycle === cycle ? "#1668dc" : "transparent", color: billingCycle === cycle ? "#fff" : c.t3, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {cycle === "monthly" ? "按月付费" : "按年付费"}
                {cycle === "yearly" && <span style={{ fontSize: 11, marginLeft: 6, color: billingCycle === cycle ? "#ffd700" : "#f59e0b" }}>省 18%</span>}
              </button>
            ))}
          </div>
        </div>

        <Row gutter={[20, 24]} justify="center">
          {PLANS.map((plan) => {
            const price = billingCycle === "monthly" ? plan.price : Math.round(plan.price * 0.82);
            return (
              <Col xs={24} md={8} key={plan.name}>
                <Card
                  style={{ background: plan.popular ? c.cardBg : "transparent", borderColor: plan.popular ? plan.accent : c.cardBorder, borderRadius: 20, height: "100%", transform: plan.popular && !isMobile ? "scale(1.04)" : "scale(1)" }}
                  styles={{ body: { padding: "36px 28px" } }}
                >
                  {plan.popular && (
                    <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg, ${plan.accent}, ${plan.accent}dd)`, color: "#fff", padding: "5px 22px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      最受欢迎
                    </div>
                  )}
                  <Text strong style={{ color: c.t1, fontSize: 20, display: "block", marginTop: plan.popular ? 8 : 0 }}>{plan.name}</Text>
                  <Text style={{ color: c.t3, fontSize: 13 }}>{plan.subtitle}</Text>
                  <div style={{ margin: "20px 0 16px", display: "flex", alignItems: "baseline" }}>
                    <Text style={{ color: plan.accent, fontSize: 48, fontWeight: 800 }}>¥{price}</Text>
                    <Text style={{ color: c.t3, fontSize: 14, marginLeft: 4 }}>/月</Text>
                  </div>
                  <Space orientation="vertical" size={12} style={{ marginBottom: 28 }}>
                    {plan.features.map((feat) => (
                      <Space key={feat} size={10}><CheckCircleOutlined style={{ color: plan.accent, fontSize: 15 }} /><Text style={{ color: c.t2, fontSize: 14 }}>{feat}</Text></Space>
                    ))}
                  </Space>
                  <Button type={plan.popular ? "primary" : "default"} block size="large" onClick={handleCTA}
                    style={{ height: 50, borderRadius: 14, fontWeight: 600, ...(plan.popular ? { background: `linear-gradient(135deg, ${plan.accent}, ${plan.accent}dd)`, border: "none" } : { background: c.btnOutlineBg, border: `1px solid ${c.btnOutlineBorder}`, color: c.btnOutlineColor }) }}>
                    {plan.price === 0 ? "免费试用" : "开始使用"}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* FAQ */}
      <div id="FAQ" style={{ maxWidth: 800, margin: "80px auto 0", padding: "0 28px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Tag color="blue" style={{ borderRadius: 8, marginBottom: 16 }}>FAQ</Tag>
          <Title level={2} style={{ color: c.t1, fontWeight: 700 }}>还有疑问？</Title>
        </div>
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          {FAQ.map((item, i) => (
            <Card key={i} style={{ background: c.faqBg, borderColor: c.cardBorder, borderRadius: 14 }} styles={{ body: { padding: "24px 28px" } }}>
              <Text strong style={{ color: c.t1, fontSize: 15, display: "block", marginBottom: 8 }}>Q: {item.q}</Text>
              <Text style={{ color: c.t2, fontSize: 14 }}>{item.a}</Text>
            </Card>
          ))}
        </Space>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: "center",
        padding: isMobile ? "60px 16px" : "80px 28px",
        background: c.heroBg,
      }}>
        <Title level={isMobile ? 3 : 2} style={{ color: c.t1, marginBottom: isMobile ? 12 : 16 }}>
          准备好让效率起飞了吗？
        </Title>
        <Paragraph style={{ color: c.t2, fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 24 : 32 }}>
          一个浏览器标签页，5 个工具的事。7 天免费试用，零风险上手。
        </Paragraph>
        <Space size={isMobile ? 8 : 16} wrap style={{ justifyContent: "center" }}>
          <Button type="primary" size={isMobile ? "middle" : "large"} icon={<RocketOutlined />} onClick={handleCTA}
            style={{
              height: isMobile ? 44 : 56, paddingInline: isMobile ? 24 : 48,
              fontSize: isMobile ? 14 : 18, fontWeight: 700, borderRadius: 16,
              background: "linear-gradient(135deg, #1668dc, #7c3aed)", border: "none",
              boxShadow: "0 8px 36px rgba(22,104,220,0.45)",
            }}>
            {auth.isAuthenticated ? "进入工作台" : "立即免费使用"}
          </Button>
          {!isMobile && (
            <Button size="large" icon={<ArrowRightOutlined />} onClick={() => navigate("/login")}
              style={{
                height: 56, paddingInline: 36, fontSize: 16, borderRadius: 16,
                background: c.btnOutlineBg, border: `1px solid ${c.btnOutlineBorder}`, color: c.btnOutlineColor,
              }}>
              已有账号？登录
            </Button>
          )}
        </Space>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "40px 28px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`, background: c.bg }}>
        <Space size={8}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #1668dc, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>X</div>
          <Text style={{ color: c.t3, fontSize: 13 }}>小红书矩阵运营 · 仅供学习交流</Text>
        </Space>
      </div>
    </div>
  );
}
