import { getMarkdownDocumentCapability } from "@/lib/document-capability"
import { getDocumentRevision } from "@/lib/document-revision"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"

export type DocumentEvaluationStatus = "ready" | "unavailable"

export interface DocumentEvaluation {
  revision: string
  parse: {
    status: DocumentEvaluationStatus
    message?: string
  }
  structured: {
    status: DocumentEvaluationStatus
  }
  derived: {
    status: DocumentEvaluationStatus
    issues: Array<{
      code: string
      path: string
      value: string
    }>
    message?: string
  }
}

/**
 * One shared capability snapshot for the assistant, editor status, and tests.
 * It deliberately reports independent stages instead of collapsing every
 * limitation into a single valid/invalid label.
 */
export function evaluateDesignDocument(markdown: string): DocumentEvaluation {
  const normalized = markdown.replace(/\r\n?/g, "\n")
  const revision = getDocumentRevision(normalized)
  const capability = getMarkdownDocumentCapability(markdown)
  const compilation = compileDesignArtifacts(markdown)
  const parseReady =
    Boolean(normalized.trim()) &&
    (compilation.ok || compilation.reason !== "parse-error")
  const compilationError =
    !compilation.ok && "error" in compilation ? compilation.error : undefined

  return {
    revision,
    parse: {
      status: parseReady ? "ready" : "unavailable",
      ...(!parseReady && compilationError ? { message: compilationError } : {}),
    },
    structured: {
      status: capability.canStructuredEdit ? "ready" : "unavailable",
    },
    derived: compilation.ok
      ? { status: "ready", issues: [] }
      : {
          status: "unavailable",
          issues: compilation.issues,
          ...(compilation.error
            ? { message: compilation.error }
            : compilation.reason === "empty"
              ? { message: "empty" }
              : {}),
        },
  }
}

export function formatDocumentEvaluationDiagnostics(
  evaluation: DocumentEvaluation
) {
  const diagnostics: string[] = []
  if (evaluation.parse.status === "unavailable") {
    diagnostics.push(`parse-error: ${evaluation.parse.message ?? "unknown"}`)
  }
  if (evaluation.structured.status === "unavailable") {
    diagnostics.push("structured-content-unavailable")
  }
  for (const issue of evaluation.derived.issues) {
    diagnostics.push(
      `${issue.code}: ${issue.path}${issue.value ? ` (${issue.value})` : ""}`
    )
  }
  return diagnostics
}
