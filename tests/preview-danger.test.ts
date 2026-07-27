import { describe, expect, it } from "vitest"
import { parseDesignMd } from "@/lib/parser/parse-design-md"

const UNPARSEABLE_VALUE = "oklch(0.7 0.1 200)"

const md = `# Sample Kit

## Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Ocean | \`${UNPARSEABLE_VALUE}\` | \`--ocean\` | decorative |
| Sky | \`#2244ee\` | \`--sky\` | primary |
| Ink | \`#334455\` | \`--ink\` | text |
`

describe("preview semantics danger inference (B9)", () => {
  it("does not pick a color whose value failed to parse as the danger slot", () => {
    const result = parseDesignMd(md)
    expect(result.previewSemantics.colors.danger.value).not.toBe(
      UNPARSEABLE_VALUE
    )
  })
})
