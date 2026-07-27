import { describe, expect, it } from "vitest"
import {
  getLibraryCardCapabilityBadge,
  getMarkdownDocumentCapability,
} from "@/lib/document-capability"

const completeDesignDocument = `# Example — Style Reference
> A compact but exportable design system.

**Theme:** light

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Primary | #112233 | --color-primary | Brand action |
`

const partialDesignDocument = `# Example — Style Reference
> A structured design document without exportable tokens yet.

## Components

### Button
**Role:** Primary action

Use one clear label.
`

describe("Markdown document capabilities", () => {
  it("accepts regular Markdown as source-only library content", () => {
    expect(
      getMarkdownDocumentCapability(
        "# Meeting notes\n\nDecisions and references are kept here."
      )
    ).toMatchObject({
      level: "markdown-only",
      canSaveToLibrary: true,
      canStructuredEdit: false,
      canPreview: false,
      canDerive: false,
    })
  })

  it("recognizes structured content while withholding invalid derivatives", () => {
    expect(getMarkdownDocumentCapability(partialDesignDocument)).toMatchObject({
      level: "partial",
      canSaveToLibrary: true,
      canStructuredEdit: true,
      canPreview: true,
      canDerive: false,
    })
  })

  it("enables every capability only for export-ready design documents", () => {
    expect(getMarkdownDocumentCapability(completeDesignDocument)).toMatchObject(
      {
        level: "full",
        canSaveToLibrary: true,
        canStructuredEdit: true,
        canPreview: true,
        canDerive: true,
      }
    )
  })

  it("does not save an empty source", () => {
    expect(getMarkdownDocumentCapability(" \n ")).toMatchObject({
      level: "markdown-only",
      canSaveToLibrary: false,
      canStructuredEdit: false,
      canPreview: false,
      canDerive: false,
    })
  })
})

describe("Library card capability badges", () => {
  it("labels source-only entries but not preview-ready or complete entries", () => {
    expect(getLibraryCardCapabilityBadge("markdown-only")).toBe("markdown-only")
    expect(getLibraryCardCapabilityBadge("partial")).toBeNull()
    expect(getLibraryCardCapabilityBadge("full")).toBeNull()
  })
})
