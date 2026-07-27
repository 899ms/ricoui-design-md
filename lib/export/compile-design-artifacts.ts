import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { exportToCss, exportToTailwindTheme } from "@/lib/export/export-css"
import { exportToJson } from "@/lib/export/export-json"
import { exportToZip } from "@/lib/export/export-zip"
import {
  getTokenExportReadiness,
  type TokenExportIssue,
} from "@/lib/validation/export-readiness"
import type { DesignTokens, RawSections } from "@/lib/types/tokens"
import { getDocumentRevision } from "@/lib/document-revision"

export interface CompiledDesignArtifacts {
  revision: string
  markdown: string
  tokens: DesignTokens
  rawSections: RawSections
  tokensJson: string
  variablesCss: string
  themeCss: string
  createZip: () => Blob
}

export type ArtifactCompilationResult =
  | { ok: true; artifacts: CompiledDesignArtifacts }
  | {
      ok: false
      revision: string
      reason: "empty" | "parse-error" | "invalid-tokens"
      issues: TokenExportIssue[]
      error?: string
    }

export function compileDesignArtifacts(
  markdown: string
): ArtifactCompilationResult {
  const normalized = markdown.replace(/\r\n?/g, "\n")
  const revision = getDocumentRevision(normalized)
  if (!normalized.trim()) {
    return { ok: false, revision, reason: "empty", issues: [] }
  }

  try {
    const parsed = parseDesignMd(normalized)
    const readiness = getTokenExportReadiness(parsed.tokens)
    if (!readiness.ready) {
      return {
        ok: false,
        revision,
        reason: "invalid-tokens",
        issues: readiness.issues,
      }
    }

    return {
      ok: true,
      artifacts: {
        revision,
        markdown: normalized,
        tokens: parsed.tokens,
        rawSections: parsed.rawSections,
        tokensJson: exportToJson(parsed.tokens),
        variablesCss: exportToCss(parsed.tokens),
        themeCss: exportToTailwindTheme(parsed.tokens),
        createZip: () =>
          exportToZip(parsed.tokens, parsed.rawSections, normalized),
      },
    }
  } catch (cause) {
    return {
      ok: false,
      revision,
      reason: "parse-error",
      issues: [],
      error:
        cause instanceof Error ? cause.message : "Could not parse DESIGN.md",
    }
  }
}
