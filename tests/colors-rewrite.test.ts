import { describe, expect, it } from "vitest"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { rewriteMarkdownSections } from "@/lib/export/export-md"

const GRADIENT_VALUE = "linear-gradient(90deg, #f97316, #ec4899)"

const mdWithInlineGradient = `# Sample Kit

## Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Sky | \`#38bdf8\` | \`--sky\` | primary |
| Sunset | \`${GRADIENT_VALUE}\` | \`--g-sunset\` | hero |
| Ink | \`#0f172a\` | \`--ink\` | text |
`

const mdWithGradientSection = `# Sample Kit

## Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Sky | \`#38bdf8\` | \`--sky\` | primary |
| Ink | \`#0f172a\` | \`--ink\` | text |

### Decorative / Gradient

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Sunset | \`${GRADIENT_VALUE}\` | \`--g-sunset\` | hero |
`

describe("gradient preservation on colors rewrite (B2)", () => {
  it("keeps a gradient row that lives in the main colors table", () => {
    const result = parseDesignMd(mdWithInlineGradient)
    expect(result.tokens.gradients).toHaveLength(1)
    expect(result.tokens.colors).toHaveLength(2)

    const rewrite = rewriteMarkdownSections(
      mdWithInlineGradient,
      result,
      ["tokens.colors"],
      result.tokens,
      result.rawSections
    )

    expect(rewrite.markdown).toContain(GRADIENT_VALUE)

    const reparsed = parseDesignMd(rewrite.markdown)
    expect(reparsed.tokens.gradients).toEqual(result.tokens.gradients)
    expect(reparsed.tokens.colors).toEqual(result.tokens.colors)
  })

  it("does not duplicate gradients when a dedicated gradient section exists", () => {
    const result = parseDesignMd(mdWithGradientSection)
    expect(result.tokens.gradients).toHaveLength(1)

    const rewrite = rewriteMarkdownSections(
      mdWithGradientSection,
      result,
      ["tokens.colors"],
      result.tokens,
      result.rawSections
    )

    const reparsed = parseDesignMd(rewrite.markdown)
    expect(reparsed.tokens.gradients).toEqual(result.tokens.gradients)
    expect(reparsed.tokens.colors).toEqual(result.tokens.colors)
    // The gradient must appear exactly once in the document.
    expect(rewrite.markdown.split(GRADIENT_VALUE)).toHaveLength(2)
  })
})

describe("table cell escaping (B15)", () => {
  it("round-trips a role containing a pipe character", () => {
    const result = parseDesignMd(mdWithInlineGradient)
    const tokens = structuredClone(result.tokens)
    tokens.colors[0].role = "nav | footer"

    const rewrite = rewriteMarkdownSections(
      mdWithInlineGradient,
      result,
      ["tokens.colors"],
      tokens,
      result.rawSections
    )

    const reparsed = parseDesignMd(rewrite.markdown)
    expect(reparsed.tokens.colors[0].role).toBe("nav | footer")
    expect(reparsed.tokens.colors).toHaveLength(2)
  })
})

describe("rewrite reports applied keys (B4)", () => {
  it("returns an empty appliedKeys list when no block matches", () => {
    const result = parseDesignMd(mdWithInlineGradient)
    const rewrite = rewriteMarkdownSections(
      mdWithInlineGradient,
      result,
      ["tokens.shadows"],
      result.tokens,
      result.rawSections
    )
    expect(rewrite.appliedKeys).toEqual([])
    expect(rewrite.markdown).toBe(mdWithInlineGradient)
  })
})
