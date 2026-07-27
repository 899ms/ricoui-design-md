import { describe, expect, it } from "vitest"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { rewriteMarkdownSections } from "@/lib/export/export-md"

const EXTRA_PROSE = "Some extra intro prose that must survive edits."

const md = `# Aurora Kit

> A calm design language.

${EXTRA_PROSE}

**Theme:** light

## Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Sky | \`#38bdf8\` | \`--sky\` | primary |
`

describe("preamble rewrite (B3)", () => {
  it("no-op meta rewrite is byte-identical", () => {
    const result = parseDesignMd(md)
    const rewrite = rewriteMarkdownSections(
      md,
      result,
      ["tokens.meta"],
      result.tokens,
      result.rawSections
    )
    expect(rewrite.markdown).toBe(md)
  })

  it("renaming keeps extra preamble prose and the blockquote", () => {
    const result = parseDesignMd(md)
    const tokens = structuredClone(result.tokens)
    tokens.meta.name = "Nebula Kit"

    const rewrite = rewriteMarkdownSections(
      md,
      result,
      ["tokens.meta"],
      tokens,
      result.rawSections
    )

    expect(rewrite.markdown).toContain("# Nebula Kit")
    expect(rewrite.markdown).toContain(EXTRA_PROSE)
    expect(rewrite.markdown).toContain("> A calm design language.")

    const reparsed = parseDesignMd(rewrite.markdown)
    expect(reparsed.tokens.meta.name).toBe("Nebula Kit")
    expect(reparsed.tokens.meta.description).toBe("A calm design language.")
    expect(reparsed.tokens.meta.theme).toBe("light")
  })

  it("renaming preserves an existing heading suffix", () => {
    const suffixed = md.replace("# Aurora Kit", "# Aurora Kit - 样式参考")
    const result = parseDesignMd(suffixed)
    expect(result.tokens.meta.name).toBe("Aurora Kit")

    const tokens = structuredClone(result.tokens)
    tokens.meta.name = "Nebula Kit"

    const rewrite = rewriteMarkdownSections(
      suffixed,
      result,
      ["tokens.meta"],
      tokens,
      result.rawSections
    )
    expect(rewrite.markdown).toContain("# Nebula Kit - 样式参考")
  })

  it("theme edit only touches the theme line", () => {
    const result = parseDesignMd(md)
    const tokens = structuredClone(result.tokens)
    tokens.meta.theme = "dark"

    const rewrite = rewriteMarkdownSections(
      md,
      result,
      ["tokens.meta"],
      tokens,
      result.rawSections
    )
    expect(rewrite.markdown).toContain("**Theme:** dark")
    expect(rewrite.markdown).toContain("# Aurora Kit")
    expect(rewrite.markdown).toContain(EXTRA_PROSE)
    expect(rewrite.markdown).toContain("> A calm design language.")
  })
})
