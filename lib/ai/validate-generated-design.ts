import { parseDesignMd } from "@/lib/parser/parse-design-md"
import {
  containsIncompleteValue,
  containsPlaceholderValue,
  hasInvalidTokenValue,
  isCanonicalCustomProperty,
  isCompleteGradientValue,
  stripProvenance,
} from "@/lib/validation/token-syntax"
import { getTokenExportReadiness } from "@/lib/validation/export-readiness"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"

export type GeneratedDesignIssue =
  | "truncated-output"
  | "missing-h1"
  | "noncanonical-title"
  | "missing-description"
  | "missing-theme"
  | "missing-source"
  | "missing-colors"
  | "missing-fonts"
  | "missing-type-scale"
  | "missing-spacing"
  | "missing-radius"
  | "missing-components"
  | "missing-guidelines"
  | "missing-imagery"
  | "missing-layout"
  | "noncanonical-headings"
  | "invalid-font-blocks"
  | "invalid-components"
  | "invalid-token-syntax"
  | "invalid-css-values"
  | "placeholder-values"
  | "unverified-values"
  | "unresolved-references"
  | "unsupported-assumptions"
  | "parse-error"

export type GeneratedDesignQuality = "ready" | "review" | "invalid"

export interface GeneratedDesignValidation {
  quality: GeneratedDesignQuality
  issues: GeneratedDesignIssue[]
  advisoryIssues: GeneratedDesignIssue[]
  blockingIssues: GeneratedDesignIssue[]
  derived: {
    ready: boolean
    issueCount: number
  }
  requiresRepair: boolean
}

export interface GeneratedDesignValidationOptions {
  finishReason?: string
  cssEvidence?: string
}

interface EvidenceCandidate {
  token?: string
  value: string
}

const UNSUPPORTED_PROVENANCE_PATTERN =
  /\((?:assumed|known|inferred|estimated)\)|\b(?:calculated|derived)\s+from\b/i
const THEME_DECLARATION_PATTERN =
  /^\*\*Theme:\*\*[ \t]*(?:light|dark)(?:[ \t]+[^\r\n]+)?[ \t]*$/im

const INFORMATIONAL_ISSUES = new Set<GeneratedDesignIssue>([
  "unverified-values",
])

function normalizeCssValue(value: string) {
  return stripProvenance(value)
    .replace(/;$/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,:()])\s*/g, "$1")
    .toLowerCase()
}

function extractEvidenceDeclarations(cssEvidence: string) {
  const declarations = new Map<string, string>()
  const values = new Set<string>()

  for (const rawLine of cssEvidence.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/;$/, "")
    const match =
      /^(--[a-z_][a-z0-9_-]*|[a-z_-][a-z0-9_-]*|meta theme-color)\s*:\s*(.+)$/i.exec(
        line
      )
    if (!match) continue
    const value = normalizeCssValue(match[2])
    if (!value) continue
    values.add(value)
    if (isCanonicalCustomProperty(match[1])) {
      declarations.set(match[1].toLowerCase(), value)
    }
  }

  return {
    declarations,
    values,
    searchableText: cssEvidence.replace(/\s+/g, " ").toLowerCase(),
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function evidenceContainsTerm(term: string, searchableText: string) {
  const normalized = stripProvenance(term)
    .replace(/["']/g, "")
    .trim()
    .toLowerCase()
  if (!normalized) return false
  return new RegExp(
    `(?:^|[^a-z0-9_-])${escapeRegExp(normalized)}(?:$|[^a-z0-9_-])`,
    "i"
  ).test(searchableText.replace(/["']/g, ""))
}

function isSupportedByEvidence(
  candidate: EvidenceCandidate,
  evidence: ReturnType<typeof extractEvidenceDeclarations>
) {
  const value = normalizeCssValue(candidate.value)
  if (!value || hasInvalidTokenValue(candidate.value)) return false

  const token = stripProvenance(candidate.token ?? "").toLowerCase()
  if (isCanonicalCustomProperty(token)) {
    const declaredValue = evidence.declarations.get(token)
    if (declaredValue !== undefined) return declaredValue === value
  }

  return evidence.values.has(value)
}

function getLayoutValues(markdown: string) {
  const keys = [
    "Section gap",
    "Card padding",
    "Element gap",
    "Max content width",
  ]
  return keys.flatMap((key) => {
    const match = new RegExp(
      `^\\s*[-*]\\s+\\*\\*${key}:\\*\\*\\s*(.+)$`,
      "im"
    ).exec(markdown)
    return match?.[1] ? [match[1].trim()] : []
  })
}

export function ensureSourceWebsite(markdown: string, url: string) {
  const sourceLine = `**Source website:** [${url}](${url})`
  const disclaimer =
    "Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative."
  const brandName = (() => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./i, "")
      const label = hostname.split(".")[0].replace(/[-_]+/g, " ").trim()
      return label.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    } catch {
      return "Website"
    }
  })()
  const normalizedTitle = markdown.replace(
    /^#\s+(?:Brand|Website|Untitled)\s+[—–-]\s+Style Reference\s*$/im,
    `# ${brandName} — Style Reference`
  )
  const sourcePattern = /^\*\*Source website:\*\*.*$/im
  const sourceMatch = sourcePattern.exec(normalizedTitle)
  let attributed: string
  if (sourceMatch && sourceMatch.index !== undefined) {
    const sourceEnd = sourceMatch.index + sourceMatch[0].length
    attributed = `${normalizedTitle.slice(0, sourceMatch.index)}${sourceLine}${normalizedTitle.slice(sourceEnd)}`
  } else {
    const sourceNote = `${sourceLine}\n\n${disclaimer}`
    const themeMatch = THEME_DECLARATION_PATTERN.exec(normalizedTitle)
    if (!themeMatch || themeMatch.index === undefined) {
      attributed = `${normalizedTitle.trim()}\n\n${sourceNote}`
    } else {
      const insertAt = themeMatch.index + themeMatch[0].length
      attributed = `${normalizedTitle.slice(0, insertAt)}\n\n${sourceNote}${normalizedTitle.slice(insertAt)}`
    }
  }

  const lines = attributed.split(/\r?\n/)
  const sourceIndex = lines.findIndex((line) =>
    /^\*\*Source website:\*\*/i.test(line.trim())
  )
  if (sourceIndex === -1) return attributed.trim()

  const authorityPattern =
    /^(?:(?:Use|Check|Compare)\b.*\b(?:live|official|source)\b.*\bauthoritative\b|The\b.*\b(?:live|source|website)\b.*\bauthoritative\b)/i
  let cursor = sourceIndex + 1
  while (cursor < lines.length && !lines[cursor].trim()) cursor += 1
  while (cursor < lines.length && authorityPattern.test(lines[cursor].trim())) {
    cursor += 1
    while (cursor < lines.length && !lines[cursor].trim()) cursor += 1
  }
  lines.splice(sourceIndex + 1, cursor - sourceIndex - 1, "", disclaimer, "")
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function validateGeneratedDesign(
  markdown: string,
  options: GeneratedDesignValidationOptions = {}
): GeneratedDesignValidation {
  const issues = new Set<GeneratedDesignIssue>()
  const trimmed = markdown.trim()

  if (options.finishReason && options.finishReason !== "stop")
    issues.add("truncated-output")
  const h1Match = /^#\s+(.+)$/m.exec(trimmed)
  if (!h1Match) {
    issues.add("missing-h1")
  } else if (!/\s—\sStyle Reference\s*$/i.test(h1Match[1])) {
    issues.add("noncanonical-title")
  }
  if (!/^>\s+\S+/m.test(trimmed)) issues.add("missing-description")
  if (!THEME_DECLARATION_PATTERN.test(trimmed)) issues.add("missing-theme")
  if (!/^\*\*Source website:\*\*/im.test(trimmed)) issues.add("missing-source")

  if (
    /^###\s+Spacing\s*$/im.test(trimmed) ||
    (/^###\s+Spacing Scale\s*$/im.test(trimmed) === false &&
      /^##\s+Tokens\s+[–—-]\s+Spacing/i.test(trimmed))
  ) {
    issues.add("noncanonical-headings")
  }

  if (containsPlaceholderValue(trimmed)) issues.add("placeholder-values")
  if (UNSUPPORTED_PROVENANCE_PATTERN.test(trimmed))
    issues.add("unsupported-assumptions")
  if (/^###\s+[^\n]*font[^\n]*\n(?:\s*\n)*\|/im.test(trimmed)) {
    issues.add("invalid-font-blocks")
  }

  try {
    const { tokens } = parseDesignMd(trimmed)
    if (tokens.colors.length === 0) issues.add("missing-colors")
    if (tokens.typography.fontFamilies.length === 0) issues.add("missing-fonts")
    if (tokens.typography.typeScale.length === 0)
      issues.add("missing-type-scale")
    if (tokens.spacing.length === 0) issues.add("missing-spacing")
    if (tokens.radius.length === 0) issues.add("missing-radius")
    if (tokens.components.length === 0) issues.add("missing-components")

    const tokenFields = [
      ...tokens.colors.map((token) => token.token),
      ...tokens.gradients.map((token) => token.token),
      ...tokens.typography.fontFamilies.map((font) => font.token),
      ...tokens.typography.typeScale.map((token) => token.token),
      ...tokens.spacing.map((token) => token.token),
      ...tokens.radius.map((token) => token.token),
      ...tokens.shadows.map((token) => token.token),
    ]
    if (tokenFields.some((token) => !isCanonicalCustomProperty(token))) {
      issues.add("invalid-token-syntax")
    }

    if (
      tokens.typography.fontFamilies.some(
        (font) =>
          !font.name.trim() ||
          !isCanonicalCustomProperty(font.token) ||
          !font.substitute.trim() ||
          font.weights.length === 0 ||
          !font.role.trim()
      )
    ) {
      issues.add("invalid-font-blocks")
    }

    if (
      tokens.components.some(
        (component) => !component.role.trim() || !component.description.trim()
      )
    ) {
      issues.add("invalid-components")
    }

    const valueFields = [
      ...tokens.colors.map((token) => token.value),
      ...tokens.gradients.map((token) => token.value),
      ...tokens.typography.typeScale.flatMap((token) => [
        token.size,
        token.lineHeight,
        token.letterSpacing,
      ]),
      ...tokens.spacing.map((token) => token.value),
      ...tokens.radius.map((token) => token.value),
      ...tokens.shadows.map((token) => token.value),
      ...getLayoutValues(trimmed),
    ].filter(Boolean)

    if (valueFields.some(hasInvalidTokenValue)) issues.add("invalid-css-values")

    if (
      getTokenExportReadiness(tokens).issues.some(
        (issue) => issue.code === "unresolved-reference"
      )
    ) {
      issues.add("unresolved-references")
    }

    if (
      tokens.gradients.some(
        (gradient) => !isCompleteGradientValue(gradient.value)
      )
    ) {
      issues.add("invalid-css-values")
    }

    if (options.cssEvidence?.trim()) {
      const evidence = extractEvidenceDeclarations(options.cssEvidence)
      const evidenceCandidates: EvidenceCandidate[] = [
        ...tokens.colors,
        ...tokens.gradients,
        ...tokens.typography.typeScale.map((token) => ({
          token: token.token,
          value: token.size,
        })),
        ...tokens.typography.typeScale.flatMap((token) => [
          { value: token.lineHeight },
          ...(token.letterSpacing ? [{ value: token.letterSpacing }] : []),
        ]),
        ...tokens.spacing,
        ...tokens.radius,
        ...tokens.shadows,
        ...getLayoutValues(trimmed).map((value) => ({ value })),
      ]
      if (
        evidenceCandidates.some(
          (candidate) => !isSupportedByEvidence(candidate, evidence)
        )
      ) {
        issues.add("unverified-values")
      }

      if (
        tokens.typography.fontFamilies.some(
          (font) =>
            !evidenceContainsTerm(font.name, evidence.searchableText) ||
            font.weights.some(
              (weight) =>
                !evidence.values.has(normalizeCssValue(String(weight)))
            )
        )
      ) {
        issues.add("unverified-values")
      }
    }
  } catch {
    issues.add("parse-error")
    issues.add("missing-colors")
    issues.add("missing-fonts")
    issues.add("missing-type-scale")
  }

  if (!/^##\s+Do['’]s and Don['’]ts\s*$/im.test(trimmed))
    issues.add("missing-guidelines")
  if (!/^##\s+Imagery\s*$/im.test(trimmed)) issues.add("missing-imagery")
  if (!/^##\s+Layout\s*$/im.test(trimmed)) issues.add("missing-layout")
  if (containsIncompleteValue(trimmed)) issues.add("unsupported-assumptions")

  const compilation = compileDesignArtifacts(trimmed)
  if (!compilation.ok && compilation.reason === "parse-error") {
    issues.add("parse-error")
  }

  const issueList = Array.from(issues)
  const derivedReady = compilation.ok
  const requiresRepair = issues.has("truncated-output") || !derivedReady
  const blockingIssues: GeneratedDesignIssue[] = requiresRepair
    ? issueList.filter(
        (issue) =>
          issue === "truncated-output" ||
          issue === "parse-error" ||
          issue === "invalid-token-syntax" ||
          issue === "invalid-css-values" ||
          issue === "placeholder-values" ||
          issue === "unresolved-references"
      )
    : []
  const advisoryIssues = issueList.filter(
    (issue) =>
      !blockingIssues.includes(issue) && !INFORMATIONAL_ISSUES.has(issue)
  )

  return {
    quality: requiresRepair
      ? "invalid"
      : advisoryIssues.length > 0
        ? "review"
        : "ready",
    issues: issueList,
    advisoryIssues,
    blockingIssues,
    derived: {
      ready: derivedReady,
      issueCount: compilation.ok ? 0 : Math.max(compilation.issues.length, 1),
    },
    requiresRepair,
  }
}

/**
 * Give the correction model both the stable issue codes and the exact parsed
 * fields that prevent derived exports. The codes keep prompts/test fixtures
 * stable; paths and values tell the model what it must actually rewrite.
 */
export function getGeneratedDesignRepairDiagnostics(
  markdown: string,
  validation: GeneratedDesignValidation
) {
  const diagnostics: string[] = [...validation.blockingIssues]

  try {
    const { tokens } = parseDesignMd(markdown)
    for (const issue of getTokenExportReadiness(tokens).issues) {
      const value = issue.value.replace(/\s+/g, " ").trim().slice(0, 180)
      diagnostics.push(
        `${issue.code} at ${issue.path}${value ? `: ${JSON.stringify(value)}` : ""}`
      )
    }
  } catch {
    // Structural diagnostics already describe documents that cannot be parsed.
  }

  return [...new Set(diagnostics)]
}
