import {
  buildAnalyzePrompt,
  buildConvertPrompt,
  buildGenerateFromUrlPrompt,
  buildGenerateCorrectionPrompt,
  buildDocumentAssistantPrompt,
  buildRepairPrompt,
} from "@/lib/ai/prompts"
import {
  getAiProvider,
  shouldUseDirectTransport,
  type AiSettings,
} from "@/lib/ai/providers"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import type { UrlSourceMetadata } from "@/lib/types/url-generation"
import type { AssistantIntent } from "@/lib/ai/document-repair-chat"
import {
  AiProviderRequestError,
  normalizeProviderError,
} from "@/lib/ai/provider-error"

export type AiTask =
  | "analyze"
  | "convert"
  | "repair"
  | "generate"
  | "generate-repair"
  | "assistant"

export interface AiStreamInput {
  task: AiTask
  input: string
  settings: AiSettings
  signal?: AbortSignal
  url?: string
  cssEvidence?: string
  source?: UrlSourceMetadata
  publishedDesignMd?: string
  diagnostics?: string[]
  instruction?: string
  previousOutput?: string
  conversation?: string
  assistantIntent?: AssistantIntent
  locale?: Locale
}

export interface AiStreamResult {
  textStream: AsyncIterable<string>
  finishReason: Promise<string>
}

function localizedMessage(
  locale: Locale | undefined,
  english: string,
  chinese: string,
  japanese: string
) {
  return locale === "ja" ? japanese : locale === "en" ? english : chinese
}

/**
 * The AI SDK rejects `finishReason` as soon as an abort signal fires. Attach a
 * rejection observer immediately so a user-initiated cancellation cannot be
 * reported as an unhandled rejection before the caller reaches its await.
 */
export function observeFinishReason(finishReason: PromiseLike<unknown>) {
  const observed = Promise.resolve(finishReason).then((reason) =>
    String(reason)
  )
  void observed.catch(() => undefined)
  return observed
}

function buildPrompt(input: AiStreamInput) {
  switch (input.task) {
    case "analyze":
      return buildAnalyzePrompt(input.input, input.locale)
    case "repair":
      return buildRepairPrompt(
        input.input,
        input.diagnostics ?? [],
        input.locale
      )
    case "generate":
      return buildGenerateFromUrlPrompt(
        input.input,
        input.url ?? "",
        input.cssEvidence,
        input.source,
        input.publishedDesignMd
      )
    case "generate-repair":
      return buildGenerateCorrectionPrompt({
        previousMarkdown: input.previousOutput ?? "",
        diagnostics: input.diagnostics ?? [],
        htmlOrText: input.input,
        url: input.url ?? "",
        cssEvidence: input.cssEvidence,
        source: input.source,
        publishedDesignMd: input.publishedDesignMd,
      })
    case "assistant":
      return buildDocumentAssistantPrompt({
        markdown: input.input,
        instruction: input.instruction ?? "Repair the document.",
        diagnostics: input.diagnostics ?? [],
        conversation: input.conversation ?? "",
        previousProposal: input.previousOutput,
        intent: input.assistantIntent ?? "repair",
        locale: input.locale ?? DEFAULT_LOCALE,
      })
    case "convert":
      return buildConvertPrompt(input.input)
  }
}

type ReasoningEffort = "high" | "max"

/**
 * Per-task model knobs. Previously every task ran DeepSeek with
 * `reasoning_effort: "high"` and `maxOutputTokens: 65536`, which made simple
 * extraction (analyze) take tens of seconds. Analyze, convert and repair are
 * deterministic document operations, so they explicitly disable thinking.
 * Only generation may honor the profile's thinking toggle. Token caps also
 * bound runaway output without constraining a normal DESIGN.md.
 */
export const AI_TASK_MODEL_CONFIG: Record<
  AiTask,
  {
    maxTokens: number
    effort: ReasoningEffort
    thinking: boolean
    temperature: number
  }
> = {
  analyze: {
    maxTokens: 3072,
    effort: "high",
    thinking: false,
    temperature: 0.1,
  },
  convert: {
    maxTokens: 16384,
    effort: "high",
    thinking: false,
    temperature: 0,
  },
  generate: {
    maxTokens: 16384,
    effort: "high",
    thinking: true,
    temperature: 0.2,
  },
  "generate-repair": {
    maxTokens: 16384,
    effort: "high",
    thinking: false,
    temperature: 0,
  },
  assistant: {
    maxTokens: 16384,
    effort: "high",
    thinking: false,
    temperature: 0,
  },
  repair: {
    maxTokens: 4096,
    effort: "high",
    thinking: false,
    temperature: 0.1,
  },
}

export function transformRequestBody(settings: AiSettings, task: AiTask) {
  const config = AI_TASK_MODEL_CONFIG[task]
  const supportsThinkingPayload =
    getAiProvider(settings.providerId).reasoningContent === true
  const useThinking =
    supportsThinkingPayload && settings.thinkingMode && config.thinking
  return (body: Record<string, unknown>) => ({
    ...body,
    ...(supportsThinkingPayload
      ? {
          thinking: { type: useThinking ? "enabled" : "disabled" },
          ...(useThinking ? { reasoning_effort: config.effort } : {}),
        }
      : {}),
  })
}

export function ensureAiTextOutput(
  output: string,
  locale: Locale = DEFAULT_LOCALE
) {
  if (output.trim()) return output
  throw new Error(
    localizedMessage(
      locale,
      "The model finished without returning visible text. Retry, switch models, or use the standard provider endpoint.",
      "模型已结束响应，但没有返回可见正文。请重试、切换模型，或改用标准 Provider 端点。",
      "モデルは応答を終了しましたが、表示できる本文を返しませんでした。再試行するか、モデルまたは標準のプロバイダーエンドポイントを変更してください。"
    )
  )
}

async function createModel(settings: AiSettings, task: AiTask) {
  const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible")
  const direct = shouldUseDirectTransport(settings)
  const baseURL = direct ? settings.baseURL : "https://proxy.invalid"
  const proxyFetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    const rawBody = typeof init?.body === "string" ? init.body : "{}"
    const body = JSON.parse(rawBody) as Record<string, unknown>
    const headers = new Headers(init?.headers)
    headers.delete("authorization")
    return fetch("/api/ai-proxy", {
      ...init,
      headers,
      body: JSON.stringify({
        ...body,
        baseURL: settings.baseURL,
        apiKey: settings.apiKey,
      }),
    })
  }

  return createOpenAICompatible({
    name: settings.providerId || "custom",
    baseURL,
    ...(direct ? { apiKey: settings.apiKey } : { fetch: proxyFetch }),
    transformRequestBody: transformRequestBody(settings, task),
    includeUsage: true,
  })(settings.model)
}

export async function streamAiConvert(
  input: AiStreamInput
): Promise<AiStreamResult> {
  if (!input.settings.apiKey.trim()) {
    throw new Error(
      localizedMessage(
        input.locale,
        "Configure an API key in AI settings first",
        "请先在 AI 设置中配置 API key",
        "先に AI 設定で API キーを設定してください"
      )
    )
  }

  const [{ streamText }, model] = await Promise.all([
    import("ai"),
    createModel(input.settings, input.task),
  ])
  const result = streamText({
    model,
    messages: [{ role: "user", content: buildPrompt(input) }],
    maxOutputTokens: AI_TASK_MODEL_CONFIG[input.task].maxTokens,
    temperature: AI_TASK_MODEL_CONFIG[input.task].temperature,
    abortSignal: input.signal,
  })

  return {
    textStream: result.textStream,
    finishReason: observeFinishReason(result.finishReason),
  }
}

export async function testAiConnection(
  settings: AiSettings,
  signal?: AbortSignal,
  locale: Locale = DEFAULT_LOCALE
) {
  if (!settings.apiKey.trim())
    throw new Error(
      localizedMessage(
        locale,
        "Enter an API key first",
        "请先填写 API key",
        "先に API キーを入力してください"
      )
    )
  const direct = shouldUseDirectTransport(settings)
  const url = direct
    ? `${settings.baseURL.replace(/\/$/, "")}/chat/completions`
    : "/api/ai-proxy"
  const body = {
    model: settings.model,
    messages: [{ role: "user", content: "Reply with OK." }],
    max_tokens: 1,
    stream: false,
    ...(direct ? {} : { baseURL: settings.baseURL, apiKey: settings.apiKey }),
    ...(getAiProvider(settings.providerId).reasoningContent
      ? { thinking: { type: "disabled" } }
      : {}),
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    const normalized = normalizeProviderError(
      body,
      localizedMessage(
        locale,
        `Request failed (${response.status})`,
        `请求失败（${response.status}）`,
        `リクエストに失敗しました（${response.status}）`
      )
    )
    throw new AiProviderRequestError(
      normalized.message,
      response.status,
      normalized.code
    )
  }
  return true
}

export async function fetchAiModels(
  settings: AiSettings,
  signal?: AbortSignal,
  locale: Locale = DEFAULT_LOCALE
) {
  if (!settings.apiKey.trim())
    throw new Error(
      localizedMessage(
        locale,
        "Enter an API key first",
        "请先填写 API Key",
        "先に API キーを入力してください"
      )
    )
  const response = await fetch("/api/ai-models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseURL: settings.baseURL,
      apiKey: settings.apiKey,
    }),
    signal,
  })
  const payload = (await response.json().catch(() => ({}))) as {
    models?: string[]
    error?: string
  }
  if (!response.ok)
    throw new Error(
      payload.error ||
        localizedMessage(
          locale,
          "Could not retrieve models",
          "获取模型失败",
          "モデルを取得できませんでした"
        )
    )
  return payload.models ?? []
}
