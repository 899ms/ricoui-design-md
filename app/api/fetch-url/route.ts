import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import type {
  UrlSourceMetadata,
  UrlSourcePackage,
} from "@/lib/types/url-generation"

export const maxDuration = 60
const MAX_REQUEST_BYTES = 16 * 1024
// Raw HTML is streamed and truncated at this cap rather than rejected: modern
// sites ship 1-2 MB of HTML that is mostly inline <script> payloads we strip
// away anyway, so rejecting on raw size (the old 512 KB limit) blocked almost
// every real website. Bounds server memory.
const MAX_DOWNLOAD_BYTES = 4 * 1024 * 1024
// Extracted, script-stripped text sent to the client/AI. Real landing-page
// text is 5-50 KB; this cap keeps even all-CJK worst cases under the AI proxy's
// 256 KB body limit and inside provider context windows.
const MAX_TEXT_CHARS = 60_000
const MAX_PUBLISHED_DESIGN_BYTES = 128 * 1024
const MAX_PUBLISHED_DESIGN_CHARS = 80_000
const SOURCE_DISCOVERY_TIMEOUT_MS = 6_000
// CSS evidence: linked stylesheets fetched per page (document order), the raw
// download cap per sheet, and the size of the distilled evidence block. The
// evidence is deterministic design-token signal (custom properties, fonts,
// colors) so the AI stops inventing values for unknown sites.
const MAX_STYLESHEETS = 6
const MAX_STYLESHEET_BYTES = 1024 * 1024
const MAX_CSS_EVIDENCE_CHARS = 32_000
const MAX_CSS_SIGNAL_CHARS = 1000

function isPrivate(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    )
  }
  const value = address.toLowerCase()
  return (
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb")
  )
}

async function validateUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  if (url.protocol !== "https:") throw new Error("只允许抓取 HTTPS URL")
  if (url.username || url.password) throw new Error("URL 不允许携带凭据")
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".local") ||
    url.hostname === "169.254.169.254"
  )
    throw new Error("禁止访问本地网络地址")
  const addresses = await lookup(url.hostname, { all: true, verbatim: true })
  if (addresses.some((entry) => isPrivate(entry.address)))
    throw new Error("目标地址解析到了私有网络")
  return url.toString()
}

function isSupportedContentType(contentType: string | null) {
  if (!contentType) return true
  const value = contentType.toLowerCase()
  return (
    value.startsWith("text/html") ||
    value.startsWith("text/plain") ||
    value.startsWith("text/markdown") ||
    value.startsWith("application/markdown") ||
    value.startsWith("application/xhtml+xml")
  )
}

function isMarkdownContentType(contentType: string | null) {
  if (!contentType) return false
  const value = contentType.toLowerCase()
  return (
    value.startsWith("text/markdown") ||
    value.startsWith("application/markdown")
  )
}

function looksLikeMarkdownUrl(url: string) {
  try {
    return /\.(?:md|markdown)$/i.test(new URL(url).pathname)
  } catch {
    return false
  }
}

function looksLikeDesignMd(markdown: string) {
  const value = markdown.trim()
  if (value.length < 80 || /<(?:html|body|script)\b/i.test(value)) return false
  const hasFrontmatter =
    /^---\s*$/m.test(value) &&
    /^(?:name|description|colors|typography|components):/im.test(value)
  const hasDesignSections =
    /^#\s+\S+/m.test(value) &&
    /^(?:#{2,3}\s+.*(?:colors|typography|tokens|components)|\*\*Theme:\*\*)/im.test(
      value
    )
  return hasFrontmatter || hasDesignSections
}

async function readBodyWithCap(response: Response, cap: number) {
  const reader = response.body?.getReader()
  if (!reader) return { bytes: new Uint8Array(0), truncated: false }
  const chunks: Uint8Array[] = []
  let received = 0
  let truncated = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    if (received >= cap) {
      truncated = true
      await reader.cancel().catch(() => {})
      break
    }
  }
  const bytes = new Uint8Array(Math.min(received, cap))
  let offset = 0
  for (const chunk of chunks) {
    const remaining = bytes.byteLength - offset
    if (remaining <= 0) break
    bytes.set(
      remaining < chunk.byteLength ? chunk.subarray(0, remaining) : chunk,
      offset
    )
    offset += Math.min(chunk.byteLength, remaining)
  }
  return { bytes, truncated }
}

const FRAMEWORK_INTERNAL_PROPERTY =
  /^--(?:tw|un|uno|windicss|webpack|next|radix)-/i
const GENERIC_INTERNAL_PROPERTY = /^--(?:value|index|progress|position)$/i

function normalizeCssSignal(raw: string) {
  return raw
    .replace(/^[;{]\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/^([^:]+):\s*/, "$1: ")
    .trim()
}

function addCssSignals(
  target: Set<string>,
  css: string,
  pattern: RegExp,
  limit: number,
  filter?: (signal: string) => boolean
) {
  const matches = css.match(pattern)
  if (!matches) return
  for (const raw of matches) {
    const signal = normalizeCssSignal(raw)
    if (
      !signal ||
      signal.length > MAX_CSS_SIGNAL_CHARS ||
      /--tw-/i.test(signal) ||
      (filter && !filter(signal))
    ) {
      continue
    }
    target.add(signal)
    if (target.size >= limit) break
  }
}

function collectPrioritizedCustomProperties(css: string) {
  const matches = css.match(/--[\w-]+\s*:\s*[^;{}]+/g) ?? []
  const candidates = new Map<string, number>()
  for (const raw of matches) {
    const signal = normalizeCssSignal(raw)
    if (!signal || signal.length > MAX_CSS_SIGNAL_CHARS) continue
    const name = signal.split(":", 1)[0]
    const value = signal.slice(signal.indexOf(":") + 1).trim()
    if (
      FRAMEWORK_INTERNAL_PROPERTY.test(name) ||
      GENERIC_INTERNAL_PROPERTY.test(name) ||
      /^(?:initial|inherit|unset)$/i.test(value)
    ) {
      continue
    }
    let score = 0
    if (
      /(?:color|background|surface|canvas|foreground|accent|primary|secondary|neutral|gray|blue|red|green|amber|purple|pink|ink|border)/i.test(
        name
      )
    ) {
      score += 8
    }
    if (/(?:font|text|type|leading|tracking|weight)/i.test(name)) score += 7
    if (/(?:space|spacing|gap|radius|rounded|shadow|container|width)/i.test(name)) {
      score += 6
    }
    if (/#[0-9a-f]{3,8}\b|(?:rgb|hsl|oklch|color|linear-gradient)\(/i.test(value)) {
      score += 4
    }
    if (/^-?\d*\.?\d+(?:px|rem|em|ch|vw|vh|%)\b/i.test(value)) score += 2
    if (/(?:animation|duration|delay|ease|transform|translate|rotate)/i.test(name)) {
      score -= 5
    }
    candidates.set(signal, Math.max(score, candidates.get(signal) ?? -Infinity))
  }
  return new Set(
    [...candidates.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 180)
      .map(([signal]) => signal)
  )
}

// Pull a balanced, compact source package out of CSS. Categories are collected
// independently so framework reset variables cannot consume the whole budget
// before fonts, colors, type, radii, and component spacing reach the model.
function distillCssEvidence(css: string) {
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/@import[^;]+;/gi, " ")
  const customProperties = collectPrioritizedCustomProperties(stripped)
  const fonts = new Set<string>()
  const colors = new Set<string>()
  const typography = new Set<string>()
  const shapes = new Set<string>()
  const layout = new Set<string>()

  addCssSignals(fonts, stripped, /@font-face\s*\{[^}]*\}/gi, 24)
  addCssSignals(
    fonts,
    stripped,
    /font-family\s*:\s*[^;{}]+/gi,
    72
  )
  addCssSignals(
    colors,
    stripped,
    /(?:^|[;{])\s*(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*[^;{}]+/gi,
    120
  )
  addCssSignals(
    typography,
    stripped,
    /(?:font-size|font-weight|line-height|letter-spacing|font-feature-settings|font-variation-settings)\s*:\s*[^;{}]+/gi,
    120
  )
  addCssSignals(
    shapes,
    stripped,
    /(?:border-radius|box-shadow)\s*:\s*[^;{}]+/gi,
    100
  )
  addCssSignals(
    layout,
    stripped,
    /(?:^|[;{])\s*(?:gap|row-gap|column-gap|padding(?:-(?:top|right|bottom|left|inline|block))?|margin(?:-(?:top|right|bottom|left|inline|block))?|width|max-width|min-width)\s*:\s*[^;{}]+/gi,
    120
  )

  const sections = [
    ["Custom properties", customProperties],
    ["Fonts", fonts],
    ["Colors and surfaces", colors],
    ["Typography", typography],
    ["Radii and shadows", shapes],
    ["Spacing and layout", layout],
  ] as const

  return sections
    .filter(([, signals]) => signals.size > 0)
    .map(([label, signals]) => `# ${label}\n${[...signals].join("\n")}`)
    .join("\n\n")
}

function capEvidenceAtLineBoundary(evidence: string) {
  if (evidence.length <= MAX_CSS_EVIDENCE_CHARS) return evidence
  const boundary = evidence.lastIndexOf("\n", MAX_CSS_EVIDENCE_CHARS)
  return evidence.slice(0, Math.max(0, boundary)).trimEnd()
}

function extractInlineStyles(html: string) {
  const blocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []
  return blocks.map((b) => b.replace(/<\/?style[^>]*>/gi, "")).join("\n")
}

function extractStylesheetHrefs(html: string, base: string) {
  const hrefs: string[] = []
  const linkTags = html.match(/<link\b[^>]*>/gi) || []
  for (const tag of linkTags) {
    if (!/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!href) continue
    try {
      hrefs.push(new URL(href, base).toString())
    } catch {
      // ignore malformed hrefs
    }
    if (hrefs.length >= MAX_STYLESHEETS) break
  }
  return hrefs
}

function getHtmlAttribute(tag: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `(?:^|\\s)${escaped}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`,
    "i"
  ).exec(tag)?.slice(1).find(Boolean)
}

function decodeHtmlText(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .trim()
}

function findMetaContent(
  html: string,
  attribute: "name" | "property",
  expected: string
) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    if (getHtmlAttribute(tag, attribute)?.toLowerCase() !== expected) continue
    const content = getHtmlAttribute(tag, "content")
    if (content) return decodeHtmlText(content)
  }
  return undefined
}

function extractPageMetadata(
  html: string,
  requestedUrl: string,
  pageUrl: string
): UrlSourceMetadata {
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0]
  const visualHref =
    findMetaContent(html, "property", "og:image") ??
    findMetaContent(html, "name", "twitter:image")
  let visualUrl: string | undefined
  if (visualHref) {
    try {
      visualUrl = new URL(visualHref, pageUrl).toString()
    } catch {
      visualUrl = undefined
    }
  }

  return {
    kind: "website",
    requestedUrl,
    pageUrl,
    sourceUrl: pageUrl,
    title: titleMatch?.[1]
      ? decodeHtmlText(titleMatch[1].replace(/<[^>]+>/g, " "))
      : undefined,
    description:
      findMetaContent(html, "name", "description") ??
      findMetaContent(html, "property", "og:description"),
    language: htmlTag ? getHtmlAttribute(htmlTag, "lang") : undefined,
    themeColor: findMetaContent(html, "name", "theme-color"),
    visualUrl,
  }
}

function extractPublishedDesignCandidates(html: string, pageUrl: string) {
  const candidates = new Set<string>()
  const origin = new URL(pageUrl).origin
  const tags = html.match(/<(?:link|a)\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    const href = getHtmlAttribute(tag, "href")
    if (!href || !/(?:^|\/)design(?:\.dark)?\.md(?:$|[?#])/i.test(href)) {
      continue
    }
    try {
      const candidate = new URL(href, pageUrl)
      if (candidate.origin === origin && !/design\.dark\.md/i.test(candidate.pathname)) {
        candidates.add(candidate.toString())
      }
    } catch {
      // Ignore malformed source hints.
    }
  }
  candidates.add(new URL("/design.md", pageUrl).toString())
  candidates.add(new URL("/DESIGN.md", pageUrl).toString())
  return [...candidates].slice(0, 3)
}

async function fetchWithChildTimeout(
  url: string,
  parentSignal: AbortSignal,
  timeoutMs: number
) {
  const controller = new AbortController()
  const abortFromParent = () => controller.abort(parentSignal.reason)
  parentSignal.addEventListener("abort", abortFromParent, { once: true })
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Source discovery timed out", "TimeoutError")),
    timeoutMs
  )
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" },
      cache: "no-store",
    })
  } finally {
    clearTimeout(timeout)
    parentSignal.removeEventListener("abort", abortFromParent)
  }
}

async function discoverPublishedDesignMd(
  html: string,
  pageUrl: string,
  signal: AbortSignal
) {
  const attempts = extractPublishedDesignCandidates(html, pageUrl).map(
    async (href) => {
    try {
      const target = await validateUrl(href)
      const response = await fetchWithChildTimeout(
        target,
        signal,
        SOURCE_DISCOVERY_TIMEOUT_MS
      )
      const type = response.headers.get("content-type")
      if (
        !response.ok ||
        (!isMarkdownContentType(type) &&
          !type?.toLowerCase().startsWith("text/plain"))
      ) {
        await response.body?.cancel().catch(() => {})
        return null
      }
      const { bytes, truncated } = await readBodyWithCap(
        response,
        MAX_PUBLISHED_DESIGN_BYTES
      )
      const markdown = new TextDecoder().decode(bytes).trim()
      if (!looksLikeDesignMd(markdown)) return null
      return {
        url: target,
        markdown: markdown.slice(0, MAX_PUBLISHED_DESIGN_CHARS),
        truncated:
          truncated || markdown.length > MAX_PUBLISHED_DESIGN_CHARS,
      }
    } catch {
      // Discovery is opportunistic. The page snapshot remains a valid source.
      return null
    }
    }
  )
  const results = await Promise.all(attempts)
  return results.find((result) => result !== null) ?? null
}

// Fetch same-safety-checked stylesheets and distill them into one evidence
// block. Each href is revalidated through validateUrl (SSRF: HTTPS-only,
// no private targets) exactly like the page itself — a linked stylesheet is a
// fresh outbound request and gets the same guardrails.
async function collectCssEvidence(
  html: string,
  pageUrl: string,
  signal: AbortSignal
) {
  const sheets = await Promise.all(
    extractStylesheetHrefs(html, pageUrl).map(async (href) => {
      try {
        const target = await validateUrl(href)
        const response = await fetch(target, {
          signal,
          headers: { Accept: "text/css,*/*;q=0.1" },
          cache: "no-store",
        })
        const type = response.headers.get("content-type")
        if (!response.ok || (type && !type.toLowerCase().includes("css"))) {
          await response.body?.cancel().catch(() => {})
          return ""
        }
        const { bytes } = await readBodyWithCap(response, MAX_STYLESHEET_BYTES)
        return new TextDecoder().decode(bytes)
      } catch {
        // one bad stylesheet shouldn't abort the whole extraction
        return ""
      }
    })
  )
  const css = [extractInlineStyles(html), ...sheets]
    .filter((part) => part.trim())
    .join("\n")
  const themeColor = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']|<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i
  )
  const metaLine = themeColor
    ? `meta theme-color: ${themeColor[1] || themeColor[2]}\n`
    : ""
  if (!css && !metaLine) return ""
  return capEvidenceAtLineBoundary(metaLine + distillCssEvidence(css))
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "请求体超过 16 KB 限制" }, { status: 413 })
  }

  let body: unknown
  try {
    const bytes = await request.arrayBuffer()
    if (bytes.byteLength > MAX_REQUEST_BYTES) {
      return Response.json({ error: "请求体超过 16 KB 限制" }, { status: 413 })
    }
    body = JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    return Response.json({ error: "请求体必须是 JSON" }, { status: 400 })
  }
  const url =
    body &&
    typeof body === "object" &&
    "url" in body &&
    typeof body.url === "string"
      ? body.url
      : ""
  if (!url) return Response.json({ error: "缺少 url" }, { status: 400 })

  let target: string
  try {
    target = await validateUrl(url)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "URL 被拒绝" },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(target, {
      signal: controller.signal,
      headers: {
        Accept: "text/markdown,text/html;q=0.9,text/plain;q=0.8",
      },
      cache: "no-store",
    })
    if (!response.ok)
      return Response.json(
        { error: `抓取失败（${response.status}）` },
        { status: 502 }
      )
    const contentType = response.headers.get("content-type")
    if (!isSupportedContentType(contentType))
      return Response.json(
        { error: "仅支持抓取 HTML 或 Markdown 内容" },
        { status: 415 }
      )
    const pageUrl = response.url || target
    const directMarkdown =
      isMarkdownContentType(contentType) ||
      (contentType?.toLowerCase().startsWith("text/plain") &&
        looksLikeMarkdownUrl(pageUrl))
    if (directMarkdown) {
      const { bytes, truncated } = await readBodyWithCap(
        response,
        MAX_PUBLISHED_DESIGN_BYTES
      )
      const markdown = new TextDecoder().decode(bytes).trim()
      if (!looksLikeDesignMd(markdown)) {
        return Response.json(
          { error: "该 Markdown 不包含可识别的设计规范结构" },
          { status: 422 }
        )
      }
      const source: UrlSourceMetadata = {
        kind: "direct-design-md",
        requestedUrl: target,
        pageUrl,
        sourceUrl: pageUrl,
      }
      return Response.json({
        url: pageUrl,
        content: "",
        cssEvidence: "",
        publishedDesignMd: markdown.slice(0, MAX_PUBLISHED_DESIGN_CHARS),
        source,
        truncated:
          truncated || markdown.length > MAX_PUBLISHED_DESIGN_CHARS,
      } satisfies UrlSourcePackage)
    }
    const { bytes, truncated: downloadTruncated } = await readBodyWithCap(
      response,
      MAX_DOWNLOAD_BYTES
    )
    const html = new TextDecoder().decode(bytes)
    // Independent ingredients fan out in parallel. A slow or unavailable
    // published source never prevents the page snapshot from reaching AI.
    const [cssEvidence, publishedDesign] = await Promise.all([
      collectCssEvidence(html, pageUrl, controller.signal),
      discoverPublishedDesignMd(html, pageUrl, controller.signal),
    ])
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      // The download cap can cut mid-block, leaving an unclosed <script>/<style>
      // the paired regexes above no longer match — drop the dangling remainder.
      .replace(/<script[\s\S]*$/i, " ")
      .replace(/<style[\s\S]*$/i, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    // Client-rendered SPA shells have no server-rendered text but do link real
    // stylesheets — CSS evidence alone is enough for token generation.
    if (!text && !cssEvidence && !publishedDesign)
      return Response.json(
        { error: "未能从该网页提取到文本内容" },
        { status: 422 }
      )
    const source: UrlSourceMetadata = {
      ...extractPageMetadata(html, target, pageUrl),
      ...(publishedDesign
        ? {
            kind: "published-design-md" as const,
            sourceUrl: publishedDesign.url,
          }
        : {}),
    }
    return Response.json({
      url: pageUrl,
      content: text.slice(0, MAX_TEXT_CHARS),
      cssEvidence,
      publishedDesignMd: publishedDesign?.markdown,
      source,
      truncated:
        downloadTruncated ||
        text.length > MAX_TEXT_CHARS ||
        Boolean(publishedDesign?.truncated),
    } satisfies UrlSourcePackage)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "网页暂时无法抓取" },
      { status: 502 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
