export interface AiAnalysisItem {
  title: string
  detail: string
  evidence?: string
}

export interface AiExportMapping {
  format: "tokens.json" | "variables.css" | "theme.css"
  detail: string
}

export interface AiConfirmationDecision {
  id: string
  question: string
  options: string[]
  recommendation?: string
  reason?: string
}

export interface AiDocumentAnalysis {
  summary: string
  observations: AiAnalysisItem[]
  suggestions: AiAnalysisItem[]
  exportMappings: AiExportMapping[]
  confirmations: AiConfirmationDecision[]
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function analysisItems(value: unknown): AiAnalysisItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return []
    const item = entry as Record<string, unknown>
    const title = stringValue(item.title)
    const detail = stringValue(item.detail)
    if (!title || !detail) return []
    const evidence = stringValue(item.evidence)
    return [{ title, detail, ...(evidence ? { evidence } : {}) }]
  })
}

function confirmationDecisions(value: unknown): AiConfirmationDecision[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    if (typeof entry === "string") {
      const question = stringValue(entry)
      return question
        ? [{ id: `decision-${index + 1}`, question, options: [] }]
        : []
    }
    if (!entry || typeof entry !== "object") return []
    const item = entry as Record<string, unknown>
    const question = stringValue(item.question)
    if (!question) return []
    const options = Array.isArray(item.options)
      ? [...new Set(item.options.map(stringValue).filter(Boolean))].slice(0, 4)
      : []
    const recommendation = stringValue(item.recommendation)
    const reason = stringValue(item.reason)
    return [
      {
        id: stringValue(item.id) || `decision-${index + 1}`,
        question,
        options,
        ...(recommendation ? { recommendation } : {}),
        ...(reason ? { reason } : {}),
      },
    ]
  })
}

export function parseAiDocumentAnalysis(output: string): AiDocumentAnalysis {
  const start = output.indexOf("{")
  const end = output.lastIndexOf("}")
  if (start < 0 || end <= start) throw new Error("AI 没有返回可读取的分析结果")
  const value: unknown = JSON.parse(output.slice(start, end + 1))
  if (!value || typeof value !== "object")
    throw new Error("AI 分析结果格式无效")
  const record = value as Record<string, unknown>
  const summary = stringValue(record.summary)
  if (!summary) throw new Error("AI 分析结果缺少摘要")

  const exportMappings = Array.isArray(record.exportMappings)
    ? record.exportMappings.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return []
        const item = entry as Record<string, unknown>
        const format = stringValue(item.format)
        const detail = stringValue(item.detail)
        if (
          !detail ||
          !["tokens.json", "variables.css", "theme.css"].includes(format)
        )
          return []
        return [{ format: format as AiExportMapping["format"], detail }]
      })
    : []

  return {
    summary,
    observations: analysisItems(record.observations),
    suggestions: analysisItems(record.suggestions),
    exportMappings,
    confirmations: confirmationDecisions(record.confirmations),
  }
}
