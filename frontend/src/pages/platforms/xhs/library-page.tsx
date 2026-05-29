import { useEffect, useState } from "react";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import { ErrorBanner, MessageBanner } from "../../../components/ui/status-banners";
import { LibraryEmpty } from "../../../components/ui/empty-states";
import { Link, useNavigate } from "react-router-dom";

import {
  batchCreateDraftsFromNotes,
  batchTagNotes,
  createDraftFromNote,
  createTag,
  deleteSavedNote,
  downloadExportFile,
  exportSavedNotes,
  fetchSavedNote,
  fetchSavedNoteAssets,
  fetchSavedNoteComments,
  fetchSavedNotes,
  fetchTags,
} from "../../../lib/api";
import { formatShanghaiTime } from "../../../lib/time";
import type { NoteAsset, NoteComment, NotesExportResponse, SavedNote, Tag as TagType } from "../../../types";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Spinner } from "../../../components/ui/skeletons";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";

function formatSavedTime(v: string): string { return formatShanghaiTime(v); }
function getRawNoteType(note: SavedNote): string { const t = note.raw_json?.model_type ?? note.raw_json?.type; return typeof t === "string" ? t : "note"; }
function getNotePublishTime(note: SavedNote): string {
  const raw = note.raw_json ?? {};
  const data = (raw.data && typeof raw.data === "object") ? raw.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const item = (items[0] && typeof items[0] === "object") ? items[0] as Record<string, unknown> : {};
  const card = (item.note_card && typeof item.note_card === "object") ? item.note_card as Record<string, unknown> : {};
  const ts = card.time ?? card.create_time ?? card.last_update_time ?? raw.time ?? raw.create_time;
  if (ts) {
    const n = typeof ts === "number" ? ts : Number(ts);
    if (Number.isFinite(n) && n > 0) return new Date(n > 1e12 ? n : n * 1000).toLocaleDateString("zh-CN");
  }
  return "";
}
function getNoteUrl(note: SavedNote): string {
  const raw = note.raw_json ?? {};
  for (const key of ["note_url", "url", "share_url"]) {
    const v = raw[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  const data = (raw.data && typeof raw.data === "object") ? raw.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const item = (items[0] && typeof items[0] === "object") ? items[0] as Record<string, unknown> : {};
  const card = (item.note_card && typeof item.note_card === "object") ? item.note_card as Record<string, unknown> : {};
  for (const obj of [card, item]) {
    const xsec = obj.xsec_token;
    if (typeof xsec === "string" && xsec) {
      const src = (typeof obj.xsec_source === "string" ? obj.xsec_source : "") || "pc_feed";
      return `https://www.xiaohongshu.com/explore/${note.note_id}?xsec_token=${xsec}&xsec_source=${src}`;
    }
    for (const k of ["note_url", "url", "share_url"]) {
      const v = obj[k];
      if (typeof v === "string" && v.startsWith("http")) return v;
    }
  }
  return `https://www.xiaohongshu.com/explore/${note.note_id}`;
}
function getAuthorProfileUrl(note: SavedNote): string {
  const raw = note.raw_json ?? {};
  const directId = raw.author_id;
  if (typeof directId === "string" && directId) return `https://www.xiaohongshu.com/user/profile/${directId}`;
  const data = (raw.data && typeof raw.data === "object") ? raw.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const item = (items[0] && typeof items[0] === "object") ? items[0] as Record<string, unknown> : {};
  const card = (item.note_card && typeof item.note_card === "object") ? item.note_card as Record<string, unknown> : {};
  const user = (card.user && typeof card.user === "object") ? card.user as Record<string, unknown> : {};
  const uid = user.user_id ?? user.id;
  if (typeof uid === "string" && uid) return `https://www.xiaohongshu.com/user/profile/${uid}`;
  return "";
}
function getNoteTags(note: SavedNote): string[] {
  const raw = note.raw_json ?? {};
  const directList = raw.tag_list ?? raw.tags;
  if (Array.isArray(directList) && directList.length > 0) {
    return directList.map((t: unknown) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object" && "name" in (t as Record<string, unknown>)) return String((t as Record<string, unknown>).name);
      return "";
    }).filter(Boolean);
  }
  const data = (raw.data && typeof raw.data === "object") ? raw.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const item = (items[0] && typeof items[0] === "object") ? items[0] as Record<string, unknown> : {};
  const card = (item.note_card && typeof item.note_card === "object") ? item.note_card as Record<string, unknown> : {};
  const nestedList = card.tag_list;
  if (Array.isArray(nestedList) && nestedList.length > 0) {
    return nestedList.map((t: unknown) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object" && "name" in (t as Record<string, unknown>)) return String((t as Record<string, unknown>).name);
      return "";
    }).filter(Boolean);
  }
  return [];
}
function getNoteEngagement(note: SavedNote): { likes: number; collects: number; comments: number; shares: number } {
  const raw = note.raw_json ?? {};
  const likes = Number(raw.liked_count ?? raw.likes ?? 0);
  const collects = Number(raw.collected_count ?? raw.collects ?? 0);
  const comments = Number(raw.comment_count ?? raw.comments ?? 0);
  const shares = Number(raw.share_count ?? raw.shares ?? 0);
  if (likes || collects || comments || shares) return { likes, collects, comments, shares };
  const data = (raw.data && typeof raw.data === "object") ? raw.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const item = (items[0] && typeof items[0] === "object") ? items[0] as Record<string, unknown> : {};
  const card = (item.note_card && typeof item.note_card === "object") ? item.note_card as Record<string, unknown> : {};
  const info = (card.interact_info && typeof card.interact_info === "object") ? card.interact_info as Record<string, unknown> : {};
  return {
    likes: Number(info.liked_count ?? 0),
    collects: Number(info.collected_count ?? 0),
    comments: Number(info.comment_count ?? 0),
    shares: Number(info.share_count ?? 0),
  };
}
function rawString(note: SavedNote, keys: string[]): string { for (const k of keys) { const v = note.raw_json?.[k]; if (typeof v === "string" && v) return v; } return ""; }
function getSavedNoteCoverUrl(note: SavedNote): string { return note.cover_url || note.asset_urls?.[0] || rawString(note, ["cover_url", "image_url"]); }

export function XhsLibraryPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<SavedNote | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<NoteAsset[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailActionMessage, setDetailActionMessage] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [tagActionMessage, setTagActionMessage] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<NoteComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("");
  const [hasAssetsFilter, setHasAssetsFilter] = useState(false);
  const [hasCommentsFilter, setHasCommentsFilter] = useState(false);
  const [viewMode, setViewMode] = useState<string>("card");
  const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
  const [batchTagId, setBatchTagId] = useState<string>("");
  const [batchActionMessage, setBatchActionMessage] = useState<string | null>(null);
  const [isBatchWorking, setIsBatchWorking] = useState(false);
  const [latestExport, setLatestExport] = useState<NotesExportResponse | null>(null);
  const [selectedPreviewAsset, setSelectedPreviewAsset] = useState<NoteAsset | null>(null);

  const selectedNoteIdSet = new Set(selectedNoteIds);

  async function loadNotes(overrideFilters?: { q?: string; tag_id?: number; has_assets?: boolean; has_comments?: boolean }) {
    setIsLoading(true); setError(null);
    const f = overrideFilters ?? { q: keywordFilter.trim() || undefined, tag_id: selectedTagFilter ? Number(selectedTagFilter) : undefined, has_assets: hasAssetsFilter || undefined, has_comments: hasCommentsFilter || undefined };
    try {
      const r = await fetchSavedNotes({ platform: "xhs", ...f });
      setNotes(r.items); setTotal(r.total);
      const ids = new Set(r.items.map((n) => n.id));
      setSelectedNoteIds((c) => c.filter((id) => ids.has(id)));
    } catch { setError("内容库加载失败。"); } finally { setIsLoading(false); }
  }

  useEffect(() => { void loadNotes(); void loadTags(); }, []);

  function clearFilters() { setKeywordFilter(""); setSelectedTagFilter(""); setHasAssetsFilter(false); setHasCommentsFilter(false); void loadNotes({}); }
  function toggleNoteSelection(id: number) { setSelectedNoteIds((c) => c.includes(id) ? c.filter((i) => i !== id) : [...c, id]); }
  function toggleVisibleSelection() { if (!notes.length) return; const vis = notes.map((n) => n.id); const allSel = vis.every((id) => selectedNoteIdSet.has(id)); setSelectedNoteIds((c) => allSel ? c.filter((id) => !vis.includes(id)) : Array.from(new Set([...c, ...vis]))); }
  function clearSelection() { setSelectedNoteIds([]); setBatchActionMessage(null); }

  async function loadTags() { try { const r = await fetchTags(); setAvailableTags(r.items); } catch { setAvailableTags([]); } }

  async function openDetail(note: SavedNote) {
    setIsDetailOpen(true); setSelectedNote(note); setDetailError(null); setDetailActionMessage(null); setTagActionMessage(null); resetComments(); setIsDetailLoading(true);
    try { const [d, a] = await Promise.all([fetchSavedNote(note.id), fetchSavedNoteAssets(note.id)]); setSelectedNote(d); setSelectedAssets(a.items); }
    catch { setDetailError("笔记详情加载失败。"); } finally { setIsDetailLoading(false); }
  }
  function closeDetail() { setIsDetailOpen(false); setDetailError(null); setDetailActionMessage(null); setTagActionMessage(null); setSelectedAssets([]); resetComments(); }
  function resetComments() { setIsCommentsOpen(false); setComments([]); setCommentsTotal(0); setCommentsPage(1); setIsCommentsLoading(false); setCommentsError(null); }

  async function copySelectedNote() {
    if (!selectedNote) return;
    try { await navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`.trim()); setDetailActionMessage("已复制标题和正文。"); }
    catch { setDetailActionMessage("复制失败。"); }
  }

  async function createDraft(intent: "rewrite" | "publish") {
    if (!selectedNote) return; setIsCreatingDraft(true); setDetailActionMessage(null);
    try {
      const d = await createDraftFromNote({ platform: "xhs", source_note_id: selectedNote.id, intent });
      setDetailActionMessage(intent === "rewrite" ? `已创建草稿 #${d.id}，正在跳转...` : `已创建草稿 #${d.id}，正在跳转...`);
      setTimeout(() => navigate("/platforms/xhs/drafts"), 600);
    }
    catch { setDetailActionMessage("草稿创建失败。"); } finally { setIsCreatingDraft(false); }
  }

  async function addToDrafts() {
    if (!selectedNote) return; setIsCreatingDraft(true); setDetailActionMessage(null);
    try {
      const d = await createDraftFromNote({ platform: "xhs", source_note_id: selectedNote.id, intent: "rewrite" });
      setDetailActionMessage(`已加入草稿工坊，草稿 #${d.id}。`);
    }
    catch { setDetailActionMessage("加入草稿工坊失败。"); } finally { setIsCreatingDraft(false); }
  }

  async function handleDeleteNote(note: SavedNote) {
    if (!window.confirm("确定删除？相关素材、评论和标签关系也会一起删除。")) return;
    try {
      await deleteSavedNote(note.id);
      setNotes((c) => c.filter((n) => n.id !== note.id));
      setSelectedNoteIds((c) => c.filter((id) => id !== note.id));
      setTotal((c) => Math.max(0, c - 1));
      if (selectedNote?.id === note.id) closeDetail();
      setBatchActionMessage("已删除笔记。");
    } catch { setBatchActionMessage("删除失败。"); }
  }

  function selectedNoteHasTag(tagId: number): boolean { return Boolean(selectedNote?.tags?.some((t) => t.id === tagId)); }
  function replaceNoteInList(u: SavedNote) { setNotes((c) => c.map((n) => n.id === u.id ? u : n)); }
  function replaceNotesInList(us: SavedNote[]) { const m = new Map(us.map((n) => [n.id, n])); setNotes((c) => c.map((n) => m.get(n.id) ?? n)); if (selectedNote) { const u = m.get(selectedNote.id); if (u) setSelectedNote(u); } }

  async function applyBatchTag(mode: "add" | "remove") {
    if (!selectedNoteIds.length) { setBatchActionMessage("请先选择笔记。"); return; }
    if (!batchTagId) { setBatchActionMessage("请选择一个标签。"); return; }
    setIsBatchWorking(true); setBatchActionMessage(null);
    try { const r = await batchTagNotes({ note_ids: selectedNoteIds, tag_ids: [Number(batchTagId)], mode }); replaceNotesInList(r.items); setBatchActionMessage(mode === "add" ? `已添加标签 (${r.updated_count})` : `已移除标签 (${r.updated_count})`); }
    catch { setBatchActionMessage("批量标签操作失败。"); } finally { setIsBatchWorking(false); }
  }

  async function createBatchRewriteDrafts() {
    if (!selectedNoteIds.length) { setBatchActionMessage("请先选择笔记。"); return; }
    setIsBatchWorking(true); setBatchActionMessage(null);
    try { const r = await batchCreateDraftsFromNotes({ note_ids: selectedNoteIds, intent: "rewrite" }); setBatchActionMessage(`已创建 ${r.created_count} 个改写草稿。`); }
    catch { setBatchActionMessage("批量创建草稿失败。"); } finally { setIsBatchWorking(false); }
  }

  async function exportSelectedNotes(format: "json" | "csv" | "xlsx") {
    if (!selectedNoteIds.length) { setBatchActionMessage("请先选择笔记。"); return; }
    setIsBatchWorking(true); setBatchActionMessage(null);
    try { const r = await exportSavedNotes({ note_ids: selectedNoteIds, format }); setLatestExport(r); setBatchActionMessage(`已导出 ${r.exported_count} 条笔记。`); }
    catch { setBatchActionMessage("导出失败。"); } finally { setIsBatchWorking(false); }
  }

  async function batchDeleteNotes() {
    if (!selectedNoteIds.length) return;
    if (!window.confirm(`确定删除选中的 ${selectedNoteIds.length} 条笔记？`)) return;
    setIsBatchWorking(true); setBatchActionMessage(null);
    try {
      for (const id of selectedNoteIds) {
        await deleteSavedNote(id);
      }
      setNotes((c) => c.filter((n) => !selectedNoteIds.includes(n.id)));
      setTotal((c) => Math.max(0, c - selectedNoteIds.length));
      setBatchActionMessage(`已删除 ${selectedNoteIds.length} 条笔记。`);
      setSelectedNoteIds([]);
    } catch { setBatchActionMessage("批量删除失败。"); }
    finally { setIsBatchWorking(false); }
  }

  async function downloadLatestExport() {
    if (!latestExport) return; setIsBatchWorking(true); setBatchActionMessage(null);
    try { await downloadExportFile(latestExport.download_url, latestExport.file_name); setBatchActionMessage(`已下载：${latestExport.file_name}`); }
    catch { setBatchActionMessage("下载失败。"); } finally { setIsBatchWorking(false); }
  }

  async function toggleSelectedTag(tag: TagType) {
    if (!selectedNote) return; setTagActionMessage(null);
    const mode = selectedNoteHasTag(tag.id) ? "remove" : "add";
    try { const r = await batchTagNotes({ note_ids: [selectedNote.id], tag_ids: [tag.id], mode }); const u = r.items[0]; setSelectedNote(u); replaceNoteInList(u); }
    catch { setTagActionMessage("标签更新失败。"); }
  }

  async function createAndAssignTag() {
    if (!selectedNote) return; const name = newTagName.trim(); if (!name) { setTagActionMessage("请输入标签名称。"); return; }
    setTagActionMessage(null);
    try { const c = await createTag({ name, color: "#111111" }); setAvailableTags((t) => [...t, c]); setNewTagName(""); const r = await batchTagNotes({ note_ids: [selectedNote.id], tag_ids: [c.id], mode: "add" }); const u = r.items[0]; setSelectedNote(u); replaceNoteInList(u); }
    catch { setTagActionMessage("标签创建失败。"); }
  }

  async function loadComments(page = 1) {
    if (!selectedNote) return; setIsCommentsLoading(true); setCommentsError(null);
    try { const r = await fetchSavedNoteComments(selectedNote.id, page); setComments((c) => page === 1 ? r.items : [...c, ...r.items]); setCommentsTotal(r.total); setCommentsPage(page); }
    catch { setCommentsError("评论加载失败。"); } finally { setIsCommentsLoading(false); }
  }

  function toggleComments() { const next = !isCommentsOpen; setIsCommentsOpen(next); if (next && selectedNote && comments.length === 0) void loadComments(1); }
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  function childComments(pid: string) { return comments.filter((c) => c.parent_comment_id === pid); }

  return (
    <div>
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">内容库</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">保存的笔记素材，支持标签、筛选、批量操作和导出</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadNotes()} loading={isLoading}>
              刷新
            </Button>
            <HeaderControls />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="stat-card-clean p-4">
          <p className="text-xs text-muted-foreground mb-1">已保存笔记</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="stat-card-clean p-4">
          <p className="text-xs text-muted-foreground mb-1">当前视图</p>
          <p className="text-2xl font-bold">{viewMode === "card" ? "卡片" : "表格"}</p>
        </div>
        <div className="stat-card-clean p-4">
          <p className="text-xs text-muted-foreground mb-1">已选择</p>
          <p className="text-2xl font-bold">{selectedNoteIds.length}<span className="text-sm font-normal text-muted-foreground ml-1">条</span></p>
        </div>
        <div className="stat-card-clean p-4">
          <p className="text-xs text-muted-foreground mb-1">平台</p>
          <p className="text-2xl font-bold">小红书</p>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-[200px]">
            <Input placeholder="标题、正文、作者" value={keywordFilter} onChange={(e) => setKeywordFilter(e.target.value)} />
          </div>
          <div className="w-[160px]">
            <Select value={selectedTagFilter || undefined} onChange={(v) => setSelectedTagFilter(v ?? "")} placeholder="全部标签" options={availableTags.map((t) => ({ value: String(t.id), label: t.name }))} />
          </div>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={hasAssetsFilter} onChange={(e) => setHasAssetsFilter(e.target.checked)} className="rounded" />
            有素材
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={hasCommentsFilter} onChange={(e) => setHasCommentsFilter(e.target.checked)} className="rounded" />
            有评论
          </label>
          <div className="flex rounded-lg border border-input overflow-hidden">
            <button className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "card" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`} onClick={() => setViewMode("card")}>卡片</button>
            <button className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`} onClick={() => setViewMode("table")}>表格</button>
          </div>
          <Button variant="outline" onClick={clearFilters}>重置</Button>
          <Button onClick={() => void loadNotes()} loading={isLoading}>筛选</Button>
        </div>
      </Card>

      {notes.length > 0 && (
        <Card className="p-4 mb-4">
          <div className="flex gap-2 flex-wrap items-center">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={notes.length > 0 && notes.every((n) => selectedNoteIdSet.has(n.id))} onChange={toggleVisibleSelection} className="rounded" />
              选择当前页
            </label>
            <span className="text-sm font-semibold">{selectedNoteIds.length} 条已选</span>
            <Button variant="outline" disabled={isBatchWorking || !selectedNoteIds.length} onClick={createBatchRewriteDrafts} size="sm">批量加入草稿工坊</Button>
            <Button disabled={isBatchWorking || !selectedNoteIds.length} onClick={() => exportSelectedNotes("json")} size="sm">JSON</Button>
            <Button variant="outline" disabled={isBatchWorking || !selectedNoteIds.length} onClick={() => exportSelectedNotes("csv")} size="sm">CSV</Button>
            <Button variant="outline" disabled={isBatchWorking || !selectedNoteIds.length} onClick={() => exportSelectedNotes("xlsx")} size="sm">Excel</Button>
            {latestExport && <Button variant="outline" disabled={isBatchWorking} onClick={downloadLatestExport} size="sm">下载</Button>}
            <Button variant="destructive" disabled={isBatchWorking || !selectedNoteIds.length} onClick={batchDeleteNotes} size="sm">批量删除</Button>
            <Button variant="ghost" disabled={!selectedNoteIds.length} onClick={clearSelection} size="sm">清空选择</Button>
          </div>
          {batchActionMessage && <MessageBanner message={batchActionMessage} onClose={() => setBatchActionMessage(null)} />}
        </Card>
      )}

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner className="mx-auto my-12" size="lg" />
      ) : notes.length === 0 ? (
        <LibraryEmpty />
      ) : viewMode === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">标题</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[120px]">作者</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[140px]">笔记 ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[160px]">保存时间</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[180px]">标签</th>
                  <th className="text-left p-3 font-medium text-muted-foreground w-[80px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id} className="border-b border-border cursor-pointer hover:bg-accent/50" onClick={() => void openDetail(n)}>
                    <td className="p-3">
                      <input type="checkbox" checked={selectedNoteIdSet.has(n.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleNoteSelection(n.id)} className="mr-2" />
                      <span className="cursor-pointer text-primary hover:underline">{n.title || "未命名"}</span>
                    </td>
                    <td className="p-3">{n.author_name}</td>
                    <td className="p-3 truncate max-w-[140px]">{n.note_id}</td>
                    <td className="p-3">{formatSavedTime(n.created_at)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {n.tags?.length ? n.tags.map((t) => (
                          <Badge key={t.id} variant="default">{t.name}</Badge>
                        )) : <span className="text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); void handleDeleteNote(n); }}>删除</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {notes.map((note) => {
            const cover = getSavedNoteCoverUrl(note);
            const kind = getRawNoteType(note);
            return (
              <Card key={note.id} className="overflow-hidden cursor-pointer" onClick={() => void openDetail(note)}>
                <div style={{ position: "relative", background: c.cardBorder2 }}>
                  <input type="checkbox" checked={selectedNoteIdSet.has(note.id)} onClick={(e) => { e.stopPropagation(); toggleNoteSelection(note.id); }} style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }} className="rounded" />
                  {cover ? (
                    <img src={cover} alt={note.title} referrerPolicy="no-referrer" className="w-full aspect-square object-cover block" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center" style={{ color: c.textMuted2, fontSize: 28 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${kind.includes("video") ? "border-transparent bg-purple-500/10 text-purple-500" : "border-transparent bg-blue-500/10 text-blue-500"}`}>
                    {kind.includes("video") ? "视频" : "图文"}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm truncate font-medium">{note.title || "未命名"}</p>
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground">{note.author_name}</span>
                    {getNotePublishTime(note) ? <span className="text-xs text-muted-foreground ml-1">{getNotePublishTime(note)}</span> : <span className="text-xs text-muted-foreground ml-1">{formatSavedTime(note.created_at)}</span>}
                  </div>
                  {(() => {
                    const eng = getNoteEngagement(note);
                    if (!eng.likes && !eng.collects && !eng.comments && !eng.shares) return null;
                    return (
                      <div className="flex gap-2 mt-1 text-xs" style={{ color: c.textTertiary }}>
                        {eng.likes > 0 && <span>❤ {eng.likes}</span>}
                        {eng.collects > 0 && <span>⭐ {eng.collects}</span>}
                        {eng.comments > 0 && <span>💬 {eng.comments}</span>}
                        {eng.shares > 0 && <span>↗ {eng.shares}</span>}
                      </div>
                    );
                  })()}
                  {note.tags?.length ? (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {note.tags.map((t) => (
                        <Badge key={t.id} variant="default" className="text-xs">{t.name}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDetailOpen} onClose={closeDetail} width={640}>
        <DialogHeader onClose={closeDetail}>
          <DialogTitle>{selectedNote?.title || "笔记详情"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {selectedNote && (
            <div>
              {isDetailLoading ? (
                <div className="text-center py-8"><Spinner /></div>
              ) : (
                <>
                  {detailError && (
                    <div className="mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-2">
                      <span className="font-bold shrink-0">⚠</span>
                      <span className="text-sm">{detailError}</span>
                    </div>
                  )}
                  {detailActionMessage && <MessageBanner message={detailActionMessage} onClose={() => setDetailActionMessage(null)} />}

                  <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">作者</span>
                      <span>
                        {getAuthorProfileUrl(selectedNote) ? (
                          <a href={getAuthorProfileUrl(selectedNote)} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">{selectedNote.author_name || "未知"}</a>
                        ) : (selectedNote.author_name || "未知")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">互动</span>
                      <span>赞 {getNoteEngagement(selectedNote).likes} · 藏 {getNoteEngagement(selectedNote).collects} · 评 {getNoteEngagement(selectedNote).comments}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">笔记 ID</span>
                      <span>{selectedNote.note_id}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">保存时间</span>
                      <span>{formatSavedTime(selectedNote.created_at)}</span>
                    </div>
                    {getNotePublishTime(selectedNote) && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-20 shrink-0">发布时间</span>
                        <span>{getNotePublishTime(selectedNote)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 shrink-0">作品链接</span>
                      <a href={getNoteUrl(selectedNote)} target="_blank" rel="noreferrer" className="text-xs break-all text-primary underline-offset-4 hover:underline">{getNoteUrl(selectedNote)}</a>
                    </div>
                  </div>

                  {getNoteTags(selectedNote).length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {getNoteTags(selectedNote).map((t) => (
                        <Badge key={t} variant="default">#{t}</Badge>
                      ))}
                    </div>
                  )}

                  <a href={getNoteUrl(selectedNote)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline mb-4">
                    查看原文
                  </a>

                  <div className="flex gap-2 flex-wrap mb-4">
                    <Button variant="outline" onClick={copySelectedNote}>复制内容</Button>
                    <Button variant="outline" onClick={addToDrafts} loading={isCreatingDraft}>加入草稿工坊</Button>
                    <Button onClick={() => createDraft("rewrite")} loading={isCreatingDraft}>AI 改写</Button>
                    <Button variant="destructive" onClick={() => void handleDeleteNote(selectedNote)}>删除</Button>
                  </div>

                  {selectedAssets.length > 0 && (
                    <div className="mb-4">
                      <p className="font-semibold text-sm mb-1.5">素材 ({selectedAssets.length})</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedAssets.map((a) => (
                          a.asset_type === "video" ? (
                            <div key={a.id} className="flex items-center justify-center" style={{ width: 80, height: 80, background: c.cardBorder2, borderRadius: 6 }}>
                              <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline">视频</a>
                            </div>
                          ) : (
                            <img key={a.id} src={a.url} width={80} height={80} className="object-cover rounded-lg" referrerPolicy="no-referrer" />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="font-semibold text-sm">正文</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: c.textSecondary }}>{selectedNote.content || "暂无正文。"}</p>
                  </div>

                  <Button variant="outline" onClick={toggleComments} className="mb-2">{isCommentsOpen ? "收起评论" : `查看评论 (${commentsTotal})`}</Button>
                  {isCommentsOpen && (
                    <Card className="p-4 mb-4" style={{ background: c.cardBg }}>
                      {commentsError && <ErrorBanner message={commentsError} />}
                      {isCommentsLoading && <Spinner size="sm" />}
                      {topLevelComments.length === 0 && !isCommentsLoading ? <p className="text-sm text-muted-foreground">暂无评论</p> : null}
                      {topLevelComments.map((cm) => (
                        <div key={cm.comment_id} className="mb-2.5 pb-2 border-b" style={{ borderColor: "#303030" }}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{cm.user_name}</span>
                            <span className="text-xs text-muted-foreground">{cm.created_at_remote} · {cm.like_count} likes</span>
                          </div>
                          <div className="text-sm mt-0.5" style={{ color: c.textSecondary }}>{cm.content}</div>
                          {childComments(cm.comment_id).map((r) => (
                            <div key={r.comment_id} className="ml-5 mt-1 pl-2 border-l-2" style={{ borderColor: "#303030" }}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs">{r.user_name}</span>
                                <span className="text-xs text-muted-foreground">{r.like_count} likes</span>
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{r.content}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {comments.length < commentsTotal && (
                        <Button variant="outline" size="sm" onClick={() => void loadComments(commentsPage + 1)} loading={isCommentsLoading}>加载更多</Button>
                      )}
                    </Card>
                  )}

                  {selectedNote.raw_json && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs" style={{ color: c.textTertiary }}>原始 JSON</summary>
                      <pre className="text-xs p-2 rounded-lg overflow-auto max-h-[300px] mt-1" style={{ color: c.textTertiary, background: c.cardBg }}>{JSON.stringify(selectedNote.raw_json, null, 2)}</pre>
                    </details>
                  )}
                </>
              )}
            </div>
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
}
