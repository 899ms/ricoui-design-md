import { CANONICAL_DESIGN_MD_SPEC } from "@/lib/ai/canonical-spec"
import { GET_DESIGN_MD_RUNTIME_SPEC } from "@/lib/ai/get-design-md-spec"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import type { UrlSourceMetadata } from "@/lib/types/url-generation"

const DUOLINGO_FEW_SHOT = `Example shape:
## Tokens – Colors
| Name | Value | Token | Role |
|------|-------|-------|------|
| Green | \`#58CC02\` | \`--color-green\` | primary action, success |

### Primary Action Button
**Role:** Filled button — main CTA
Use the brand green for the main action and preserve any source-specific details.`

function capUtf8Text(value: string, maxBytes: number) {
  const encoder = new TextEncoder()
  if (encoder.encode(value).byteLength <= maxBytes) return value
  let low = 0
  let high = value.length
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (encoder.encode(value.slice(0, middle)).byteLength <= maxBytes) {
      low = middle
    } else {
      high = middle - 1
    }
  }
  return value.slice(0, low)
}

export function buildConvertPrompt(rawMarkdown: string) {
  return `Convert the foreign-format DESIGN.md below into the canonical grammar.

Rules:
1. Preserve every meaningful token, reference, value, name, role, and prose detail. Do not invent values when the source provides one.
2. Map YAML frontmatter maps and prose into canonical tables and sections. Put component prose in Components and guidance in Do's and Don'ts.
3. Preserve the source theme exactly as **Theme:** light or **Theme:** dark.
4. Preserve wide-gamut and reference strings verbatim, including oklch(), color(display-p3 ...), and {colors.x} values.
5. If a source group has no canonical equivalent, preserve it in the closest canonical prose section rather than dropping it.
6. Write canonical headings and supporting prose in English. Preserve proper names, token names, exact values, and quoted source content.
7. Return only the converted Markdown document.

${CANONICAL_DESIGN_MD_SPEC}

${GET_DESIGN_MD_RUNTIME_SPEC}

${DUOLINGO_FEW_SHOT}

SOURCE DOCUMENT:
---
${rawMarkdown}
---`
}

export function buildAnalyzePrompt(
  rawMarkdown: string,
  locale: Locale = DEFAULT_LOCALE
) {
  const languageRule =
    locale === "ja"
      ? "Write every human-readable field in Japanese, including the summary, titles, details, evidence, export details, questions, options, recommendations, and reasons. Keep source token names, CSS properties, filenames, code, exact values, and quoted evidence unchanged. Do not translate or rewrite the source document itself."
      : locale === "en"
        ? "Write every human-readable field in English, including the summary, titles, details, evidence, export details, questions, options, recommendations, and reasons. Keep source token names, CSS properties, filenames, code, exact values, and quoted evidence unchanged. Do not translate or rewrite the source document itself."
        : "Write every human-readable field in Simplified Chinese, including the summary, titles, details, evidence, export details, questions, options, recommendations, and reasons. Keep source token names, CSS properties, filenames, code, exact values, and quoted evidence unchanged. Do not answer in English just because the source document is English."
  return `Review the DESIGN.md below as a concrete, actionable audit for its author. Compare it against the canonical structure below and surface specific gaps, non-standard choices, and concrete fixes — do not just paraphrase what is there.

Return valid JSON only with this exact shape:
{
  "summary": "1-2 sentences: what the document is and its overall health (does it follow the canonical structure, and what is the single biggest issue).",
  "observations": [
    { "title": "a specific finding", "detail": "what is present or missing and why it matters", "evidence": "quote or point to the relevant section/line of the source" }
  ],
  "suggestions": [
    { "title": "a concrete change", "detail": "exactly what to add, rename, or restructure, and how", "evidence": "why this follows from the source / canonical rule" }
  ],
  "exportMappings": [
    { "format": "tokens.json|variables.css|theme.css", "detail": "how current content maps to this format, and what is missing for a clean export" }
  ],
  "confirmations": [
    {
      "id": "stable-kebab-case-id",
      "question": "a specific ambiguity the author should decide",
      "options": ["a concrete choice", "another mutually exclusive choice"],
      "recommendation": "one option copied exactly from options",
      "reason": "why this option is recommended"
    }
  ]
}

Rules:
- ${languageRule}
- Be specific and evidence-based. Point to real sections, tables, or values in the source. Never give generic advice.
- Keep the response concise: 3-6 observations, 3-5 suggestions, exactly one mapping for each requested export format, and at most 3 confirmations. Keep each detail to 1-2 sentences.
- observations: cover both well-formed parts AND notable gaps or non-canonical choices (e.g. Colors table missing the Role column, no Spacing scale, radius values in px not extracted to tokens, theme not declared as **Theme:** light/dark).
- suggestions: rank by impact. Each must be a concrete, doable change (what to add/rename/restructure), not a vague goal.
- exportMappings: include exactly tokens.json, variables.css, and theme.css; state what would be lost or missing on export.
- confirmations: include only decisions that genuinely require the author. Give each decision 2-3 short, mutually exclusive options and one recommended option copied exactly from options. Return an empty array when no author decision is needed.
- Output ONLY the JSON object — no prose before/after, no markdown fences.

Canonical checklist for this audit:
- H1 name, blockquote description, and **Theme:** light or dark.
- Colors table: Name, Value, Token, Role.
- Typography: font blocks plus Role, Size, Line Height, Letter Spacing, Token.
- Spacing, Border Radius, and Shadows: Name, Value, Token.
- Optional Components, Do's and Don'ts, Imagery, and Layout sections when supported by source evidence.
- Preserve exact source values; never invent a missing token. Treat placeholders such as -, – and — as absent.

SOURCE DOCUMENT:
---
${rawMarkdown}
---`
}

export function buildRepairPrompt(
  markdown: string,
  diagnostics: string[],
  locale: Locale = DEFAULT_LOCALE
) {
  const responseLanguage =
    locale === "ja"
      ? "Write title, description, rationale, and preview guidance in Japanese."
      : locale === "en"
        ? "Write title, description, rationale, and preview guidance in English."
        : "使用简体中文撰写 title、description、rationale 与 preview 建议。"
  return `Inspect this canonical DESIGN.md and return a JSON object with a single "suggestions" array. Each item must be an ImportSuggestion with id, category, title, description, rationale, confidence, preview, and action. The action must be one of set-color-role, set-font-role, set-component-role, set-meta-description, set-meta-theme, or none. Do not rewrite the document. Return valid JSON only.

${responseLanguage}

Diagnostics:
${diagnostics.join("\n") || "No diagnostics were provided; identify high-confidence missing information."}

DESIGN.md:
${markdown}`
}

export function buildGenerateFromUrlPrompt(
  htmlOrText: string,
  url: string,
  cssEvidence = "",
  source?: UrlSourceMetadata,
  publishedDesignMd = ""
) {
  const compactPublishedDesignMd = capUtf8Text(publishedDesignMd, 90_000)
  const compactCssEvidence = capUtf8Text(
    cssEvidence,
    compactPublishedDesignMd ? 40_000 : 70_000
  )
  const compactPageContent = capUtf8Text(
    htmlOrText,
    compactPublishedDesignMd ? 25_000 : 110_000
  )
  const cssSignalBlock = compactCssEvidence
    ? `CAPTURED CSS SIGNAL (prioritized from the site's stylesheets):
---
${compactCssEvidence}
---

`
    : ""
  const metadataBlock = source
    ? `SOURCE METADATA:
${JSON.stringify(
  {
    kind: source.kind,
    requestedUrl: source.requestedUrl,
    pageUrl: source.pageUrl,
    sourceDocumentUrl: source.kind === "website" ? undefined : source.sourceUrl,
    title: source.title,
    description: source.description,
    language: source.language,
    themeColor: source.themeColor,
    visualUrl: source.visualUrl,
  },
  null,
  2
)}

`
    : ""
  const publishedBlock = compactPublishedDesignMd
    ? `PUBLISHED DESIGN.MD (highest-priority source; preserve its exact tokens and meaning while converting it to the canonical grammar):
---
${compactPublishedDesignMd}
---

`
    : ""
  return `Act as the senior design-system analyst for ${url}. Generate one useful, canonical DESIGN.md that another AI agent can implement immediately.

Decision rules:
1. You are the primary analyst. Combine the published document, captured CSS signal, page metadata, page content, and your design-system judgment instead of merely copying declarations.
2. Source priority is: PUBLISHED DESIGN.MD, named CSS custom properties and fonts, repeated captured styles, page content/metadata, then conservative AI inference. Never override a published token with a weaker page sample.
3. Prefer exact captured values when they are available. When the compact source package has a small gap, you may choose a coherent conventional value that fits the observed system. Keep the set restrained and internally consistent; do not claim that an inferred value was observed.
4. Do not expose uncertainty inside canonical cells. Never emit unknown, N/A, placeholders, (known), (assumed), (inferred), estimated, calculated, or truncated values. Do not mechanically multiply a base unit into a large spacing scale.
5. Ignore one-off computed-instance artifacts such as fractional responsive measurements or a specific CTA width unless they repeat or are explicitly named. Normalize the result into reusable semantic roles rather than treating every page element as a global token.
6. Preserve the exact website URL in a **Source website:** Markdown link directly after **Theme:**, followed by one sentence stating that the live website remains authoritative.
7. Use a concise, evidence-backed semantic system. Include the token groups supported by the captured source. Components, layout, imagery, and Do/Don't guidance are optional when the source does not provide meaningful evidence; do not invent filler merely to satisfy a checklist.
8. A Value cell contains exactly one executable CSS value. Write either 1.25rem or 20px, never 1.25rem (20px). Use ASCII minus signs and never use scientific notation or floating-point-limit sentinels for CSS lengths. Use 9999px for a Pill or Full radius. A gradient must contain a complete CSS gradient function. A var() reference must resolve to a Token row in this document without a cycle.
9. A Token cell contains exactly one CSS custom property such as --spacing-4. Arithmetic expressions, metadata labels, provenance suffixes, and multiple tokens are invalid.
10. Typography uses a readable font-family H3 containing one --font-* token, followed by Substitute, Weights, and Role bullets, then a separate ### Type Scale table. Spacing uses ### Spacing Scale.
11. Components use an H3, an unbulleted **Role:** paragraph, and concrete specification prose. Reusable navigation, buttons, cards, inputs, dialogs, and menus are components; product features and marketing sections are layout examples.
12. Write canonical headings and supporting prose in English while preserving brand names, product names, source token names, and quoted content. The H1 must use the detected website brand name in \`# {actual brand name} — Style Reference\`; never output the literal placeholder \`Brand\`, \`Website\`, or \`Untitled\`.
13. Return only the complete canonical Markdown document, with no fenced wrapper or commentary.

Invalid spacing row (never output):
| Spacing 5 | 1.25rem (20px) | \`--spacing * 5\` (assumed) |

Valid semantic row:
| Compact | 0.5rem | \`--spacing-compact\` |

${CANONICAL_DESIGN_MD_SPEC}

${metadataBlock}${publishedBlock}${cssSignalBlock}WEBSITE CONTENT:
---
${compactPageContent}
---`
}

export function buildGenerateCorrectionPrompt({
  previousMarkdown,
  diagnostics,
  htmlOrText,
  url,
  cssEvidence = "",
  source,
  publishedDesignMd = "",
}: {
  previousMarkdown: string
  diagnostics: string[]
  htmlOrText: string
  url: string
  cssEvidence?: string
  source?: UrlSourceMetadata
  publishedDesignMd?: string
}) {
  const compactPublishedDesignMd = capUtf8Text(publishedDesignMd, 60_000)
  const compactCssEvidence = capUtf8Text(cssEvidence, 35_000)
  const compactPageContent = capUtf8Text(htmlOrText, 35_000)
  const compactPreviousMarkdown = capUtf8Text(previousMarkdown, 90_000)
  return `Repair the generated DESIGN.md below and return the complete corrected Markdown.

This is the automatic correction pass. Resolve every listed diagnostic while preserving useful AI decisions, published values, and the exact source URL. Diagnostics may include an exact parser path and rejected value; inspect and rewrite that field, then audit the rest of the same table for the same defect. If a malformed row cannot be repaired coherently, remove that row rather than leaving a placeholder.

Diagnostics:
${diagnostics.map((diagnostic) => `- ${diagnostic}`).join("\n")}

Mandatory rules:
- Return only the complete DESIGN.md, with no fence or explanation.
- Do not return the document until every listed invalid-token, invalid-value, unresolved-reference, missing-theme, and invalid-css-values finding has been removed.
- Token cells contain exactly one --custom-property name.
- Values contain one executable CSS value: never mixed display conversions, ranges, placeholders, provenance suffixes, arithmetic tokens, incomplete functions, or unresolved var() references.
- Use an exact declaration beginning with **Theme:** light or **Theme:** dark. A short parenthetical note about another available theme is allowed after the declared primary theme.
- Use canonical headings, font-family blocks, component Role paragraphs, and # Brand — Style Reference.
- Keep canonical headings and supporting prose in English. Preserve brand, product, and token names.
- Treat a published DESIGN.md as higher priority than captured page styles. Captured CSS guides the repair but is not a verbatim allowlist.

Requested source URL: ${url}

Source metadata:
${source ? JSON.stringify(source, null, 2) : "No structured metadata was captured."}

Published DESIGN.md:
---
${compactPublishedDesignMd || "No published DESIGN.md was discovered."}
---

Captured CSS signal:
---
${compactCssEvidence || "No CSS signal was extracted. Use the source document, page content, and coherent design-system judgment."}
---

WEBSITE CONTENT:
---
${compactPageContent}
---

INVALID DESIGN.md:
---
${compactPreviousMarkdown}
---`
}

export function buildDocumentAssistantPrompt({
  markdown,
  instruction,
  diagnostics,
  conversation,
  previousProposal,
  intent,
  locale,
}: {
  markdown: string
  instruction: string
  diagnostics: string[]
  conversation: string
  previousProposal?: string
  intent: "explain" | "repair" | "normalize" | "transform"
  locale: Locale
}) {
  const responseLanguage =
    locale === "ja"
      ? "Write the reply summary in Japanese."
      : locale === "en"
        ? "Write the reply summary in English."
        : "使用简体中文撰写回复摘要。"
  const successCriteria = {
    explain:
      "Answer the question accurately. Keep the source unchanged unless the user explicitly asks for an edit.",
    repair:
      "Make the smallest coherent edit that addresses the requested problem and reduce the listed deterministic diagnostics where relevant.",
    normalize:
      "Reorganize the source into a canonical DESIGN.md that the structured editor can recognize. Preserve useful source content and attribution.",
    transform:
      "Carry out the requested visual or thematic transformation coherently across all affected tokens and guidance. User-directed design choices do not require source-site evidence.",
  }[intent]
  return `You are the AI copilot for the current DESIGN.md. Translate the user's natural-language intent into a reviewable document-scoped result.

Detected intent: ${intent}
Success criterion: ${successCriteria}

${responseLanguage} Preserve the document's existing language unless the user explicitly asks for translation. Inspect and revise the DESIGN.md source only. tokens.json, variables.css, and theme.css are deterministic derivatives and must never be edited separately.

Return exactly this envelope:
<<<TASK>>>
intent: ${intent}
scope: A short description of the document areas inspected or changed
<<<REPLY>>>
A concise, actionable answer. State what you checked, what the proposal would change, and any decision that still needs the user. Never imply that proposed Markdown has already been applied. If no edit is needed, say so clearly.
<<<DESIGN_MD>>>
The complete revised DESIGN.md
<<<END_DESIGN_MD>>>

Rules:
- Follow the user's latest instruction.
- Keep the detected intent unless the user's words clearly require a different one; if so, report the corrected intent in TASK.
- Keep the reply compact: at most 6 short Markdown bullets and roughly 120 English words or 220 Chinese characters. Put each bullet on its own line and use blank lines between sections.
- Do not repeat the complete document, long token values, or a generic request for confirmation in the reply. The interface already provides the diff and apply controls.
- The user may ask for an audit, an explanation, or a concrete edit. For an audit, fix clear technical problems in the returned document and summarize the findings. If the request needs a product decision, keep the source unchanged for that point and ask one precise question in the reply.
- For repair, preserve unrelated tokens, prose, source attribution, and unknown source-only sections.
- For normalize or transform, you may reorder and rewrite the whole document, but preserve source attribution, custom sections, and useful user content unless the user explicitly asks to remove them.
- Do not put unknown, assumed, inferred, estimated, calculated, or placeholder labels into canonical token cells.
- Use coherent design-system judgment only when the user explicitly asks you to complete a gap; explain that decision in the reply instead of polluting token names or values.
- A Token cell contains exactly one CSS custom property. A Value cell contains one executable CSS value.
- Canonical structured sections are H2 headings. Use \`## Tokens - Colors\` with a four-column \`Name | Value | Token | Role\` table; \`## Tokens - Typography\` for font-family blocks and a five-column \`Role | Size | Line Height | Letter Spacing | Token\` type-scale table; and \`## Tokens - Spacing & Shapes\` for spacing, radius, shadow, and layout values. Do not hide these categories below a generic \`## Tokens\` heading.
- A color row must have four cells, including a human-readable Name and Role. A generic three-column \`Token | Value | Usage\` table is not canonical and will not enable structured editing.
- Font families are not table rows. Each family must use \`### Font Name — --font-name\` followed by \`- **Substitute:** ...\`, \`- **Weights:** ...\`, and \`- **Role:** ...\`. A heading such as \`### Font Families\` is only a grouping label and must not be treated as a token.
- If the user reports an error in JSON/CSS/Tailwind, repair the corresponding source row in DESIGN.md.
- Do not claim a value was verified when the current document provides no evidence. This restriction does not prevent user-authorized visual transformations from introducing coherent design values.
- Always return the complete DESIGN.md envelope, even when the document is unchanged. The interface will show a diff only when the returned document actually differs.
- When LAST UNAPPLIED PROPOSAL is present and the user asks to continue, fix, or retry it, revise that proposal instead of restarting from CURRENT DESIGN.md.

Current diagnostics:
${diagnostics.length ? diagnostics.map((item) => `- ${item}`).join("\n") : "- No blocking machine diagnostics."}

Recent conversation:
${conversation || "No earlier messages."}

User instruction:
${instruction}

CURRENT DESIGN.md:
---
${markdown}
---

${previousProposal ? `LAST UNAPPLIED PROPOSAL:\n---\n${previousProposal}\n---` : ""}`
}
