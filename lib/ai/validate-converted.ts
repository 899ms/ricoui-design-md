import { buildPreviewSemantics } from "@/lib/preview/build-preview-semantics"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import type { ParseResult } from "@/lib/types/tokens"

export interface ConvertedCompletenessReport {
  valid: boolean
  truncated: boolean
  reasons: string[]
  nonEmptyGroups: string[]
  fallbackDiagnostics: number
  result: ParseResult | null
}

function looksTruncated(markdown: string) {
  const trimmed = markdown.trimEnd()
  if (!trimmed) return true
  if (/^```/m.test(trimmed)) return true
  if (/\|[^\n]*\|\s*$/.test(trimmed) && !trimmed.endsWith("|")) return true
  if (
    /\n(?:[-*]|\d+\.)\s+[^\n]*$/.test(trimmed) &&
    !/[.!?。！？`]$/.test(trimmed)
  ) {
    return true
  }
  return false
}

export function validateConvertedMarkdown(
  markdown: string,
  finishReason?: string
): ConvertedCompletenessReport {
  const reasons: string[] = []
  if (!markdown.trim()) reasons.push("模型没有返回内容")
  const truncated =
    finishReason !== undefined && finishReason !== "stop"
      ? true
      : looksTruncated(markdown)
  if (truncated) reasons.push("模型输出可能在表格或区块中途截断")

  try {
    const result = parseDesignMd(markdown)
    const tokens = result.tokens
    const nonEmptyGroups = [
      tokens.colors.length > 0 && "colors",
      tokens.typography.fontFamilies.length > 0 && "fontFamilies",
      tokens.typography.typeScale.length > 0 && "typeScale",
      tokens.spacing.length > 0 && "spacing",
      tokens.radius.length > 0 && "radius",
      tokens.shadows.length > 0 && "shadows",
      tokens.components.length > 0 && "components",
    ].filter((value): value is string => Boolean(value))
    const fallbackDiagnostics = buildPreviewSemantics(tokens).diagnostics.length
    return {
      valid: reasons.length === 0,
      truncated,
      reasons,
      nonEmptyGroups,
      fallbackDiagnostics,
      result,
    }
  } catch {
    return {
      valid: false,
      truncated,
      reasons: [...reasons, "无法按 canonical DESIGN.md 语法解析"],
      nonEmptyGroups: [],
      fallbackDiagnostics: 0,
      result: null,
    }
  }
}
