import { MessageSquare, Smartphone, UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { CookieImportPanel } from "./cookie-import-panel";
import { PhoneLoginPanel } from "./phone-login-panel";
import { QrLoginPanel } from "./qr-login-panel";
import type { PlatformAccount } from "../../types";
import { useToast } from "../ui/toast";

type AddAccountDrawerProps = {
  open: boolean;
  onClose: () => void;
  onBound: () => void;
};

type AccountType = "pc" | "creator";
type LoginMethod = "qr" | "phone" | "cookie";

const loginMethods: { key: LoginMethod; label: string; icon: React.ReactNode }[] = [
  { key: "qr", label: "二维码", icon: <Smartphone size={16} /> },
  { key: "phone", label: "手机验证码", icon: <MessageSquare size={16} /> },
  { key: "cookie", label: "Cookie", icon: <UserPlus size={16} /> },
];

export function AddAccountDrawer({ open, onClose, onBound }: AddAccountDrawerProps) {
  const toast = useToast();
  const [accountType, setAccountType] = useState<AccountType>("pc");
  const [method, setMethod] = useState<LoginMethod>("qr");

  const handleConfirmed = useCallback((account: PlatformAccount) => {
    const actionText = account.action === "updated" ? "已更新到账号矩阵" : "已加入账号矩阵";
    toast.success(`${account.nickname || "账号"} ${actionText}`);
    onBound();
  }, [onBound, toast]);

  return (
    <Dialog open={open} onClose={onClose} width={440}>
      <DialogHeader onClose={onClose}>
        <div>
          <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-0.5">XHS Account</p>
          <DialogTitle>添加小红书账号</DialogTitle>
        </div>
      </DialogHeader>

      <DialogBody className="space-y-5">
        {/* Account type toggle */}
        <div className="inline-flex rounded-xl border border-border p-0.5 bg-muted/50 w-full">
          {(["pc", "creator"] as const).map((type) => {
            const active = accountType === type;
            return (
              <button
                key={type}
                onClick={() => setAccountType(type)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {type === "pc" ? "PC 端账号" : "Creator 账号"}
              </button>
            );
          })}
        </div>

        {/* Login method */}
        <div className="inline-flex rounded-xl border border-border p-0.5 bg-muted/50 w-full">
          {loginMethods.map((m) => {
            const active = method === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {m.icon} {m.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        {method === "qr" ? (
          <QrLoginPanel accountType={accountType} onConfirmed={handleConfirmed} />
        ) : method === "cookie" ? (
          <CookieImportPanel accountType={accountType} onImported={handleConfirmed} />
        ) : (
          <PhoneLoginPanel accountType={accountType} onConfirmed={handleConfirmed} />
        )}
      </DialogBody>
    </Dialog>
  );
}
