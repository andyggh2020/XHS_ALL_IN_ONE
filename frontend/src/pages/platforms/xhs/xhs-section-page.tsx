import { useParams } from "react-router-dom";

const sectionInfo: Record<string, { title: string; description: string }> = {
  accounts: { title: "账号矩阵", description: "管理 PC 与 Creator 账号、Cookie 状态、健康检查和账号作用域。" },
  discovery: { title: "笔记发现", description: "关键词搜索、URL 直达、账号笔记抓取和批量入库。" },
  library: { title: "内容库", description: "视觉笔记卡、标签、筛选、批量导出和素材下载的统一资产库。" },
  analytics: { title: "数据洞察", description: "围绕已抓取数据生成趋势、爆款拆解、评论痛点和关键词机会。" },
  benchmarks: { title: "竞品监控", description: "跟踪目标账号、品牌、关键词与 URL 的最新变化和内容模式。" },
  rewrite: { title: "AI 改写", description: "把收藏笔记转化为可编辑草稿，生成标题、标签和内容角度。" },
  "image-studio": { title: "图片工坊", description: "封面生成、配图变体、版式调整和发布前图片处理。" },
  publish: { title: "发布中心", description: "草稿、素材上传、立即发布、定时发布、失败重试和历史记录。" },
};

export function XhsSectionPage() {
  const { section = "discovery" } = useParams();
  const info = sectionInfo[section] ?? sectionInfo.discovery;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">{info.title}</h2>
      <p className="text-sm text-muted-foreground max-w-md">{info.description}</p>
    </div>
  );
}
