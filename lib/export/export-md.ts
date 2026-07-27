import type {
  DesignTokens,
  DocumentSectionDataKey,
  DocumentSectionSkeleton,
  ParseResult,
  RawSections,
} from "@/lib/types/tokens"

function formatHeading(depth: number, text: string): string {
  return `${"#".repeat(depth)} ${text}\n\n`
}

/** Escape pipes so cell values can't break the table structure on rewrite. */
function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|")
}

function renderTable(headers: string[], rows: string[][]): string {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "------").join("|")}|`,
    ...rows.map((row) => `| ${row.map(escapeTableCell).join(" | ")} |`),
  ]

  return `${lines.join("\n")}\n\n`
}

function renderBulletList(items: string[]): string {
  if (items.length === 0) return ""
  return `${items.map((item) => `- ${item}`).join("\n")}\n\n`
}

function normalizedHeadingText(
  section: DocumentSectionSkeleton,
  fallback: string,
  depth: number
): string {
  return formatHeading(depth, section.headingText?.trim() || fallback)
}

// Local copy of the parser's inline cleanup — used to compare what a preamble
// line would parse to against the current token values.
function cleanInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .trim()
}

const H1_SUFFIX_PATTERN = /\s*[-—]\s*(?:Style\s*Reference|样式参考)\s*$/i
const THEME_LINE_PATTERN = /\*{0,2}theme\s*:\*{0,2}\s*(light|dark)/i

/**
 * Rewrites only the meta-bearing lines of the preamble (H1 name, blockquote
 * description, theme line) and keeps every other line verbatim, so extra
 * preamble prose survives structured edits (PROJECT-REVIEW B3). Lines whose
 * parsed value already matches the token state are left byte-identical.
 */
function renderPreamble(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  const lines = section.raw.split("\n")

  let h1Index = lines.findIndex((line) => /^#\s+\S/.test(line))
  if (h1Index >= 0) {
    const text = lines[h1Index].replace(/^#\s+/, "")
    const suffix = text.match(H1_SUFFIX_PATTERN)?.[0] ?? ""
    const currentName = cleanInline(text.replace(H1_SUFFIX_PATTERN, ""))
    if (currentName !== tokens.meta.name) {
      lines[h1Index] = `# ${tokens.meta.name}${suffix}`
    }
  } else if (tokens.meta.name) {
    lines.unshift(`# ${tokens.meta.name}`, "")
    h1Index = 0
  }

  let quoteStart = -1
  let quoteEnd = -1
  for (let index = 0; index < lines.length; index += 1) {
    if (/^>/.test(lines[index])) {
      quoteStart = index
      quoteEnd = index + 1
      while (quoteEnd < lines.length && /^>/.test(lines[quoteEnd])) {
        quoteEnd += 1
      }
      break
    }
  }
  if (quoteStart >= 0) {
    const currentDescription = cleanInline(
      lines
        .slice(quoteStart, quoteEnd)
        .map((line) => line.replace(/^>\s?/, ""))
        .join("\n")
    )
    if (currentDescription !== tokens.meta.description) {
      const replacement = tokens.meta.description
        ? [`> ${tokens.meta.description}`]
        : []
      lines.splice(quoteStart, quoteEnd - quoteStart, ...replacement)
    }
  } else if (tokens.meta.description) {
    lines.splice(h1Index + 1, 0, "", `> ${tokens.meta.description}`)
  }

  const themeIndex = lines.findIndex((line) => THEME_LINE_PATTERN.test(line))
  if (themeIndex >= 0) {
    const currentTheme = lines[themeIndex]
      .match(THEME_LINE_PATTERN)?.[1]
      ?.toLowerCase()
    if (currentTheme !== tokens.meta.theme) {
      lines[themeIndex] = `**Theme:** ${tokens.meta.theme}`
    }
  } else if (tokens.meta.theme !== "light") {
    // "light" is the parse default, so an absent theme line already means
    // light — only materialize the line for a non-default value.
    let insertAt = lines.length
    while (insertAt > 0 && lines[insertAt - 1].trim() === "") {
      insertAt -= 1
    }
    lines.splice(insertAt, 0, "", `**Theme:** ${tokens.meta.theme}`)
  }

  return lines.join("\n")
}

function renderColorsTable(
  tokens: DesignTokens,
  includeInlineGradients: boolean
): string {
  const rows = tokens.colors.map((color) => [
    color.name,
    `\`${color.value}\``,
    `\`${color.token}\``,
    color.role,
  ])

  // When the document has no dedicated gradient section, gradient rows live
  // in the main colors table — re-emit them or they are silently deleted on
  // the first structured color edit (PROJECT-REVIEW B2).
  if (includeInlineGradients) {
    rows.push(
      ...tokens.gradients.map((gradient) => [
        gradient.name,
        `\`${gradient.value}\``,
        `\`${gradient.token}\``,
        gradient.role,
      ])
    )
  }

  return renderTable(["Name", "Value", "Token", "Role"], rows)
}

function renderGradientsSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  return `${normalizedHeadingText(section, "Decorative / Gradient", 3)}${renderTable(
    ["Name", "Value", "Token", "Role"],
    tokens.gradients.map((gradient) => [
      gradient.name,
      `\`${gradient.value}\``,
      `\`${gradient.token}\``,
      gradient.role,
    ])
  )}`
}

function renderFontFamilySection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  const index = Number.parseInt(section.dataKey?.split(".").at(-1) ?? "", 10)
  const font = tokens.typography.fontFamilies[index]

  if (!font) return ""

  const lines = [normalizedHeadingText(section, font.name, 3).trimEnd()]

  if (font.substitute) {
    lines.push(`- **Substitute:** ${font.substitute}`)
  }
  if (font.weights.length > 0) {
    lines.push(`- **Weights:** ${font.weights.join(", ")}`)
  }
  if (font.role) {
    lines.push(`- **Role:** ${font.role}`)
  }
  lines.push("")

  return `${lines.join("\n")}\n`
}

function renderTypeScaleSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  return `${normalizedHeadingText(section, "Type Scale", 3)}${renderTable(
    ["Role", "Size", "Line Height", "Letter Spacing", "Token"],
    tokens.typography.typeScale.map((style) => [
      style.role,
      style.size,
      style.lineHeight,
      style.letterSpacing || "-",
      `\`${style.token}\``,
    ])
  )}`
}

function renderSpacingSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  return `${normalizedHeadingText(section, "Spacing Scale", 3)}${renderTable(
    ["Name", "Value", "Token"],
    tokens.spacing.map((space) => [
      space.name,
      space.value,
      `\`${space.token}\``,
    ])
  )}`
}

function renderRadiusSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  return `${normalizedHeadingText(section, "Border Radius", 3)}${renderTable(
    ["Name", "Value", "Token"],
    tokens.radius.map((radius) => [
      radius.name,
      radius.value,
      `\`${radius.token}\``,
    ])
  )}`
}

function renderShadowsSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  return `${normalizedHeadingText(section, "Shadows", 3)}${renderTable(
    ["Name", "Value", "Token"],
    tokens.shadows.map((shadow) => [
      shadow.name,
      `\`${shadow.value}\``,
      `\`${shadow.token}\``,
    ])
  )}`
}

function renderLayoutSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  const lines = [
    normalizedHeadingText(section, "Layout", 3).trimEnd(),
    `- **Section gap:** ${tokens.layout.sectionGap}`,
    `- **Card padding:** ${tokens.layout.cardPadding}`,
    `- **Element gap:** ${tokens.layout.elementGap}`,
    `- **Max content width:** ${tokens.layout.maxContentWidth}`,
    "",
  ]

  return `${lines.join("\n")}\n`
}

function renderComponentSection(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens
): string {
  const index = Number.parseInt(section.dataKey?.split(".").at(-1) ?? "", 10)
  const component = tokens.components[index]

  if (!component) return ""

  const lines = [
    normalizedHeadingText(
      section,
      component.name || `组件 ${index + 1}`,
      3
    ).trimEnd(),
  ]

  if (component.role) {
    lines.push(`**Role:** ${component.role}`)
    lines.push("")
  }
  if (component.description) {
    lines.push(component.description)
  }
  lines.push("")

  return `${lines.join("\n")}\n`
}

function renderGuidelineSection(
  section: DocumentSectionSkeleton,
  heading: string,
  items: string[]
): string {
  const body = items.length > 0 ? renderBulletList(items) : ""
  return `${normalizedHeadingText(section, heading, 3)}${body}`
}

function renderDosDontsBody(rawSections: RawSections): string {
  const blocks: string[] = []

  if (rawSections.dosDonts.dos.length > 0) {
    blocks.push("### Do")
    blocks.push("")
    blocks.push(renderBulletList(rawSections.dosDonts.dos).trimEnd())
    blocks.push("")
  }

  if (rawSections.dosDonts.donts.length > 0) {
    blocks.push("### Don't")
    blocks.push("")
    blocks.push(renderBulletList(rawSections.dosDonts.donts).trimEnd())
    blocks.push("")
  }

  return blocks.length > 0 ? `${blocks.join("\n")}\n` : ""
}

function renderProseBlock(value: string): string {
  return value ? `${value}\n\n` : ""
}

export interface RenderSectionContext {
  /** Whether the skeleton has a dedicated `tokens.gradients` block. */
  hasGradientsBlock: boolean
}

export function renderSectionSkeletonBlock(
  section: DocumentSectionSkeleton,
  tokens: DesignTokens,
  rawSections: RawSections,
  context: RenderSectionContext = { hasGradientsBlock: false }
): string {
  switch (section.dataKey) {
    case "tokens.meta":
      return renderPreamble(section, tokens)
    case "tokens.colors":
      return renderColorsTable(tokens, !context.hasGradientsBlock)
    case "tokens.gradients":
      return renderGradientsSection(section, tokens)
    case "tokens.typography.typeScale":
      return renderTypeScaleSection(section, tokens)
    case "tokens.spacing":
      return renderSpacingSection(section, tokens)
    case "tokens.radius":
      return renderRadiusSection(section, tokens)
    case "tokens.shadows":
      return renderShadowsSection(section, tokens)
    case "tokens.layout":
      return renderLayoutSection(section, tokens)
    case "rawSections.dosDonts":
      return renderDosDontsBody(rawSections)
    case "rawSections.dos":
      return renderGuidelineSection(section, "Do", rawSections.dosDonts.dos)
    case "rawSections.donts":
      return renderGuidelineSection(
        section,
        "Don't",
        rawSections.dosDonts.donts
      )
    case "rawSections.imagery":
      return renderProseBlock(rawSections.imagery)
    case "rawSections.layout":
      return renderProseBlock(rawSections.layout)
    default:
      if (section.dataKey?.startsWith("tokens.typography.fontFamilies.")) {
        return renderFontFamilySection(section, tokens)
      }
      if (section.dataKey?.startsWith("tokens.components.")) {
        return renderComponentSection(section, tokens)
      }
      return section.raw
  }
}

export interface RewriteMarkdownResult {
  markdown: string
  /** Data keys that actually matched a skeleton block and were rewritten. */
  appliedKeys: DocumentSectionDataKey[]
}

export function rewriteMarkdownSections(
  rawMarkdown: string,
  parsedDocument: ParseResult,
  dataKeys: DocumentSectionDataKey[],
  tokens: DesignTokens,
  rawSections: RawSections
): RewriteMarkdownResult {
  const matchingBlocks = parsedDocument.sectionSkeleton
    .filter(
      (
        section
      ): section is DocumentSectionSkeleton & {
        dataKey: DocumentSectionDataKey
      } => !!section.dataKey && dataKeys.includes(section.dataKey)
    )
    .sort((left, right) => right.start - left.start)

  if (matchingBlocks.length === 0) {
    return { markdown: rawMarkdown, appliedKeys: [] }
  }

  const context: RenderSectionContext = {
    hasGradientsBlock: parsedDocument.sectionSkeleton.some(
      (section) => section.dataKey === "tokens.gradients"
    ),
  }

  let nextMarkdown = rawMarkdown
  const appliedKeys = new Set<DocumentSectionDataKey>()

  for (const section of matchingBlocks) {
    const replacement = renderSectionSkeletonBlock(
      section,
      tokens,
      rawSections,
      context
    )
    appliedKeys.add(section.dataKey)
    nextMarkdown =
      nextMarkdown.slice(0, section.start) +
      replacement +
      nextMarkdown.slice(section.end)
  }

  return { markdown: nextMarkdown, appliedKeys: [...appliedKeys] }
}

/**
 * Export the current document state back to a DESIGN.md file.
 * Structured tables are regenerated from token state while prose is preserved from raw sections.
 */
export function exportToMd(
  tokens: DesignTokens,
  rawSections: RawSections
): string {
  const lines: string[] = []

  lines.push(`# ${tokens.meta.name} - 样式参考`)
  if (tokens.meta.description) {
    lines.push(`> ${tokens.meta.description}`)
    lines.push("")
  }
  lines.push(`**Theme:** ${tokens.meta.theme}`)
  lines.push("")

  if (tokens.colors.length > 0) {
    lines.push("## Tokens - Colors")
    lines.push("")
    lines.push(renderColorsTable(tokens, false).trimEnd())
    lines.push("")
  }

  if (tokens.gradients.length > 0) {
    lines.push("### Decorative / Gradient")
    lines.push("")
    lines.push(
      renderTable(
        ["Name", "Value", "Token", "Role"],
        tokens.gradients.map((gradient) => [
          gradient.name,
          `\`${gradient.value}\``,
          `\`${gradient.token}\``,
          gradient.role,
        ])
      ).trimEnd()
    )
    lines.push("")
  }

  if (
    tokens.typography.fontFamilies.length > 0 ||
    tokens.typography.typeScale.length > 0
  ) {
    lines.push("## Tokens - Typography")
    lines.push("")

    for (const font of tokens.typography.fontFamilies) {
      lines.push(`### ${font.name} - \`${font.token}\``)
      lines.push(`- **Substitute:** ${font.substitute || font.name}`)
      if (font.weights.length > 0) {
        lines.push(`- **Weights:** ${font.weights.join(", ")}`)
      }
      if (font.role) {
        lines.push(`- **Role:** ${font.role}`)
      }
      lines.push("")
    }

    if (tokens.typography.typeScale.length > 0) {
      lines.push("### Type Scale")
      lines.push("")
      lines.push(
        renderTable(
          ["Role", "Size", "Line Height", "Letter Spacing", "Token"],
          tokens.typography.typeScale.map((style) => [
            style.role,
            style.size,
            style.lineHeight,
            style.letterSpacing || "-",
            `\`${style.token}\``,
          ])
        ).trimEnd()
      )
      lines.push("")
    }
  }

  if (
    rawSections.density ||
    tokens.spacing.length > 0 ||
    tokens.radius.length > 0 ||
    tokens.shadows.length > 0 ||
    tokens.layout.sectionGap
  ) {
    lines.push("## Tokens - Spacing & Shapes")
    lines.push("")
  }

  if (rawSections.density) {
    lines.push(`- **Density:** ${rawSections.density}`)
    lines.push("")
  }

  if (tokens.spacing.length > 0) {
    lines.push("### Spacing Scale")
    lines.push("")
    lines.push(
      renderTable(
        ["Name", "Value", "Token"],
        tokens.spacing.map((space) => [
          space.name,
          space.value,
          `\`${space.token}\``,
        ])
      ).trimEnd()
    )
    lines.push("")
  }

  if (tokens.radius.length > 0) {
    lines.push("### Border Radius")
    lines.push("")
    lines.push(
      renderTable(
        ["Name", "Value", "Token"],
        tokens.radius.map((radius) => [
          radius.name,
          radius.value,
          `\`${radius.token}\``,
        ])
      ).trimEnd()
    )
    lines.push("")
  }

  if (tokens.shadows.length > 0) {
    lines.push("### Shadows")
    lines.push("")
    lines.push(
      renderTable(
        ["Name", "Value", "Token"],
        tokens.shadows.map((shadow) => [
          shadow.name,
          `\`${shadow.value}\``,
          `\`${shadow.token}\``,
        ])
      ).trimEnd()
    )
    lines.push("")
  }

  if (tokens.layout.sectionGap) {
    lines.push("### Layout")
    lines.push("")
    lines.push(`- **Section gap:** ${tokens.layout.sectionGap}`)
    lines.push(`- **Card padding:** ${tokens.layout.cardPadding}`)
    lines.push(`- **Element gap:** ${tokens.layout.elementGap}`)
    lines.push(`- **Max content width:** ${tokens.layout.maxContentWidth}`)
    lines.push("")
  }

  if (tokens.components.length > 0) {
    lines.push("## Components")
    lines.push("")
    for (const component of tokens.components) {
      lines.push(`### ${component.name}`)
      if (component.role) {
        lines.push(`**Role:** ${component.role}`)
        lines.push("")
      }
      if (component.description) {
        lines.push(component.description)
      }
      lines.push("")
    }
  }

  if (
    rawSections.dosDonts.dos.length > 0 ||
    rawSections.dosDonts.donts.length > 0
  ) {
    lines.push("## Do's and Don'ts")
    lines.push("")
    if (rawSections.dosDonts.dos.length > 0) {
      lines.push("### Do")
      lines.push("")
      lines.push(renderBulletList(rawSections.dosDonts.dos).trimEnd())
      lines.push("")
    }
    if (rawSections.dosDonts.donts.length > 0) {
      lines.push("### Don't")
      lines.push("")
      lines.push(renderBulletList(rawSections.dosDonts.donts).trimEnd())
      lines.push("")
    }
  }

  if (rawSections.imagery) {
    lines.push("## Imagery")
    lines.push("")
    lines.push(rawSections.imagery)
    lines.push("")
  }

  if (rawSections.layout) {
    lines.push("## Layout")
    lines.push("")
    lines.push(rawSections.layout)
    lines.push("")
  }

  return lines.join("\n")
}
