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
  const isDark = themeMode === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const bg = isDark ? "#0a0a0a" : "#f5f5f5";
  const cardBg = isDark ? "#1a1a1a" : "#ffffff";
  const cardBorder = isDark ? "#303030" : "#e8e8e8";
  const inputBg = isDark ? "#0a0a0a" : "#ffffff";
  const inputBorder = isDark ? "#303030" : "#d9d9d9";
  const textColor = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const placeholderColor = isDark ? "#8c8c8c" : "#bfbfbf";

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
    <div style={{
      minHeight: "100vh", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* 装饰光晕 */}
      <div style={{ position: "absolute", pointerEvents: "none", inset: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -160, right: -160, width: 400, height: 400,
          borderRadius: "50%", background: "#1668dc15",
          filter: "blur(80px)", animation: "loginBgFloat 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: -160, left: -160, width: 400, height: 400,
          borderRadius: "50%", background: "#4e8ff715",
          filter: "blur(80px)", animation: "loginBgFloat 10s ease-in-out infinite 1s",
        }} />
      </div>

      <div style={{
        width: "100%", maxWidth: isMobile ? 420 : 1000, position: "relative", zIndex: 10,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 24 : 48,
        alignItems: "center",
      }}>
        {/* 左侧：品牌介绍 */}
        {!isMobile && (<div style={{ animation: "loginLeft 0.6s ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #1668dc 0%, #4e8ff7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 14, color: "#fff",
              boxShadow: "0 4px 14px rgba(22,104,220,0.3)",
            }}>X</div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: textMuted }}>小红书矩阵运营</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>All in One</div>
            </div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, marginBottom: 16, color: isDark ? "#fff" : "#1a1a1a" }}>
            小红书运营<br />从抓取到发布一屏推进
          </h1>
          <p style={{ color: textMuted, fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
            数据发现、内容库、AI 改写、账号矩阵和 Creator 发布
            <br />统一在一个工作区里完成。
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { value: "128", label: "今日抓取" },
              { value: "14", label: "AI 草稿" },
              { value: "7", label: "待发布" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: isDark ? "#fff" : "#1a1a1a" }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 12, color: textMuted }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>)}

        {/* 右侧：登录表单 */}
        <div style={{
          borderRadius: 16, padding: "32px 28px",
          background: cardBg, border: `1px solid ${cardBorder}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          animation: "loginRight 0.6s ease-out 0.1s both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 15, color: textColor }}>
              {mode === "login" ? "平台登录" : "注册平台账号"}
            </span>
          </div>

          {/* Tab 切换 */}
          <div style={{
            display: "flex", borderRadius: 8, padding: 2, marginBottom: 24,
            background: isDark ? "#0a0a0a" : "#f0f0f0",
            border: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
          }}>
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(null); }}
                style={{
                  flex: 1, padding: "7px 0", fontSize: 13, fontWeight: 500,
                  border: "none", borderRadius: 6, cursor: "pointer",
                  transition: "all 0.2s",
                  background: mode === tab
                    ? isDark ? "#1668dc" : "#ffffff"
                    : "transparent",
                  color: mode === tab
                    ? "#ffffff"
                    : textMuted,
                  boxShadow: mode === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {tab === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 6, color: textColor }}>
                平台账号
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                autoComplete="username"
                style={{
                  width: "100%", padding: "10px 14px", fontSize: 14,
                  borderRadius: 8, border: `1px solid ${inputBorder}`,
                  background: inputBg, color: textColor,
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#1668dc"; e.target.style.boxShadow = "0 0 0 3px rgba(22,104,220,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 6, color: textColor }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={{
                  width: "100%", padding: "10px 14px", fontSize: 14,
                  borderRadius: 8, border: `1px solid ${inputBorder}`,
                  background: inputBg, color: textColor,
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#1668dc"; e.target.style.boxShadow = "0 0 0 3px rgba(22,104,220,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {mode === "register" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 6, color: textColor }}>
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 14,
                    borderRadius: 8, border: `1px solid ${inputBorder}`,
                    background: inputBg, color: textColor,
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#1668dc"; e.target.style.boxShadow = "0 0 0 3px rgba(22,104,220,0.15)"; }}
                  onBlur={(e) => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
                />
              </div>
            )}

            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", marginBottom: 16,
                borderRadius: 8, background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", fontSize: 13,
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
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
              style={{
                width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600,
                borderRadius: 8, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                background: "#1668dc", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: isSubmitting ? 0.6 : 1,
                transition: "all 0.2s",
                boxShadow: "0 4px 14px rgba(22,104,220,0.3)",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.background = "#4e8ff7"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1668dc"; e.currentTarget.style.transform = "none"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              {isSubmitting ? (
                <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
                </svg>
              ) : (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
              {mode === "login" ? "进入工作台" : "创建并进入"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: textMuted }}>
            {mode === "login"
              ? "登录后直接进入小红书工作台。"
              : "注册后自动进入小红书工作台。"}
          </p>
        </div>
      </div>
    </div>
  );
}