import { describe, expect, it } from "vitest"
import { normalizeLineEndings } from "@/lib/utils"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { expectSkeletonOffsetsValid, loadGoldenBrandMd } from "./golden"

describe("normalizeLineEndings", () => {
  it("converts CRLF to LF", () => {
    expect(normalizeLineEndings("a\r\nb\r\nc")).toBe("a\nb\nc")
  })

  it("converts bare CR to LF", () => {
    expect(normalizeLineEndings("a\rb")).toBe("a\nb")
  })

  it("handles mixed endings", () => {
    expect(normalizeLineEndings("a\r\nb\rc\nd")).toBe("a\nb\nc\nd")
  })

  it("leaves LF-only text untouched", () => {
    const text = "# Title\n\nBody\n"
    expect(normalizeLineEndings(text)).toBe(text)
  })
})

describe("CRLF ingestion (B1)", () => {
  it("a CRLF upload, once normalized, keeps skeleton offsets valid", () => {
    const lfMarkdown = loadGoldenBrandMd("duolingo")
    const crlfMarkdown = lfMarkdown.replace(/\n/g, "\r\n")

    const normalized = normalizeLineEndings(crlfMarkdown)
    expect(normalized).toBe(lfMarkdown)

    const result = parseDesignMd(normalized)
    expectSkeletonOffsetsValid(normalized, result)
  })
})
