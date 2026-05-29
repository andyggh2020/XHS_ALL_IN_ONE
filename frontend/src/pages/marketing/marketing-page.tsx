import {
  Rocket, ChevronRight, Star, CheckCircle, ArrowRight,
  Search, Database, Bot, Image, Send, Zap, Settings, Edit3,
  BarChart3, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../hooks/use-auth";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useThemeMode } from "../../app/providers";
import { cn } from "../../lib/utils";

interface Feature {
  icon: React.ReactNode;
  title: string;
  tag: string;
  tagColor: string;
  intro: string;
  highlights: string[];
}

const FEATURES: Feature[] = [
  {
    icon: <Search size={24} />, title: "智能数据采集", tag: "PC 端", tagColor: "#1668dc",
    intro: "基于小红书 PC 端接口，关键词搜索、用户主页、笔记详情、评论区等多维度数据采集。",
    highlights: ["关键词搜索全站笔记", "批量采集无水印原图和高清视频", "笔记评论和互动数据"],
  },
  {
    icon: <Database size={24} />, title: "内容库管理", tag: "资产", tagColor: "#10b981",
    intro: "采集笔记统一沉淀到内容库，卡片/列表双视图，标签分类检索。",
    highlights: ["自动保存完整信息", "自定义标签分类", "JSON / CSV 批量导出"],
  },
  {
    icon: <Bot size={24} />, title: "AI 智能改写", tag: "大模型", tagColor: "#7c3aed",
    intro: "接入主流大模型，编辑器内完成标题、正文、标签全量改写。",
    highlights: ["支持多模型，自定义 API Key", "一键改写正文", "AI 生成吸睛标题和热门标签"],
  },
  {
    icon: <Image size={24} />, title: "AI 图片润色", tag: "视觉", tagColor: "#f59e0b",
    intro: "AI 图片处理：风格迁移、背景替换、封面生成。",
    highlights: ["添加参考图和文字指令", "根据标题自动生成封面", "生成的图片直接关联草稿"],
  },
  {
    icon: <Send size={24} />, title: "一键发布", tag: "发布", tagColor: "#ef4444",
    intro: "对接创作者平台，支持图集和视频发布，多账号切换。",
    highlights: ["支持图集和视频作品发布", "立即发布和定时发布", "多账号一键切换"],
  },
  {
    icon: <Zap size={24} />, title: "全自动运营", tag: "自动", tagColor: "#06b6d4",
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

  const handleCTA = () => {
    navigate(auth.isAuthenticated ? "/platforms/xhs/dashboard" : "/login", { replace: true });
  };

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = ["功能", "定价", "FAQ"];

  return (
    <div className="bg-background min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center px-4 sm:px-8 h-14">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff2442] to-[#ff6b81] flex items-center justify-center shrink-0 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" />
              </svg>
            </div>
            {!isMobile && <span className="font-semibold text-base">小红书助手</span>}
          </div>
          {!isMobile && (
            <div className="flex-1 flex justify-center gap-9">
              {navLinks.map((n) => (
                <button key={n} onClick={() => scrollTo(`#${n}`)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {n}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">登录</button>
            <Button size="sm" onClick={handleCTA}>
              {auth.isAuthenticated ? "工作台" : "免费注册"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-40 pb-12 sm:pb-16 text-center bg-background relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/5 via-purple-500/4 to-transparent blur-[120px]" />
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/8 to-pink-500/4 blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/8 to-cyan-500/4 blur-[100px]" />
        </div>

        <div className="relative px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 sm:mb-8">
            <Star size={12} className="text-amber-500" />
            <span className="text-xs sm:text-sm font-semibold text-primary">全新 2.0 · 十项能力升级</span>
          </div>

          <h1 className={cn(
            "font-extrabold leading-tight mb-5 sm:mb-7 tracking-tight",
            isMobile ? "text-[2.5rem]" : "text-[3.5rem] sm:text-[4rem]",
          )}>
            小红书助手<br />
            <span className="bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
              一个平台，管理所有
            </span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-9 sm:mb-11 leading-relaxed">
            集数据发现、内容库、AI 改写、自动发布于一体
            <br className="hidden sm:block" />
            把采集、分析、发布装进一个面板
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Button size={isMobile ? "default" : "lg"} className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white shadow-xl shadow-primary/25 border-0 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 transition-all px-6 sm:px-8" onClick={handleCTA}>
              <Rocket size={18} className="mr-1.5" />
              {auth.isAuthenticated ? "进入工作台" : "免费开始使用"}
            </Button>
            {!isMobile && (
              <Button size="lg" variant="outline" className="px-6 sm:px-8" onClick={() => scrollTo("#功能")}>
                <ChevronRight size={18} className="mr-1.5" />
                探索功能
              </Button>
            )}
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-10 sm:mt-12">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">1,200+</span> 创作者已在使用
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { v: "6", d: "大模块", color: "#2563eb" },
            { v: "12+", d: "签名逆向", color: "#7c3aed" },
            { v: "∞", d: "不限采集", color: "#10b981" },
            { v: "24×7", d: "自动运行", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.d} className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6 sm:p-8 text-center hover:bg-card/60 transition-colors">
              <p className="text-[2rem] sm:text-[2.5rem] font-extrabold tracking-tight" style={{ color: s.color }}>{s.v}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="功能" className="max-w-5xl mx-auto mt-20 sm:mt-24 px-4 sm:px-8">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4">核心能力</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">一个面板，搞定全流程</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card/80 backdrop-blur-lg p-7 sm:p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.tagColor}15`, color: f.tagColor }}>
                {f.icon}
              </div>
              <Badge variant="default" className="mb-2" style={{ background: `${f.tagColor}15`, color: f.tagColor, border: "none" }}>{f.tag}</Badge>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{f.intro}</p>
              <div className="space-y-2">
                {f.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: f.tagColor }} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-4xl mx-auto mt-20 sm:mt-24 px-4 sm:px-8">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4">四步上手</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">配置一次，长期自动运行</h2>
        </div>

        <div className="rounded-2xl border bg-card/80 backdrop-blur-lg p-8 sm:p-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { step: "01", icon: <Settings size={22} />, title: "绑定账号", desc: "Cookie 导入小红书 PC 端和创作者账号", color: "#1668dc" },
              { step: "02", icon: <Search size={22} />, title: "搜索采集", desc: "输入关键词自动搜索并批量采集目标笔记", color: "#7c3aed" },
              { step: "03", icon: <Edit3 size={22} />, title: "AI 改写", desc: "AI 自动改写标题正文，生成差异化原创内容", color: "#f59e0b" },
              { step: "04", icon: <Rocket size={22} />, title: "自动发布", desc: "按设定频率自动发布，24×7 持续运营", color: "#10b981" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <p className="text-xs font-bold tracking-widest mb-3" style={{ color: s.color }}>{s.step}</p>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${s.color}15`, color: s.color }}>
                  {s.icon}
                </div>
                <h4 className="font-semibold mb-2">{s.title}</h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="定价" className="max-w-4xl mx-auto mt-20 sm:mt-24 px-4 sm:px-8">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4">定价</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">简单透明的方案选择</h2>
          <p className="text-sm text-muted-foreground mt-2">7 天免费试用，随时升级或降级</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl border border-border p-1 bg-muted/30">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  "px-6 sm:px-8 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  billingCycle === cycle ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cycle === "monthly" ? "按月付费" : "按年付费"}
                {cycle === "yearly" && <span className="text-[11px] ml-1.5 text-amber-500">省 18%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const price = billingCycle === "monthly" ? plan.price : Math.round(plan.price * 0.82);
            return (
              <div
                key={plan.name}
                className={cn(
                  "rounded-2xl border bg-card/80 backdrop-blur-lg p-8 relative flex flex-col",
                  plan.popular && "ring-2 ring-primary shadow-xl scale-[1.03] z-10",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1668dc] to-[#1668dc] text-white px-6 py-1 rounded-full text-xs font-bold shadow-lg">
                    最受欢迎
                  </div>
                )}
                <h3 className={cn("text-xl font-bold", plan.popular && "mt-4")}>{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                <div className="flex items-baseline gap-1 my-5">
                  <span className="text-5xl font-extrabold" style={{ color: plan.accent }}>¥{price}</span>
                  <span className="text-sm text-muted-foreground">/月</span>
                </div>
                <div className="space-y-3 flex-1 mb-7">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: plan.accent }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className={cn("w-full", plan.popular && "bg-gradient-to-r from-[#1668dc] to-[#1668dc] border-0")}
                  onClick={handleCTA}
                >
                  {plan.price === 0 ? "免费试用" : "开始使用"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="FAQ" className="max-w-2xl mx-auto mt-20 sm:mt-24 px-4 sm:px-8 pb-10">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4">FAQ</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">还有疑问？</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border bg-card/50 backdrop-blur-lg p-5 sm:p-6">
              <p className="font-semibold mb-2">Q: {item.q}</p>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 sm:py-20 px-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="relative">
          <h2 className={cn("font-bold mb-3", isMobile ? "text-2xl" : "text-3xl")}>准备好让效率起飞了吗？</h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto">
            一个浏览器标签页，5 个工具的事。7 天免费试用，零风险上手。
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
            <Button size={isMobile ? "default" : "lg"} className="bg-gradient-to-r from-[#1668dc] to-[#7c3aed] text-white shadow-xl shadow-primary/30 border-0" onClick={handleCTA}>
              <Rocket size={18} className="mr-1.5" />
              {auth.isAuthenticated ? "进入工作台" : "立即免费使用"}
            </Button>
            {!isMobile && (
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                <ArrowRight size={18} className="mr-1.5" />
                已有账号？登录
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#ff2442] to-[#ff6b81] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" />
            </svg>
          </div>
          小红书助手 · 仅供学习交流
        </div>
      </footer>
    </div>
  );
}
