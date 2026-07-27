import { describe, expect, it } from "vitest"
import { parseDesignMd } from "@/lib/parser/parse-design-md"

function docWithSection(title: string, body: string): string {
  return `# Sample Kit\n\n> Demo\n\n## ${title}\n\n${body}\n`
}

const DOS_DONTS_BODY =
  "### Do\n\n- keep spacing consistent\n\n### Don't\n\n- mix icon styles\n"

describe("H2 section classification (B13)", () => {
  it("'Documentation' is NOT treated as dos/donts", () => {
    const result = parseDesignMd(
      docWithSection("Documentation", "Read the docs online.")
    )
    expect(result.rawSections.dosDonts.dos).toEqual([])
    expect(result.rawSections.dosDonts.donts).toEqual([])
    const section = result.sectionSkeleton.find(
      (block) => block.title === "Documentation"
    )
    expect(section?.kind).toBe("unknown")
  })

  it("'Download' is NOT treated as dos/donts", () => {
    const result = parseDesignMd(
      docWithSection("Download", "Get the assets from the CDN.")
    )
    expect(result.rawSections.dosDonts.dos).toEqual([])
    expect(result.rawSections.dosDonts.donts).toEqual([])
  })

  it("'Layout Guidelines' is classified as layout, not dos/donts", () => {
    const result = parseDesignMd(
      docWithSection("Layout Guidelines", "Use a 12-column grid.")
    )
    expect(result.rawSections.layout).toBe("Use a 12-column grid.")
    expect(result.rawSections.dosDonts.dos).toEqual([])
  })

  it("'Do / Don't' still parses as dos/donts", () => {
    const result = parseDesignMd(docWithSection("Do / Don't", DOS_DONTS_BODY))
    expect(result.rawSections.dosDonts.dos).toEqual(["keep spacing consistent"])
    expect(result.rawSections.dosDonts.donts).toEqual(["mix icon styles"])
  })

  it("'Dos and Don'ts' still parses as dos/donts", () => {
    const result = parseDesignMd(
      docWithSection("Dos and Don'ts", DOS_DONTS_BODY)
    )
    expect(result.rawSections.dosDonts.dos).toEqual(["keep spacing consistent"])
    expect(result.rawSections.dosDonts.donts).toEqual(["mix icon styles"])
  })

  it("'Usage Guidelines' still parses as dos/donts", () => {
    const result = parseDesignMd(
      docWithSection("Usage Guidelines", DOS_DONTS_BODY)
    )
    expect(result.rawSections.dosDonts.dos).toEqual(["keep spacing consistent"])
    expect(result.rawSections.dosDonts.donts).toEqual(["mix icon styles"])
  })
})
