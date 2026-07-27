import { describe, expect, it } from "vitest"
import {
  buildHeroCopy,
  detectPreviewLocale,
  getPreviewCopy,
} from "@/components/theme-gallery-page/theme-preview-renderer"

const appleReference = `# Apple — Style Reference
> Apple design reference.

**Theme:** light

**Source website:** [https://www.apple.com/](https://www.apple.com/)
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

Apple uses deliberate typography, restrained color, and careful layout rhythm across product marketing pages.`

describe("brand preview hero source attribution", () => {
  it("extracts an official website without treating attribution as preview prose", () => {
    const hero = buildHeroCopy({
      name: "Apple",
      description: "Apple design reference.",
      mdContent: appleReference,
      brandId: "apple",
    })

    expect(hero.website).toBe("https://www.apple.com/")
    expect(hero.intro).toContain("Apple uses deliberate typography")
    expect(hero.intro).not.toContain("Source website")
    expect(hero.intro).not.toContain("Use the live official website")
    expect(hero.locale).toBe("en")
  })

  it("prefers an existing canonical mapping", () => {
    const hero = buildHeroCopy({
      name: "Framer",
      description: "Framer design reference.",
      mdContent:
        "**Source website:** [https://example.com](https://example.com)",
      brandId: "framer",
    })

    expect(hero.website).toBe("https://framer.com")
  })

  it("removes token references and generic implementation copy from the hero", () => {
    const hero = buildHeroCopy({
      name: "**Notion**",
      description:
        "Notion uses a deep navy hero ({colors.brand-navy}) with a purple CTA ({colors.primary}). A flexible workspace system.",
      mdContent: `# Notion

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition against [the live source](https://www.notion.com/).`,
      brandId: "notion",
    })

    expect(hero.title).toBe("Notion")
    expect(hero.standfirst).toBe(
      "Notion uses a deep navy hero with a purple CTA."
    )
    expect(hero.intro).toBeUndefined()
  })

  it("uses Chinese and Japanese only when the source language is clear", () => {
    expect(
      detectPreviewLocale({
        mdContent: "# 设计规范\n这是一个中文设计系统。",
        description: "中文品牌",
      })
    ).toBe("zh")

    expect(
      detectPreviewLocale({
        mdContent: "# デザインシステム\n日本語のガイドラインです。",
        description: "日本語ブランド",
      })
    ).toBe("ja")

    expect(
      detectPreviewLocale({
        mdContent: "# Product style reference",
        website: "https://example.jp/",
      })
    ).toBe("ja")

    expect(
      detectPreviewLocale({
        mdContent: "# Product style reference\nA clear English system.",
        description: "An English brand",
      })
    ).toBe("en")

    expect(
      detectPreviewLocale({
        mdContent: "# Product style reference\nA clear English system.",
        description: "这是本地目录使用的中文说明。",
      })
    ).toBe("en")
  })

  it("keeps the English preview copy as the default", () => {
    const copy = getPreviewCopy("en")
    expect(copy.stats.colors(23)).toBe("23 colors")
    expect(copy.stats.typeScale(18)).toBe("18 type steps")
    expect(copy.sampleText).toBe(
      "A design system keeps the brand experience consistent."
    )
    expect(copy.sections.do).toBe("Do")
    expect(copy.sections.dont).toBe("Don't")
  })
})
