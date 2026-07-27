import { parseDesignMd } from "@/lib/parser/parse-design-md"
import {
  getTokenExportReadiness,
  type TokenExportIssue,
} from "@/lib/validation/export-readiness"

export type DocumentCapabilityLevel = "full" | "partial" | "markdown-only"

export interface MarkdownDocumentCapability {
  level: DocumentCapabilityLevel
  canSaveToLibrary: boolean
  canStructuredEdit: boolean
  canPreview: boolean
  canDerive: boolean
  issues: TokenExportIssue[]
}

/** Only source-only Library entries need a capability label on gallery cards. */
export function getLibraryCardCapabilityBadge(
  level?: DocumentCapabilityLevel
): "markdown-only" | null {
  return level === "markdown-only" ? level : null
}

function hasStructuredDesignContent(
  result: ReturnType<typeof parseDesignMd>
): boolean {
  const { tokens, rawSections, sectionSkeleton } = result
  const hasTokenRows =
    tokens.colors.length > 0 ||
    tokens.gradients.length > 0 ||
    tokens.typography.fontFamilies.length > 0 ||
    tokens.typography.typeScale.length > 0 ||
    tokens.spacing.length > 0 ||
    tokens.radius.length > 0 ||
    tokens.shadows.length > 0
  const hasLayoutTokens = Object.values(tokens.layout).some((value) =>
    value.trim()
  )
  const hasStructuredProse =
    tokens.components.length > 0 ||
    rawSections.components.length > 0 ||
    rawSections.dosDonts.dos.length > 0 ||
    rawSections.dosDonts.donts.length > 0 ||
    Boolean(rawSections.imagery.trim()) ||
    Boolean(rawSections.layout.trim()) ||
    Boolean(rawSections.density?.trim())
  const hasModeledSection = sectionSkeleton.some(
    (section) => section.modeled && section.dataKey !== "tokens.meta"
  )

  return (
    hasTokenRows || hasLayoutTokens || hasStructuredProse || hasModeledSection
  )
}

/**
 * Library acceptance and derived-file readiness are deliberately separate.
 * Any non-empty Markdown can be kept as source; richer capabilities only
 * become available when the parser recognizes design-system structure.
 */
export function getMarkdownDocumentCapability(
  markdown: string
): MarkdownDocumentCapability {
  const canSaveToLibrary = Boolean(markdown.trim())
  if (!canSaveToLibrary) {
    return {
      level: "markdown-only",
      canSaveToLibrary: false,
      canStructuredEdit: false,
      canPreview: false,
      canDerive: false,
      issues: [],
    }
  }

  try {
    const parsed = parseDesignMd(markdown)
    const readiness = getTokenExportReadiness(parsed.tokens)
    const structured = hasStructuredDesignContent(parsed)

    if (!structured) {
      return {
        level: "markdown-only",
        canSaveToLibrary: true,
        canStructuredEdit: false,
        canPreview: false,
        canDerive: false,
        issues: readiness.issues,
      }
    }

    if (readiness.ready) {
      return {
        level: "full",
        canSaveToLibrary: true,
        canStructuredEdit: true,
        canPreview: true,
        canDerive: true,
        issues: [],
      }
    }

    return {
      level: "partial",
      canSaveToLibrary: true,
      canStructuredEdit: true,
      canPreview: true,
      canDerive: false,
      issues: readiness.issues,
    }
  } catch {
    return {
      level: "markdown-only",
      canSaveToLibrary: true,
      canStructuredEdit: false,
      canPreview: false,
      canDerive: false,
      issues: [],
    }
  }
}
