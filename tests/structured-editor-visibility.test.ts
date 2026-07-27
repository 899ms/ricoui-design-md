import { describe, expect, it } from "vitest"
import { rewriteMarkdownSections } from "@/lib/export/export-md"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { getStructuredEditorVisibility } from "@/lib/structured-editor-visibility"

function visibilityFor(markdown: string) {
  const result = parseDesignMd(markdown)
  return {
    result,
    visibility: getStructuredEditorVisibility(result),
  }
}

describe("structured editor visibility", () => {
  it("shows only token panels backed by parsed content", () => {
    const { visibility } = visibilityFor(`# Sparse Theme

## Tokens — Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Primary | #145aff | --color-primary | Action |
`)

    expect(visibility.colors).toBe(true)
    expect(visibility.gradients).toBe(false)
    expect(visibility.fontFamilies).toBe(false)
    expect(visibility.typeScale).toBe(false)
    expect(visibility.radius).toBe(false)
    expect(visibility.shadows).toBe(false)
    expect(visibility.spacing).toBe(false)
    expect(visibility.components).toBe(false)
    expect(visibility.workflows).toEqual(["brand"])
  })

  it("keeps workflow order contiguous when intermediate groups are absent", () => {
    const { visibility } = visibilityFor(`# Type and Components

## Tokens — Typography

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
| --- | --- | --- | --- | --- |
| Body | 16px | 1.5 | 0 | --font-body |

## Components

### Button

- Role: Primary action
`)

    expect(visibility.fontFamilies).toBe(false)
    expect(visibility.typeScale).toBe(true)
    expect(visibility.components).toBe(true)
    expect(visibility.workflows).toEqual(["brand", "typography", "components"])
  })

  it("keeps detected empty prose sections editable without empty previews", () => {
    const { result, visibility } = visibilityFor(`# Guidance Shell

## Layout

## Imagery

## Do's and Don'ts
`)

    expect(visibility.layoutProse).toBe(true)
    expect(visibility.imagery).toBe(true)
    expect(visibility.dosDonts).toBe(true)
    expect(visibility.previewDos).toBe(false)
    expect(visibility.previewDonts).toBe(false)
    expect(visibility.previewImagery).toBe(false)
    expect(visibility.workflows).toEqual(["brand", "layout", "guidelines"])

    result.rawSections.layout = "Use a restrained twelve-column grid."
    const rewritten = rewriteMarkdownSections(
      `# Guidance Shell

## Layout

## Imagery

## Do's and Don'ts
`,
      result,
      ["rawSections.layout"],
      result.tokens,
      result.rawSections
    )

    expect(parseDesignMd(rewritten.markdown).rawSections.layout).toBe(
      "Use a restrained twelve-column grid."
    )
  })
})
