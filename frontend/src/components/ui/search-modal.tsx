import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Dialog } from "./dialog";
import { globalSearch, type SearchResult } from "../../lib/api";
import { cn } from "../../lib/utils";

type SearchModalProps = { open: boolean; onClose: () => void };

const STATUS_COLORS: Record<string, string> = {
  pending: "blue", uploading: "processing", publishing: "processing",
  published: "green", failed: "red", cancelled: "default", scheduled: "gold",
};

export function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) { setQuery(""); setResults(null); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const res = await globalSearch(query.trim()); setResults(res); }
      catch { setResults(null); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const flatItems = (() => {
    if (!results) return [];
    const items: { label: string; url: string; group: string }[] = [];
    results.notes.forEach((n) => items.push({ label: `📝 ${n.title}`, url: n.url, group: "笔记" }));
    results.accounts.forEach((a) => items.push({ label: `🔗 ${a.nickname} (${a.sub_type})`, url: a.url, group: "账号" }));
    results.publish_jobs.forEach((j) => items.push({ label: `🚀 ${j.title} [${j.status}]`, url: j.url, group: "发布" }));
    results.tasks.forEach((t) => items.push({ label: `⚡ ${t.task_type} [${t.status}]`, url: t.url, group: "任务" }));
    return items;
  })();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && flatItems[selectedIndex]) { onClose(); navigate(flatItems[selectedIndex].url); }
  };

  const hasAnyResult = results && (results.notes.length > 0 || results.accounts.length > 0 || results.publish_jobs.length > 0 || results.tasks.length > 0);

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-4 pb-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="搜索笔记、账号、发布任务..."
            className="w-full h-11 pl-10 pr-16 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-mono">ESC</kbd>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {loading && <div className="text-center py-8 text-sm text-muted-foreground">搜索中...</div>}
        {!loading && query && !hasAnyResult && <div className="text-center py-8 text-sm text-muted-foreground">没有找到相关结果</div>}
        {!loading && results && (() => {
          const groups = [
            { key: "笔记", items: results.notes, icon: "📝", labelKey: "title" as const },
            { key: "账号", items: results.accounts, icon: "🔗", labelKey: "nickname" as const },
            { key: "发布", items: results.publish_jobs, icon: "🚀", labelKey: "title" as const },
            { key: "任务", items: results.tasks, icon: "⚡", labelKey: "task_type" as const },
          ].filter((g) => g.items.length > 0);
          return groups.length > 0 ? (
            <div>
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{group.icon} {group.key}</div>
                  {group.items.map((item: any) => {
                    const label = item[group.labelKey] || "";
                    const flatIdx = flatItems.findIndex((f) => f.label.includes(label));
                    const isSelected = flatIdx === selectedIndex;
                    return (
                      <div key={`${group.key}-${item.id}`} onClick={() => { onClose(); navigate(item.url || ""); }} onMouseEnter={() => setSelectedIndex(flatIdx)}
                        className={cn("flex items-center gap-2 px-6 py-2.5 cursor-pointer rounded-lg transition-colors", isSelected ? "bg-primary/10" : "hover:bg-accent")}>
                        <span className="flex-1 text-sm truncate">{label}</span>
                        {item.status && <span className="text-xs text-muted-foreground shrink-0">{STATUS_COLORS[item.status] || item.status}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null;
        })()}
      </div>

      {results && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
          <span>↑↓ 导航</span><span>↵ 跳转</span><span>Esc 关闭</span>
        </div>
      )}
    </Dialog>
  );
}
