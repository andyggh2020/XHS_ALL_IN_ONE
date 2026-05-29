import { Check, CheckCircle, ChevronLeft, ChevronRight, Clock, Database, Download, ExternalLink, FileText, Heart, Image, KeyRound, Link as LinkIcon, Loader2, MessageSquare, Play, Plus, RefreshCw, Search, Send, Settings, Shield, Star, Target, Trash2, User, X, Zap, BarChart3, Bot } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Spinner } from "../../../components/ui/skeletons";
import { Dialog, DialogBody, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import { ErrorBanner, MessageBanner } from "../../../components/ui/status-banners";
import { Link } from "react-router-dom";

import { fetchAccounts, fetchSavedNoteIds, fetchXhsNoteComments, fetchXhsNoteDetail, saveXhsNotesToLibrary, searchXhsNotes } from "../../../lib/api";
import type { NoteComment, PlatformAccount, XhsSearchNote, XhsSearchOptions } from "../../../types";

const sortOptions = [{ value: 0, label: "综合排序" }, { value: 1, label: "最新" }, { value: 2, label: "最多点赞" }, { value: 3, label: "最多评论" }, { value: 4, label: "最多收藏" }];
const noteTypeOptions = [{ value: 0, label: "不限类型" }, { value: 1, label: "视频笔记" }, { value: 2, label: "普通笔记" }];
const noteTimeOptions = [{ value: 0, label: "不限时间" }, { value: 1, label: "一天内" }, { value: 2, label: "一周内" }, { value: 3, label: "半年内" }];
const noteRangeOptions = [{ value: 0, label: "不限范围" }, { value: 1, label: "已看过" }, { value: 2, label: "未看过" }, { value: 3, label: "已关注" }];
const distanceOptions = [{ value: 0, label: "不限距离" }, { value: 1, label: "同城" }, { value: 2, label: "附近" }];

function formatMetric(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}w`;
  return value.toLocaleString();
}
function formatNoteTime(note: XhsSearchNote): string {
  const ts = note.timestamp;
  if (ts) {
    const num = typeof ts === "number" ? ts : Number(ts);
    if (Number.isFinite(num) && num > 0) {
      return new Date(num > 1e12 ? num : num * 1000).toLocaleDateString("zh-CN");
    }
    if (typeof ts === "string") return ts;
  }
  const raw = note.raw ?? {};
  const data = (raw.data && typeof raw.data === "object") ? raw.data as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const item = (items[0] && typeof items[0] === "object") ? items[0] as Record<string, unknown> : {};
  const card = (item.note_card && typeof item.note_card === "object") ? item.note_card as Record<string, unknown> : {};
  const deep = card.time ?? card.create_time ?? card.last_update_time ?? raw.time ?? raw.create_time;
  if (deep) {
    const n = typeof deep === "number" ? deep : Number(deep);
    if (Number.isFinite(n) && n > 0) {
      return new Date(n > 1e12 ? n : n * 1000).toLocaleDateString("zh-CN");
    }
  }
  return "";
}
function rawString(note: XhsSearchNote, keys: string[]): string {
  for (const key of keys) { const v = note.raw?.[key]; if (typeof v === "string" && v) return v; } return "";
}
function getPreviewNoteUrl(note: XhsSearchNote): string {
  return note.note_url || rawString(note, ["note_url", "url", "share_url"]) || (note.note_id ? `https://www.xiaohongshu.com/explore/${note.note_id}` : "");
}
function getCoverUrl(note: XhsSearchNote): string { return note.cover_url || note.image_urls?.[0] || rawString(note, ["cover_url", "image_url"]); }
function getNoteImageUrls(note: XhsSearchNote): string[] { const urls = note.image_urls?.length ? note.image_urls : [getCoverUrl(note)]; return urls.filter((u): u is string => Boolean(u)); }
function getNoteVideoUrl(note: XhsSearchNote): string { return note.video_url || note.video_addr || rawString(note, ["video_url", "video_addr"]); }
function getNoteKindLabel(note: XhsSearchNote): "视频" | "图文" {
  const rawType = rawString(note, ["type", "note_type", "model_type"]);
  return `${note.type || rawType}`.toLowerCase().includes("video") || Boolean(getNoteVideoUrl(note)) ? "视频" : "图文";
}
function stopCardClick(e: MouseEvent<HTMLElement>) { e.stopPropagation(); }

export function XhsDiscoveryPage() {
  const c = useThemeColors();
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [noteUrl, setNoteUrl] = useState("");
  const [filters, setFilters] = useState({ sort_type_choice: 0, note_type: 0, note_time: 0, note_range: 0, pos_distance: 0, geo: "" });
  const [notes, setNotes] = useState<XhsSearchNote[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const [savingNoteIds, setSavingNoteIds] = useState<string[]>([]);
  const [savedNoteIds, setSavedNoteIds] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<XhsSearchNote | null>(null);
  const [detailMediaIndex, setDetailMediaIndex] = useState(0);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [commentPreviewByNoteId, setCommentPreviewByNoteId] = useState<Record<string, NoteComment[]>>({});
  const [commentPreviewErrors, setCommentPreviewErrors] = useState<Record<string, string>>({});
  const [loadingCommentNoteIds, setLoadingCommentNoteIds] = useState<string[]>([]);

  const pcAccounts = useMemo(() => accounts.filter((a) => a.platform === "xhs" && a.sub_type === "pc"), [accounts]);
  const pcAccountOptions = useMemo(() => pcAccounts.map((a) => ({ value: String(a.id), label: `${a.nickname || `PC ${a.id}`} · ${a.status}` })), [pcAccounts]);

  async function loadAccounts() {
    setIsLoadingAccounts(true); setError(null);
    try { const loaded = await fetchAccounts("xhs"); setAccounts(loaded); const first = loaded.find((a) => a.sub_type === "pc"); setSelectedAccountId((c) => c ?? first?.id ?? null); }
    catch { setError("账号列表加载失败。"); } finally { setIsLoadingAccounts(false); }
  }

  function searchPayload(nextPage: number): XhsSearchOptions | null {
    if (!selectedAccountId) { setError("请先选择一个 PC 账号。"); return null; }
    if (!keyword.trim()) { setError("请输入要搜索的关键词。"); return null; }
    return { account_id: selectedAccountId, keyword: keyword.trim(), page: nextPage, ...filters, geo: filters.geo.trim() };
  }

  async function runSearch(nextPage: number, append: boolean) {
    const payload = searchPayload(nextPage); if (!payload) return;
    setError(null); append ? setIsLoadingMore(true) : setIsSearching(true);
    try {
      const result = await searchXhsNotes(payload);
      setNotes((c) => append ? [...c, ...result.items] : result.items);
      setPage(result.page); setHasMore(result.has_more);
      void loadSavedNoteIds();
      setCommentPreviewByNoteId((c) => append ? c : {}); setCommentPreviewErrors((c) => append ? c : {}); setSearchedKeyword(payload.keyword);
    } catch (err: unknown) { const a = err as { response?: { status?: number; data?: { detail?: string } }; message?: string }; setError(a?.response?.data?.detail ? `[${a.response.status}] ${a.response.data.detail}` : `搜索失败：${a?.message || "请检查网络和后端服务"}`); }
    finally { setIsSearching(false); setIsLoadingMore(false); }
  }

  async function handleSearch(e: FormEvent) { e.preventDefault(); await runSearch(1, false); }
  async function handleLoadMore() { await runSearch(page + 1, true); }

  async function loadSavedNoteIds() {
    try {
      const ids = await fetchSavedNoteIds("xhs");
      setSavedNoteIds(ids);
    } catch { /* ignore */ }
  }

  async function handleSaveNote(note: XhsSearchNote) {
    setError(null); if (!selectedAccountId) { setError("请先选择一个 PC 账号。"); return; }
    setSavingNoteIds((c) => [...c, note.note_id]);
    try { const d = await ensureNoteDetail(note); await saveXhsNotesToLibrary({ account_id: selectedAccountId, notes: [d] }); setSavedNoteIds((c) => c.includes(note.note_id) ? c : [...c, note.note_id]); }
    catch { setError("保存到内容库失败。"); } finally { setSavingNoteIds((c) => c.filter((id) => id !== note.note_id)); }
  }

  async function ensureNoteDetail(note: XhsSearchNote): Promise<XhsSearchNote> {
    const url = getPreviewNoteUrl(note); if (!selectedAccountId || !url) return note;
    const detail = await fetchXhsNoteDetail({ account_id: selectedAccountId, url });
    const merged = { ...note, ...detail, note_url: detail.note_url || url };
    setNotes((c) => c.map((n) => n.note_id === note.note_id ? merged : n));
    setSelectedNote((c) => c?.note_id === note.note_id ? merged : c); return merged;
  }

  async function handleFetchUrlDetail() {
    setError(null); if (!selectedAccountId) { setError("请先选择一个 PC 账号。"); return; }
    const cleanUrl = noteUrl.trim(); if (!cleanUrl) { setError("请输入小红书笔记 URL。"); return; }
    setIsFetchingUrl(true);
    try {
      const detail = await fetchXhsNoteDetail({ account_id: selectedAccountId, url: cleanUrl });
      const merged = { ...detail, note_url: detail.note_url || cleanUrl };
      setNotes([merged]); setDetailMediaIndex(0); setSelectedNote(merged); setHasMore(false); setPage(1);
      setSearchedKeyword("URL 直查"); setSavedNoteIds([]); setCommentPreviewByNoteId({}); setCommentPreviewErrors({});
    } catch (err: unknown) { const a = err as { response?: { status?: number; data?: { detail?: string } }; message?: string }; setError(a?.response?.data?.detail ? `[${a.response.status}] ${a.response.data.detail}` : `URL 直查失败：${a?.message || "请检查网络"}`); } finally { setIsFetchingUrl(false); }
  }

  async function openDetail(note: XhsSearchNote) {
    setDetailMediaIndex(0); setSelectedNote(note); setDetailError(null);
    if (!selectedAccountId) { setDetailError("请先选择一个 PC 账号。"); return; }
    const url = getPreviewNoteUrl(note); if (!url) { setDetailError("缺少可用于获取详情的笔记 URL。"); return; }
    setIsFetchingDetail(true);
    try { const detail = await fetchXhsNoteDetail({ account_id: selectedAccountId, url }); setDetailMediaIndex(0); setSelectedNote({ ...note, ...detail, note_url: detail.note_url || url }); }
    catch { setDetailError("详情加载失败，已保留搜索结果预览。"); } finally { setIsFetchingDetail(false); }
  }

  function closeDetail() { setSelectedNote(null); setDetailMediaIndex(0); setDetailError(null); }

  function getChildComments(noteId: string, parentId: string): NoteComment[] {
    return (commentPreviewByNoteId[noteId] ?? []).filter((c) => c.parent_comment_id === parentId);
  }

  async function handlePreviewComments(note: XhsSearchNote) {
    setError(null); if (!selectedAccountId) { setError("请先选择一个 PC 账号。"); return; }
    const url = getPreviewNoteUrl(note);
    if (!url) { setCommentPreviewErrors((c) => ({ ...c, [note.note_id]: "缺少笔记 URL。" })); return; }
    if (commentPreviewByNoteId[note.note_id]) { setCommentPreviewByNoteId((c) => { const n = { ...c }; delete n[note.note_id]; return n; }); return; }
    setLoadingCommentNoteIds((c) => [...c, note.note_id]); setCommentPreviewErrors((c) => ({ ...c, [note.note_id]: "" }));
    try { const r = await fetchXhsNoteComments({ account_id: selectedAccountId, note_url: url }); setCommentPreviewByNoteId((c) => ({ ...c, [note.note_id]: r.items })); }
    catch { setCommentPreviewErrors((c) => ({ ...c, [note.note_id]: "评论加载失败。" })); }
    finally { setLoadingCommentNoteIds((c) => c.filter((id) => id !== note.note_id)); }
  }

  useEffect(() => { void loadAccounts(); void loadSavedNoteIds(); }, []);

  const noPcAccount = !isLoadingAccounts && pcAccounts.length === 0;
  const selImgUrls = selectedNote ? getNoteImageUrls(selectedNote) : [];
  const selVideoUrl = selectedNote ? getNoteVideoUrl(selectedNote) : "";
  const selMediaIdx = selImgUrls.length ? Math.min(detailMediaIndex, selImgUrls.length - 1) : 0;

  return (
    <div>
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">笔记发现</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">按关键词或链接查找笔记，查看详情、评论和原文，保存到内容库</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Button onClick={loadAccounts} disabled={isLoadingAccounts}>
                {isLoadingAccounts ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                刷新账号
              </Button>
              <HeaderControls />
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); void runSearch(1, false); }}>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground mb-1">搜索账号</p>
                <select
                  value={selectedAccountId ?? ""}
                  onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  <option value="">选择 PC 账号</option>
                  {pcAccountOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground mb-1">关键词</p>
                <div className="flex gap-2">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="低卡早餐、通勤穿搭"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  />
                  <Button type="submit" size="sm" disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">排序</p>
                <select
                  value={filters.sort_type_choice}
                  onChange={(e) => setFilters((c) => ({ ...c, sort_type_choice: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">类型</p>
                <select
                  value={filters.note_type}
                  onChange={(e) => setFilters((c) => ({ ...c, note_type: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  {noteTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">时间</p>
                <select
                  value={filters.note_time}
                  onChange={(e) => setFilters((c) => ({ ...c, note_time: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  {noteTimeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3 mt-3 items-end">
              <div className="col-span-6">
                <p className="text-xs text-muted-foreground mb-1">笔记 URL</p>
                <input
                  value={noteUrl}
                  onChange={(e) => setNoteUrl(e.target.value)}
                  placeholder="https://www.xiaohongshu.com/explore/..."
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={handleFetchUrlDetail} disabled={noPcAccount || isFetchingUrl}>
                  {isFetchingUrl ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  URL 直查
                </Button>
              </div>
            </div>
          </form>
                    {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
          {noPcAccount && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center mt-6">
              <h3 className="text-lg font-semibold mb-2">还没有可用的 PC 账号</h3>
              <Link to="/platforms/xhs/accounts"><Button><LinkIcon className="h-4 w-4 mr-2" />去绑定账号</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="p-6 pb-3">
          <div className="flex items-center gap-3">
            <h5 className="text-base font-semibold m-0">{searchedKeyword ? `"${searchedKeyword}" 的搜索结果` : "搜索结果"}</h5>
            <Badge variant="secondary">{notes.length} 篇</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-3">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">{searchedKeyword ? "这次搜索没有返回笔记。" : "输入关键词后，搜索结果会以笔记卡片显示在这里。"}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {notes.map((note) => {
                  const coverUrl = getCoverUrl(note);
                  const originalUrl = getPreviewNoteUrl(note);
                  const kind = getNoteKindLabel(note);
                  return (
                    <div className="col-span-1" key={`${note.note_id}-${note.title}`}>
                      <Card className="overflow-hidden cursor-pointer" onClick={() => void openDetail(note)}>
                        <div className="relative" style={{ background: c.cardBorder2 }}>
                          {coverUrl
                            ? <img src={coverUrl} alt={note.title || "封面"} referrerPolicy="no-referrer" className="w-full aspect-square object-cover block" />
                            : <div className="w-full aspect-square flex items-center justify-center" style={{ color: c.textMuted2, fontSize: 28 }}><Image className="h-8 w-8" /></div>}
                          <Badge variant={kind === "视频" ? "warning" : "default"} className="absolute top-2 left-2">
                            {kind === "视频" ? <Play className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}{kind}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm truncate">{note.title || "未命名笔记"}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{note.author_name || "未知作者"}</span>
                            {formatNoteTime(note) && <span className="text-xs text-muted-foreground">{formatNoteTime(note)}</span>}
                          </div>
                          <div className="flex gap-3 mt-2 text-xs" style={{ color: c.textTertiary }}>
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatMetric(note.likes)}</span>
                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {formatMetric(note.collects)}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {formatMetric(note.comments)}</span>
                          </div>
                          <div className="mt-2 flex gap-1.5 flex-wrap" onClick={stopCardClick}>
                            <Button size="sm" variant={savedNoteIds.includes(note.note_id) ? "outline" : "default"} disabled={savedNoteIds.includes(note.note_id)} onClick={() => void handleSaveNote(note)}>
                              {savingNoteIds.includes(note.note_id) ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : savedNoteIds.includes(note.note_id) ? <Check className="h-3 w-3 mr-1" /> : <Database className="h-3 w-3 mr-1" />}
                              {savedNoteIds.includes(note.note_id) ? "已保存" : "保存"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void handlePreviewComments(note)}>
                              {loadingCommentNoteIds.includes(note.note_id) ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                              {commentPreviewByNoteId[note.note_id] ? "收起" : "评论"}
                            </Button>
                            {originalUrl && (
                              <a href={originalUrl} target="_blank" rel="noreferrer" onClick={stopCardClick}>
                                <Button size="sm" variant="outline">
                                  <LinkIcon className="h-3 w-3 mr-1" />原文
                                </Button>
                              </a>
                            )}
                          </div>
                          {commentPreviewErrors[note.note_id] && (
                            <div className="mt-2 p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">{commentPreviewErrors[note.note_id]}</div>
                          )}
                          {commentPreviewByNoteId[note.note_id] && (
                            <div className="mt-2 pt-2 border-t border-border" onClick={stopCardClick}>
                              {commentPreviewByNoteId[note.note_id].length === 0 ? <span className="text-xs text-muted-foreground">暂无评论</span> : null}
                              {commentPreviewByNoteId[note.note_id].filter((cm) => !cm.parent_comment_id).slice(0, 4).map((cm) => (
                                <div key={cm.comment_id} className="mb-1.5 text-xs">
                                  <span className="font-semibold text-xs">{cm.user_name}</span>{' '}
                                  <span className="text-muted-foreground text-[11px]">{cm.created_at_remote} · {cm.like_count} likes</span>
                                  <div style={{ color: c.textSecondary }}>{cm.content}</div>
                                  {getChildComments(note.note_id, cm.comment_id).map((r) => (
                                    <div key={r.comment_id} className="ml-4 mt-1">
                                      <span className="font-semibold text-[11px]">{r.user_name}</span>{' '}
                                      <span className="text-muted-foreground text-[11px]">{r.like_count} likes</span>
                                      <div style={{ color: c.textSecondary, fontSize: 12 }}>{r.content}</div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-6">
                <Button onClick={handleLoadMore} disabled={!hasMore || isLoadingMore}>
                  {isLoadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {hasMore ? "加载更多" : "没有更多了"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedNote} onClose={closeDetail} width={640}>
        {selectedNote && (
          <>
            <DialogHeader onClose={closeDetail}>
              <DialogTitle>{selectedNote?.title || "笔记详情"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div>
                {isFetchingDetail && <div className="text-center py-4"><Spinner className="mx-auto" /></div>}
                {detailError && (
                  <div className="mb-3 p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm">{detailError}</div>
                )}
                {selVideoUrl && getNoteKindLabel(selectedNote) === "视频" ? (
                  <div className="mb-4">
                    <div className="relative rounded-lg overflow-hidden" style={{ background: c.cardBorder2 }}>
                      {selImgUrls.length ? <img src={selImgUrls[0]} alt="视频封面" referrerPolicy="no-referrer" className="w-full max-h-[400px] object-contain block" /> : <div className="h-[200px] flex items-center justify-center"><Play className="h-10 w-10" style={{ color: c.textMuted }} /></div>}
                      <Badge variant="warning" className="absolute top-2 left-2"><Play className="h-3 w-3 mr-1" /> 视频封面</Badge>
                    </div>
                    <a href={selVideoUrl} target="_blank" rel="noreferrer" className="block mt-2">
                      <Button className="w-full"><LinkIcon className="h-4 w-4 mr-2" />打开视频</Button>
                    </a>
                  </div>
                ) : selImgUrls.length ? (
                  <div className="mb-4">
                    <div className="relative rounded-lg overflow-hidden text-center" style={{ background: c.cardBorder2 }}>
                      <img src={selImgUrls[selMediaIdx]} alt="笔记图片" referrerPolicy="no-referrer" className="max-w-full max-h-[400px] object-contain" />
                      {selImgUrls.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-input bg-background/80 flex items-center justify-center hover:bg-accent"
                            onClick={() => setDetailMediaIndex((c) => (c - 1 + selImgUrls.length) % selImgUrls.length)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-input bg-background/80 flex items-center justify-center hover:bg-accent"
                            onClick={() => setDetailMediaIndex((c) => (c + 1) % selImgUrls.length)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <Badge className="absolute bottom-2 right-2">{selMediaIdx + 1}/{selImgUrls.length}</Badge>
                        </>
                      )}
                    </div>
                    {selImgUrls.length > 1 && (
                      <div className="flex gap-1 mt-2 overflow-x-auto">
                        {selImgUrls.map((url, i) => (
                          <div key={url} onClick={() => setDetailMediaIndex(i)}
                            className="w-12 h-12 rounded overflow-hidden cursor-pointer shrink-0"
                            style={{ border: i === selMediaIdx ? "2px solid #1668dc" : "2px solid transparent" }}>
                            <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">作者</span>
                    <span>
                      {selectedNote.author_id ? (
                        <a href={`https://www.xiaohongshu.com/user/profile/${selectedNote.author_id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {selectedNote.author_name || "-"}
                        </a>
                      ) : (selectedNote.author_name || "-")}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">互动</span>
                    <span>赞 {formatMetric(selectedNote.likes)} · 藏 {formatMetric(selectedNote.collects)} · 评 {formatMetric(selectedNote.comments)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">笔记 ID</span>
                    <span>{selectedNote.note_id || "-"}</span>
                  </div>
                  {formatNoteTime(selectedNote) && (
                    <div className="flex">
                      <span className="text-muted-foreground w-16 shrink-0">发布时间</span>
                      <span>{formatNoteTime(selectedNote)}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="text-muted-foreground w-16 shrink-0">作品链接</span>
                    <a href={getPreviewNoteUrl(selectedNote)} target="_blank" rel="noreferrer" className="text-xs break-all text-primary hover:underline">{getPreviewNoteUrl(selectedNote) || "-"}</a>
                  </div>
                </div>

                {selectedNote.tags?.length ? (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {selectedNote.tags.map((t) => <Badge key={t} variant="secondary">#{t}</Badge>)}
                  </div>
                ) : null}

                <div className="mb-4">
                  <p className="font-semibold text-sm">正文</p>
                  <p className="mt-1 text-sm" style={{ color: c.textSecondary }}>{selectedNote.content || "暂无正文。"}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={savedNoteIds.includes(selectedNote.note_id) ? "outline" : "default"}
                    disabled={savedNoteIds.includes(selectedNote.note_id)}
                    onClick={() => void handleSaveNote(selectedNote)}
                  >
                    {savingNoteIds.includes(selectedNote.note_id) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : savedNoteIds.includes(selectedNote.note_id) ? <Check className="h-4 w-4 mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                    {savedNoteIds.includes(selectedNote.note_id) ? "已保存" : "保存到内容库"}
                  </Button>
                  <Button variant="outline" onClick={() => void handlePreviewComments(selectedNote)}>
                    <MessageSquare className="h-4 w-4 mr-2" />{commentPreviewByNoteId[selectedNote.note_id] ? "收起评论" : "查看评论"}
                  </Button>
                  {getPreviewNoteUrl(selectedNote) && (
                    <a href={getPreviewNoteUrl(selectedNote)} target="_blank" rel="noreferrer">
                      <Button><LinkIcon className="h-4 w-4 mr-2" />打开原文</Button>
                    </a>
                  )}
                </div>

                {commentPreviewErrors[selectedNote.note_id] && <ErrorBanner message={commentPreviewErrors[selectedNote.note_id]} />}
                {commentPreviewByNoteId[selectedNote.note_id] && (
                  <Card size="small" className="mb-3" style={{ background: c.cardBg }}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">评论预览</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {commentPreviewByNoteId[selectedNote.note_id].length === 0 ? <span className="text-sm text-muted-foreground">暂无评论</span> : null}
                      {commentPreviewByNoteId[selectedNote.note_id].filter((cm) => !cm.parent_comment_id).map((cm) => (
                        <div key={cm.comment_id} className="mb-3 pb-2 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{cm.user_name}</span>
                            <span className="text-muted-foreground text-[11px]">{cm.created_at_remote} · {cm.like_count} likes</span>
                          </div>
                          <div className="text-sm mt-0.5" style={{ color: c.textSecondary }}>{cm.content}</div>
                          {getChildComments(selectedNote.note_id, cm.comment_id).map((r) => (
                            <div key={r.comment_id} className="ml-5 mt-1.5 pl-2 border-l-2" style={{ borderColor: "#303030" }}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs">{r.user_name}</span>
                                <span className="text-muted-foreground text-[11px]">{r.like_count} likes</span>
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: c.textSecondary }}>{r.content}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogBody>
          </>
        )}
      </Dialog>
    </div>
  );
}
