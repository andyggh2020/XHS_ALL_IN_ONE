import { Input, List, Modal, Tag, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { globalSearch, type SearchResult } from "../../lib/api";
import { useThemeColors } from "../../hooks/use-theme-colors";

const { Text } = Typography;

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "blue", uploading: "processing", publishing: "processing",
  published: "green", failed: "red", cancelled: "default", scheduled: "gold",
};

export function SearchModal({ open, onClose }: SearchModalProps) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const flatResultsRef = useRef<{ label: string; url: string }[]>([]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(query.trim());
        setResults(res);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
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
  flatResultsRef.current = flatItems;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatItems[selectedIndex]) {
      onClose();
      navigate(flatItems[selectedIndex].url);
    }
  };

  const hasAnyResult = results && (
    results.notes.length > 0 || results.accounts.length > 0 ||
    results.publish_jobs.length > 0 || results.tasks.length > 0
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      closable={false}
      destroyOnClose
      style={{ top: 80 }}
      styles={{
        body: { padding: "16px 0", background: c.cardBg, borderRadius: 12 },
      }}
    >
      <div style={{ padding: "0 16px 12px", borderBottom: `1px solid ${c.cardBorder}` }}>
        <Input
          ref={inputRef as any}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="搜索笔记、账号、发布任务..."
          variant="borderless"
          size="large"
          style={{ fontSize: 16 }}
          prefix={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
          suffix={
            <Tag style={{ marginRight: 0, fontSize: 11, lineHeight: "18px", borderRadius: 4 }}>
              ESC
            </Tag>
          }
        />
      </div>

      <div style={{ maxHeight: 400, overflow: "auto", padding: "8px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 24, color: c.textTertiary, fontSize: 13 }}>
            搜索中...
          </div>
        )}
        {!loading && query && !hasAnyResult && (
          <div style={{ textAlign: "center", padding: 32, color: c.textTertiary, fontSize: 13 }}>
            没有找到 "{query}" 的相关结果
          </div>
        )}
        {!loading && results && (() => {
          const groups = [
            { key: "笔记", items: results.notes, icon: "📝" },
            { key: "账号", items: results.accounts, icon: "🔗" },
            { key: "发布", items: results.publish_jobs, icon: "🚀" },
            { key: "任务", items: results.tasks, icon: "⚡" },
          ].filter((g) => g.items.length > 0);

          return groups.length > 0 ? (
            <List size="small" dataSource={groups} renderItem={(group) => (
              <>
                <div style={{ padding: "6px 16px", fontSize: 11, color: c.textTertiary, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                  {group.icon} {group.key}
                </div>
                {group.items.map((item, idx) => {
                  const flatIdx = flatItems.findIndex((f) => f.label.includes(item.title || item.nickname || item.task_type));
                  const isSelected = flatIdx === selectedIndex;
                  return (
                    <div
                      key={`${group.key}-${item.id}`}
                      onClick={() => { onClose(); navigate(item.url || ""); }}
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                      style={{
                        padding: "8px 16px 8px 24px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: isSelected ? (c.isDark ? "rgba(22,104,220,0.12)" : "rgba(22,104,220,0.06)") : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <Text ellipsis style={{ flex: 1, fontSize: 13, color: c.textPrimary }}>
                        {"title" in item ? item.title : "nickname" in item ? item.nickname : item.task_type}
                      </Text>
                      <Text style={{ fontSize: 11, color: c.textTertiary, flexShrink: 0 }}>
                        {"status" in item ? STATUS_COLORS[item.status] || item.status : ""}
                      </Text>
                    </div>
                  );
                })}
              </>
            )} />
          ) : null;
        })()}
      </div>

      {results && (
        <div style={{ padding: "8px 16px 0", borderTop: `1px solid ${c.cardBorder}`, display: "flex", gap: 16, justifyContent: "center", color: c.textMuted, fontSize: 11 }}>
          <span>↑↓ 导航</span>
          <span>↵ 跳转</span>
          <span>Esc 关闭</span>
        </div>
      )}
    </Modal>
  );
}
