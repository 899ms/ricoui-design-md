import { describe, expect, it } from "vitest"
import {
  ensureSourceWebsite,
  getGeneratedDesignRepairDiagnostics,
  validateGeneratedDesign,
} from "@/lib/ai/validate-generated-design"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"

const canonicalDocument = `# Example — Style Reference
> A compact reference for the Example website.

**Theme:** light

**Source website:** [https://example.com/](https://example.com/)

Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Ink | #111111 | --color-ink | Primary text (observed) |

## Tokens — Typography

### Inter · \`--font-sans\`
- **Substitute:** Arial
- **Weights:** 400, 600
- **Role:** Interface text (observed)

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| body | 16px | 1.5 | 0 | --text-body |

## Tokens — Spacing & Shapes

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| 4 | 4px | --spacing-4 |

### Border Radius

| Name | Value | Token |
|---|---|---|
| Small | 4px | --radius-sm |

## Components

### Primary Button
**Role:** Primary action

Uses the observed ink color and a visible focus state.

## Do's and Don'ts

### Do
- Keep actions concise.

### Don't
- Do not invent states that were not observed.

## Imagery

Use product imagery at its natural aspect ratio.

## Layout

- **Section gap:** 64px
- **Card padding:** 24px
- **Element gap:** 16px
- **Max content width:** 1200px`

describe("website DESIGN.md validation", () => {
  it("accepts a complete canonical website reference", () => {
    expect(
      validateGeneratedDesign(canonicalDocument, { finishReason: "stop" })
    ).toEqual({
      quality: "ready",
      issues: [],
    })
  })

  it("accepts a primary theme followed by an availability note", () => {
    const result = validateGeneratedDesign(
      canonicalDocument.replace(
        "**Theme:** light",
        "**Theme:** light (dark mode available via toggle)"
      ),
      { finishReason: "stop" }
    )

    expect(result.issues).not.toContain("missing-theme")
    expect(result.quality).toBe("ready")
  })

  it("parses compact bold font blocks and list-based component specs", () => {
    const markdown = canonicalDocument
      .replace(
        `### Inter · \`--font-sans\`
- **Substitute:** Arial
- **Weights:** 400, 600
- **Role:** Interface text (observed)`,
        `**\`--font-heading\`**
**Substitute:** "Funnel Display", system-ui, sans-serif
**Weights:** 300, 400, 500, 600, 700
**Role:** All headings and display text.`
      )
      .replace(
        "Uses the observed ink color and a visible focus state.",
        "- Background: var(--color-ink).\n- Focus: visible focus ring."
      )
    const parsed = parseDesignMd(markdown)
    const validation = validateGeneratedDesign(markdown, {
      finishReason: "stop",
    })
    const compilation = compileDesignArtifacts(markdown)

    expect(parsed.tokens.typography.fontFamilies).toEqual([
      expect.objectContaining({
        name: "Funnel Display",
        token: "--font-heading",
        weights: [300, 400, 500, 600, 700],
        role: "All headings and display text.",
      }),
    ])
    expect(parsed.tokens.components[0]).toEqual(
      expect.objectContaining({
        role: "Primary action",
        description: expect.stringContaining("Background: var(--color-ink)"),
      })
    )
    expect(validation.issues).not.toEqual(
      expect.arrayContaining(["missing-fonts", "invalid-components"])
    )
    expect(validation.quality).toBe("ready")
    expect(compilation.ok).toBe(true)
  })

  it("marks the structural problems found in a generated draft for review", () => {
    const generatedDraft = `# Notion
> A website reference.

**Theme:** light

## Tokens – Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Blue | #097fe8 | --color-blue | Primary action (observed) |

## Tokens – Typography

### --font-family-sans
- **Weights:** 400, 700 (assumed)
- **Role:** Interface text

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| Body | 16px | 1.5 | 0 | --text-body |

## Tokens – Spacing & Shapes

### Spacing
| Name | Value | Token |
|---|---|---|
| 4 | 4px | --spacing-4 |

### Border Radius
| Name | Value | Token |
|---|---|---|
| Small | 4px | --radius-sm |

## Components

### Docs
**Role:** Product feature

Shadow: 0 23px… (truncated in evidence).`

    const result = validateGeneratedDesign(generatedDraft, {
      finishReason: "length",
    })

    expect(result.quality).toBe("invalid")
    expect(result.issues).toEqual(
      expect.arrayContaining([
        "truncated-output",
        "noncanonical-title",
        "missing-source",
        "missing-type-scale",
        "missing-guidelines",
        "missing-imagery",
        "missing-layout",
        "unsupported-assumptions",
      ])
    )
  })

  it("rejects malformed Vercel-style inferred tokens and display conversions", () => {
    const generatedDraft = ensureSourceWebsite(
      `# Vercel Design System
> Design tokens for an agentic infrastructure platform.

**Theme:** light

## Tokens – Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Background | #FAFAFA | meta theme-color (observed) | Page background |

### Decorative / Gradient

| Name | Value | Token | Role |
|---|---|---|---|
| Hero gradient | 135deg,#0070f3,#f81ce5 | --tw-gradient-position (observed) | Hero background |

## Tokens – Typography

### Font Family 1: Geist Sans

| Token | Substitute | Weights | Role |
|---|---|---|---|
| --font-sans | sans-serif | 400, 600 | Interface text |

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| Subheading | 1.25rem (20px) | 1.4 (28px) | –0.03em | --text-xl (observed) |

## Tokens – Spacing & Shapes

### Spacing

| Name | Value | Token |
|---|---|---|
| Base unit | 0.25rem (4px) | --spacing (observed) |
| Spacing 5 | 1.25rem | --spacing * 5 (assumed) |

### Border Radius

| Name | Value | Token |
|---|---|---|
| Large rounded | 1.5rem (24px) | --radius-3xl (observed) |

## Components

### Header
- **Role:** Primary navigation
- Uses a white background.

## Layout

- **Section gap:** 4rem to 6rem
- **Card padding:** 1.5rem (24px)
- **Element gap:** 0.75rem to 1rem
- **Max content width:** 1200px`,
      "https://vercel.com/"
    )

    const result = validateGeneratedDesign(generatedDraft, {
      finishReason: "stop",
      cssEvidence: `meta theme-color: #FAFAFA
--spacing: 0.25rem
--radius-3xl: 1.5rem
--text-xl: 1.25rem`,
    })

    expect(result.quality).toBe("invalid")
    expect(result.issues).toEqual(
      expect.arrayContaining([
        "noncanonical-title",
        "noncanonical-headings",
        "invalid-font-blocks",
        "invalid-token-syntax",
        "invalid-css-values",
        "unverified-values",
        "unsupported-assumptions",
      ])
    )
  })

  it("rejects unknown and placeholder values", () => {
    const result = validateGeneratedDesign(
      canonicalDocument.replace("64px", "unknown"),
      { finishReason: "stop" }
    )

    expect(result.quality).toBe("invalid")
    expect(result.issues).toContain("placeholder-values")
  })

  it("rejects a var() value whose custom property is not in the document", () => {
    const result = validateGeneratedDesign(
      canonicalDocument.replace("#111111", "var(--missing-ink)"),
      { finishReason: "stop" }
    )

    expect(result.quality).toBe("invalid")
    expect(result.issues).toContain("unresolved-references")
  })

  it("keeps values absent from compact CSS as non-blocking diagnostics", () => {
    const result = validateGeneratedDesign(canonicalDocument, {
      finishReason: "stop",
      cssEvidence: `--color-ink: #111111
font-family: MadeUp Sans, sans-serif
font-weight: 400
--text-body: 16px
line-height: 1.5
letter-spacing: 0
--spacing-4: 4px
--radius-sm: 4px
gap: 64px
padding: 24px
gap: 16px
max-width: 1200px`,
    })

    expect(result.quality).toBe("ready")
    expect(result.issues).toContain("unverified-values")
  })

  it("blocks malformed token names while keeping font metadata advisory", () => {
    const result = validateGeneratedDesign(
      canonicalDocument
        .replace(/### Inter[^\n]+/, "### Inter")
        .replace("--spacing-4", "spacing-4"),
      { finishReason: "stop" }
    )

    expect(result.quality).toBe("invalid")
    expect(result.issues).toEqual(
      expect.arrayContaining(["invalid-font-blocks", "invalid-token-syntax"])
    )
  })

  it("gives the correction model exact invalid token paths and values", () => {
    const markdown = canonicalDocument.replace("--spacing-4", "spacing * 4")
    const validation = validateGeneratedDesign(markdown, {
      finishReason: "stop",
    })

    expect(getGeneratedDesignRepairDiagnostics(markdown, validation)).toEqual(
      expect.arrayContaining([
        "invalid-token-syntax",
        'invalid-token at spacing.0.token: "spacing * 4"',
      ])
    )
  })

  it("normalizes source attribution and does not duplicate it", () => {
    const url = "https://www.notion.com/"
    const withoutSource = `# Notion — Style Reference
> Notion reference.

**Theme:** light

## Tokens — Colors`

    const attributed = ensureSourceWebsite(withoutSource, url)
    const normalizedAgain = ensureSourceWebsite(attributed, url)

    expect(attributed).toContain(`**Source website:** [${url}](${url})`)
    expect(attributed).toContain(
      "The current source website remains authoritative."
    )
    expect(normalizedAgain).toBe(attributed)
    expect(normalizedAgain.match(/\*\*Source website:\*\*/g)).toHaveLength(1)
  })

  it("replaces a model-provided source URL with the requested URL", () => {
    const requestedUrl = "https://www.notion.com/"
    const result = ensureSourceWebsite(
      `# Notion — Style Reference
> Notion reference.

**Theme:** light

**Source website:** [https://example.com](https://example.com)`,
      requestedUrl
    )

    expect(result).toContain(
      `**Source website:** [${requestedUrl}](${requestedUrl})`
    )
    expect(result).not.toContain("example.com")
  })
})
