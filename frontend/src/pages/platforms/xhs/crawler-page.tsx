import { Check, CheckCircle, ChevronDown, ChevronRight, Clock, Download, ExternalLink, FileText, Heart, Image, KeyRound, Link as LinkIcon, Loader2, MessageSquare, Play, Plus, RefreshCw, Search, Send, Settings, Shield, Star, Target, Trash2, User, X, Zap, BarChart3, Bot, Database } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Spinner } from "../../../components/ui/skeletons";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import { ErrorBanner, MessageBanner } from "../../../components/ui/status-banners";
import { Link } from "react-router-dom";

import { crawlXhsDataStream, fetchAccounts } from "../../../lib/api";
import type { PlatformAccount, XhsDataCrawlItem, XhsDataCrawlMode } from "../../../types";

const sortOptions = [
  { value: 0, label: "综合排序" },
  { value: 1, label: "最新" },
  { value: 2, label: "最多点赞" },
  { value: 3, label: "最多评论" },
  { value: 4, label: "最多收藏" },
];
const noteTypeOptions = [
  { value: 0, label: "不限类型" },
  { value: 1, label: "视频笔记" },
  { value: 2, label: "普通笔记" },
];
const noteTimeOptions = [
  { value: 0, label: "不限时间" },
  { value: 1, label: "一天内" },
  { value: 2, label: "一周内" },
  { value: 3, label: "半年内" },
];
const noteRangeOptions = [
  { value: 0, label: "不限范围" },
  { value: 1, label: "已看过" },
  { value: 2, label: "未看过" },
  { value: 3, label: "已关注" },
];
const distanceOptions = [
  { value: 0, label: "不限距离" },
  { value: 1, label: "同城" },
  { value: 2, label: "附近" },
];

function splitUrls(value: string): string[] {
  return value.split(/\r?\n|,/).map((url) => url.trim()).filter(Boolean);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const noteExcelHeaders = [
  "笔记id", "笔记url", "笔记类型", "用户id", "用户主页url", "昵称", "头像url", "标题", "描述",
  "点赞数量", "收藏数量", "评论数量", "分享数量", "视频封面url", "视频地址url", "图片地址url列表",
  "标签", "上传时间", "ip归属地",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
function firstRecord(value: unknown): Record<string, unknown> {
  return Array.isArray(value) && value.length > 0 ? asRecord(value[0]) : {};
}
function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value);
  }
  return "";
}
function listValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "")).filter(Boolean).join("\n");
  return textValue(value);
}
function dateText(value: unknown): string {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return textValue(value);
  const date = new Date(numberValue > 10_000_000_000 ? numberValue : numberValue * 1000);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}
function rawNoteItem(note: XhsDataCrawlItem["note"]): Record<string, unknown> {
  const raw = asRecord(note?.raw);
  const data = asRecord(raw.data);
  const firstItem = firstRecord(data.items);
  return Object.keys(firstItem).length > 0 ? firstItem : raw;
}
function rawNoteCard(note: XhsDataCrawlItem["note"]): Record<string, unknown> {
  const item = rawNoteItem(note);
  const noteCard = asRecord(item.note_card);
  const notePayload = asRecord(item.note);
  if (Object.keys(noteCard).length > 0) return noteCard;
  if (Object.keys(notePayload).length > 0) return notePayload;
  return item;
}
function noteTypeText(value: unknown): string {
  const text = textValue(value);
  if (text === "normal") return "图集";
  if (text === "video") return "视频";
  return text;
}

function spiderStyleNoteRow(item: XhsDataCrawlItem): string[] {
  const note = item.note;
  if (!note) return noteExcelHeaders.map(() => "");
  const rawItem = rawNoteItem(note);
  const card = rawNoteCard(note);
  const cardUser = asRecord(card.user);
  const cardAuthor = asRecord(card.author);
  const author = Object.keys(cardUser).length > 0 ? cardUser : cardAuthor;
  const cardInteract = asRecord(card.interact_info);
  const cardInteraction = asRecord(card.interaction);
  const interact = Object.keys(cardInteract).length > 0 ? cardInteract : cardInteraction;
  const video = asRecord(card.video);
  const videoMedia = asRecord(video.media);
  const stream = asRecord(videoMedia.stream);
  const h264 = firstRecord(stream.h264);
  const user_id = textValue(note.author_id, author.user_id, author.id);
  const note_url = textValue(note.note_url, card.note_url, card.url, rawItem.note_url, rawItem.url, item.source.startsWith("http") ? item.source : "");
  const upload_time = dateText(textValue(card.time, card.create_time, rawItem.time, rawItem.create_time));
  const originVideoKey = textValue(asRecord(video.consumer).origin_video_key);
  const video_addr = textValue(h264.master_url, h264.url, originVideoKey ? `https://sns-video-bd.xhscdn.com/${originVideoKey}` : "");
  return [
    textValue(note.note_id, card.note_id, card.id, rawItem.id), note_url,
    noteTypeText(textValue(note.type, card.type, rawItem.model_type)),
    user_id, user_id ? `https://www.xiaohongshu.com/user/profile/${user_id}` : "",
    textValue(note.author_name, author.nickname, author.name),
    textValue(note.author_avatar, author.avatar, author.avatar_url),
    textValue(note.title, card.title, card.display_title),
    textValue(note.content, card.desc, card.content),
    textValue(note.likes, interact.liked_count, interact.likes),
    textValue(note.collects, interact.collected_count, interact.collects),
    textValue(note.comments, interact.comment_count, interact.comments),
    textValue(note.shares, interact.share_count, interact.shares),
    textValue(note.cover_url, video.cover_url), video_addr,
    listValue(note.image_urls?.length ? note.image_urls : note.cover_url ? [note.cover_url] : []),
    listValue(note.tags), upload_time, textValue(card.ip_location, rawItem.ip_location),
  ];
}

function exportRowsToExcel(items: XhsDataCrawlItem[]) {
  const rows = items.map((item) => [item.status, item.source, item.error, ...spiderStyleNoteRow(item), item.comment_count, (item.comments ?? []).map((c) => c.content).join("\n")]);
  const headers = ["抓取状态", "来源", "错误", ...noteExcelHeaders, "抓取评论数", "评论内容"];
  const table = [headers, ...rows].map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<html><head><meta charset="UTF-8"></head><body><table>${table}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `xhs-crawl-${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function XhsCrawlerPage() {
  const c = useThemeColors();
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [mode, setMode] = useState<XhsDataCrawlMode>("note_urls");
  const [urls, setUrls] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pages, setPages] = useState(1);
  const [maxNotes, setMaxNotes] = useState(20);
  const [timeSleep, setTimeSleep] = useState(1);
  const [fetchCommentsChecked, setFetchCommentsChecked] = useState(false);
  const [filters, setFilters] = useState({ sort_type_choice: 0, note_type: 0, note_time: 0, note_range: 0, pos_distance: 0, geo: "" });
  const [items, setItems] = useState<XhsDataCrawlItem[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcAccounts = useMemo(() => accounts.filter((a) => a.platform === "xhs" && a.sub_type === "pc"), [accounts]);

  async function loadAccounts() {
    setIsLoadingAccounts(true);
    setError(null);
    try {
      const loaded = await fetchAccounts("xhs");
      setAccounts(loaded);
      const first = loaded.find((a) => a.sub_type === "pc");
      setSelectedAccountId((c) => c ?? first?.id ?? null);
    } catch { setError("账号列表加载失败。"); }
    finally { setIsLoadingAccounts(false); }
  }

  async function handleRun(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!selectedAccountId) { setError("请先选择一个 PC 账号。"); return; }
    const parsedUrls = splitUrls(urls);
    if (mode !== "search" && parsedUrls.length === 0) { setError("请至少输入一个笔记链接。"); return; }
    if (mode === "search" && !keyword.trim()) { setError("请填写搜索关键词。"); return; }
    setIsRunning(true);
    setItems([]);
    setSuccessCount(0);
    setFailedCount(0);
    setProgressMsg(null);
    try {
      const summary = await crawlXhsDataStream(
        { account_id: selectedAccountId, mode, urls: parsedUrls, keyword: keyword.trim(), pages, max_notes: maxNotes, time_sleep: timeSleep, fetch_comments: mode === "comments" ? false : fetchCommentsChecked, ...filters, geo: filters.geo.trim() },
        (index, item) => { setItems((prev) => [...prev, item]); },
        (msg) => { setProgressMsg(msg); },
        (msg) => { setError(msg); },
      );
      setSuccessCount(summary.success_count);
      setFailedCount(summary.failed_count);
      setProgressMsg(null);
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      setError(axiosErr?.message || "抓取失败");
    }
    finally { setIsRunning(false); }
  }

  useEffect(() => { void loadAccounts(); }, []);

  const noPcAccount = !isLoadingAccounts && pcAccounts.length === 0;

  return (
    <div>
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">数据抓取</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">搜索结果、笔记详情和评论抓取，失败项单独标注并可导出 Excel</p>
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
          <form onSubmit={(e) => void handleRun(e)}>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <label className="text-sm font-medium mb-1.5 block">PC 账号</label>
                <select
                  value={selectedAccountId ?? ""}
                  onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  <option value="">选择 PC 账号</option>
                  {pcAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.nickname || `PC 账号 ${a.id}`} · {a.status}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                <label className="text-sm font-medium mb-1.5 block">抓取方式</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as XhsDataCrawlMode)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  <option value="note_urls">直接爬取笔记链接</option>
                  <option value="search">通过搜索爬取详情</option>
                  <option value="comments">只爬取评论</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Time Sleep</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={timeSleep}
                  onChange={(e) => setTimeSleep(Number(e.target.value) || 1)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                />
              </div>
              <div className="col-span-3 flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fetchCommentsChecked}
                    onChange={(e) => setFetchCommentsChecked(e.target.checked)}
                    disabled={mode === "comments"}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  同时抓取评论
                </label>
              </div>
            </div>

            {mode === "search" ? (
              <div className="grid grid-cols-12 gap-4 mt-4">
                <div className="col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">搜索关键词</label>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="低卡早餐、通勤穿搭"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">爬取数量</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={maxNotes}
                    onChange={(e) => { const n = Number(e.target.value) || 20; setMaxNotes(n); setPages(Math.max(1, Math.ceil(n / 20))); }}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">排序</label>
                  <select
                    value={filters.sort_type_choice}
                    onChange={(e) => setFilters((c) => ({ ...c, sort_type_choice: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">类型</label>
                  <select
                    value={filters.note_type}
                    onChange={(e) => setFilters((c) => ({ ...c, note_type: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {noteTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">时间范围</label>
                  <select
                    value={filters.note_time}
                    onChange={(e) => setFilters((c) => ({ ...c, note_time: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {noteTimeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium mb-1.5 block">距离</label>
                  <select
                    value={filters.pos_distance}
                    onChange={(e) => setFilters((c) => ({ ...c, pos_distance: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {distanceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <label className="text-sm font-medium mb-1.5 block">笔记链接</label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="每行一个链接，也可以用英文逗号分隔"
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                />
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button type="submit" disabled={noPcAccount}>
                {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : mode === "search" ? <Search className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {isRunning ? "抓取中..." : "开始抓取"}
              </Button>
              <Button variant="outline" onClick={() => items.length && exportRowsToExcel(items)} disabled={!items.length}>
                <FileText className="h-4 w-4 mr-2" />导出 Excel
              </Button>
            </div>
          </form>

                    {error && <ErrorBanner message={error} />}
          {noPcAccount && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center mt-6">
              <h3 className="text-lg font-semibold mb-2">还没有可用的 PC 账号</h3>
              <Link to="/platforms/xhs/accounts">
                <Button><LinkIcon className="h-4 w-4 mr-2" />去绑定账号</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <h5 className="text-base font-semibold m-0">抓取结果</h5>
            <span className="text-sm text-muted-foreground">
              成功 {successCount} · 失败 {failedCount}{isRunning && progressMsg ? ` · ${progressMsg}` : ""}{isRunning ? " · 抓取中..." : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {items.length === 0 && !isRunning ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">执行抓取后，结果会显示在这里</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-20">状态</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-50">来源</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-50">标题</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-24">作者</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-44">互动</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-20">评论</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">错误</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className={`border-b border-border/50 ${item.status === "failed" ? "bg-red-500/5" : ""}`}>
                      <td className="py-2 px-3">
                        {item.status === "failed" ? (
                          <Badge variant="destructive"><X className="h-3 w-3 mr-1" />失败</Badge>
                        ) : (
                          <Badge variant="success"><Check className="h-3 w-3 mr-1" />成功</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 max-w-[200px] truncate">{item.source}</td>
                      <td className="py-2 px-3 max-w-[200px] truncate">{item.note?.title || "-"}</td>
                      <td className="py-2 px-3">{item.note?.author_name || "-"}</td>
                      <td className="py-2 px-3">
                        {item.note ? (
                          <span className="text-xs text-muted-foreground">
                            赞{item.note.likes} 藏{item.note.collects} 评{item.note.comments}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-2 px-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />{item.comment_count}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {item.error ? <span className="text-xs text-red-400">{item.error}</span> : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
