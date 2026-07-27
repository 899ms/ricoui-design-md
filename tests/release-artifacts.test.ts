import { strFromU8, unzipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { buildReleaseArtifactBundle } from "@/lib/export/export-zip"
import { sha256Hex } from "@/lib/export/artifact-hash"
import { parseGolden } from "./golden"

describe("V13 release artifacts", () => {
  it("uses an exact deterministic release allowlist", async () => {
    const { markdown, result } = parseGolden("caldera")
    const first = buildReleaseArtifactBundle(
      result.tokens,
      result.rawSections,
      markdown
    )
    await new Promise((resolve) => setTimeout(resolve, 10))
    const second = buildReleaseArtifactBundle(
      result.tokens,
      result.rawSections,
      markdown
    )
    expect(await sha256Hex(first.zip)).toBe(await sha256Hex(second.zip))
    const files = unzipSync(first.zip)
    expect(Object.keys(files).sort()).toEqual(
      [
        "README.md",
        "caldera-DESIGN.md",
        "caldera-raw-tokens.json",
        "caldera-theme.css",
        "caldera-tokens.json",
        "caldera-variables.css",
      ].sort()
    )
    const readme = strFromU8(files["README.md"])
    expect(readme).toContain("https://design.ricoui.com")
    expect(readme).not.toContain("github.com/ricocc/design-md-editor")
    expect(readme).not.toMatch(/preview\.html/i)
  })
})
