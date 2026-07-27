export type AiTransport = "auto" | "direct" | "proxy"
export type AiProviderPresetId =
  | "deepseek"
  | "anthropic"
  | "volcengine"
  | "openrouter"
  | "glm"
  | "glm-coding"
  | "custom"

export interface AiProvider {
  id: AiProviderPresetId
  label: string
  baseURL: string
  models: string[]
  defaultModel: string
  corsOk: boolean
  reasoningContent?: boolean
  supportsModelList: boolean
  recommended?: boolean
  description: string
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
    defaultModel: "deepseek-v4-flash",
    corsOk: false,
    reasoningContent: true,
    supportsModelList: true,
    description: "DeepSeek 官方 OpenAI 兼容接口",
  },
  {
    id: "anthropic",
    label: "Anthropic / Claude",
    baseURL: "https://api.anthropic.com/v1",
    models: [
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
      "claude-opus-4-8",
    ],
    defaultModel: "claude-sonnet-4-6",
    corsOk: false,
    supportsModelList: false,
    recommended: true,
    description: "Claude 官方兼容入口；适合纯文本文档任务，高级能力需原生 API",
  },
  {
    id: "volcengine",
    label: "火山方舟",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    models: ["doubao-seed-2-0-lite-260215", "doubao-seed-1-6-flash-250715"],
    defaultModel: "doubao-seed-2-0-lite-260215",
    corsOk: false,
    reasoningContent: true,
    supportsModelList: true,
    description: "火山方舟 OpenAI 兼容接口，使用方舟推理 API Key",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    models: [
      "openai/gpt-5.2",
      "anthropic/claude-sonnet-4.5",
      "google/gemini-3-flash-preview",
    ],
    defaultModel: "openai/gpt-5.2",
    corsOk: true,
    supportsModelList: true,
    description: "通过一个 API 使用多个模型供应商",
  },
  {
    id: "glm",
    label: "Z.AI / GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    models: ["glm-5.2", "glm-5", "glm-4.7", "glm-4.7-flash"],
    defaultModel: "glm-5.2",
    corsOk: false,
    reasoningContent: true,
    supportsModelList: true,
    description: "智谱开放平台标准 API",
  },
  {
    id: "glm-coding",
    label: "GLM Coding Plan",
    baseURL: "https://open.bigmodel.cn/api/coding/paas/v4",
    models: ["glm-5.2", "glm-4.7"],
    defaultModel: "glm-5.2",
    corsOk: false,
    reasoningContent: true,
    supportsModelList: false,
    description: "实验性兼容：GLM 编码套餐专属端点",
  },
  {
    id: "custom",
    label: "自定义",
    baseURL: "https://your-provider.example.com/v1",
    models: [],
    defaultModel: "",
    corsOk: false,
    supportsModelList: true,
    description: "其他 OpenAI Compatible 服务",
  },
]

export interface AiSettings {
  providerId: AiProviderPresetId
  baseURL: string
  model: string
  apiKey: string
  transport: AiTransport
  thinkingMode: boolean
}

export interface AiProviderProfile extends AiSettings {
  id: string
  name: string
  kind: "preset" | "custom"
  discoveredModels: string[]
}

export interface AiSettingsState {
  version: 2
  aiEnabled: boolean
  activeProfileId: string
  profiles: AiProviderProfile[]
}

export function getAiProvider(providerId: string): AiProvider {
  return (
    AI_PROVIDERS.find((provider) => provider.id === providerId) ??
    AI_PROVIDERS[AI_PROVIDERS.length - 1]
  )
}

export function createProviderProfile(
  providerId: AiProviderPresetId,
  id = crypto.randomUUID()
): AiProviderProfile {
  const provider = getAiProvider(providerId)
  return {
    id,
    name: provider.label,
    kind: providerId === "custom" ? "custom" : "preset",
    providerId,
    baseURL: provider.baseURL,
    model: provider.defaultModel,
    apiKey: "",
    transport: providerId === "custom" ? "proxy" : "auto",
    thinkingMode: false,
    discoveredModels: [],
  }
}

export function shouldUseDirectTransport(
  settings: Pick<AiSettings, "providerId" | "baseURL" | "transport">
) {
  if (settings.transport === "direct") return true
  if (settings.transport === "proxy") return false
  if (settings.providerId === "custom") return false
  return getAiProvider(settings.providerId).corsOk
}
