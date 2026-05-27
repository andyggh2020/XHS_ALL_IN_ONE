import {
  CloudUploadOutlined,
  FileAddOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/layout/app-shell";
import { useThemeColors } from "../../../hooks/use-theme-colors";
import { uploadAssetFile } from "../../../lib/api";
import type { UploadedFile } from "../../../lib/api";

const { Title, Text, Paragraph } = Typography;

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
  const [videoFile, setVideoFile] = useState<VideoInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      message.error("请选择视频文件");
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      message.error("视频文件不能超过 500MB");
      return false;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return false; // Don't auto-upload
  };

  const handleUpload = async () => {
    if (!videoFile || !videoUrl) return;
    const file = await fetch(videoUrl).then(r => r.blob());
    const uploadFile = new File([file], videoFile.name, { type: videoFile.type });
    
    setUploading(true);
    try {
      const result = await uploadAssetFile(uploadFile);
      setVideoFile(prev => prev ? { ...prev, uploadedFile: result } : prev);
      message.success("视频上传成功");
    } catch {
      message.error("视频上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleSendToDrafts = () => {
    if (!videoFile?.uploadedFile) return;
    message.info("视频已准备就绪，正在跳转到草稿工坊...");
    navigate("/platforms/xhs/drafts");
  };

  const handleSendToPublish = () => {
    if (!videoFile?.uploadedFile) return;
    navigate("/platforms/xhs/publish");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Video Studio"
        title="视频工坊"
        description="上传视频、预览内容、提取封面，一键送往草稿或发布中心。"
        action={
          <Button icon={<ReloadOutlined />} onClick={() => { setVideoFile(null); setVideoUrl(null); }}>
            清除重来
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        {/* Upload Area */}
        <Col xs={24} lg={12}>
          <Card style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }} styles={{ body: { padding: 24 } }}>
            <Title level={5} style={{ color: c.textPrimary, marginBottom: 20 }}>上传视频</Title>

            {!videoFile ? (
              <Upload.Dragger
                accept="video/*"
                beforeUpload={handleFileSelect as any}
                showUploadList={false}
                style={{ background: c.cardBg2, border: `2px dashed ${c.cardBorder}`, borderRadius: 12 }}
              >
                <div style={{ padding: "60px 24px" }}>
                  <VideoCameraOutlined style={{ fontSize: 56, color: c.textMuted2, marginBottom: 16 }} />
                  <Title level={5} style={{ color: c.textSecondary }}>
                    <CloudUploadOutlined style={{ marginRight: 8 }} />
                    点击或拖拽视频文件到此处
                  </Title>
                  <Text style={{ color: c.textTertiary, fontSize: 13 }}>
                    支持 MP4、MOV、AVI 格式，最大 500MB
                  </Text>
                </div>
              </Upload.Dragger>
            ) : (
              <div>
                {/* Video Info */}
                <Card
                  size="small"
                  style={{ background: c.cardBg2, borderColor: c.cardBorder, marginBottom: 16 }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Space align="start" size={16}>
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 10,
                        background: c.cardBg3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <VideoCameraOutlined style={{ fontSize: 32, color: c.textMuted }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ color: c.textPrimary, fontSize: 15, display: "block", marginBottom: 8 }}>
                        {videoFile.name}
                      </Text>
                      <Space size={16} wrap>
                        <Text style={{ color: c.textTertiary, fontSize: 13 }}>类型：{videoFile.type}</Text>
                        <Text style={{ color: c.textTertiary, fontSize: 13 }}>大小：{formatSize(videoFile.size)}</Text>
                        {videoFile.duration && (
                          <Text style={{ color: c.textTertiary, fontSize: 13 }}>时长：{formatDuration(videoFile.duration)}</Text>
                        )}
                      </Space>
                      {videoFile.uploadedFile && (
                        <Tag color="green" style={{ marginTop: 8 }}>已上传到服务器</Tag>
                      )}
                    </div>
                  </Space>
                </Card>

                {/* Upload + Action Buttons */}
                <Space size={12}>
                  {!videoFile.uploadedFile ? (
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      onClick={handleUpload}
                      loading={uploading}
                      size="large"
                    >
                      上传到服务器
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="primary"
                        icon={<FileAddOutlined />}
                        onClick={handleSendToDrafts}
                      >
                        送往草稿工坊
                      </Button>
                      <Button
                        icon={<SendOutlined />}
                        onClick={handleSendToPublish}
                      >
                        直接发布
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            )}
          </Card>
        </Col>

        {/* Preview Area */}
        <Col xs={24} lg={12}>
          <Card
            style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12, height: "100%" }}
            styles={{ body: { padding: 24, height: "100%" } }}
          >
            <Title level={5} style={{ color: c.textPrimary, marginBottom: 20 }}>视频预览</Title>

            {!videoUrl ? (
              <Empty
                image={<PlayCircleOutlined style={{ fontSize: 48, color: c.textMuted2 }} />}
                description={<Text style={{ color: c.textTertiary }}>上传视频后可在此预览</Text>}
              />
            ) : (
              <div style={{ borderRadius: 12, overflow: "hidden", background: "#000" }}>
                <video
                  src={videoUrl}
                  controls
                  style={{ width: "100%", maxHeight: 400, display: "block" }}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Cover Extraction & Tips */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}>
            <Title level={5} style={{ color: c.textPrimary, marginBottom: 16 }}>封面提取</Title>
            <Alert
              type="info"
              showIcon
              message="AI 自动提取"
              description="视频上传后，AI 会自动分析视频内容，提取最佳帧作为封面图。您也可手动选择关键帧。"
              style={{ background: c.cardBg2, borderColor: c.cardBorder }}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <div style={{ width: 100, height: 133, borderRadius: 8, background: c.cardBg3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PictureOutlined style={{ fontSize: 24, color: c.textMuted }} />
              </div>
              <div style={{ width: 100, height: 133, borderRadius: 8, background: c.cardBg3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PictureOutlined style={{ fontSize: 24, color: c.textMuted }} />
              </div>
              <div style={{ width: 100, height: 133, borderRadius: 8, background: c.cardBg3, display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${c.cardBorder}` }}>
                <FileAddOutlined style={{ fontSize: 20, color: c.textMuted }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}>
            <Title level={5} style={{ color: c.textPrimary, marginBottom: 16 }}>使用提示</Title>
            <Space orientation="vertical" size={14} style={{ width: "100%" }}>
              {[
                { icon: "🎬", title: "上传视频", desc: "支持 MP4、MOV、AVI，最大 500MB，建议 16:9 或 3:4 竖屏。" },
                { icon: "✂️", title: "送往草稿", desc: "视频上传后送往草稿工坊，可添加标题、标签、AI 改写正文。" },
                { icon: "🚀", title: "前往发布", desc: "也可以直接跳转到发布中心，选择账号后进行定时或立即发布。" },
                { icon: "🖼️", title: "封面优化", desc: "系统会自动提取视频关键帧作为封面，提高笔记点击率。" },
              ].map((tip) => (
                <div key={tip.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</Text>
                  <div>
                    <Text strong style={{ color: c.textPrimary, fontSize: 14, display: "block" }}>{tip.title}</Text>
                    <Text style={{ color: c.textTertiary, fontSize: 13 }}>{tip.desc}</Text>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Tech Specs */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card style={{ background: c.cardBg, borderColor: c.cardBorder, borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}>
            <Title level={5} style={{ color: c.textPrimary, marginBottom: 16 }}>技术规格</Title>
            <Row gutter={[24, 16]}>
              {[
                { label: "视频格式", value: "MP4、MOV、AVI", color: "#1668dc" },
                { label: "最大大小", value: "500 MB", color: "#7c3aed" },
                { label: "推荐比例", value: "16:9 或 3:4", color: "#10b981" },
                { label: "封面尺寸", value: "1080×1440", color: "#f59e0b" },
                { label: "编码建议", value: "H.264 / AAC", color: "#ef4444" },
                { label: "上传方式", value: "浏览器直传", color: "#06b6d4" },
              ].map((spec) => (
                <Col xs={12} sm={8} md={4} key={spec.label}>
                  <Statistic
                    title={<Text style={{ color: c.textTertiary, fontSize: 12 }}>{spec.label}</Text>}
                    value={spec.value}
                    styles={{ content: { color: spec.color, fontSize: 16, fontWeight: 600 } }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
