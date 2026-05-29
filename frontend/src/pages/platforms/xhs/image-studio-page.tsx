import { Image as ImageIcon, Inbox, Link, Plus, RefreshCw, Star, Trash2, Upload, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Spinner } from "../../../components/ui/skeletons";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import {
  deleteGeneratedImageAsset, deleteUserImage, describeImageWithAi,
  fetchGeneratedImageAssets, fetchUserImages, generateImageWithAi, uploadAssetFile,
} from "../../../lib/api";
import { formatShanghaiTime } from "../../../lib/time";
import type { GeneratedImageAsset, UserImageFile } from "../../../types";

function isRenderableImage(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/") || value.startsWith("/api/");
}

export function XhsImageStudioPage() {
  const c = useThemeColors();
  const [assets, setAssets] = useState<GeneratedImageAsset[]>([]);
  const [userImages, setUserImages] = useState<UserImageFile[]>([]);
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [saveToAssets, setSaveToAssets] = useState(true);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<"reference" | "describe">("reference");
  const [pickerUrlInput, setPickerUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ai_assets");

  async function loadAssets() {
    setIsLoading(true); setError(null);
    try { const [aiResult, userResult] = await Promise.all([fetchGeneratedImageAssets(), fetchUserImages()]); setAssets(aiResult.items); setUserImages(userResult.items); }
    catch { setError("图片资产加载失败。"); } finally { setIsLoading(false); }
  }

  async function handleGenerate() {
    if (!prompt.trim()) { setError("请填写提示词。"); return; }
    setIsGenerating(true); setError(null); setMessage(null); setGeneratedPreview(null);
    try {
      const result = await generateImageWithAi({ prompt: prompt.trim(), reference_images: referenceImages.length > 0 ? referenceImages : undefined, save_to_assets: saveToAssets });
      setGeneratedPreview(result.url);
      if (result.asset) setAssets((prev) => [result.asset!, ...prev]);
      setMessage("图片生成成功。");
    } catch { setError("AI 图片生成失败，请确认已配置图片生成模型。"); } finally { setIsGenerating(false); }
  }

  async function handleDescribeImage() {
    if (!imageUrl.trim()) { setError("请先填写图片 URL。"); return; }
    setIsDescribing(true); setError(null); setMessage(null);
    try { const result = await describeImageWithAi({ image_url: imageUrl.trim(), instruction: "提炼这张图片适合小红书发布的卖点、风格和标题方向。" }); setDescription(result.text); setMessage("图片描述已生成。"); }
    catch { setError("图片描述失败，请确认已配置支持视觉理解的图片模型。"); } finally { setIsDescribing(false); }
  }

  function openRefPicker(mode: "reference" | "describe") { setPickerMode(mode); setPickerUrlInput(""); setRefPickerOpen(true); }
  function handlePickerSelect(url: string) { if (pickerMode === "reference") { setReferenceImages((prev) => prev.includes(url) ? prev : [...prev, url]); } else { setImageUrl(url); } setRefPickerOpen(false); }
  function handlePickerUrlAdd() { const trimmed = pickerUrlInput.trim(); if (trimmed) handlePickerSelect(trimmed); }

  async function handleUploadFile(file: File) {
    try { const uploaded = await uploadAssetFile(file); const newItem: UserImageFile = { file_name: uploaded.file_name, url: uploaded.download_url, size: uploaded.size }; setUserImages((prev) => [newItem, ...prev]); }
    catch { setError("文件上传失败。"); }
    return false;
  }

  useEffect(() => { void loadAssets(); }, []);

  const renderPickerModal = (
    <Dialog open={refPickerOpen} onClose={() => setRefPickerOpen(false)}>
      <DialogHeader onClose={() => setRefPickerOpen(false)}><DialogTitle>选择图片</DialogTitle></DialogHeader>
      <DialogBody>
        <div className="flex gap-1 mb-4 rounded-xl border border-border p-0.5 bg-muted/50">
          {["user_images", "ai_assets", "url"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: activeTab === tab ? "var(--primary)" : "transparent", color: activeTab === tab ? "white" : "var(--muted-foreground)" }}>
              {tab === "user_images" ? "普通图片" : tab === "ai_assets" ? "AI 资产" : "URL"}
            </button>
          ))}
        </div>
        {activeTab === "user_images" && (userImages.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">暂无普通图片资产。</p> : (
          <div className="grid grid-cols-4 gap-2">{userImages.map((img) => (
            <div key={img.file_name} onClick={() => handlePickerSelect(img.url)} className="cursor-pointer rounded overflow-hidden border border-border h-20 flex items-center justify-center bg-muted/30">
              <img src={img.url} alt={img.file_name} className="max-h-full max-w-full object-contain" />
            </div>
          ))}</div>
        ))}
        {activeTab === "ai_assets" && (assets.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">暂无 AI 图片资产。</p> : (
          <div className="grid grid-cols-4 gap-2">{assets.map((asset) => (
            <div key={asset.id} onClick={() => handlePickerSelect(asset.file_path)} className="cursor-pointer rounded overflow-hidden border border-border h-20 flex items-center justify-center bg-muted/30">
              {isRenderableImage(asset.file_path) ? <img src={asset.file_path} alt={asset.prompt} className="max-h-full max-w-full object-contain" /> : <ImageIcon size={24} className="text-muted-foreground" />}
            </div>
          ))}</div>
        ))}
        {activeTab === "url" && (
          <div className="flex gap-2">
            <input value={pickerUrlInput} onChange={(e) => setPickerUrlInput(e.target.value)} placeholder="输入图片 URL" onKeyDown={(e) => e.key === "Enter" && handlePickerUrlAdd()} className="flex-1 h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none" />
            <Button onClick={handlePickerUrlAdd}>添加</Button>
          </div>
        )}
      </DialogBody>
    </Dialog>
  );

  return (
    <div>
      {/* Gradient header area */}
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">图片工坊</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">AI 图片生成、图片描述、沉淀图片资产，赋能小红书内容创作。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadAssets} disabled={isLoading}><RefreshCw size={14} className="mr-1" />刷新资产</Button>
            <HeaderControls />
          </div>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">✕ {error}</div>}
      {message && <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm">✓ {message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* AI Generation */}
        <Card className="md:col-span-3 p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Star size={16} /> AI 图片生成</h3>
          <p className="text-xs text-muted-foreground mb-3">需配置图片生成模型（如 gpt-image-2、豆包 Seedream）</p>

          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="充满活力的特写编辑肖像，模特眼神犀利..." rows={4} disabled={isGenerating}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 mb-3 resize-none" />

          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1.5">参考图</p>
            <div className="flex gap-2 flex-wrap">
              {referenceImages.map((url, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded overflow-hidden border border-border">
                  {isRenderableImage(url) ? <img src={url} alt={`ref-${idx}`} className="w-14 h-14 object-cover" /> : <div className="w-14 h-14 flex items-center justify-center bg-muted"><ImageIcon size={20} className="text-muted-foreground" /></div>}
                  <button onClick={() => setReferenceImages((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 w-4 h-4 bg-black/60 text-white text-[10px] rounded-bl flex items-center justify-center">✕</button>
                </div>
              ))}
              <div onClick={() => openRefPicker("reference")} className="w-14 h-14 rounded border border-dashed border-border flex items-center justify-center cursor-pointer bg-muted/30">
                <Plus size={20} className="text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={saveToAssets} onChange={(e) => setSaveToAssets(e.target.checked)} className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm text-muted-foreground">保存到 AI 图片资产</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPrompt(""); setReferenceImages([]); setGeneratedPreview(null); setSaveToAssets(true); }} disabled={isGenerating}>重置</Button>
              <Button size="sm" onClick={handleGenerate} disabled={isGenerating}><Bot size={14} className="mr-1" />{isGenerating ? "生成中..." : "生成"}</Button>
            </div>
          </div>

          {generatedPreview && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">生成结果</p>
              <div className="rounded-lg bg-muted/30 p-2 text-center">
                <img src={generatedPreview} alt="generated" className="max-h-[240px] object-contain mx-auto" />
              </div>
            </div>
          )}
        </Card>

        {/* Image Description */}
        <Card className="md:col-span-2 p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><ImageIcon size={16} /> 图片描述</h3>
          <p className="text-xs text-muted-foreground mb-3">需配置多模态模型（如 GPT-4o）</p>
          <div className="flex gap-2 mb-3">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="图片 URL" disabled={isGenerating} className="flex-1 h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none" />
            <Button variant="outline" size="sm" onClick={() => openRefPicker("describe")}><ImageIcon size={14} className="mr-1" />选择</Button>
          </div>
          <Button onClick={handleDescribeImage} disabled={isDescribing} className="w-full mb-3">{isDescribing ? "描述中..." : "生成描述"}</Button>
          {description && <p className="text-sm p-3 rounded-lg bg-muted/30">{description}</p>}
        </Card>
      </div>

      {/* Bottom tabs */}
      <div className="flex gap-1 mb-4 rounded-xl border border-border p-0.5 bg-muted/50">
        {["ai_assets", "user_images"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: activeTab === tab ? "var(--primary)" : "transparent", color: activeTab === tab ? "white" : "var(--muted-foreground)" }}>
            {tab === "ai_assets" ? "AI 图片资产" : "普通图片资产"}
          </button>
        ))}
      </div>

      {activeTab === "ai_assets" ? (
        isLoading ? <div className="flex justify-center py-12"><Spinner /></div>
        : assets.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">暂无 AI 图片资产。</p>
        : <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {assets.map((asset) => (
              <Card key={asset.id} className="p-2">
                <div className="h-[120px] flex items-center justify-center mb-1 rounded overflow-hidden bg-muted/30">
                  {isRenderableImage(asset.file_path) ? <img src={asset.file_path} alt={asset.prompt} className="max-h-[120px] object-contain" /> : <ImageIcon size={28} className="text-muted-foreground" />}
                </div>
                <p className="text-xs font-medium truncate">{asset.prompt}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[10px]">{asset.model_name || "model"}</Badge>
                  <span className="text-[10px] text-muted-foreground">{formatShanghaiTime(asset.created_at)}</span>
                </div>
                <Button size="sm" variant="ghost" className="w-full mt-1 text-destructive" onClick={async () => { try { await deleteGeneratedImageAsset(asset.id); setAssets((prev) => prev.filter((a) => a.id !== asset.id)); } catch { /* ok */ } }}>
                  <Trash2 size={12} className="mr-0.5" />删除
                </Button>
              </Card>
            ))}
          </div>
      ) : (
        <div>
          <div className="mb-4">
            <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleUploadFile(e.target.files[0]); }} className="text-sm" />
          </div>
          {userImages.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">暂无普通图片资产。</p>
          : <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {userImages.map((img) => (
                <Card key={img.file_name} className="p-2">
                  <div className="h-[120px] flex items-center justify-center mb-1 rounded overflow-hidden bg-muted/30">
                    <img src={img.url} alt={img.file_name} className="max-h-[120px] object-contain" />
                  </div>
                  <p className="text-xs truncate">{img.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">{(img.size / 1024).toFixed(1)} KB</p>
                  <Button size="sm" variant="ghost" className="w-full mt-1 text-destructive" onClick={async () => { try { await deleteUserImage(img.file_name); setUserImages((prev) => prev.filter((i) => i.file_name !== img.file_name)); } catch { /* ok */ } }}>
                  <Trash2 size={12} className="mr-0.5" />删除
                </Button>
              </Card>
            ))}
            </div>}
        </div>
      )}

      {renderPickerModal}
    </div>
  );
}
