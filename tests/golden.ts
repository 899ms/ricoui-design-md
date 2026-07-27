import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { expect } from "vitest"
import { normalizeLineEndings } from "@/lib/utils"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import type { ParseResult } from "@/lib/types/tokens"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export const GOLDEN_BRAND_IDS = [
  "caldera",
  "duolingo",
  "framer",
  "raycast",
] as const

export function loadGoldenBrandMd(brandId: string): string {
  const filePath = path.join(rootDir, "public", "brands", brandId, "DESIGN.md")
  return normalizeLineEndings(readFileSync(filePath, "utf8"))
}

/**
 * The core skeleton invariant: every block's [start, end) range must slice the
 * source markdown back to exactly the block's raw text. Section splicing is
 * built entirely on this.
 */
export function expectSkeletonOffsetsValid(
  markdown: string,
  result: ParseResult
) {
  for (const block of result.sectionSkeleton) {
    expect(markdown.slice(block.start, block.end)).toBe(block.raw)
  }
}

/** Returns the token/rawSections slice that a given dataKey governs. */
export function sliceForDataKey(result: ParseResult, dataKey: string): unknown {
  const { tokens, rawSections } = result
  if (dataKey === "tokens.meta") return tokens.meta
  if (dataKey === "tokens.colors")
    return { colors: tokens.colors, gradients: tokens.gradients }
  if (dataKey === "tokens.gradients") return tokens.gradients
  if (dataKey === "tokens.typography.typeScale")
    return tokens.typography.typeScale
  if (dataKey.startsWith("tokens.typography.fontFamilies."))
    return tokens.typography.fontFamilies[Number(dataKey.split(".").at(-1))]
  if (dataKey === "tokens.spacing") return tokens.spacing
  if (dataKey === "tokens.radius") return tokens.radius
  if (dataKey === "tokens.shadows") return tokens.shadows
  if (dataKey === "tokens.layout") return tokens.layout
  if (dataKey.startsWith("tokens.components."))
    return tokens.components[Number(dataKey.split(".").at(-1))]
  if (
    dataKey === "rawSections.dosDonts" ||
    dataKey === "rawSections.dos" ||
    dataKey === "rawSections.donts"
  )
    return rawSections.dosDonts
  if (dataKey === "rawSections.imagery") return rawSections.imagery
  if (dataKey === "rawSections.layout") return rawSections.layout
  return undefined
}

export function parseGolden(brandId: string) {
  const markdown = loadGoldenBrandMd(brandId)
  return { markdown, result: parseDesignMd(markdown) }
}
