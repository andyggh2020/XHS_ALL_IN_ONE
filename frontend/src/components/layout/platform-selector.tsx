import { ArrowRight } from "lucide-react";
import { useThemeColors } from "../../hooks/use-theme-colors";

type PlatformItem = {
  id: string;
  name: string;
  icon: string;
  status: "active" | "coming";
  color: string;
};

const platforms: PlatformItem[] = [
  { id: "xhs", name: "小红书", icon: "📕", status: "active", color: "#ff2442" },
  { id: "douyin", name: "抖音", icon: "🎵", status: "coming", color: "#000000" },
  { id: "bilibili", name: "Bilibili", icon: "📺", status: "coming", color: "#fb7299" },
  { id: "weibo", name: "微博", icon: "📱", status: "coming", color: "#ff8200" },
  { id: "zhihu", name: "知乎", icon: "💡", status: "coming", color: "#0084ff" },
  { id: "ks", name: "快手", icon: "🎬", status: "coming", color: "#ff6f00" },
];

type Props = {
  onSelect: (id: string) => void;
};

export function PlatformSelector({ onSelect }: Props) {
  const c = useThemeColors();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {platforms.map((p) => {
        const isActive = p.status === "active";
        return (
          <div
            key={p.id}
            onClick={() => isActive && onSelect(p.id)}
            className="group relative rounded-2xl border p-6 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            style={{
              background: c.cardBg,
              borderColor: isActive ? c.cardBorder : "rgba(255,255,255,0.06)",
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: c.textPrimary }}>{p.name}</h3>
                  {!isActive && <span className="text-xs text-muted-foreground">即将开放</span>}
                </div>
              </div>
              {isActive && (
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
            {isActive && (
              <div className="mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: `${p.color}15`, color: p.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                  已接入
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
