import { validateProviderTarget } from "@/lib/ai/validate-provider-target"
import { normalizeProviderError } from "@/lib/ai/provider-error"

export const maxDuration = 300

const MAX_BODY_BYTES = 256 * 1024
const UPSTREAM_TIMEOUT_MS = 180_000

function jsonError(message: string, status: number, code?: string) {
  return Response.json(
    { error: message, ...(code ? { code } : {}) },
    { status }
  )
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED === "false") {
    return jsonError("AI 功能已被部署配置关闭", 503)
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > MAX_BODY_BYTES)
    return jsonError("请求体超过 256 KB 限制", 413)

  const bytes = await request.arrayBuffer()
  if (bytes.byteLength > MAX_BODY_BYTES)
    return jsonError("请求体超过 256 KB 限制", 413)

  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error()
    body = parsed as Record<string, unknown>
  } catch {
    return jsonError("请求体必须是 JSON 对象", 400)
  }

  const baseURL = typeof body.baseURL === "string" ? body.baseURL : ""
  const apiKey = typeof body.apiKey === "string" ? body.apiKey : ""
  const model = typeof body.model === "string" ? body.model : ""
  const messages = body.messages
  if (!baseURL || !apiKey || !model || !Array.isArray(messages)) {
    return jsonError("缺少 baseURL、apiKey、model 或 messages", 400)
  }

  let target: string
  try {
    target = await validateProviderTarget(baseURL, "chat/completions")
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "目标地址被拒绝",
      400
    )
  }

  const upstreamBody = { ...body }
  delete upstreamBody.baseURL
  delete upstreamBody.apiKey
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  // Forward a client disconnect (user cancel / navigation) to the upstream so
  // the provider actually stops, instead of only tearing down the browser
  // stream while the model keeps generating.
  request.signal.addEventListener("abort", () => {
    if (!controller.signal.aborted) controller.abort()
  })

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
      cache: "no-store",
    })

    if (!upstream.ok) {
      const body = (await upstream.text().catch(() => "")).slice(0, 1000)
      const normalized = normalizeProviderError(body, "AI provider 请求失败")
      return jsonError(normalized.message, upstream.status, normalized.code)
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonError("AI provider 请求超时", 504)
    }
    return jsonError("AI provider 暂时不可用", 502)
  } finally {
    clearTimeout(timeout)
  }
}
