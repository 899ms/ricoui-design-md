import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AiSettings } from "@/lib/ai/providers"

const mocks = vi.hoisted(() => ({
  createDocument: vi.fn(),
  streamAiConvert: vi.fn(),
  loadUrlSourcePackage: vi.fn(),
  saveUrlSourcePackage: vi.fn(),
}))

vi.mock("@/lib/store/design-store", () => ({
  useDesignStore: {
    getState: () => ({ createDocument: mocks.createDocument }),
  },
}))

vi.mock("@/lib/ai/ai-client", () => ({
  streamAiConvert: mocks.streamAiConvert,
}))

vi.mock("@/lib/storage/workspace-persistence", () => ({
  loadUrlSourcePackage: mocks.loadUrlSourcePackage,
  saveUrlSourcePackage: mocks.saveUrlSourcePackage,
}))

import { useUrlGenerationStore } from "@/lib/store/url-generation-store"

const settings: AiSettings = {
  providerId: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  model: "deepseek-v4-flash",
  apiKey: "test-key",
  transport: "proxy",
  thinkingMode: false,
}

const validGeneratedMarkdown = `# Notion — Style Reference
> Notion website reference.

**Theme:** light

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Blue | #097fe8 | --color-blue | Primary action (observed) |

## Tokens — Typography

### Inter · \`--font-sans\`
- **Substitute:** Arial
- **Weights:** 400, 600
- **Role:** Interface text

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| body | 16px | 1.5 | 0 | --text-body |

## Tokens — Spacing & Shapes

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| 4 | 4px | --spacing-4 |

### Border Radius

| Name | Value | Token |
|---|---|---|
| Small | 4px | --radius-sm |

## Components

### Primary Button
**Role:** Primary action

Uses the observed blue color and a visible focus state.`

const cssEvidence = `--color-blue: #097fe8
font-family: Inter, Arial
font-weight: 400
font-weight: 600
--text-body: 16px
--leading-body: 1.5
--tracking-body: 0
--spacing-4: 4px
--radius-sm: 4px`

describe("background URL generation", () => {
  beforeEach(() => {
    useUrlGenerationStore.setState({ job: null })
    mocks.createDocument.mockReset()
    mocks.streamAiConvert.mockReset()
    mocks.loadUrlSourcePackage.mockReset()
    mocks.loadUrlSourcePackage.mockResolvedValue(null)
    mocks.saveUrlSourcePackage.mockReset()
    mocks.saveUrlSourcePackage.mockResolvedValue(undefined)
    vi.unstubAllGlobals()
  })

  it("publishes progress immediately and saves the attributed result", async () => {
    let resolveFetch!: (response: Response) => void
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(() => pendingFetch)
    )

    async function* textStream() {
      yield validGeneratedMarkdown
    }

    mocks.streamAiConvert.mockResolvedValue({
      textStream: textStream(),
      finishReason: Promise.resolve("stop"),
    })
    mocks.createDocument.mockResolvedValue("draft-notion")

    const generation = useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "zh-CN",
    })

    expect(useUrlGenerationStore.getState().job).toMatchObject({
      hostname: "notion.com",
      status: "running",
      phase: "fetching",
    })

    resolveFetch(
      new Response(
        JSON.stringify({
          content: "Notion homepage",
          cssEvidence,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    )
    await generation

    expect(mocks.streamAiConvert).toHaveBeenCalledWith(
      expect.objectContaining({
        task: "generate",
        url: "https://www.notion.com/",
        locale: "zh-CN",
      })
    )
    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "blank",
        name: "notion.com DESIGN.md",
        content: expect.stringContaining(
          "**Source website:** [https://www.notion.com/](https://www.notion.com/)"
        ),
      })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "done",
      phase: "saving",
      documentId: "draft-notion",
      quality: "review",
    })
  })

  it("reuses a cached source package and preserves published source metadata", async () => {
    mocks.loadUrlSourcePackage.mockResolvedValue({
      url: "https://vercel.com/",
      content: "Vercel homepage",
      cssEvidence: "--geist-foreground: #171717",
      publishedDesignMd: "---\nname: Geist\ncolors:\n  primary: '#171717'\n---",
      source: {
        kind: "published-design-md",
        requestedUrl: "https://vercel.com/",
        pageUrl: "https://vercel.com/",
        sourceUrl: "https://vercel.com/design.md",
        title: "Vercel",
      },
      truncated: false,
    })
    vi.stubGlobal("fetch", vi.fn())

    async function* textStream() {
      yield validGeneratedMarkdown
    }
    mocks.streamAiConvert.mockResolvedValue({
      textStream: textStream(),
      finishReason: Promise.resolve("stop"),
    })
    mocks.createDocument.mockResolvedValue("draft-vercel")

    await useUrlGenerationStore.getState().start({
      url: "https://vercel.com/",
      settings,
      locale: "en",
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(mocks.streamAiConvert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ kind: "published-design-md" }),
        publishedDesignMd: expect.stringContaining("name: Geist"),
      })
    )
    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        generation: expect.objectContaining({
          sourceKind: "published-design-md",
          sourceDocumentUrl: "https://vercel.com/design.md",
          sourceCacheHit: true,
        }),
      })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      sourceCacheHit: true,
      source: { kind: "published-design-md" },
    })
  })

  it("retries once and saves a blocked draft when token errors remain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              content: "Vercel homepage",
              cssEvidence: "--spacing: 0.25rem",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
      )
    )

    async function* invalidTextStream() {
      yield `# Vercel Design System
> Vercel reference.

**Theme:** light

## Tokens — Colors
| Name | Value | Token | Role |
|---|---|---|---|
| Ink | unknown | --color-ink | Text |

## Tokens — Spacing & Shapes
### Spacing
| Name | Value | Token |
|---|---|---|
| Spacing 5 | 1.25rem | --spacing * 5 (assumed) |`
    }

    mocks.streamAiConvert.mockImplementation(async () => ({
      textStream: invalidTextStream(),
      finishReason: Promise.resolve("stop"),
    }))
    mocks.createDocument.mockResolvedValue("review-vercel")

    await useUrlGenerationStore.getState().start({
      url: "https://vercel.com/",
      settings,
      locale: "zh-CN",
    })

    expect(mocks.streamAiConvert).toHaveBeenCalledTimes(2)
    expect(mocks.streamAiConvert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        task: "generate-repair",
        previousOutput: expect.stringContaining("--spacing * 5"),
        diagnostics: expect.arrayContaining(["invalid-token-syntax"]),
      })
    )
    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("--spacing * 5"),
        generation: expect.objectContaining({
          status: "blocked",
          attempts: 2,
        }),
      })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "done",
      phase: "saving",
      quality: "invalid",
      attempts: 2,
      documentId: "review-vercel",
    })
  })

  it("uses the corrected second draft when the retry passes blocking checks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              content: "Notion homepage",
              cssEvidence,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
      )
    )

    async function* firstDraft() {
      yield validGeneratedMarkdown.replace("#097fe8", "unknown")
    }
    async function* correctedDraft() {
      yield validGeneratedMarkdown
    }
    mocks.streamAiConvert
      .mockResolvedValueOnce({
        textStream: firstDraft(),
        finishReason: Promise.resolve("stop"),
      })
      .mockResolvedValueOnce({
        textStream: correctedDraft(),
        finishReason: Promise.resolve("stop"),
      })
    mocks.createDocument.mockResolvedValue("draft-notion-repaired")

    await useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "en",
    })

    expect(mocks.streamAiConvert).toHaveBeenCalledTimes(2)
    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("#097fe8"),
        generation: expect.objectContaining({
          attempts: 2,
          status: "warning",
        }),
      })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "done",
      quality: "review",
      attempts: 2,
      documentId: "draft-notion-repaired",
    })
  })

  it("keeps the first draft when the automatic correction request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              content: "Notion homepage",
              cssEvidence,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
      )
    )

    async function* firstDraft() {
      yield validGeneratedMarkdown.replace("#097fe8", "unknown")
    }
    mocks.streamAiConvert
      .mockResolvedValueOnce({
        textStream: firstDraft(),
        finishReason: Promise.resolve("stop"),
      })
      .mockRejectedValueOnce(new Error("Correction service unavailable"))
    mocks.createDocument.mockResolvedValue("draft-notion-blocked")

    await useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "en",
    })

    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("unknown"),
        generation: expect.objectContaining({
          attempts: 2,
          status: "blocked",
        }),
      })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "done",
      quality: "invalid",
      attempts: 2,
      documentId: "draft-notion-blocked",
    })
  })

  it("repairs blocking syntax once even when no CSS signal exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ content: "Notion homepage" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
      )
    )

    async function* invalidDraft() {
      yield validGeneratedMarkdown.replace("#097fe8", "unknown")
    }
    mocks.streamAiConvert.mockResolvedValue({
      textStream: invalidDraft(),
      finishReason: Promise.resolve("stop"),
    })
    mocks.createDocument.mockResolvedValue("draft-no-evidence")

    await useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "en",
    })

    expect(mocks.streamAiConvert).toHaveBeenCalledTimes(2)
    expect(mocks.streamAiConvert).toHaveBeenLastCalledWith(
      expect.objectContaining({ task: "generate-repair" })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "done",
      quality: "invalid",
      attempts: 2,
    })
  })

  it("aborts the active fetch and creates no draft when explicitly cancelled", async () => {
    let requestSignal: AbortSignal | undefined
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined
        return new Promise<Response>((_resolve, reject) => {
          requestSignal?.addEventListener("abort", () => {
            reject(requestSignal?.reason)
          })
        })
      })
    )

    const generation = useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "en",
    })

    await vi.waitFor(() => expect(requestSignal).toBeDefined())
    expect(requestSignal?.aborted).toBe(false)
    useUrlGenerationStore.getState().cancel()
    await generation

    expect(requestSignal?.aborted).toBe(true)
    expect(mocks.createDocument).not.toHaveBeenCalled()
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "cancelled",
      phase: "fetching",
    })
  })

  it("keeps a background job running until cancel is explicitly requested", async () => {
    let requestSignal: AbortSignal | undefined
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined
        return new Promise<Response>((_resolve, reject) => {
          requestSignal?.addEventListener("abort", () => {
            reject(requestSignal?.reason)
          })
        })
      })
    )

    const generation = useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "en",
    })

    await vi.waitFor(() => expect(requestSignal).toBeDefined())
    expect(useUrlGenerationStore.getState().job?.status).toBe("running")
    expect(requestSignal?.aborted).toBe(false)

    useUrlGenerationStore.getState().cancel()
    await generation
  })

  it("saves an invalid result only after the user explicitly chooses to", async () => {
    useUrlGenerationStore.setState({
      job: {
        id: "invalid-vercel",
        url: "https://vercel.com/",
        hostname: "vercel.com",
        status: "invalid",
        phase: "validating",
        attempts: 1,
        startedAt: Date.now(),
        completedAt: Date.now(),
        generatedCharacters: 100,
        pendingMarkdown: "# Vercel Design System",
        quality: "invalid",
        issues: ["invalid-token-syntax"],
      },
    })
    mocks.createDocument.mockResolvedValue("review-vercel")

    await useUrlGenerationStore.getState().saveInvalidDraft()

    expect(mocks.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "vercel.com DESIGN.md",
        content: "# Vercel Design System",
      })
    )
    expect(useUrlGenerationStore.getState().job).toMatchObject({
      status: "done",
      quality: "invalid",
      documentId: "review-vercel",
    })
  })

  it("does not allow a second website to replace a running job", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined))
    )

    void useUrlGenerationStore.getState().start({
      url: "https://www.notion.com/",
      settings,
      locale: "en",
    })
    void useUrlGenerationStore.getState().start({
      url: "https://www.apple.com/",
      settings,
      locale: "en",
    })

    expect(useUrlGenerationStore.getState().job?.url).toBe(
      "https://www.notion.com/"
    )
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("persists a collapsed completed result without affecting a running job", () => {
    useUrlGenerationStore.setState({
      job: {
        id: "completed-notion",
        url: "https://www.notion.com/",
        hostname: "notion.com",
        status: "done",
        phase: "saving",
        attempts: 1,
        startedAt: Date.now(),
        completedAt: Date.now(),
        generatedCharacters: 100,
        quality: "review",
        issues: ["missing-layout"],
      },
    })

    useUrlGenerationStore.getState().collapse()
    expect(useUrlGenerationStore.getState().job?.presentation).toBe("collapsed")

    useUrlGenerationStore.getState().expand()
    expect(useUrlGenerationStore.getState().job?.presentation).toBe("expanded")

    useUrlGenerationStore.setState({
      job: {
        ...useUrlGenerationStore.getState().job!,
        status: "running",
      },
    })
    useUrlGenerationStore.getState().collapse()
    expect(useUrlGenerationStore.getState().job?.presentation).toBe("expanded")
  })
})
