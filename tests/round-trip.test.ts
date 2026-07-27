import { describe, expect, it } from "vitest"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { rewriteMarkdownSections } from "@/lib/export/export-md"
import type { DocumentSectionDataKey } from "@/lib/types/tokens"
import {
  GOLDEN_BRAND_IDS,
  expectSkeletonOffsetsValid,
  parseGolden,
  sliceForDataKey,
} from "./golden"

describe.each(GOLDEN_BRAND_IDS)("golden round-trip: %s", (brandId) => {
  const { markdown, result } = parseGolden(brandId)

  it("skeleton offsets slice back to each block's raw text", () => {
    expectSkeletonOffsetsValid(markdown, result)
  })

  const modeledKeys = [
    ...new Set(
      result.sectionSkeleton
        .filter((block) => block.modeled && block.dataKey)
        .map((block) => block.dataKey as DocumentSectionDataKey)
    ),
  ]

  it.each(modeledKeys)("no-op rewrite of %s is lossless", (dataKey) => {
    const rewrite = rewriteMarkdownSections(
      markdown,
      result,
      [dataKey],
      result.tokens,
      result.rawSections
    )

    expect(rewrite.appliedKeys).toContain(dataKey)

    const blocks = result.sectionSkeleton.filter(
      (block) => block.dataKey === dataKey
    )
    if (blocks.length === 1) {
      // Everything outside the rewritten block must be byte-identical.
      const [block] = blocks
      expect(rewrite.markdown.startsWith(markdown.slice(0, block.start))).toBe(
        true
      )
      expect(rewrite.markdown.endsWith(markdown.slice(block.end))).toBe(true)
    }

    // Re-parsing the rewritten document must yield the same values for the
    // slice this dataKey governs (no silent data loss).
    const reparsed = parseDesignMd(rewrite.markdown)
    expect(sliceForDataKey(reparsed, dataKey)).toEqual(
      sliceForDataKey(result, dataKey)
    )
  })

  it("no-op rewrite of every modeled key at once keeps all governed values", () => {
    const rewrite = rewriteMarkdownSections(
      markdown,
      result,
      modeledKeys,
      result.tokens,
      result.rawSections
    )
    const reparsed = parseDesignMd(rewrite.markdown)
    for (const dataKey of modeledKeys) {
      expect(sliceForDataKey(reparsed, dataKey)).toEqual(
        sliceForDataKey(result, dataKey)
      )
    }
    // And a second pass over the rewritten doc must be byte-stable.
    const secondPass = rewriteMarkdownSections(
      rewrite.markdown,
      reparsed,
      modeledKeys,
      reparsed.tokens,
      reparsed.rawSections
    )
    expect(secondPass.markdown).toBe(rewrite.markdown)
  })
})
