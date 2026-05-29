import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useThemeColors } from "../../../hooks/use-theme-colors";
import { HeaderControls } from "../../../components/layout/header-controls";
import { uploadAssetFile } from "../../../lib/api";
import type { UploadedFile } from "../../../lib/api";
import { useToast } from "../../../components/ui/toast";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

interface VideoInfo {
  name: string;
  size: number;
  type: string;
  duration?: number;
  uploadedFile?: UploadedFile;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function XhsVideoStudioPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<VideoInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast("请选择视频文件", "error");
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast("视频文件不能超过 500MB", "error");
      return false;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return false;
  };

  const handleUpload = async () => {
    if (!videoFile || !videoUrl) return;
    const file = await fetch(videoUrl).then(r => r.blob());
    const uploadFile = new File([file], videoFile.name, { type: videoFile.type });
    
    setUploading(true);
    try {
      const result = await uploadAssetFile(uploadFile);
      setVideoFile(prev => prev ? { ...prev, uploadedFile: result } : prev);
      toast("视频上传成功", "success");
    } catch {
      toast("视频上传失败，请重试", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSendToDrafts = () => {
    if (!videoFile?.uploadedFile) return;
    toast("视频已准备就绪，正在跳转到草稿工坊...", "info");
    navigate("/platforms/xhs/drafts");
  };

  const handleSendToPublish = () => {
    if (!videoFile?.uploadedFile) return;
    navigate("/platforms/xhs/publish");
  };

  return (
    <div>
      {/* Gradient header area */}
      <div className="bg-page-header-feigua -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <div className="flex items-start justify-between header-content">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1.5">视频工坊</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">上传视频、预览内容、提取封面，一键送往草稿或发布中心。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setVideoFile(null); setVideoUrl(null); }}>
              清除重来
            </Button>
            <HeaderControls />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload Area */}
        <div>
          <Card className="p-6" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: c.textPrimary }}>上传视频</h3>

            {!videoFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileSelect(file);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "video/*";
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFileSelect(f);
                  };
                  input.click();
                }}
                style={{ background: c.cardBg2, border: `2px dashed ${c.cardBorder}`, borderRadius: 12, cursor: "pointer" }}
              >
                <div className="text-center py-16 px-6">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: c.textMuted2, margin: "0 auto 16px", display: "block" }}>
                    <path d="M22 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h2" />
                    <rect x="16" y="2" width="6" height="6" rx="1" />
                    <path d="M14 7a3 3 0 0 1-3 3H9" />
                    <path d="M10 9v-2" />
                    <path d="M10 5v-2" />
                    <circle cx="17" cy="5" r="1" />
                  </svg>
                  <h3 className="text-base font-semibold mb-2" style={{ color: c.textSecondary }}>
                    点击或拖拽视频文件到此处
                  </h3>
                  <p style={{ color: c.textTertiary, fontSize: 13 }}>
                    支持 MP4、MOV、AVI 格式，最大 500MB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Video Info */}
                <div className="flex gap-4 p-4 mb-4 rounded-xl" style={{ background: c.cardBg2, borderColor: c.cardBorder }}>
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{ width: 80, height: 80, borderRadius: 10, background: c.cardBg3 }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: c.textMuted }}>
                      <path d="M22 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h2" />
                      <rect x="16" y="2" width="6" height="6" rx="1" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold mb-2 text-sm" style={{ color: c.textPrimary }}>{videoFile.name}</p>
                    <div className="flex gap-4 flex-wrap">
                      <span style={{ color: c.textTertiary, fontSize: 13 }}>类型：{videoFile.type}</span>
                      <span style={{ color: c.textTertiary, fontSize: 13 }}>大小：{formatSize(videoFile.size)}</span>
                      {videoFile.duration && (
                        <span style={{ color: c.textTertiary, fontSize: 13 }}>时长：{formatDuration(videoFile.duration)}</span>
                      )}
                    </div>
                    {videoFile.uploadedFile && (
                      <span className="inline-flex items-center rounded-lg border border-transparent bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 text-xs font-semibold mt-2">
                        已上传到服务器
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload + Action Buttons */}
                <div className="flex gap-3">
                  {!videoFile.uploadedFile ? (
                    <Button onClick={handleUpload} loading={uploading} size="lg">
                      上传到服务器
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSendToDrafts}>
                        送往草稿工坊
                      </Button>
                      <Button variant="outline" onClick={handleSendToPublish}>
                        直接发布
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Preview Area */}
        <div>
          <Card className="p-6 h-full" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
            <h3 className="text-base font-semibold mb-5" style={{ color: c.textPrimary }}>视频预览</h3>

            {!videoUrl ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: c.textMuted2 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p style={{ color: c.textTertiary }} className="mt-4">上传视频后可在此预览</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ background: "#000" }}>
                <video
                  src={videoUrl}
                  controls
                  className="w-full max-h-[400px] block"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Cover Extraction & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <div>
          <Card className="p-6" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: c.textPrimary }}>封面提取</h3>
            <div className="p-4 rounded-xl border" style={{ background: c.cardBg2, borderColor: c.cardBorder }}>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold shrink-0">ℹ</span>
                <div>
                  <p className="font-semibold text-sm">AI 自动提取</p>
                  <p className="text-sm" style={{ color: c.textTertiary }}>视频上传后，AI 会自动分析视频内容，提取最佳帧作为封面图。您也可手动选择关键帧。</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <div className="flex items-center justify-center" style={{ width: 100, height: 133, borderRadius: 8, background: c.cardBg3 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: c.textMuted }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="flex items-center justify-center" style={{ width: 100, height: 133, borderRadius: 8, background: c.cardBg3 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: c.textMuted }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="flex items-center justify-center" style={{ width: 100, height: 133, borderRadius: 8, border: `1px dashed ${c.cardBorder}`, background: c.cardBg3 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: c.textMuted }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-6" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: c.textPrimary }}>使用提示</h3>
            <div className="flex flex-col gap-3.5 w-full">
              {[
                { icon: "🎬", title: "上传视频", desc: "支持 MP4、MOV、AVI，最大 500MB，建议 16:9 或 3:4 竖屏。" },
                { icon: "✂️", title: "送往草稿", desc: "视频上传后送往草稿工坊，可添加标题、标签、AI 改写正文。" },
                { icon: "🚀", title: "前往发布", desc: "也可以直接跳转到发布中心，选择账号后进行定时或立即发布。" },
                { icon: "🖼️", title: "封面优化", desc: "系统会自动提取视频关键帧作为封面，提高笔记点击率。" },
              ].map((tip) => (
                <div key={tip.title} className="flex gap-3 items-start">
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: c.textPrimary }}>{tip.title}</p>
                    <p className="text-sm" style={{ color: c.textTertiary }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Tech Specs */}
      <div className="mt-5">
        <Card className="p-6" style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: c.textPrimary }}>技术规格</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { label: "视频格式", value: "MP4、MOV、AVI", color: "#1668dc" },
              { label: "最大大小", value: "500 MB", color: "#7c3aed" },
              { label: "推荐比例", value: "16:9 或 3:4", color: "#10b981" },
              { label: "封面尺寸", value: "1080×1440", color: "#f59e0b" },
              { label: "编码建议", value: "H.264 / AAC", color: "#ef4444" },
              { label: "上传方式", value: "浏览器直传", color: "#06b6d4" },
            ].map((spec) => (
              <div key={spec.label}>
                <p className="text-xs" style={{ color: c.textTertiary }}>{spec.label}</p>
                <p className="text-base font-semibold mt-1" style={{ color: spec.color }}>{spec.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
