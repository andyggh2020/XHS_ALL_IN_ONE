import { RefreshCw } from "lucide-react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { createXhsCreatorQrLoginSession, createXhsPcQrLoginSession, pollXhsLoginSession } from "../../lib/api";
import type { PlatformAccount, XhsQrLoginSession } from "../../types";

type QrLoginPanelProps = {
  accountType: "pc" | "creator";
  onConfirmed: (account: PlatformAccount) => void;
};

export function QrLoginPanel({ accountType, onConfirmed }: QrLoginPanelProps) {
  const [session, setSession] = useState<XhsQrLoginSession | null>(null);
  const [statusText, setStatusText] = useState("准备生成二维码");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncCreator, setSyncCreator] = useState(false);
  const confirmedRef = useRef(false);

  function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "string" && detail) return detail;
    }
    return "二维码生成失败，请稍后重试。";
  }

  async function startSession() {
    setIsLoading(true);
    setError(null);
    confirmedRef.current = false;
    try {
      const nextSession =
        accountType === "pc"
          ? await createXhsPcQrLoginSession({ sync_creator: syncCreator })
          : await createXhsCreatorQrLoginSession();
      setSession(nextSession);
      setStatusText(accountType === "pc" ? "请使用小红书 App 扫描二维码" : "请使用小红书 App 扫描 Creator 二维码");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void startSession(); }, [accountType, syncCreator]);

  useEffect(() => {
    if (!session?.session_id || session.status === "confirmed" || session.status === "expired") return;

    const interval = window.setInterval(async () => {
      try {
        const polled = await pollXhsLoginSession(session.session_id);
        setSession((current) => ({
          ...polled,
          qr_image_data_url: polled.qr_image_data_url ?? current?.qr_image_data_url
        }));
        if (polled.status === "scanned") {
          setStatusText("已扫码，请在手机端确认登录");
        } else if (polled.status === "expired") {
          setStatusText("二维码已过期，请刷新");
        } else if (polled.status === "confirmed" && polled.account && !confirmedRef.current) {
          confirmedRef.current = true;
          setStatusText("账号绑定成功");
          onConfirmed(polled.account);
        }
      } catch { /* silent */ }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [accountType, onConfirmed, session?.session_id, session?.status]);

  return (
    <div className="space-y-5">
      {/* QR Code */}
      <div className="flex items-center justify-center p-5 min-h-[200px] rounded-2xl border-2 border-dashed border-border/60 bg-[var(--surface-block)]">
        {session?.qr_image_data_url ? (
          <img
            src={session.qr_image_data_url}
            alt="小红书登录二维码"
            className="w-[168px] h-[168px] rounded-xl bg-white p-2.5 shadow-lg"
          />
        ) : (
          <div className="w-[168px] h-[168px] flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground/40 text-3xl font-bold tracking-widest border border-border/30">
            QR
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-medium">{statusText}</p>
        {session?.qr_url && (
          <a href={session.qr_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            打开二维码链接
          </a>
        )}
      </div>

      {accountType === "pc" && (
        <label className="flex items-center gap-2.5 cursor-pointer px-1 py-1.5 rounded-lg hover:bg-surface-hover transition-colors">
          <input
            type="checkbox"
            checked={syncCreator}
            onChange={(e) => setSyncCreator(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground">登录 PC 后同步 Creator 账号</span>
        </label>
      )}

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <Button onClick={startSession} disabled={isLoading} variant="outline" className="w-full">
        <RefreshCw size={16} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "生成中..." : "刷新二维码"}
      </Button>
    </div>
  );
}
