import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { importXhsCookieAccount } from "../../lib/api";
import type { PlatformAccount } from "../../types";

type CookieImportPanelProps = {
  accountType: "pc" | "creator";
  onImported: (account: PlatformAccount) => void;
};

export function CookieImportPanel({ accountType, onImported }: CookieImportPanelProps) {
  const toast = useToast();
  const [cookieString, setCookieString] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncCreator, setSyncCreator] = useState(false);

  async function handleImport() {
    setError(null);
    if (!cookieString.includes("=")) {
      setError("请粘贴完整 Cookie 字符串。");
      return;
    }

    setIsSubmitting(true);
    try {
      const account = await importXhsCookieAccount({
        sub_type: accountType,
        cookie_string: cookieString.trim(),
        sync_creator: accountType === "pc" ? syncCreator : undefined
      });
      onImported(account);
      setCookieString("");
    } catch {
      setError("Cookie 无效或已过期。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">Cookie 字符串</label>
        <textarea
          value={cookieString}
          onChange={(e) => setCookieString(e.target.value)}
          placeholder="a1=...; web_session=...;"
          rows={6}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_var(--primary-ring)] transition-all placeholder:text-muted-foreground/60 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">从浏览器开发者工具中复制完整的 Cookie 字符串</p>
      </div>

      {accountType === "pc" && (
        <label className="flex items-center gap-2.5 cursor-pointer px-1 py-1.5 rounded-lg hover:bg-surface-hover transition-colors">
          <input
            type="checkbox"
            checked={syncCreator}
            onChange={(e) => setSyncCreator(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/30 bg-[var(--surface)]"
          />
          <span className="text-sm text-muted-foreground">导入 PC Cookie 后同步 Creator 账号</span>
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

      <Button onClick={handleImport} disabled={isSubmitting} className="w-full">
        <Download size={16} className="mr-1.5" />
        {isSubmitting ? "校验中..." : "校验并导入"}
      </Button>
    </div>
  );
}
