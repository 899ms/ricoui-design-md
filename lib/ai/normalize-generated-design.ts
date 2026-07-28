import { rewriteMarkdownSections } from "@/lib/export/export-md"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import type { DesignTokens, DocumentSectionDataKey } from "@/lib/types/tokens"
import { slugify } from "@/lib/utils"
import { isCanonicalCustomProperty } from "@/lib/validation/token-syntax"

export interface GeneratedTokenNormalization {
  markdown: string
  normalizedCount: number
  normalizedTokenCount: number
  normalizedValueCount: number
}

const CSS_PIXEL_LENGTH_PATTERN = /^\+?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?px$/i

function normalizeRadiusValue(value: string) {
  const unwrapped = value.replace(/^`|`$/g, "").trim()
  if (!CSS_PIXEL_LENGTH_PATTERN.test(unwrapped)) return value
  const pixels = Number(unwrapped.slice(0, -2))
  return pixels > 9999 ? "9999px" : value
}

function nextTokenName(
  prefix: string,
  label: string,
  index: number,
  used: Set<string>
) {
  const labelSlug = slugify(label)
  const slug =
    labelSlug.replace(new RegExp(`^${prefix}-`), "") || `${index + 1}`
  const base = `--${prefix}-${slug}`
  let candidate = base
  let suffix = 2

  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  used.add(candidate.toLowerCase())
  return candidate
}

function allTokenNames(tokens: DesignTokens) {
  return [
    ...tokens.colors.map((item) => item.token),
    ...tokens.gradients.map((item) => item.token),
    ...tokens.typography.fontFamilies.map((item) => item.token),
    ...tokens.typography.typeScale.map((item) => item.token),
    ...tokens.spacing.map((item) => item.token),
    ...tokens.radius.map((item) => item.token),
    ...tokens.shadows.map((item) => item.token),
  ]
}

/**
 * Normalize deterministic defects in a newly generated DESIGN.md. Existing
 * valid custom properties stay byte-for-byte equivalent, malformed or absent
 * identifiers receive a stable name, and oversized radius sentinels collapse
 * to an executable pill value. The section rewriter preserves attribution and
 * unknown Markdown.
 */
export function normalizeGeneratedDesignTokens(
  markdown: string
): GeneratedTokenNormalization {
  let parsed: ReturnType<typeof parseDesignMd>
  try {
    parsed = parseDesignMd(markdown)
  } catch {
    return {
      markdown,
      normalizedCount: 0,
      normalizedTokenCount: 0,
      normalizedValueCount: 0,
    }
  }

  const { tokens, rawSections } = parsed
  const used = new Set(
    allTokenNames(tokens)
      .filter(isCanonicalCustomProperty)
      .map((token) => token.trim().toLowerCase())
  )
  const changedKeys = new Set<DocumentSectionDataKey>()
  let normalizedTokenCount = 0
  let normalizedValueCount = 0

  const normalize = (
    current: string,
    prefix: string,
    label: string,
    index: number,
    dataKey: DocumentSectionDataKey
  ) => {
    if (isCanonicalCustomProperty(current)) return current.trim()
    normalizedTokenCount += 1
    changedKeys.add(dataKey)
    return nextTokenName(prefix, label, index, used)
  }

  tokens.colors.forEach((item, index) => {
    item.token = normalize(
      item.token,
      "color",
      item.name || item.role,
      index,
      "tokens.colors"
    )
  })

  const hasGradientSection = parsed.sectionSkeleton.some(
    (section) => section.dataKey === "tokens.gradients"
  )
  tokens.gradients.forEach((item, index) => {
    item.token = normalize(
      item.token,
      "gradient",
      item.name || item.role,
      index,
      hasGradientSection ? "tokens.gradients" : "tokens.colors"
    )
  })

  tokens.typography.fontFamilies.forEach((item, index) => {
    item.token = normalize(
      item.token,
      "font",
      item.name || item.substitute,
      index,
      `tokens.typography.fontFamilies.${index}`
    )
  })

  tokens.typography.typeScale.forEach((item, index) => {
    item.token = normalize(
      item.token,
      "text",
      item.role,
      index,
      "tokens.typography.typeScale"
    )
  })

  for (const [prefix, items, dataKey] of [
    ["spacing", tokens.spacing, "tokens.spacing"],
    ["radius", tokens.radius, "tokens.radius"],
    ["shadow", tokens.shadows, "tokens.shadows"],
  ] as const) {
    items.forEach((item, index) => {
      item.token = normalize(item.token, prefix, item.name, index, dataKey)
    })
  }

  tokens.radius.forEach((item) => {
    const normalizedValue = normalizeRadiusValue(item.value)
    if (normalizedValue === item.value) return
    item.value = normalizedValue
    normalizedValueCount += 1
    changedKeys.add("tokens.radius")
  })

  if (changedKeys.size === 0) {
    return {
      markdown,
      normalizedCount: 0,
      normalizedTokenCount: 0,
      normalizedValueCount: 0,
    }
  }

  const rewritten = rewriteMarkdownSections(
    markdown,
    parsed,
    [...changedKeys],
    tokens,
    rawSections
  )

  return {
    markdown: rewritten.markdown,
    normalizedCount:
      rewritten.appliedKeys.length > 0
        ? normalizedTokenCount + normalizedValueCount
        : 0,
    normalizedTokenCount:
      rewritten.appliedKeys.length > 0 ? normalizedTokenCount : 0,
    normalizedValueCount:
      rewritten.appliedKeys.length > 0 ? normalizedValueCount : 0,
  }
}
