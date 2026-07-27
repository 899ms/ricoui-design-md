import { describe, expect, it } from "vitest"
import {
  assistantOutcomeMeetsIntent,
  buildDocumentLineDiff,
  detectAssistantAreas,
  detectAssistantIntent,
  formatRepairConversation,
  getAssistantProposalAction,
  hasDocumentChanges,
  isDocumentRepairEnvelopeError,
  parseDocumentRepairResponse,
  resolveAssistantIntent,
} from "@/lib/ai/document-repair-chat"
import { getDocumentRevision } from "@/lib/document-revision"
import { evaluateDesignDocument } from "@/lib/document-evaluation"

describe("document AI assistant", () => {
  it("parses a checked repair envelope", () => {
    expect(
      parseDocumentRepairResponse(`Preface that should be ignored.
<<<TASK>>>
intent: transform
scope: colors and surfaces
<<<REPLY>>>
Removed the unsupported spacing row.
<<<DESIGN_MD>>>
\`\`\`markdown
# Example — Style Reference
> Example reference.
\`\`\`
<<<END_DESIGN_MD>>>`)
    ).toEqual({
      intent: "transform",
      scope: "colors and surfaces",
      summary: "Removed the unsupported spacing row.",
      markdown: "# Example — Style Reference\n> Example reference.",
    })
  })

  it("rejects a response that cannot be previewed safely", () => {
    try {
      parseDocumentRepairResponse("Here is the updated document")
      throw new Error("expected parser to reject the response")
    } catch (cause) {
      expect(isDocumentRepairEnvelopeError(cause)).toBe(true)
    }
  })

  it("accepts an unchanged source-only Markdown response for explanations", () => {
    expect(
      parseDocumentRepairResponse(`<<<TASK>>>
intent: explain
scope: current source
<<<REPLY>>>
Explained why structured editing is unavailable.
<<<DESIGN_MD>>>
Plain notes without a heading.
<<<END_DESIGN_MD>>>`)
    ).toMatchObject({
      intent: "explain",
      markdown: "Plain notes without a heading.",
    })
  })

  it("builds line-level additions and removals", () => {
    const diff = buildDocumentLineDiff(
      "# Example\n\n- **Gap:** unknown\n",
      "# Example\n\n- **Gap:** 16px\n"
    )

    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(1)
    expect(diff.lines).toEqual(
      expect.arrayContaining([
        { type: "remove", text: "- **Gap:** unknown" },
        { type: "add", text: "- **Gap:** 16px" },
      ])
    )
  })

  it("does not create a revision for an unchanged assistant answer", () => {
    expect(hasDocumentChanges("# Example\r\n", "# Example\n\n")).toBe(false)
    expect(hasDocumentChanges("# Example\n", "# Updated\n")).toBe(true)
  })

  it("allows limited proposals while protecting stale revisions", () => {
    expect(getAssistantProposalAction("blocked", false)).toBe("apply")
    expect(getAssistantProposalAction("ready", true)).toBe("refresh")
    expect(getAssistantProposalAction("warning", false)).toBe("apply")
  })

  it("recognizes natural-language assistant intents", () => {
    expect(detectAssistantIntent("为什么预览还是旧的？")).toBe("explain")
    expect(detectAssistantIntent("修复 Token 导出问题")).toBe("repair")
    expect(detectAssistantIntent("把普通 Markdown 规范化")).toBe("normalize")
    expect(detectAssistantIntent("整体改成黑白编辑风格")).toBe("transform")
    expect(detectAssistantAreas("修改颜色、字体和圆角风格")).toEqual([
      "colors",
      "typography",
      "surfaces",
    ])
  })

  it("treats broad repair of a source-only import as normalization", () => {
    const sourceOnly = evaluateDesignDocument(
      "# Notes\n\nUnstructured token notes."
    )
    expect(resolveAssistantIntent("完善和修复这份文档", sourceOnly)).toBe(
      "normalize"
    )
    expect(resolveAssistantIntent("修复这段文案的错别字", sourceOnly)).toBe(
      "repair"
    )
  })

  it("checks deterministic success criteria for each intent", () => {
    const source = evaluateDesignDocument("# Notes\n\nPlain source.")
    const structured = evaluateDesignDocument(`# Example — Style Reference
> Example.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Primary | #112233 | --color-primary | Action |
`)
    expect(
      assistantOutcomeMeetsIntent({
        intent: "normalize",
        before: source,
        after: structured,
        hasChanges: true,
      })
    ).toBe(true)
    expect(
      assistantOutcomeMeetsIntent({
        intent: "transform",
        before: structured,
        after: structured,
        hasChanges: false,
      })
    ).toBe(false)
    expect(
      assistantOutcomeMeetsIntent({
        intent: "explain",
        before: source,
        after: source,
        hasChanges: false,
      })
    ).toBe(true)
    expect(
      assistantOutcomeMeetsIntent({
        intent: "repair",
        before: source,
        after: evaluateDesignDocument(
          "# Notes\n\nStill source only, but edited."
        ),
        hasChanges: true,
      })
    ).toBe(false)
  })

  it("limits conversation context and revisions change with the source", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message-${index}`,
      createdAt: index,
    }))
    const context = formatRepairConversation(messages)

    expect(context).not.toContain("message-0")
    expect(context).toContain("message-11")
    expect(getDocumentRevision("# A")).not.toBe(getDocumentRevision("# B"))
  })
})
