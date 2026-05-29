import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../../hooks/use-auth";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useThemeMode } from "../../app/providers";

const credentialsSchema = z.object({
  username: z.string().trim().min(3, "账号至少 3 个字符").max(80, "账号不能超过 80 个字符"),
  password: z.string().min(6, "密码至少 6 个字符").max(128, "密码不能超过 128 个字符"),
});

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function LoginPage() {
  const auth = useAuth();
  const { mode: themeMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    setError(null);
    const parsed = credentialsSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "请检查账号和密码。");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === "login") await auth.login(parsed.data);
      else await auth.register(parsed.data);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || "/platforms/xhs/dashboard", { replace: true });
    } catch (caughtError) {
      setError(errorMessage(caughtError, mode === "login" ? "账号不存在或密码错误" : "注册失败，请稍后重试"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Back to home */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors z-10 px-3 py-1.5 rounded-lg hover:bg-accent"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
        </svg>
        回到首页
      </button>
      {/* Decorative orbs */}
      <div className="login-orb-blue" />
      <div className="login-orb-purple" />
      <div className="login-orb-pink" />
      {/* Dot grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className="w-full relative z-10"
        style={{
          maxWidth: isMobile ? 420 : 1000,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 24 : 48,
          alignItems: "center",
        }}
      >
        {/* Left: Brand */}
        {!isMobile && (
          <div className="space-y-8" style={{ animation: "slideUp 0.6s ease-out" }}>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ff2442] to-[#ff6b81] flex items-center justify-center shrink-0 shadow-lg"
                style={{ boxShadow: "0 4px 20px rgba(255,36,66,0.35)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground">小红书助手</div>
                <div className="text-sm font-bold text-gradient-brand">All in One</div>
              </div>
            </div>

            {/* Hero */}
            <h1 className="text-[32px] font-bold leading-[1.3] tracking-tight">
              小红书运营<br />
              <span className="text-gradient-brand">从抓取到发布一屏推进</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              数据发现、内容库、AI 改写、账号矩阵和 Creator 发布<br />
              统一在一个工作区里完成。
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              {[
                { value: "128", label: "今日抓取", color: "var(--primary)" },
                { value: "14", label: "AI 草稿", color: "var(--purple)" },
                { value: "7", label: "待发布", color: "var(--pink)" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[28px] font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: Form Card */}
        <div
          className="rounded-2xl border bg-card/90 backdrop-blur-xl p-8 shadow-xl"
          style={{ animation: "scaleIn 0.5s ease-out 0.1s both" }}
        >
          {/* Lock icon + title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)]/15 to-[var(--purple)]/15 flex items-center justify-center ring-1 ring-[var(--primary)]/10">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold">{mode === "login" ? "平台登录" : "注册平台账号"}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {mode === "login" ? "输入账号密码登录工作台" : "创建一个新账号"}
              </p>
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="relative flex rounded-xl p-1 mb-6 bg-muted/80 border border-border/50">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(null); }}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative z-10"
                style={{
                  color: mode === tab ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                {tab === "login" ? "登录" : "注册"}
              </button>
            ))}
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--purple)] transition-all duration-200 shadow-sm"
              style={{ left: mode === "login" ? 4 : "calc(50% + 2px)" }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">平台账号</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                autoComplete="username"
                className="flex h-11 w-full rounded-xl border border-input bg-background/60 px-4 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_var(--primary-ring)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="flex h-11 w-full rounded-xl border border-input bg-background/60 px-4 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_var(--primary-ring)] transition-all"
              />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                  className="flex h-11 w-full rounded-xl border border-input bg-background/60 px-4 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_var(--primary-ring)] transition-all"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={auth.isChecking || isSubmitting}
              className="relative w-full h-11 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--purple)] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
              {mode === "login" ? "进入工作台" : "创建并进入"}
            </button>
          </form>

          <p className="text-center mt-5 text-xs text-muted-foreground">
            {mode === "login"
              ? "登录后直接进入小红书工作台。"
              : "注册后自动进入小红书工作台。"}
          </p>
        </div>
      </div>
    </div>
  );
}
