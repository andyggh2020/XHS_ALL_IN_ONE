import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PlatformSelector } from "../../components/layout/platform-selector";
import { useAuth } from "../../hooks/use-auth";
import { fetchPlatforms } from "../../lib/api";
import { fallbackPlatforms } from "../../lib/platforms";
import type { PlatformMeta } from "../../types";

export function PlatformSelectPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState<PlatformMeta[]>(fallbackPlatforms);

  useEffect(() => {
    fetchPlatforms().then(setPlatforms);
  }, []);

  const handleSelectPlatform = (id: string) => {
    navigate(`/platforms/${id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background p-10">
      <div className="max-w-[960px] mx-auto">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-1">Choose Workspace</p>
            <h2 className="text-2xl font-bold mb-1">选择平台工作区</h2>
            <p className="text-sm text-muted-foreground">小红书已开放，其它平台保留扩展入口。</p>
          </div>
          <button
            onClick={() => void auth.logout()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>

        <PlatformSelector onSelect={handleSelectPlatform} />
      </div>
    </div>
  );
}
