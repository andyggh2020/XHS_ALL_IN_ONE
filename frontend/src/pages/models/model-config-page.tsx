import { Bot, CheckCircle, Edit3, ExternalLink, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../../components/layout/app-shell";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Spinner } from "../../components/ui/skeletons";
import { createModelConfig, deleteModelConfig, fetchModelConfigs, setDefaultModelConfig, testModelConfig, updateModelConfig } from "../../lib/api";
import type { ModelConfig, ModelConfigPayload, ModelType } from "../../types";

const emptyForm: ModelConfigPayload = {
  name: "", model_type: "text", provider: "openai-compatible",
  model_name: "gpt-5.4", base_url: "", api_key: "", is_default: true,
};

function defaultModelName(type: ModelType): string {
  return type === "text" ? "gpt-5.4" : "";
}

function typeLabel(type: ModelType): string {
  return type === "text" ? "文本模型" : "图片模型";
}

const modelProviders = [
  { label: "OpenAI 兼容", value: "openai-compatible" },
  { label: "OpenAI", value: "openai" },
  { label: "Azure OpenAI", value: "azure" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Gemini", value: "gemini" },
];

export function ModelConfigPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [form, setForm] = useState<ModelConfigPayload>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { status: string; message: string }>>({});

  const grouped = useMemo(() => ({
    text: configs.filter((c) => c.model_type === "text"),
    image: configs.filter((c) => c.model_type === "image"),
  }), [configs]);

  async function loadConfigs() {
    setIsLoading(true); setError(null);
    try { const r = await fetchModelConfigs(); setConfigs(r.items); }
    catch { setError("模型配置加载失败。"); }
    finally { setIsLoading(false); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.model_name.trim()) { setError("请填写配置名称和模型名称。"); return; }
    setIsSaving(true); setMessage(null); setError(null);
    const payload = { ...form, name: form.name.trim(), model_name: form.model_name.trim(), provider: form.provider.trim(), base_url: form.base_url.trim(), api_key: form.api_key.trim() };
    try {
      if (editingId) {
        const updated = await updateModelConfig(editingId, payload);
        setConfigs((current) => current.map((c) => c.id === updated.id ? updated : (updated.is_default && c.model_type === updated.model_type ? { ...c, is_default: false } : c)));
        setMessage(`${typeLabel(updated.model_type)}配置已更新。`); setEditingId(null);
      } else {
        const created = await createModelConfig(payload);
        setConfigs((current) => {
          const withoutOldDefault = created.is_default ? current.map((c) => c.model_type === created.model_type ? { ...c, is_default: false } : c) : current;
          return [created, ...withoutOldDefault];
        });
        setMessage(`${typeLabel(created.model_type)}配置已保存。`);
      }
      setForm({ ...emptyForm, model_type: form.model_type });
    } catch { setError("模型配置保存失败。"); }
    finally { setIsSaving(false); }
  }

  function handleEdit(config: ModelConfig) {
    setEditingId(config.id);
    setForm({ name: config.name, model_type: config.model_type, provider: config.provider, model_name: config.model_name, base_url: config.base_url, api_key: "", is_default: config.is_default });
    setMessage(null); setError(null);
  }

  function handleCancelEdit() { setEditingId(null); setForm({ ...emptyForm, model_type: form.model_type }); }

  async function handleDelete(configId: number) {
    setError(null); setMessage(null);
    try { await deleteModelConfig(configId); setConfigs((current) => current.filter((c) => c.id !== configId)); if (editingId === configId) { setEditingId(null); setForm({ ...emptyForm, model_type: form.model_type }); } setMessage("配置已删除。"); }
    catch { setError("配置删除失败。"); }
  }

  async function handleTest(configId: number) {
    setTestingId(configId);
    try { const r = await testModelConfig(configId); setTestResults((prev) => ({ ...prev, [configId]: { status: r.status, message: r.message } })); }
    catch { setTestResults((prev) => ({ ...prev, [configId]: { status: "error", message: "检查请求失败" } })); }
    finally { setTestingId(null); }
  }

  async function handleSetDefault(config: ModelConfig) {
    setError(null); setMessage(null);
    try { const updated = await setDefaultModelConfig(config.id); setConfigs((current) => current.map((item) => item.model_type === updated.model_type ? { ...item, is_default: item.id === updated.id } : item)); setMessage(`${updated.name} 已设为默认${typeLabel(updated.model_type)}。`); }
    catch { setError("默认模型切换失败。"); }
  }

  useEffect(() => { void loadConfigs(); }, []);

  return (
    <div>
      {/* Gradient header area */}
      <div className="bg-[var(--background-alt)]/30 -mx-8 -mt-8 px-8 pt-8 pb-2 mb-6 border-b border-border/50">
        <PageHeader
        eyebrow="Model Routing"
        title="模型配置"
        description="为改写、生成、封面和图片处理配置用户级文本与图片模型。"
        action={<Button variant="outline" size="sm" onClick={loadConfigs} disabled={isLoading}><RefreshCw size={14} className="mr-1" />刷新</Button>}
      />
      </div>{/* end gradient header */}

      {/* Info */}
      <div className="flex items-start gap-2 px-4 py-3 mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500 text-sm">
        <span>ℹ</span>
        <div>
          <p className="font-medium mb-1">推荐的 OpenAI 兼容 API 服务</p>
          <ul className="space-y-1 text-xs">
            <li><a href="https://api.openai-next.com/" target="_blank" rel="noreferrer" className="underline hover:no-underline">api.openai-next.com</a> — Base URL: <code className="px-1 py-0.5 rounded bg-blue-500/20">https://api.openai-next.com/v1</code></li>
            <li><a href="https://www.volcengine.com/product/doubao" target="_blank" rel="noreferrer" className="underline hover:no-underline">火山引擎（豆包）</a> — Base URL: <code className="px-1 py-0.5 rounded bg-blue-500/20">https://ark.cn-beijing.volces.com/api/v3</code></li>
            <li><a href="https://bailian.console.aliyun.com/" target="_blank" rel="noreferrer" className="underline hover:no-underline">阿里云百炼</a> — Base URL: <code className="px-1 py-0.5 rounded bg-blue-500/20">https://dashscope.aliyuncs.com/compatible-mode/v1</code></li>
          </ul>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">✕ {error}</div>}
      {message && <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm">✓ {message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
                <h3 className="font-semibold">{editingId ? "编辑模型" : "新增模型"}</h3>
                {editingId && <Button size="sm" variant="ghost" className="ml-auto" onClick={handleCancelEdit}>取消编辑</Button>}
              </div>

              <div className="flex rounded-xl border border-border p-0.5 bg-muted/50 mb-5">
                {(["text", "image"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((current) => ({ ...current, model_type: type, model_name: defaultModelName(type) }))}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: form.model_type === type ? "var(--primary)" : "transparent", color: form.model_type === type ? "white" : "var(--muted-foreground)" }}
                  >
                    {typeLabel(type)}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">配置名称</label>
                  <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="例如：默认文本模型" className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 text-xs text-muted-foreground">所有模型需兼容 OpenAI 接口规范</div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">模型名称</label>
                  <input value={form.model_name} onChange={(e) => setForm((c) => ({ ...c, model_name: e.target.value }))} placeholder={form.model_type === "text" ? "gpt-4o-mini" : "gpt-image-1"} className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Base URL</label>
                  <input value={form.base_url} onChange={(e) => setForm((c) => ({ ...c, base_url: e.target.value }))} placeholder="https://api.example.com/v1" className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">API Key</label>
                  <input type="password" value={form.api_key} onChange={(e) => setForm((c) => ({ ...c, api_key: e.target.value }))} placeholder="保存后只显示是否已配置" className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((c) => ({ ...c, is_default: e.target.checked }))} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                  <span className="text-sm">设为该类型默认模型</span>
                </label>
                <Button type="submit" disabled={isSaving} className="w-full">{isSaving ? "保存中..." : editingId ? "更新配置" : "保存配置"}</Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Config Lists */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["text", "image"] as ModelType[]).map((type) => (
              <Card key={type}>
                <div className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Bot size={16} className="text-muted-foreground" />
                    {typeLabel(type)}
                  </h3>

                  {isLoading ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  ) : grouped[type].length === 0 ? (
                    <div className="text-center py-8">
                      <Bot size={36} className="mx-auto text-muted-foreground/30 mb-3" />
                      <p className="font-medium text-sm mb-1">暂无{typeLabel(type)}</p>
                      <p className="text-xs text-muted-foreground">保存一个配置后，AI 流程就能读取默认模型。</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {grouped[type].map((config) => (
                        <div key={config.id} className="rounded-xl border border-border p-4 bg-card/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{config.name}</span>
                            {config.is_default && <Badge variant="default"><Star size={12} className="mr-1 text-amber-500" />默认</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{config.model_name || "未填写模型名称"}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                            <span>{config.base_url || "未配置 Base URL"}</span>
                            <span>{config.has_api_key ? "已保存 API Key" : "未保存 API Key"}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" variant="ghost" disabled={config.is_default} onClick={() => handleSetDefault(config)}>
                              {config.is_default ? "当前默认" : "设为默认"}
                            </Button>
                            <Button size="sm" variant="ghost" disabled={testingId === config.id} onClick={() => void handleTest(config.id)}>
                              <ExternalLink size={12} className="mr-0.5" />检查
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(config)}>
                              <Edit3 size={12} className="mr-0.5" />编辑
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm("确定删除此模型配置？")) void handleDelete(config.id); }}>
                              <Trash2 size={12} className="mr-0.5" />删除
                            </Button>
                          </div>
                          {testResults[config.id] && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <Badge variant={testResults[config.id].status === "ok" ? "success" : "destructive"}>
                                {testResults[config.id].status === "ok" ? "连接正常" : "连接失败"}
                              </Badge>
                              <span className="text-muted-foreground">{testResults[config.id].message}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
