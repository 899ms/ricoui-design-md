import { describe, expect, it } from "vitest"
import { exportToCss, exportToTailwindTheme } from "@/lib/export/export-css"
import { exportToJson } from "@/lib/export/export-json"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"
import { getTokenExportReadiness } from "@/lib/validation/export-readiness"
import {
  isCanonicalCustomProperty,
  isExportableTokenValue,
} from "@/lib/validation/token-syntax"

const malformedGeneratedDocument = `# Vercel — Style Reference
> Regression fixture for malformed generated tokens.

**Theme:** light

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Ink | #111111 | --color-ink | Primary text |
| Background | #FAFAFA | meta theme-color (observed) | Page background |

### Decorative / Gradient

| Name | Value | Token | Role |
|---|---|---|---|
| Hero | 135deg,#0070f3,#f81ce5 | --tw-gradient-position (observed) | Hero background |

## Tokens — Typography

### Geist · \`--font-sans\`
- **Substitute:** Arial
- **Weights:** 400, 600
- **Role:** Interface text

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| body | 1.25rem (20px) | 1.4 (28px) | –0.03em | --text-xl (observed) |

## Tokens — Spacing & Shapes

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| Base | 0.25rem | --spacing |
| Derived 5 | 1.25rem | --spacing * 5 (assumed) |

### Border Radius

| Name | Value | Token |
|---|---|---|
| Large | 1.5rem (24px) | --radius-3xl (observed) |`

const aliasDocument = `# Alias — Style Reference
> A regression fixture for resolvable CSS aliases.

**Theme:** light

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Ink base | #111111 | --color-ink-base | Concrete ink |
| Ink | var(--color-ink-base) | --color-ink | Semantic ink alias |

## Tokens — Typography

### Inter · \`--font-sans\`
- **Substitute:** Arial
- **Weights:** 400
- **Role:** Interface text

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
| Small | 4px | --radius-sm |`

describe("derived artifact safety", () => {
  it("recognizes canonical token names and single source values", () => {
    expect(isCanonicalCustomProperty("--spacing-4")).toBe(true)
    expect(isCanonicalCustomProperty("--spacing * 4 (assumed)")).toBe(false)
    expect(isExportableTokenValue("1.25rem")).toBe(true)
    expect(isExportableTokenValue("1.25rem (20px)")).toBe(false)
    expect(isExportableTokenValue("–0.03em")).toBe(false)
    expect(isExportableTokenValue("unknown")).toBe(false)
  })

  it("does not emit malformed generated rows into JSON or CSS artifacts", () => {
    const { tokens } = parseDesignMd(malformedGeneratedDocument)
    const json = exportToJson(tokens)
    const css = exportToCss(tokens)
    const theme = exportToTailwindTheme(tokens)

    for (const output of [json, css, theme]) {
      expect(output).toContain("#111111")
      expect(output).not.toContain("--spacing * 5")
      expect(output).not.toContain("1.25rem (20px)")
      expect(output).not.toContain("–0.03em")
      expect(output).not.toContain("meta theme-color")
      expect(output).not.toContain("135deg,#0070f3,#f81ce5")
    }
  })

  it("blocks every derived file when the current DESIGN.md revision is invalid", () => {
    const result = compileDesignArtifacts(malformedGeneratedDocument)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("Expected invalid source to be blocked")
    expect(result.reason).toBe("invalid-tokens")
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-token" }),
        expect.objectContaining({ code: "invalid-value" }),
      ])
    )
  })

  it("does not treat an incomplete gradient argument list as exportable", () => {
    const { tokens } = parseDesignMd(malformedGeneratedDocument)
    tokens.gradients = [
      {
        name: "Broken",
        value: "135deg,#0070f3,#f81ce5",
        token: "--gradient-broken",
        role: "Decorative",
      },
    ]

    const readiness = getTokenExportReadiness(tokens)
    expect(readiness.ready).toBe(false)
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        code: "invalid-value",
        path: "gradients.0.value",
      })
    )
  })

  it("does not generate empty derivative files from prose-only Markdown", () => {
    const result = compileDesignArtifacts(`# Notes
> No token source is available yet.

**Theme:** light`)

    expect(result.ok).toBe(false)
    if (result.ok)
      throw new Error("Expected an empty token model to be blocked")
    expect(result.issues).toContainEqual({
      code: "missing-token",
      path: "tokens",
      value: "",
    })
  })

  it("does not treat a typography grouping heading as a missing font token", () => {
    const result = compileDesignArtifacts(`# Example — Style Reference
> Example reference.

**Theme:** light

## Tokens – Typography

### Font Families

Use one family for interface copy.

### Inter — --font-body
- **Substitute:** system-ui, sans-serif
- **Weights:** 400, 600
- **Role:** Body

### Type Scale
| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| body | 16px | 1.5 | 0 | --type-body |
`)

    expect(result.ok).toBe(true)
  })

  it("allows aliases that resolve to a concrete token in the same document", () => {
    const result = compileDesignArtifacts(aliasDocument)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("Expected the local alias to resolve")
    expect(result.artifacts.variablesCss).toContain(
      "--color-ink: var(--color-ink-base);"
    )
    expect(result.artifacts.variablesCss).toContain(
      "--color-ink-base: #111111;"
    )
  })

  it("blocks unresolved and cyclic CSS custom-property references", () => {
    const unresolved = compileDesignArtifacts(
      aliasDocument.replace("var(--color-ink-base)", "var(--missing-ink)")
    )
    expect(unresolved.ok).toBe(false)
    if (unresolved.ok) throw new Error("Expected an unresolved alias to fail")
    expect(unresolved.issues).toContainEqual(
      expect.objectContaining({
        code: "unresolved-reference",
        path: "colors.1.value",
      })
    )

    const cyclic = compileDesignArtifacts(
      aliasDocument.replace("#111111", "var(--color-ink)")
    )
    expect(cyclic.ok).toBe(false)
    if (cyclic.ok) throw new Error("Expected a cyclic alias to fail")
    expect(cyclic.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unresolved-reference" }),
      ])
    )
  })
})
