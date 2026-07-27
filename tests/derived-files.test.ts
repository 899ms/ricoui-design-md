import { describe, expect, it } from "vitest"
import { isGenerationRevisionBlocked } from "@/lib/validation/derived-files"
import type { UrlGenerationMetadata } from "@/lib/types/tokens"

const blockedGeneration: UrlGenerationMetadata = {
  sourceUrl: "https://example.com/",
  status: "blocked",
  attempts: 2,
  issues: ["invalid-css-values"],
  validatedRevision: "blocked-revision",
  generatedAt: 1,
}

describe("derived file generation state", () => {
  it("keeps the original blocked revision from producing derived files", () => {
    expect(
      isGenerationRevisionBlocked(blockedGeneration, "blocked-revision")
    ).toBe(true)
  })

  it("allows a repaired revision to rely on current export validation", () => {
    expect(
      isGenerationRevisionBlocked(blockedGeneration, "repaired-revision")
    ).toBe(false)
  })

  it("does not block ready generated documents", () => {
    expect(
      isGenerationRevisionBlocked(
        { ...blockedGeneration, status: "ready" },
        "blocked-revision"
      )
    ).toBe(false)
  })
})
