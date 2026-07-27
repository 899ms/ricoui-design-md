import type { AiRepairMessage } from "@/lib/store/ai-repair-chat-store"
import type { DocumentEvaluation } from "@/lib/document-evaluation"

const REPLY_MARKER = "<<<REPLY>>>"
const DOCUMENT_MARKER = "<<<DESIGN_MD>>>"
const END_MARKER = "<<<END_DESIGN_MD>>>"
const MISSING_ENVELOPE_ERROR =
  "AI repair response is missing the required envelope"

export interface DocumentRepairResponse {
  intent?: AssistantIntent
  scope?: string
  summary: string
  markdown: string
}

export type AssistantIntent = "explain" | "repair" | "normalize" | "transform"
export type AssistantArea =
  | "document"
  | "exports"
  | "colors"
  | "typography"
  | "surfaces"
  | "components"
  | "layout"

export type DocumentDiffLineType = "same" | "add" | "remove"

export interface DocumentDiffLine {
  type: DocumentDiffLineType
  text: string
}

export interface DocumentLineDiff {
  lines: DocumentDiffLine[]
  added: number
  removed: number
}

export type AssistantProposalAction = "apply" | "draft" | "refresh"

export function getAssistantProposalAction(
  _quality: "ready" | "warning" | "blocked",
  stale: boolean
): AssistantProposalAction {
  if (stale) return "refresh"
  return "apply"
}

export function detectAssistantIntent(instruction: string): AssistantIntent {
  const value = instruction.trim().toLowerCase()
  if (
    /(规范化|标准化|整理成|转换成|转成|canonical|standard(?:ize|ise)|normalize|convert)/i.test(
      value
    )
  ) {
    return "normalize"
  }
  if (
    /(风格|主题|换成|改成.*(?:色|风|主题)|重新设计|重构|配色|视觉|style|theme|redesign|restyle|palette)/i.test(
      value
    )
  ) {
    return "transform"
  }
  if (
    /(修复|修正|纠正|补全|完善|检查|审查|token|导出|css|json|fix|repair|correct|audit|complete)/i.test(
      value
    )
  ) {
    return "repair"
  }
  if (
    /(?:为什么|是什么|解释|说明|如何|怎么|why|what|explain|describe|how)/i.test(
      value
    )
  ) {
    return "explain"
  }
  return "repair"
}

/**
 * Resolve broad repair requests against the current deterministic capability.
 * A source-only import must first be normalized before a targeted repair can
 * make structured editing or preview available.
 */
export function resolveAssistantIntent(
  instruction: string,
  evaluation: DocumentEvaluation
): AssistantIntent {
  const detected = detectAssistantIntent(instruction)
  if (
    detected === "repair" &&
    evaluation.structured.status === "unavailable" &&
    /(完善|补全|修复|修正|整理|结构化|预览|complete|repair|fix|structure|preview)/i.test(
      instruction
    ) &&
    !/(错别字|拼写|文案|措辞|说明文字|typo|spelling|copywriting|wording)/i.test(
      instruction
    )
  ) {
    return "normalize"
  }
  return detected
}

export function detectAssistantAreas(
  instruction: string,
  intent = detectAssistantIntent(instruction)
): AssistantArea[] {
  if (intent === "normalize" || intent === "explain") return ["document"]

  const areas: AssistantArea[] = []
  const add = (area: AssistantArea, pattern: RegExp) => {
    if (pattern.test(instruction)) areas.push(area)
  }
  add("exports", /(token|导出|派生|css|json|tailwind|zip)/i)
  add("colors", /(颜色|配色|色彩|主色|color|palette)/i)
  add("typography", /(字体|排版|字号|字阶|font|type|typography)/i)
  add("surfaces", /(圆角|阴影|边框|表面|radius|shadow|border|surface)/i)
  add("components", /(组件|按钮|卡片|表单|component|button|card|form)/i)
  add("layout", /(布局|间距|密度|容器|layout|spacing|density|container)/i)
  return areas.length > 0 ? [...new Set(areas)] : ["document"]
}

export function assistantOutcomeMeetsIntent({
  intent,
  before,
  after,
  hasChanges,
}: {
  intent: AssistantIntent
  before: DocumentEvaluation
  after: DocumentEvaluation
  hasChanges: boolean
}) {
  if (intent === "explain") return !hasChanges
  if (intent === "normalize") return after.structured.status === "ready"
  if (intent === "transform") {
    return hasChanges && after.parse.status === "ready"
  }

  const issueCount = (evaluation: DocumentEvaluation) =>
    (evaluation.parse.status === "unavailable" ? 1 : 0) +
    (evaluation.structured.status === "unavailable" ? 1 : 0) +
    evaluation.derived.issues.length
  const beforeIssues = issueCount(before)
  const afterIssues = issueCount(after)
  return (
    hasChanges &&
    after.parse.status === "ready" &&
    (beforeIssues === 0 || afterIssues < beforeIssues)
  )
}

function unwrapMarkdownFence(value: string) {
  const trimmed = value.trim()
  const match = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i.exec(trimmed)
  return (match?.[1] ?? trimmed).trim()
}

export function parseDocumentRepairResponse(
  output: string
): DocumentRepairResponse {
  const taskStart = output.indexOf("<<<TASK>>>")
  const replyStart = output.indexOf(REPLY_MARKER)
  const documentStart = output.indexOf(DOCUMENT_MARKER)
  const documentEnd = output.lastIndexOf(END_MARKER)

  if (
    replyStart < 0 ||
    documentStart <= replyStart ||
    documentEnd <= documentStart
  ) {
    throw new Error(MISSING_ENVELOPE_ERROR)
  }

  const summary = output
    .slice(replyStart + REPLY_MARKER.length, documentStart)
    .trim()
  const markdown = unwrapMarkdownFence(
    output.slice(documentStart + DOCUMENT_MARKER.length, documentEnd)
  )

  if (!summary || !markdown) {
    throw new Error("AI repair response does not contain a complete document")
  }
  const task =
    taskStart >= 0 && taskStart < replyStart
      ? output.slice(taskStart + "<<<TASK>>>".length, replyStart).trim()
      : ""
  const intentMatch =
    /^intent:\s*(explain|repair|normalize|transform)\s*$/im.exec(task)
  const scopeMatch = /^scope:\s*(.+)$/im.exec(task)

  return {
    ...(intentMatch ? { intent: intentMatch[1] as AssistantIntent } : {}),
    ...(scopeMatch ? { scope: scopeMatch[1].trim() } : {}),
    summary,
    markdown,
  }
}

export function isDocumentRepairEnvelopeError(cause: unknown) {
  return cause instanceof Error && cause.message === MISSING_ENVELOPE_ERROR
}

export function formatRepairConversation(messages: AiRepairMessage[]) {
  return messages
    .slice(-10)
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`
    )
    .join("\n")
}

export function hasDocumentChanges(
  currentMarkdown: string,
  proposedMarkdown: string
) {
  const normalize = (value: string) => value.replace(/\r\n?/g, "\n").trimEnd()
  return normalize(currentMarkdown) !== normalize(proposedMarkdown)
}

function coarseDiff(before: string[], after: string[]): DocumentDiffLine[] {
  let prefix = 0
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  ) {
    prefix += 1
  }

  let suffix = 0
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1
  }

  return [
    ...before.slice(0, prefix).map((text) => ({
      type: "same" as const,
      text,
    })),
    ...before.slice(prefix, before.length - suffix).map((text) => ({
      type: "remove" as const,
      text,
    })),
    ...after.slice(prefix, after.length - suffix).map((text) => ({
      type: "add" as const,
      text,
    })),
    ...before.slice(before.length - suffix).map((text) => ({
      type: "same" as const,
      text,
    })),
  ]
}

function lcsDiff(before: string[], after: string[]): DocumentDiffLine[] {
  const columns = after.length + 1
  const matrix = new Uint32Array((before.length + 1) * columns)

  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      const index = row * columns + column
      matrix[index] =
        before[row] === after[column]
          ? matrix[(row + 1) * columns + column + 1] + 1
          : Math.max(
              matrix[(row + 1) * columns + column],
              matrix[row * columns + column + 1]
            )
    }
  }

  const lines: DocumentDiffLine[] = []
  let row = 0
  let column = 0
  while (row < before.length && column < after.length) {
    if (before[row] === after[column]) {
      lines.push({ type: "same", text: before[row] })
      row += 1
      column += 1
    } else if (
      matrix[(row + 1) * columns + column] >= matrix[row * columns + column + 1]
    ) {
      lines.push({ type: "remove", text: before[row] })
      row += 1
    } else {
      lines.push({ type: "add", text: after[column] })
      column += 1
    }
  }

  while (row < before.length) {
    lines.push({ type: "remove", text: before[row] })
    row += 1
  }
  while (column < after.length) {
    lines.push({ type: "add", text: after[column] })
    column += 1
  }
  return lines
}

export function buildDocumentLineDiff(
  currentMarkdown: string,
  proposedMarkdown: string
): DocumentLineDiff {
  const before = currentMarkdown.replace(/\r\n?/g, "\n").split("\n")
  const after = proposedMarkdown.replace(/\r\n?/g, "\n").split("\n")
  const lines =
    before.length * after.length <= 250_000
      ? lcsDiff(before, after)
      : coarseDiff(before, after)

  return {
    lines,
    added: lines.filter((line) => line.type === "add").length,
    removed: lines.filter((line) => line.type === "remove").length,
  }
}
