import {
  Edit3, Eye, FileImage, FileText, Highlighter, Inbox,
  Link, Image as ImageIcon, Play, Plus, RefreshCw, Save, Send, Video,
  Tags, PlusCircle, Trash2,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Spinner } from "../../../components/ui/skeletons";
import { useToast } from "../../../components/ui/toast";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import { ErrorBanner } from "../../../components/ui/status-banners";
import { DraftsEmpty, PublishEmpty } from "../../../components/ui/empty-states";
import {
  deleteDraft, deleteDraftAsset, fetchDraftAssets, fetchDrafts,
  reorderDraftAssets, updateDraft,
  deletePublishJob, fetchPublishAssets, fetchPublishJobs, publishJobToCreator,
  retryPublishJob, cancelPublishJob, sendDraftToPublish, updatePublishJob,
} from "../../../lib/api";
import { formatShanghaiTime } from "../../../lib/time";
// DraftAsset type for asset management
interface DraftAsset { id: number; url: string; }
import type { Draft, PublishAsset, PublishJob } from "../../../types";

const { TextArea } = { TextArea: (props: any) => <textarea {...props} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none" /> };

export function XhsDraftsPage() {
  const toast = useToast();
  const c = useThemeColors();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("drafts");

  // Draft editing
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [assets, setAssets] = useState<DraftAsset[]>([]);

  // Send to publish
  const [sendingDraftId, setSendingDraftId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function loadDrafts() {
    setIsLoadingDrafts(true); setError(null);
    try { const r = await fetchDrafts("xhs"); setDrafts(r.items); }
    catch { setError("草稿列表加载失败。"); } finally { setIsLoadingDrafts(false); }
  }

  async function loadJobs() {
    setIsLoadingJobs(true);
    try { const r = await fetchPublishJobs("xhs"); setJobs(r.items); }
    catch { /* ignore */ } finally { setIsLoadingJobs(false); }
  }

  useEffect(() => { void loadDrafts(); void loadJobs(); }, []);

  async function openEdit(draft: Draft) {
    setEditingDraft(draft); setEditTitle(draft.title || ""); setEditBody(draft.body || "");
    setEditTags((draft.tags || []).map((t) => t.name || t).join(", "));
    try { const r = await fetchDraftAssets(draft.id); setAssets(r.items); }
    catch { setAssets([]); }
  }

  async function handleSaveEdit() {
    if (!editingDraft) return; setIsSaving(true);
    try {
      const tags = editTags.split(",").filter(Boolean).map((s) => ({ name: s.trim() }));
      const updated = await updateDraft(editingDraft.id, { title: editTitle, body: editBody, tags });
      setDrafts((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      toast.success("草稿已更新。");
    } catch { toast.error("更新草稿失败。"); } finally { setIsSaving(false); }
  }

  async function handleSendToPublish(draftId: number) {
    setSendingDraftId(draftId);
    try {
      const job = await sendDraftToPublish(draftId, {});
      setJobs((prev) => [job, ...prev]);
      toast.success("已发送到发布中心。");
    } catch { toast.error("发送失败，请检查 Creator 账号配置。"); }
    finally { setSendingDraftId(null); }
  }

  async function handleDeleteDraft(draftId: number) {
    if (!window.confirm("确定删除此草稿？")) return;
    try { await deleteDraft(draftId); setDrafts((prev) => prev.filter((d) => d.id !== draftId)); toast.success("草稿已删除。"); }
    catch { toast.error("删除失败。"); }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = assets.findIndex((a) => a.id === active.id);
    const newIndex = assets.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(assets, oldIndex, newIndex);
    setAssets(reordered);
    if (editingDraft) { try { await reorderDraftAssets(editingDraft.id, reordered.map((a) => a.id)); } catch { /* revert */ } }
  }

  const renderAssets = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={assets.map((a) => a.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-2 flex-wrap">
          {assets.map((asset) => <SortableAsset key={asset.id} asset={asset} onDelete={async (id) => { try { await deleteDraftAsset(editingDraft!.id, id); setAssets((prev) => prev.filter((a) => a.id !== id)); } catch { toast.error("删除素材失败。"); } }} />)}
        </div>
      </SortableContext>
    </DndContext>
  );

  const publishStatusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    pending: "warning", uploading: "default", publishing: "default",
    published: "success", failed: "destructive", cancelled: "secondary", scheduled: "warning",
  };

  return (
    <div>
      {/* Gradient header area */}
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">草稿工坊 & 发布中心</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">管理改写草稿，发送到创作者平台发布。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { void loadDrafts(); void loadJobs(); }}>
              <RefreshCw className="h-4 w-4 mr-1.5" />刷新
            </Button>
            <HeaderControls />
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex gap-1 mb-6 rounded-xl border border-border p-0.5 bg-muted/50">
        {["drafts", "publish"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: activeTab === tab ? "var(--primary)" : "transparent", color: activeTab === tab ? "white" : "var(--muted-foreground)" }}>
            {tab === "drafts" ? `草稿 (${drafts.length})` : `发布 (${jobs.length})`}
          </button>
        ))}
      </div>

      {activeTab === "drafts" ? (
        isLoadingDrafts ? <div className="flex justify-center py-12"><Spinner /></div>
        : drafts.length === 0 ? <DraftsEmpty />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm">{draft.title || "无标题"}</h3>
                  <Badge variant={(draft as any).status === "completed" ? "success" : "default"}>{(draft as any).status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{draft.body || "无正文"}</p>
                {draft.tags?.length ? <div className="flex gap-1 flex-wrap mb-2">{draft.tags.map((t) => <Badge key={typeof t === "string" ? t : t.name} variant="secondary" className="text-[10px]">{typeof t === "string" ? t : t.name}</Badge>)}</div> : null}
                <p className="text-[10px] text-muted-foreground mb-3">创建于 {formatShanghaiTime(draft.created_at)}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openEdit(draft)}><Edit3 size={12} className="mr-0.5" />编辑</Button>
                  <Button size="sm" variant="outline" disabled={sendingDraftId === draft.id} onClick={() => handleSendToPublish(draft.id)}><Send size={12} className="mr-0.5" />发送发布</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDraft(draft.id)}><Trash2 size={12} className="mr-0.5" />删除</Button>
                </div>
              </Card>
            ))}
          </div>
      ) : (
        isLoadingJobs ? <div className="flex justify-center py-12"><Spinner /></div>
        : jobs.length === 0 ? <PublishEmpty />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm truncate">{job.title || `发布 #${job.id}`}</h3>
                  <Badge variant={publishStatusVariant[job.status] || "secondary"}>{job.status}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">创建于 {formatShanghaiTime(job.created_at)}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {job.status === "pending" && <Button size="sm" variant="outline" onClick={async () => { try { const u = await publishJobToCreator(job.id); setJobs((prev) => prev.map((j) => j.id === u.id ? u : j)); toast.success("已发布到 Creator。"); } catch { toast.error("发布失败。"); } }}><Send size={12} className="mr-0.5" />立即发布</Button>}
                  {job.status === "failed" && <Button size="sm" variant="outline" onClick={async () => { try { const u = await retryPublishJob(job.id); setJobs((prev) => prev.map((j) => j.id === u.id ? u : j)); toast.success("已重试。"); } catch { toast.error("重试失败。"); } }}><RefreshCw size={12} className="mr-0.5" />重试</Button>}
                  {["pending", "uploading", "publishing"].includes(job.status) && <Button size="sm" variant="ghost" onClick={async () => { try { await cancelPublishJob(job.id); setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: "cancelled" } : j)); toast.success("已取消。"); } catch { toast.error("取消失败。"); } }}>取消</Button>}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (window.confirm("确定删除？")) { try { await deletePublishJob(job.id); setJobs((prev) => prev.filter((j) => j.id !== job.id)); toast.success("已删除。"); } catch { toast.error("删除失败。"); } } }}><Trash2 size={12} className="mr-0.5" />删除</Button>
                </div>
              </Card>
            ))}
          </div>
      )}

      {/* Edit Draft Dialog */}
      <Dialog open={!!editingDraft} onClose={() => setEditingDraft(null)} width={700}>
        <DialogHeader onClose={() => setEditingDraft(null)}>
          <DialogTitle>编辑草稿</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">标题</label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="标题" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">正文</label>
            <TextArea value={editBody} onChange={(e: any) => setEditBody(e.target.value)} rows={8} placeholder="正文" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">标签（逗号分隔）</label>
            <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="标签1, 标签2" />
          </div>
          {assets.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">素材（拖拽排序）</p>
              {renderAssets}
            </div>
          )}
        </DialogBody>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => setEditingDraft(null)}>取消</Button>
          <Button onClick={handleSaveEdit} disabled={isSaving}>{isSaving ? "保存中..." : "保存"}</Button>
        </div>
      </Dialog>
    </div>
  );
}

function SortableAsset({ asset, onDelete }: { asset: DraftAsset; onDelete: (id: number) => Promise<void> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: asset.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border cursor-grab active:cursor-grabbing bg-muted/30 flex items-center justify-center">
      {asset.url?.startsWith("http") || asset.url?.startsWith("/api") ? (
        <img src={asset.url} alt="" className="w-full h-full object-cover" />
      ) : (
        <FileImage size={24} className="text-muted-foreground" />
      )}
      <button onClick={(e) => { e.stopPropagation(); void onDelete(asset.id); }} className="absolute top-0 right-0 w-4 h-4 bg-black/60 text-white text-[10px] rounded-bl flex items-center justify-center">✕</button>
    </div>
  );
}
