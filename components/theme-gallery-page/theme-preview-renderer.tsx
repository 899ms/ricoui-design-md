"use client"

import type { CSSProperties, ReactNode } from "react"
import { useEffect, useMemo } from "react"
import { ExternalLink } from "lucide-react"
import { buildDocumentCssVars } from "@/lib/preview/build-css-vars"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { exportToCss } from "@/lib/export/export-css"
import { exportToJson } from "@/lib/export/export-json"
import { slugify } from "@/lib/utils"
import type {
  DesignTokens,
  PreviewSemantics,
  RawSections,
} from "@/lib/types/tokens"
import type { UnifiedThemeEntry } from "./theme-gallery-page"

export interface PreviewHero {
  title: string
  standfirst: string
  intro?: string
  website?: string
  linkKind?: "website" | "project"
  metadata?: string[]
  locale: PreviewLocale
}

export type PreviewLocale = "en" | "zh" | "ja"

export interface PreviewCopy {
  stats: {
    colors: (count: number) => string
    typeScale: (count: number) => string
    spacing: (count: number) => string
    radius: (count: number) => string
    shadows: (count: number) => string
  }
  sections: {
    colors: string
    colorsDescription: string
    gradients: string
    gradientsDescription: string
    typography: string
    typographyDescription: string
    fonts: string
    fontsDescription: string
    spacing: string
    spacingDescription: string
    radius: string
    radiusDescription: string
    shadows: string
    shadowsDescription: string
    guidelines: string
    guidelinesDescription: string
    do: string
    dont: string
  }
  sampleText: string
  visitWebsite: (name: string) => string
  visitProject: (name: string) => string
}

const PREVIEW_COPY: Record<PreviewLocale, PreviewCopy> = {
  en: {
    stats: {
      colors: (count) => `${count} colors`,
      typeScale: (count) => `${count} type steps`,
      spacing: (count) => `${count} spacing steps`,
      radius: (count) => `${count} radii`,
      shadows: (count) => `${count} shadows`,
    },
    sections: {
      colors: "Colors",
      colorsDescription:
        "Color tokens with labels, values, and swatches kept separate for reliable contrast.",
      gradients: "Gradients",
      gradientsDescription: "Gradient tokens shown without overlaid text.",
      typography: "Typography",
      typographyDescription:
        "Standardized type steps rendered with the brand display and body fonts.",
      fonts: "Fonts",
      fontsDescription: "Font families used by this design system.",
      spacing: "Spacing",
      spacingDescription: "Spacing tokens shown as a relative visual scale.",
      radius: "Radii",
      radiusDescription: "Radius tokens shown as corner samples.",
      shadows: "Shadows",
      shadowsDescription: "Shadow tokens shown on neutral surfaces.",
      guidelines: "Usage guidelines",
      guidelinesDescription:
        "Guidance extracted directly from the source document.",
      do: "Do",
      dont: "Don't",
    },
    sampleText: "A design system keeps the brand experience consistent.",
    visitWebsite: (name) => `Visit ${name} website`,
    visitProject: (name) => `Visit ${name} project`,
  },
  zh: {
    stats: {
      colors: (count) => `${count} 个颜色`,
      typeScale: (count) => `${count} 个字阶`,
      spacing: (count) => `${count} 个间距`,
      radius: (count) => `${count} 个圆角`,
      shadows: (count) => `${count} 个阴影`,
    },
    sections: {
      colors: "颜色",
      colorsDescription:
        "颜色 Token 将标签、值与色块分开显示，确保各种配色下都清晰可读。",
      gradients: "渐变",
      gradientsDescription: "渐变 Token 以独立色块展示，不叠加文字。",
      typography: "文字样式",
      typographyDescription: "使用品牌字体展示标准化字阶。",
      fonts: "字体",
      fontsDescription: "此设计系统使用的字体族。",
      spacing: "间距",
      spacingDescription: "按相对尺寸展示间距比例。",
      radius: "圆角",
      radiusDescription: "圆角 Token 以角部样例展示。",
      shadows: "阴影",
      shadowsDescription: "在中性表面上展示阴影 Token。",
      guidelines: "使用指南",
      guidelinesDescription: "直接来自源文档的使用建议。",
      do: "建议",
      dont: "避免",
    },
    sampleText: "设计系统让品牌体验保持一致。",
    visitWebsite: (name) => `访问 ${name} 官网`,
    visitProject: (name) => `访问 ${name} 项目`,
  },
  ja: {
    stats: {
      colors: (count) => `${count}色`,
      typeScale: (count) => `${count}段階の文字サイズ`,
      spacing: (count) => `${count}個の間隔`,
      radius: (count) => `${count}個の角丸`,
      shadows: (count) => `${count}個のシャドウ`,
    },
    sections: {
      colors: "カラー",
      colorsDescription:
        "カラー Token はラベル、値、スウォッチを分けて表示し、どの配色でも読みやすくします。",
      gradients: "グラデーション",
      gradientsDescription:
        "グラデーション Token を独立したスウォッチで表示します。",
      typography: "タイポグラフィ",
      typographyDescription:
        "ブランドフォントで標準化された文字サイズを表示します。",
      fonts: "フォント",
      fontsDescription: "このデザインシステムで使用するフォントファミリー。",
      spacing: "スペース",
      spacingDescription: "相対的なスケールでスペース Token を表示します。",
      radius: "角丸",
      radiusDescription: "角丸 Token をコーナーのサンプルで表示します。",
      shadows: "シャドウ",
      shadowsDescription: "ニュートラルな面にシャドウ Token を表示します。",
      guidelines: "使用ガイドライン",
      guidelinesDescription: "元のドキュメントから抽出したガイドラインです。",
      do: "推奨",
      dont: "避ける",
    },
    sampleText: "デザインシステムはブランド体験の一貫性を保ちます。",
    visitWebsite: (name) => `${name} の公式サイトを見る`,
    visitProject: (name) => `${name} のプロジェクトを見る`,
  },
}

export function getPreviewCopy(locale: PreviewLocale): PreviewCopy {
  return PREVIEW_COPY[locale]
}

export function detectPreviewLocale({
  mdContent,
  description = "",
  website = "",
}: {
  mdContent: string
  description?: string
  website?: string
}): PreviewLocale {
  const explicit = mdContent.match(
    /(?:locale|lang|language)\s*[:=]\s*["']?(en|zh(?:-[a-z]+)?|ja(?:-[a-z]+)?)["']?/i
  )
  if (explicit?.[1]) {
    if (explicit[1].toLowerCase().startsWith("zh")) return "zh"
    if (explicit[1].toLowerCase().startsWith("ja")) return "ja"
    return "en"
  }

  const source = website || mdContent
  if (/(?:^|[./_-])(ja|jp)(?:[./_-]|$)/i.test(source)) return "ja"
  if (/(?:^|[./_-])(zh|cn)(?:[./_-]|$)/i.test(source)) return "zh"

  // Catalog descriptions can be localized independently from the referenced
  // website. Preview copy must follow the source document, not the app UI.
  const content = mdContent || description
  if ((content.match(/[\u3040-\u30ff]/gu) ?? []).length >= 2) return "ja"
  const hanRuns = content.match(/[\u4e00-\u9fff]{3,}/gu) ?? []
  if (hanRuns.some((run) => run.length >= 3)) return "zh"
  return "en"
}

const SYSTEM_FONT_NAMES = [
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "arial",
  "helvetica",
  "georgia",
  "times new roman",
]

const KNOWN_BRAND_WEBSITES: Record<string, string> = {
  caldera: "https://caldera.xyz",
  duolingo: "https://duolingo.com",
  framer: "https://framer.com",
  raycast: "https://raycast.com",
}

export function computeContrast(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? "#0f172a" : "#ffffff"
}

function parseHexColor(color: string) {
  const hex = color.trim()
  if (!/^#([\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex
  const value = normalized.slice(1)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function toHex(value: { r: number; g: number; b: number }) {
  return `#${[value.r, value.g, value.b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`
}

function mixHexColors(source: string, target: string, amount: number) {
  const from = parseHexColor(source)
  const to = parseHexColor(target)
  if (!from || !to) return source

  return toHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  })
}

function relativeLuminance(color: string) {
  const rgb = parseHexColor(color)
  if (!rgb) return null

  const transform = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  return (
    0.2126 * transform(rgb.r) +
    0.7152 * transform(rgb.g) +
    0.0722 * transform(rgb.b)
  )
}

function contrastRatio(foreground: string, background: string) {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  if (l1 === null || l2 === null) return null
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function bestReadableTarget(background: string) {
  const dark = "#0f172a"
  const light = "#ffffff"
  const darkRatio = contrastRatio(dark, background) ?? 0
  const lightRatio = contrastRatio(light, background) ?? 0
  return lightRatio >= darkRatio ? light : dark
}

function ensureContrast(
  color: string,
  background: string,
  minimumRatio: number
) {
  const initial = contrastRatio(color, background)
  if (initial !== null && initial >= minimumRatio) return color

  const target = bestReadableTarget(background)
  for (let step = 0.12; step <= 1; step += 0.08) {
    const candidate = mixHexColors(color, target, step)
    const ratio = contrastRatio(candidate, background)
    if (ratio !== null && ratio >= minimumRatio) {
      return candidate
    }
  }
  return target
}

function ensureSeparation(
  color: string,
  background: string,
  minimumRatio: number
) {
  const initial = contrastRatio(color, background)
  if (initial !== null && initial >= minimumRatio) return color

  const backgroundLuminance = relativeLuminance(background)
  const target =
    backgroundLuminance !== null && backgroundLuminance < 0.45
      ? "#ffffff"
      : "#0f172a"

  for (let step = 0.1; step <= 0.72; step += 0.08) {
    const candidate = mixHexColors(color, target, step)
    const ratio = contrastRatio(candidate, background)
    if (ratio !== null && ratio >= minimumRatio) {
      return candidate
    }
  }
  return mixHexColors(color, target, 0.48)
}

export function normalizePreviewSemantics(
  semantics: PreviewSemantics
): PreviewSemantics {
  const background = semantics.colors.background.value
  const surface = ensureSeparation(
    semantics.colors.surface.value,
    background,
    1.16
  )
  const text = ensureContrast(semantics.colors.text.value, background, 7)
  const muted = ensureContrast(semantics.colors.muted.value, background, 4.5)
  const border = ensureSeparation(semantics.colors.border.value, surface, 1.18)
  const primary = ensureContrast(
    semantics.colors.primary.value,
    background,
    3.2
  )
  const secondary = ensureContrast(
    semantics.colors.secondary.value,
    background,
    3
  )

  const patchButton = <
    T extends PreviewSemantics["canonicalKit"]["buttons"]["primary"],
  >(
    spec: T
  ): T => ({
    ...spec,
    foreground: ensureContrast(spec.foreground, spec.background, 4.5),
    border: ensureSeparation(spec.border, spec.background, 1.12),
  })

  const patchField = <
    T extends PreviewSemantics["canonicalKit"]["fields"]["input"],
  >(
    spec: T
  ): T => ({
    ...spec,
    foreground: ensureContrast(spec.foreground, spec.background, 4.5),
    placeholder: ensureContrast(spec.placeholder, spec.background, 3),
    border: ensureSeparation(spec.border, spec.background, 1.16),
  })

  return {
    ...semantics,
    colors: {
      ...semantics.colors,
      background: { ...semantics.colors.background, value: background },
      surface: { ...semantics.colors.surface, value: surface },
      text: { ...semantics.colors.text, value: text },
      muted: { ...semantics.colors.muted, value: muted },
      border: { ...semantics.colors.border, value: border },
      primary: { ...semantics.colors.primary, value: primary },
      secondary: { ...semantics.colors.secondary, value: secondary },
    },
    canonicalKit: {
      ...semantics.canonicalKit,
      buttons: {
        primary: patchButton(semantics.canonicalKit.buttons.primary),
        secondary: patchButton(semantics.canonicalKit.buttons.secondary),
        ghost: patchButton(semantics.canonicalKit.buttons.ghost),
      },
      fields: {
        input: patchField(semantics.canonicalKit.fields.input),
        textarea: patchField(semantics.canonicalKit.fields.textarea),
        select: patchField(semantics.canonicalKit.fields.select),
      },
      badges: semantics.canonicalKit.badges.map((badge) => ({
        ...badge,
        foreground: ensureContrast(badge.foreground, badge.background, 4.5),
      })),
      alerts: semantics.canonicalKit.alerts.map((alert) => ({
        ...alert,
        foreground: ensureContrast(alert.foreground, alert.background, 4.5),
        border: ensureSeparation(alert.border, alert.background, 1.12),
      })),
      topBar: {
        ...semantics.canonicalKit.topBar,
        background: surface,
        foreground: text,
        border,
      },
      sectionBlock: {
        ...semantics.canonicalKit.sectionBlock,
        background: surface,
        foreground: text,
        border,
      },
      focusRing: ensureContrast(semantics.canonicalKit.focusRing, surface, 2.2),
    },
  }
}

export function buildHeroCopy({
  name,
  description,
  mdContent,
  brandId,
}: {
  name: string
  description: string
  mdContent: string
  brandId?: string
}): PreviewHero {
  const cleanHeroProse = (value: string) =>
    value
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\s*\(\{[^}]+\}\)/g, "")
      .replace(/\{[^}]+\}/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim()

  const title = cleanHeroProse(name)
  const cleanDescription = cleanHeroProse(description)
  const standfirst =
    cleanDescription
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .find(Boolean) ?? cleanDescription

  const withoutFrontmatter = mdContent.replace(/^---[\s\S]*?---\s*/m, "")
  const paragraphs = withoutFrontmatter
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter(
      (block) =>
        !block.startsWith("#") &&
        !block.startsWith(">") &&
        !block.startsWith("|") &&
        !block.startsWith("- ") &&
        !block.startsWith("**Theme:**") &&
        !/^\*\*Project URL:\*\*/i.test(block) &&
        !/^\*\*Source website:\*\*/i.test(block) &&
        !/^Source website:/i.test(block) &&
        !/^Use the live official website\b/i.test(block) &&
        !/^Use the documented spacing scale\b/i.test(block) &&
        !/^##?\s/.test(block) &&
        !/^Source pages:/i.test(block)
    )
    .map(cleanHeroProse)
    .filter(Boolean)

  const intro =
    paragraphs.find((block) => block.length > 140) ||
    paragraphs.find((block) => block.length > 80)

  const sourcePagesMatch = mdContent.match(
    /Source pages:\s*([a-z0-9.-]+\.[a-z]{2,})(?:\s|\(|,|$)/i
  )
  const sourceWebsiteMatch = mdContent.match(
    /\*\*Source website:\*\*[\s\S]*?\((https?:\/\/[^)\s]+)\)/i
  )
  const projectUrlMatch = mdContent.match(
    /\*\*Project URL:\*\*\s*(?:\[[^\]]*\]\()?((?:https?:\/\/)[^)\s]+)\)?/i
  )
  const sourceDomain = sourcePagesMatch?.[1]?.replace(/[.)銆?]+$/, "")
  const website =
    (brandId ? KNOWN_BRAND_WEBSITES[brandId] : undefined) ||
    projectUrlMatch?.[1] ||
    sourceWebsiteMatch?.[1] ||
    (sourceDomain ? `https://${sourceDomain}` : undefined)
  const locale = detectPreviewLocale({ mdContent, description, website })

  return {
    title,
    standfirst,
    intro,
    website,
    linkKind: projectUrlMatch ? "project" : "website",
    locale,
  }
}

export function useThemePreviewData(
  entry: UnifiedThemeEntry | null,
  options?: { loadFonts?: boolean }
) {
  const parsed = useMemo(() => {
    if (!entry) return null
    try {
      return parseDesignMd(entry.mdContent)
    } catch {
      return null
    }
  }, [entry])

  const previewSemantics = useMemo(
    () => (parsed ? normalizePreviewSemantics(parsed.previewSemantics) : null),
    [parsed]
  )

  const cssVars = useMemo<CSSProperties | null>(() => {
    if (!parsed || !previewSemantics) return null
    const base = buildDocumentCssVars({
      tokens: parsed.tokens,
      previewSemantics,
    })
    return base as CSSProperties
  }, [parsed, previewSemantics])

  useEffect(() => {
    if (!parsed || !options?.loadFonts) return
    const links: HTMLLinkElement[] = []
    for (const font of parsed.tokens.typography.fontFamilies) {
      const name = font.substitute || font.name
      const isSystem = SYSTEM_FONT_NAMES.some((sys) =>
        name.toLowerCase().includes(sys)
      )
      if (isSystem) continue
      const weights =
        font.weights.length > 0 ? font.weights.join(";") : "400;700"
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        name
      )}:wght@${weights}&display=swap`
      if (document.querySelector(`link[href="${href}"]`)) continue
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = href
      link.dataset.designMdThemePreviewFont = "true"
      document.head.appendChild(link)
      links.push(link)
    }
    return () => {
      for (const link of links) link.remove()
    }
  }, [parsed, options?.loadFonts])

  const prefix = parsed
    ? slugify(parsed.tokens.meta.name || entry?.name || "theme")
    : "theme"

  return {
    parsed,
    previewSemantics,
    cssVars,
    mdSource: entry?.mdContent ?? "",
    jsonSource: parsed ? exportToJson(parsed.tokens) : "",
    cssSource: parsed ? exportToCss(parsed.tokens) : "",
    prefix,
  }
}

function PreviewSection({
  title,
  description,
  children,
}: {
  index?: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-border/70 py-14 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mb-8">
        <h2 className="text-[24px] font-bold tracking-[-0.005em] text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function TokenCard({
  swatch,
  title,
  value,
  caption,
}: {
  swatch: ReactNode
  title: string
  value: string
  caption?: string
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
      <div
        className="border-b border-border"
        role="img"
        aria-label={`${title}: ${value}`}
      >
        {swatch}
      </div>
      <div className="space-y-1 px-3.5 py-3">
        <p className="text-[14px] font-medium tracking-[-0.005em] text-card-foreground">
          {title}
        </p>
        <p className="font-mono text-[12px] text-muted-foreground">{value}</p>
        {caption && (
          <p className="pt-0.5 text-[12px] leading-5 text-muted-foreground">
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}

function TypeRow({
  role,
  sample,
  meta,
  style,
}: {
  role: string
  sample: string
  meta: string
  style: CSSProperties
}) {
  return (
    <div className="grid gap-3 border-t border-border/70 py-5 first:border-t-0 md:grid-cols-[110px_1fr_200px] md:items-baseline">
      <div className="text-[12px] font-medium text-muted-foreground">
        {role}
      </div>
      <div className="min-w-0 text-foreground" style={style}>
        {sample}
      </div>
      <div className="font-mono text-[12px] text-muted-foreground md:justify-self-end md:text-right">
        {meta}
      </div>
    </div>
  )
}

function extractGuidelines(rawSections: RawSections) {
  return {
    dos: rawSections.dosDonts?.dos ?? [],
    donts: rawSections.dosDonts?.donts ?? [],
  }
}

function tokenKey(...parts: Array<string | number | undefined>) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : part))
    .filter((part) => part !== "" && part !== undefined)
    .join("-")
}

export function ThemePreviewDocument({
  tokens,
  rawSections,
  parsedName,
  previewSemantics,
  cssVars,
  hero,
  heroLogo,
  heroMedia,
  className,
}: {
  tokens: DesignTokens
  rawSections: RawSections
  parsedName: string
  previewSemantics: PreviewSemantics
  cssVars: CSSProperties
  hero: PreviewHero
  heroLogo?: ReactNode
  heroMedia?: ReactNode
  className?: string
}) {
  const guidelines = extractGuidelines(rawSections)
  const hasGuidelines = guidelines.dos.length > 0 || guidelines.donts.length > 0
  const displayFont = previewSemantics.typography.displayFont.value
  const bodyFont = previewSemantics.typography.bodyFont.value
  const copy = getPreviewCopy(hero.locale)

  const heroStats = [
    tokens.colors.length > 0 ? copy.stats.colors(tokens.colors.length) : null,
    tokens.typography.typeScale.length > 0
      ? copy.stats.typeScale(tokens.typography.typeScale.length)
      : null,
    tokens.spacing.length > 0
      ? copy.stats.spacing(tokens.spacing.length)
      : null,
    tokens.radius.length > 0 ? copy.stats.radius(tokens.radius.length) : null,
    tokens.shadows.length > 0
      ? copy.stats.shadows(tokens.shadows.length)
      : null,
  ].filter((item): item is string => Boolean(item))

  return (
    <div
      className={[
        "relative rounded-md border border-border bg-background text-foreground",
        className ?? "px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16",
      ].join(" ")}
      style={
        {
          ...cssVars,
          fontFamily: bodyFont,
        } as CSSProperties
      }
    >
      <div className="relative mx-auto max-w-[920px]">
        <header className="pb-12">
          <div className="flex items-center gap-4">
            {heroLogo}
            <h1
              className="text-[44px] leading-[1.05] font-semibold tracking-[-0.035em] text-foreground sm:text-[56px]"
              style={{ fontFamily: displayFont }}
            >
              {parsedName || hero.title}
            </h1>
          </div>
          <p className="mt-6 max-w-2xl text-[16px] leading-7 text-muted-foreground">
            {hero.standfirst}
          </p>
          {/* {hero.intro && hero.intro !== hero.standfirst && (
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted-foreground">
              {hero.intro}
            </p>
          )} */}

          {hero.metadata && hero.metadata.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] leading-5 text-muted-foreground/70">
              {hero.metadata.map((item, index) => (
                <span key={item} className="inline-flex items-center gap-2.5">
                  {index > 0 && (
                    <span className="size-0.5 rounded-full bg-muted-foreground/35" />
                  )}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}

          {hero.website && (
            <a
              href={hero.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-card-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
            >
              {hero.linkKind === "project"
                ? copy.visitProject(hero.title)
                : copy.visitWebsite(hero.title)}
              <ExternalLink className="size-3.5" />
            </a>
          )}

          {heroMedia && <div className="mt-8">{heroMedia}</div>}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
            {heroStats.map((item, index) => (
              <span key={item} className="flex items-center gap-x-5">
                {index > 0 && (
                  <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/45" />
                )}
                <span>{item}</span>
              </span>
            ))}
          </div>
        </header>

        {tokens.colors.length > 0 && (
          <PreviewSection
            title={copy.sections.colors}
            description={copy.sections.colorsDescription}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tokens.colors.map((color, index) => (
                <TokenCard
                  key={tokenKey(color.token, color.name, color.value, index)}
                  swatch={
                    <div style={{ backgroundColor: color.value, height: 96 }} />
                  }
                  title={color.name}
                  value={color.value}
                  caption={color.role}
                />
              ))}
            </div>
          </PreviewSection>
        )}

        {tokens.gradients.length > 0 && (
          <PreviewSection
            title={copy.sections.gradients}
            description={copy.sections.gradientsDescription}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {tokens.gradients.map((gradient, index) => (
                <TokenCard
                  key={tokenKey(
                    gradient.token,
                    gradient.name,
                    gradient.value,
                    index
                  )}
                  swatch={
                    <div style={{ background: gradient.value, height: 128 }} />
                  }
                  title={gradient.name}
                  value={gradient.token}
                  caption={gradient.role}
                />
              ))}
            </div>
          </PreviewSection>
        )}

        {tokens.typography.typeScale.length > 0 && (
          <PreviewSection
            title={copy.sections.typography}
            description={copy.sections.typographyDescription}
          >
            <div>
              {tokens.typography.typeScale.map((step, index) => (
                <TypeRow
                  key={tokenKey(step.token, step.role, step.size, index)}
                  role={step.role}
                  sample={copy.sampleText}
                  meta={`${step.size} / ${step.lineHeight}${step.letterSpacing && step.letterSpacing !== "0" ? ` / ${step.letterSpacing}` : ""}`}
                  style={{
                    fontFamily: displayFont,
                    fontSize: step.size,
                    lineHeight: step.lineHeight,
                    letterSpacing: step.letterSpacing,
                  }}
                />
              ))}
            </div>
          </PreviewSection>
        )}

        {tokens.typography.fontFamilies.length > 0 && (
          <PreviewSection
            title={copy.sections.fonts}
            description={copy.sections.fontsDescription}
          >
            <div>
              {tokens.typography.fontFamilies.map((font, index) => (
                <div
                  key={tokenKey(font.token, font.name, font.substitute, index)}
                  className="grid gap-3 border-t border-border/70 py-5 first:border-t-0 md:grid-cols-[180px_1fr_120px] md:items-baseline"
                >
                  <div className="text-[14px] font-medium text-foreground">
                    {font.name}
                  </div>
                  <div className="text-[12px] leading-6 text-muted-foreground">
                    {font.substitute}
                    {font.role ? ` · ${font.role}` : ""}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground md:text-right">
                    {font.weights.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {tokens.spacing.length > 0 &&
          (() => {
            const maxSpacing = Math.max(
              ...tokens.spacing.map((space) => parseInt(space.value, 10) || 0),
              1
            )
            return (
              <PreviewSection
                title={copy.sections.spacing}
                description={copy.sections.spacingDescription}
              >
                <div>
                  {tokens.spacing.map((space, index) => {
                    const numeric = parseInt(space.value, 10) || 0
                    const size = Math.max(
                      Math.min((numeric / maxSpacing) * 40, 40),
                      2
                    )
                    return (
                      <div
                        key={tokenKey(
                          space.token,
                          space.name,
                          space.value,
                          index
                        )}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-6 border-t border-border/70 py-3 first:border-t-0"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted/55">
                          <div
                            className="rounded-[2px] bg-muted-foreground/65"
                            style={{ width: size, height: size }}
                          />
                        </div>
                        <div className="text-[14px] font-medium text-foreground">
                          {space.name}
                        </div>
                        <div className="font-mono text-[12px] text-muted-foreground tabular-nums">
                          {space.value}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PreviewSection>
            )
          })()}

        {tokens.radius.length > 0 && (
          <PreviewSection
            title={copy.sections.radius}
            description={copy.sections.radiusDescription}
          >
            <div>
              {tokens.radius.map((radius, index) => (
                <div
                  key={tokenKey(radius.token, radius.name, radius.value, index)}
                  className="grid grid-cols-[56px_1fr_auto] items-center gap-6 border-t border-border/70 py-3 first:border-t-0"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-muted/55">
                    <div
                      className="absolute top-0 left-0 h-20 w-20 border-t border-l border-muted-foreground/65"
                      style={{ borderTopLeftRadius: radius.value }}
                    />
                  </div>
                  <div className="text-[14px] font-medium text-foreground">
                    {radius.name}
                  </div>
                  <div className="font-mono text-[12px] text-muted-foreground tabular-nums">
                    {radius.value}
                  </div>
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {tokens.shadows.length > 0 && (
          <PreviewSection
            title={copy.sections.shadows}
            description={copy.sections.shadowsDescription}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tokens.shadows.map((shadow, index) => (
                <TokenCard
                  key={tokenKey(shadow.token, shadow.name, shadow.value, index)}
                  swatch={
                    <div className="grid h-[120px] place-items-center bg-muted/55">
                      <div
                        className="h-[64px] w-[140px] rounded-md bg-card"
                        style={{ boxShadow: shadow.value }}
                      />
                    </div>
                  }
                  title={shadow.name}
                  value={shadow.token}
                  caption={shadow.value}
                />
              ))}
            </div>
          </PreviewSection>
        )}

        {hasGuidelines && (
          <PreviewSection
            title={copy.sections.guidelines}
            description={copy.sections.guidelinesDescription}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {guidelines.dos.length > 0 && (
                <div className="rounded-md border border-emerald-500/25 bg-emerald-500/8 p-5">
                  <h3 className="text-[11px] font-semibold tracking-[0.1em] text-emerald-700 uppercase dark:text-emerald-300">
                    {copy.sections.do}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-[14px] leading-6 text-foreground/85">
                    {guidelines.dos.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2.5">
                        <span
                          aria-hidden
                          className="mt-[7px] inline-block h-1.5 w-1.5 flex-none rounded-full bg-emerald-500/80"
                        />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {guidelines.donts.length > 0 && (
                <div className="rounded-md border border-rose-500/25 bg-rose-500/8 p-5">
                  <h3 className="text-[11px] font-semibold tracking-[0.1em] text-rose-700 uppercase dark:text-rose-300">
                    {copy.sections.dont}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-[14px] leading-6 text-foreground/85">
                    {guidelines.donts.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2.5">
                        <span
                          aria-hidden
                          className="mt-[7px] inline-block h-1.5 w-1.5 flex-none rounded-full bg-rose-500/80"
                        />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </PreviewSection>
        )}
      </div>
    </div>
  )
}
