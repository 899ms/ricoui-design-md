import { describe, expect, it } from "vitest"
import {
  clampAiWorkspaceWidth,
  DEFAULT_AI_WORKSPACE_MODE,
  hasResizeExceededThreshold,
} from "@/components/ai-document-workspace"
import { AI_PROVIDERS, createProviderProfile } from "@/lib/ai/providers"
import { migrateAiSettings } from "@/lib/store/ai-settings-store"

describe("AI provider profiles", () => {
  it("migrates a legacy single-provider setting without losing credentials", () => {
    const migrated = migrateAiSettings({
      providerId: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      model: "vendor/model",
      apiKey: "secret",
      transport: "direct",
      thinkingMode: false,
      aiEnabled: false,
    })
    expect(migrated.version).toBe(2)
    expect(migrated.aiEnabled).toBe(false)
    expect(migrated.profiles).toHaveLength(1)
    expect(migrated.profiles[0]).toMatchObject({
      providerId: "openrouter",
      model: "vendor/model",
      apiKey: "secret",
      transport: "direct",
      thinkingMode: false,
    })
  })

  it("keeps GLM standard API and Coding Plan as separate presets", () => {
    const glm = AI_PROVIDERS.find((provider) => provider.id === "glm")!
    const coding = AI_PROVIDERS.find(
      (provider) => provider.id === "glm-coding"
    )!
    expect(glm.baseURL).toBe("https://open.bigmodel.cn/api/paas/v4")
    expect(coding.baseURL).toBe("https://open.bigmodel.cn/api/coding/paas/v4")
    expect(glm.reasoningContent).toBe(true)
    expect(coding.reasoningContent).toBe(true)
    expect(coding.description).toContain("实验性兼容")
    expect(createProviderProfile("glm").apiKey).toBe("")
    expect(createProviderProfile("glm-coding").apiKey).toBe("")
  })

  it("provides Claude and Volcengine Ark presets with safe defaults", () => {
    const anthropic = AI_PROVIDERS.find(
      (provider) => provider.id === "anthropic"
    )!
    const volcengine = AI_PROVIDERS.find(
      (provider) => provider.id === "volcengine"
    )!

    expect(anthropic.baseURL).toBe("https://api.anthropic.com/v1")
    expect(anthropic.defaultModel).toBe("claude-sonnet-4-6")
    expect(anthropic.recommended).toBe(true)
    expect(volcengine.baseURL).toBe("https://ark.cn-beijing.volces.com/api/v3")
    expect(createProviderProfile("anthropic").thinkingMode).toBe(false)
    expect(createProviderProfile("volcengine").transport).toBe("auto")
  })
})

describe("AI workspace width", () => {
  it("enforces its minimum, percentage maximum and content reserve", () => {
    expect(clampAiWorkspaceWidth(200, 1200)).toBe(420)
    expect(clampAiWorkspaceWidth(900, 1200)).toBe(720)
    expect(clampAiWorkspaceWidth(1200, 1600)).toBe(1040)
    expect(clampAiWorkspaceWidth(540, 1200)).toBe(540)
    expect(clampAiWorkspaceWidth(700, 1200, 1050)).toBe(570)
  })

  it("does not treat a click or minor pointer jitter as a resize", () => {
    expect(hasResizeExceededThreshold(100, 100)).toBe(false)
    expect(hasResizeExceededThreshold(100, 103)).toBe(false)
    expect(hasResizeExceededThreshold(100, 104)).toBe(true)
    expect(hasResizeExceededThreshold(100, 96)).toBe(true)
  })

  it("opens on generation by default", () => {
    expect(DEFAULT_AI_WORKSPACE_MODE).toBe("standardize")
  })
})
