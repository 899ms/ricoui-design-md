import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildConvertPrompt,
  buildDocumentAssistantPrompt,
  buildGenerateCorrectionPrompt,
  buildGenerateFromUrlPrompt,
  buildRepairPrompt,
} from "@/lib/ai/prompts"
import { shouldUseDirectTransport } from "@/lib/ai/providers"
import { validateConvertedMarkdown } from "@/lib/ai/validate-converted"
import {
  AI_TASK_MODEL_CONFIG,
  ensureAiTextOutput,
  observeFinishReason,
  streamAiConvert,
  transformRequestBody,
} from "@/lib/ai/ai-client"
import {
  AiProviderRequestError,
  getAiUserFacingError,
  isProviderBusyError,
  normalizeProviderError,
} from "@/lib/ai/provider-error"

describe("V8 AI core", () => {
  it("observes a cancelled stream finish reason immediately", async () => {
    const abort = new DOMException("AI conversion cancelled", "AbortError")
    const controller = new AbortController()
    const finishReason = observeFinishReason(
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(controller.signal.reason)
        )
      })
    )
    controller.abort(abort)

    await expect(finishReason).rejects.toBe(abort)
  })

  it("selects direct transport only for CORS-friendly providers", () => {
    expect(
      shouldUseDirectTransport({
        providerId: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        transport: "auto",
      })
    ).toBe(true)
    expect(
      shouldUseDirectTransport({
        providerId: "deepseek",
        baseURL: "https://api.deepseek.com/v1",
        transport: "auto",
      })
    ).toBe(false)
    expect(
      shouldUseDirectTransport({
        providerId: "deepseek",
        baseURL: "https://api.deepseek.com/v1",
        transport: "direct",
      })
    ).toBe(true)
  })

  it("injects the canonical contract and preserves opaque source values", () => {
    const prompt = buildConvertPrompt(
      "theme: dark\naccent: oklch(60% 0.2 30)\n{colors.primary}"
    )
    expect(prompt).toContain("canonical grammar")
    expect(prompt).toContain("oklch(60% 0.2 30)")
    expect(prompt).toContain("{colors.primary}")
    expect(prompt).toContain("only the converted Markdown document")
  })

  it("asks repair models for structured JSON suggestions", () => {
    const prompt = buildRepairPrompt("# Example", ["missing colors"])
    expect(prompt).toContain('"suggestions"')
    expect(prompt).toContain("valid JSON only")
  })

  it("makes AI the primary analyst while preserving canonical value safety", () => {
    const prompt = buildGenerateFromUrlPrompt(
      "Develop. Preview. Ship.",
      "https://vercel.com",
      "--geist-foreground: #000000\nfont-family: Geist, sans-serif"
    )
    expect(prompt).toContain("CAPTURED CSS SIGNAL")
    expect(prompt).toContain("--geist-foreground: #000000")
    expect(prompt).toContain("https://vercel.com")
    expect(prompt).toContain("You are the primary analyst")
    expect(prompt).toContain("you may choose a coherent conventional value")
    expect(prompt).toContain("Never emit unknown")
    expect(prompt).toContain("never 1.25rem (20px)")
    expect(prompt).toContain("--spacing * 5")
    expect(prompt).toContain("Do not mechanically multiply a base unit")
    expect(prompt).toContain("**Source website:**")
    expect(prompt).toContain("product features")
  })

  it("gives a published DESIGN.md priority over weaker page samples", () => {
    const prompt = buildGenerateFromUrlPrompt(
      "Vercel homepage",
      "https://vercel.com/",
      "--color-page: #fafafa",
      {
        kind: "published-design-md",
        requestedUrl: "https://vercel.com/",
        pageUrl: "https://vercel.com/",
        sourceUrl: "https://vercel.com/design.md",
        title: "Vercel",
      },
      "---\nname: Geist\ncolors:\n  primary: '#171717'\n---"
    )

    expect(prompt).toContain("PUBLISHED DESIGN.MD (highest-priority source")
    expect(prompt).toContain("name: Geist")
    expect(prompt).toContain("https://vercel.com/design.md")
    expect(prompt).toContain("Never override a published token")
  })

  it("omits the CSS evidence block when no evidence was extracted", () => {
    const prompt = buildGenerateFromUrlPrompt(
      "Some text",
      "https://example.com"
    )
    expect(prompt).not.toContain("CAPTURED CSS SIGNAL")
    expect(prompt).toContain("WEBSITE CONTENT")
  })

  it("constrains correction and the AI assistant to the DESIGN.md source", () => {
    const correction = buildGenerateCorrectionPrompt({
      previousMarkdown: "# Example",
      diagnostics: ["invalid-css-values"],
      htmlOrText: "Example",
      url: "https://example.com/",
      cssEvidence: "--spacing: 4px",
    })
    expect(correction).toContain("automatic correction pass")
    expect(correction).toContain("exact parser path and rejected value")
    expect(correction).toContain("https://example.com/")
    expect(correction).toContain("supporting prose in English")

    const chat = buildDocumentAssistantPrompt({
      markdown: "# Example",
      instruction: "Remove the invalid row",
      diagnostics: ["invalid-token"],
      conversation: "",
      intent: "repair",
      locale: "zh-CN",
    })
    expect(chat).toContain("<<<TASK>>>")
    expect(chat).toContain("<<<DESIGN_MD>>>")
    expect(chat).toContain("deterministic derivatives")
    expect(chat).toContain("使用简体中文撰写回复摘要")
    expect(chat).toContain("AI copilot for the current DESIGN.md")
    expect(chat).toContain("audit, an explanation, or a concrete edit")
    expect(chat).toContain("Name | Value | Token | Role")
    expect(chat).toContain("Never imply that proposed Markdown has already")
    expect(chat).toContain("show a diff only when")
    expect(chat).toContain("LAST UNAPPLIED PROPOSAL")
  })

  it("keeps deterministic document tasks in fast non-thinking mode", () => {
    expect(AI_TASK_MODEL_CONFIG.analyze).toMatchObject({
      thinking: false,
      maxTokens: 3072,
    })
    expect(AI_TASK_MODEL_CONFIG.convert.thinking).toBe(false)
    expect(AI_TASK_MODEL_CONFIG.repair.thinking).toBe(false)
    expect(AI_TASK_MODEL_CONFIG["generate-repair"].thinking).toBe(false)
    expect(AI_TASK_MODEL_CONFIG.assistant.thinking).toBe(false)
    expect(AI_TASK_MODEL_CONFIG.generate.thinking).toBe(true)
  })

  it("controls GLM thinking by task and keeps deterministic work disabled", () => {
    const settings = {
      providerId: "glm" as const,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-5.2",
      apiKey: "secret",
      transport: "proxy" as const,
      thinkingMode: true,
    }
    expect(
      transformRequestBody(settings, "convert")({ model: "glm-5.2" })
    ).toMatchObject({ thinking: { type: "disabled" } })
    expect(transformRequestBody(settings, "assistant")({})).toMatchObject({
      thinking: { type: "disabled" },
    })
    expect(transformRequestBody(settings, "repair")({})).toMatchObject({
      thinking: { type: "disabled" },
    })
    expect(transformRequestBody(settings, "generate")({})).toMatchObject({
      thinking: { type: "enabled" },
      reasoning_effort: "high",
    })
    expect(
      transformRequestBody(
        { ...settings, providerId: "glm-coding", thinkingMode: false },
        "generate"
      )({})
    ).toMatchObject({ thinking: { type: "disabled" } })
  })

  it("rejects an empty visible response instead of reporting completion", () => {
    expect(() => ensureAiTextOutput(" \n ", "zh-CN")).toThrow(
      "没有返回可见正文"
    )
    expect(ensureAiTextOutput("visible", "en")).toBe("visible")
  })

  it("streams GLM visible content when reasoning frames arrive separately", async () => {
    const response = [
      `data: ${JSON.stringify({
        id: "chatcmpl-1",
        object: "chat.completion.chunk",
        created: 1,
        model: "glm-5.2",
        choices: [
          {
            index: 0,
            delta: { role: "assistant", reasoning_content: "internal" },
            finish_reason: null,
          },
        ],
      })}`,
      `data: ${JSON.stringify({
        id: "chatcmpl-1",
        object: "chat.completion.chunk",
        created: 1,
        model: "glm-5.2",
        choices: [
          { index: 0, delta: { content: "visible" }, finish_reason: null },
        ],
      })}`,
      `data: ${JSON.stringify({
        id: "chatcmpl-1",
        object: "chat.completion.chunk",
        created: 1,
        model: "glm-5.2",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      })}`,
      "data: [DONE]",
      "",
    ].join("\n\n")
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Promise.resolve(
          new Response(response, {
            headers: { "content-type": "text/event-stream" },
          })
        )
    )
    vi.stubGlobal("fetch", fetchMock)

    const stream = await streamAiConvert({
      task: "convert",
      input: "# Example",
      settings: {
        providerId: "glm",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        model: "glm-5.2",
        apiKey: "secret",
        transport: "direct",
        thinkingMode: true,
      },
      locale: "en",
    })
    let output = ""
    for await (const chunk of stream.textStream) output += chunk

    expect(output).toBe("visible")
    expect(await stream.finishReason).toBe("stop")
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body))).toMatchObject({
      thinking: { type: "disabled" },
    })
  })

  it("normalizes nested provider errors and identifies busy responses", () => {
    const nested = JSON.stringify({
      error: JSON.stringify({
        error: { code: "1305", message: "该模型当前访问量过大，请您稍后再试" },
      }),
    })
    expect(normalizeProviderError(nested, "fallback")).toEqual({
      code: "1305",
      message: "该模型当前访问量过大，请您稍后再试",
    })
    const error = new AiProviderRequestError("busy", 400, "1305")
    expect(isProviderBusyError(error)).toBe(true)
    expect(getAiUserFacingError(error, "zh-CN", "fallback")).toContain(
      "不表示 API Key 无效"
    )
    expect(
      getAiUserFacingError(
        new AiProviderRequestError("unauthorized", 401),
        "zh-CN",
        "fallback"
      )
    ).toContain("检查 API Key")
  })

  it("reports canonical output completeness and truncation", () => {
    const complete = `# Example\n\n> Description\n\n**Theme:** light\n\n## Tokens – Colors\n\n| Name | Value | Token | Role |\n|---|---|---|---|\n| Primary | \`#000\` | \`--color-primary\` | primary |\n\n## Tokens – Typography\n\n### Inter\n- **Substitute:** system-ui\n- **Weights:** 400\n- **Role:** body\n\n### Type Scale\n| Role | Size | Line Height | Letter Spacing | Token |\n|---|---|---|---|---|\n| body | 16px | 1.5 | 0 | \`--type-body\` |\n\n## Components\n\n### Button\n**Role:** CTA\nA button.`
    const report = validateConvertedMarkdown(complete, "stop")
    expect(report.result).not.toBeNull()
    expect(report.nonEmptyGroups).toContain("colors")

    const truncated = validateConvertedMarkdown(
      "# Example\n\n| Name | Value |",
      "length"
    )
    expect(truncated.truncated).toBe(true)
    expect(truncated.valid).toBe(false)
  })
})

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34" }]),
}))

describe("AI proxy hardening", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("data: [DONE]\n\n", {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          })
      )
    )
  })

  it("rejects insecure and private targets before forwarding", async () => {
    const { POST } = await import("@/app/api/ai-proxy/route")
    const body = { model: "test", messages: [], apiKey: "secret" }
    const insecure = await POST(
      new Request("http://localhost/api/ai-proxy", {
        method: "POST",
        body: JSON.stringify({ ...body, baseURL: "http://example.com/v1" }),
      })
    )
    expect(insecure.status).toBe(400)

    const privateTarget = await POST(
      new Request("http://localhost/api/ai-proxy", {
        method: "POST",
        body: JSON.stringify({ ...body, baseURL: "https://127.0.0.1/v1" }),
      })
    )
    expect(privateTarget.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it("forwards a fixed chat completions path and streams the body", async () => {
    const { POST } = await import("@/app/api/ai-proxy/route")
    const response = await POST(
      new Request("http://localhost/api/ai-proxy", {
        method: "POST",
        body: JSON.stringify({
          model: "test",
          messages: [{ role: "user", content: "hello" }],
          apiKey: "secret",
          baseURL: "https://example.com/v1/arbitrary",
          stream: true,
        }),
      })
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("[DONE]")
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://example.com/v1/arbitrary/chat/completions",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("returns a clean provider error and optional code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: JSON.stringify({
              error: {
                code: "1305",
                message: "该模型当前访问量过大，请您稍后再试",
              },
            }),
          },
          { status: 429 }
        )
      )
    )
    const { POST } = await import("@/app/api/ai-proxy/route")
    const response = await POST(
      new Request("http://localhost/api/ai-proxy", {
        method: "POST",
        body: JSON.stringify({
          model: "glm-5.2",
          messages: [],
          apiKey: "do-not-echo",
          baseURL: "https://example.com/v1",
        }),
      })
    )
    const body = await response.json()
    expect(response.status).toBe(429)
    expect(body).toEqual({
      error: "该模型当前访问量过大，请您稍后再试",
      code: "1305",
    })
    expect(JSON.stringify(body)).not.toContain("do-not-echo")
  })
})

describe("AI model discovery proxy", () => {
  it("uses the validated models endpoint and normalizes model IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: [{ id: "vendor/z" }, { id: 12 }, { id: "vendor/a" }],
        })
      )
    )
    const { POST } = await import("@/app/api/ai-models/route")
    const response = await POST(
      new Request("http://localhost/api/ai-models", {
        method: "POST",
        body: JSON.stringify({
          baseURL: "https://example.com/v1",
          apiKey: "secret",
        }),
      })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ models: ["vendor/a", "vendor/z"] })
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "https://example.com/v1/models",
      expect.objectContaining({ cache: "no-store" })
    )
  })
})
