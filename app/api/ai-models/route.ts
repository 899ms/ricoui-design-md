import { validateProviderTarget } from "@/lib/ai/validate-provider-target"

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED === "false") {
    return Response.json({ error: "AI 功能已被部署配置关闭" }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as {
    baseURL?: string
    apiKey?: string
  } | null
  if (!body?.baseURL || !body.apiKey) {
    return Response.json({ error: "缺少 Base URL 或 API Key" }, { status: 400 })
  }
  let target: string
  try {
    target = await validateProviderTarget(body.baseURL, "models")
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "服务地址被拒绝" },
      { status: 400 }
    )
  }
  try {
    const upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${body.apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    })
    if (!upstream.ok) {
      const message = (await upstream.text().catch(() => "")).slice(0, 500)
      return Response.json(
        { error: message || "供应商不支持模型列表接口" },
        { status: upstream.status }
      )
    }
    const payload = (await upstream.json()) as {
      data?: Array<{ id?: unknown }>
    }
    const models = (payload.data ?? [])
      .map((item) => (typeof item.id === "string" ? item.id : ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
    return Response.json({ models })
  } catch {
    return Response.json({ error: "暂时无法获取模型列表" }, { status: 502 })
  }
}
