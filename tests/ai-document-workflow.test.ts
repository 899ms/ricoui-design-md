import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { buildAnalyzePrompt } from "@/lib/ai/prompts"
import { parseAiDocumentAnalysis } from "@/lib/ai/document-analysis"
import { exportToCss, exportToTailwindTheme } from "@/lib/export/export-css"
import { exportToJson } from "@/lib/export/export-json"
import { parseDesignMd } from "@/lib/parser/parse-design-md"

describe("optional AI document workflow", () => {
  it("asks for a concrete, evidence-based audit without rewriting the source", () => {
    const source = "# Personal notes\n\nOnly the details I need."
    const prompt = buildAnalyzePrompt(source, "zh-CN")

    expect(prompt).toContain(source)
    // JSON-only output means the source is never rewritten as Markdown.
    expect(prompt).toContain("valid JSON only")
    expect(prompt).toContain("Output ONLY the JSON object")
    // The audit must be concrete and evidence-based, not a neutral paraphrase.
    expect(prompt).toContain("concrete")
    expect(prompt).toContain("evidence-based")
    // Grounded in the canonical structure so it can surface real gaps.
    expect(prompt).toContain("canonical structure")
    // An explicit Chinese interface locale keeps human-readable output Chinese.
    expect(prompt).toContain("Simplified Chinese")
    expect(prompt).toContain("Do not answer in English")
    // Author decisions must contain options that the UI can actually confirm.
    expect(prompt).toContain('"options"')
    expect(prompt).toContain('"recommendation"')
  })

  it("accepts fenced analysis JSON while ignoring unsupported mappings", () => {
    const result = parseAiDocumentAnalysis(`Result:\n\`\`\`json
      {"summary":"颜色与排版说明","observations":[{"title":"颜色","detail":"识别到品牌色"}],"suggestions":[],"exportMappings":[{"format":"theme.css","detail":"映射颜色变量"},{"format":"unknown.css","detail":"忽略"}],"confirmations":[]}
    \`\`\``)

    expect(result.summary).toBe("颜色与排版说明")
    expect(result.observations).toHaveLength(1)
    expect(result.exportMappings).toEqual([
      { format: "theme.css", detail: "映射颜色变量" },
    ])
  })

  it("parses actionable author decisions and keeps legacy questions readable", () => {
    const result = parseAiDocumentAnalysis(
      JSON.stringify({
        summary: "结构基本完整",
        observations: [],
        suggestions: [],
        exportMappings: [],
        confirmations: [
          {
            id: "color-aliases",
            question: "语义色别名是否继续保留？",
            options: ["保留语义别名", "只保留基础色阶"],
            recommendation: "保留语义别名",
            reason: "组件调用更稳定。",
          },
          "是否补充暗色主题？",
        ],
      })
    )

    expect(result.confirmations).toEqual([
      {
        id: "color-aliases",
        question: "语义色别名是否继续保留？",
        options: ["保留语义别名", "只保留基础色阶"],
        recommendation: "保留语义别名",
        reason: "组件调用更稳定。",
      },
      {
        id: "decision-2",
        question: "是否补充暗色主题？",
        options: [],
      },
    ])
  })
})

describe("Caldera rule exports", () => {
  it("uses one parsed token model for JSON, CSS and Tailwind theme", async () => {
    const markdown = await readFile(
      new URL("../public/brands/caldera/DESIGN.md", import.meta.url),
      "utf8"
    )
    const { tokens } = parseDesignMd(markdown)
    const variables = exportToCss(tokens)
    const theme = exportToTailwindTheme(tokens)
    const json = exportToJson(tokens)

    expect(tokens.radius).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "cards", value: "40px" }),
        expect.objectContaining({ name: "inputs", value: "100px" }),
      ])
    )
    expect(tokens.layout.maxContentWidth).toBe("1200px")
    expect(variables).toContain("--radius-cards: 40px")
    expect(variables).toContain("--layout-max-width: 1200px")
    expect(theme).toContain("--radius-cards: 40px")
    expect(theme).toContain("--text-body-sm: 14px")
    expect(json).toContain('"$value": "40px"')
    expect(variables).not.toMatch(/:\s*[—–-]\s*;/)
    expect(theme).not.toMatch(/:\s*[—–-]\s*;/)
  })
})
