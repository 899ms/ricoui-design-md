import { describe, expect, it } from "vitest"
import { buildHeroCopy } from "@/components/theme-gallery-page/theme-preview-renderer"
import {
  applyLibraryProjectUrl,
  extractProjectUrl,
  setProjectUrlInMarkdown,
} from "@/lib/library/project-url"

const designMd = `# Example

> A reusable product design system.

**Theme:** light

## Tokens — Colors`

describe("Library project URL", () => {
  it("writes a canonical project link into DESIGN.md", () => {
    const markdown = setProjectUrlInMarkdown(
      designMd,
      "https://example.com/product"
    )

    expect(markdown).toContain(
      "**Project URL:** [https://example.com/product](https://example.com/product)"
    )
    expect(extractProjectUrl(markdown)).toBe("https://example.com/product")
  })

  it("updates and removes the project URL without duplicating it", () => {
    const first = setProjectUrlInMarkdown(designMd, "https://example.com/one")
    const updated = setProjectUrlInMarkdown(first, "https://example.com/two")
    const removed = setProjectUrlInMarkdown(updated, "")

    expect(updated.match(/\*\*Project URL:\*\*/g)).toHaveLength(1)
    expect(updated).toContain("https://example.com/two")
    expect(removed).not.toContain("**Project URL:**")
  })

  it("uses the project URL for the preview action", () => {
    const markdown = setProjectUrlInMarkdown(
      designMd,
      "https://example.com/project"
    )
    const hero = buildHeroCopy({
      name: "Example",
      description: "A reusable product design system.",
      mdContent: markdown,
    })

    expect(hero.website).toBe("https://example.com/project")
    expect(hero.linkKind).toBe("project")
    expect(hero.intro).toBeUndefined()
  })

  it("rejects non-HTTP URLs", () => {
    expect(setProjectUrlInMarkdown(designMd, "javascript:alert(1)")).toBe(
      designMd
    )
  })

  it("preserves programmatic saves and applies dialog URL changes", () => {
    expect(applyLibraryProjectUrl(designMd)).toBe(designMd)

    const withUrl = applyLibraryProjectUrl(
      designMd,
      "https://example.com/library"
    )
    expect(extractProjectUrl(withUrl)).toBe("https://example.com/library")
    expect(
      extractProjectUrl(applyLibraryProjectUrl(withUrl, ""))
    ).toBeUndefined()
  })
})
