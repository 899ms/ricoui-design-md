import { describe, expect, it } from "vitest"
import {
  DEFAULT_LOCALE,
  detectSupportedBrowserLocale,
  getAppLocale,
  getLocaleFromAcceptLanguage,
  getSuggestedLocale,
} from "@/lib/i18n/config"
import { getMessages, preloadMessages } from "@/lib/i18n/messages"
import { buildAnalyzePrompt, buildRepairPrompt } from "@/lib/ai/prompts"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nested]) => leafKeys(nested, prefix ? `${prefix}.${key}` : key)
  )
}

describe("same-URL application locales", () => {
  it("uses English by default and resolves the browser's primary language", () => {
    expect(DEFAULT_LOCALE).toBe("en")
    expect(getAppLocale("unknown")).toBe("en")
    expect(getAppLocale("en")).toBe("en")
    expect(detectSupportedBrowserLocale(["zh-TW", "en-US"])).toBe("zh-CN")
    expect(detectSupportedBrowserLocale(["ja-JP", "en-US"])).toBe("ja")
    expect(detectSupportedBrowserLocale(["fr-FR", "zh-CN"])).toBe("en")
    expect(detectSupportedBrowserLocale(["ja-JP"])).toBe("ja")
  })

  it("uses the highest-priority request language when no locale is saved", () => {
    expect(getLocaleFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh-CN")
    expect(getLocaleFromAcceptLanguage("ja-JP,ja;q=0.9,en;q=0.8")).toBe("ja")
    expect(getLocaleFromAcceptLanguage("en-US,en;q=0.9,zh;q=0.8")).toBe("en")
    expect(getLocaleFromAcceptLanguage("ja;q=1,zh;q=0.8")).toBe("ja")
    expect(getLocaleFromAcceptLanguage()).toBe("en")
  })

  it("suggests a supported browser language only before an explicit choice", () => {
    expect(
      getSuggestedLocale({
        browserLanguages: ["en-US"],
        currentLocale: "zh-CN",
        hasExplicitLocale: false,
        hasHandledPrompt: false,
      })
    ).toBe("en")
    expect(
      getSuggestedLocale({
        browserLanguages: ["en-US"],
        currentLocale: "zh-CN",
        hasExplicitLocale: true,
        hasHandledPrompt: false,
      })
    ).toBeNull()
    expect(
      getSuggestedLocale({
        browserLanguages: ["zh-CN"],
        currentLocale: "zh-CN",
        hasExplicitLocale: false,
        hasHandledPrompt: false,
      })
    ).toBeNull()
  })

  it("keeps every loaded locale structurally identical", async () => {
    const [zh, en, ja] = await Promise.all([
      getMessages("zh-CN"),
      getMessages("en"),
      getMessages("ja"),
    ])
    expect(leafKeys(en).sort()).toEqual(leafKeys(zh).sort())
    expect(leafKeys(en).sort()).toEqual(leafKeys(ja).sort())
  })

  it("can preload alternate locale dictionaries", async () => {
    await expect(preloadMessages("en")).resolves.toMatchObject({
      Common: expect.any(Object),
    })
    await expect(preloadMessages("ja")).resolves.toMatchObject({
      Common: expect.any(Object),
    })
  })

  it("uses the interface locale for AI analysis and repair guidance", () => {
    const source = "# English source\n\nKeep this text unchanged."
    const analysis = buildAnalyzePrompt(source, "en")
    const repair = buildRepairPrompt(source, [], "en")

    expect(analysis).toContain("Write every human-readable field in English")
    expect(analysis).toContain(source)
    expect(repair).toContain("guidance in English")
    expect(repair).toContain(source)

    expect(buildAnalyzePrompt(source, "ja")).toContain(
      "human-readable field in Japanese"
    )
  })
})
