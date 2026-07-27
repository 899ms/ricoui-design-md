import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sourceRoot = path.join(root, "docs", "themes")
const targetRoot = path.join(root, "public", "brands")
const excluded = new Set()
const required = ["DESIGN.md", "preview.html", "tokens.json", "variables.css", "theme.css"]
const sourceUrls = {
  airbnb: "https://www.airbnb.com/",
  airtable: "https://www.airtable.com/",
  apple: "https://www.apple.com/",
  binance: "https://www.binance.com/",
  bmw: "https://www.bmw.com/",
  "bmw-m": "https://www.bmw-m.com/",
  bugatti: "https://www.bugatti.com/",
  cal: "https://cal.com/",
  claude: "https://claude.ai/",
  clay: "https://www.clay.com/",
  clickhouse: "https://clickhouse.com/",
  cohere: "https://cohere.com/",
  composio: "https://composio.dev/",
  cursor: "https://www.cursor.com/",
  "dell-1996": "https://www.dell.com/",
  elevenlabs: "https://elevenlabs.io/",
  expo: "https://expo.dev/",
  ferrari: "https://www.ferrari.com/",
  figma: "https://www.figma.com/",
  framer: "https://www.framer.com/",
  hashicorp: "https://www.hashicorp.com/",
  hp: "https://www.hp.com/",
  ibm: "https://www.ibm.com/",
  slack: "https://slack.com/",
  intercom: "https://www.intercom.com/",
  kraken: "https://www.kraken.com/",
  lamborghini: "https://www.lamborghini.com/",
  "linear.app": "https://linear.app/",
  lovable: "https://lovable.dev/",
  mastercard: "https://www.mastercard.com/",
  meta: "https://www.meta.com/",
  minimax: "https://www.minimax.io/",
  mintlify: "https://www.mintlify.com/",
  miro: "https://miro.com/",
  "mistral.ai": "https://mistral.ai/",
  mongodb: "https://www.mongodb.com/",
  nike: "https://www.nike.com/",
  "nintendo-2001": "https://www.nintendo.com/",
  notion: "https://www.notion.com/",
  nvidia: "https://www.nvidia.com/",
  ollama: "https://ollama.com/",
  "opencode.ai": "https://opencode.ai/",
  pinterest: "https://www.pinterest.com/",
  playstation: "https://www.playstation.com/",
  posthog: "https://posthog.com/",
  raycast: "https://www.raycast.com/",
  renault: "https://www.renault.com/",
  replicate: "https://replicate.com/",
  resend: "https://resend.com/",
  revolut: "https://www.revolut.com/",
  runwayml: "https://runwayml.com/",
  sanity: "https://www.sanity.io/",
  sentry: "https://sentry.io/",
  shopify: "https://www.shopify.com/",
  spacex: "https://www.spacex.com/",
  spotify: "https://www.spotify.com/",
  starbucks: "https://www.starbucks.com/",
  stripe: "https://stripe.com/",
  supabase: "https://supabase.com/",
  superhuman: "https://superhuman.com/",
  tesla: "https://www.tesla.com/",
  theverge: "https://www.theverge.com/",
  "together.ai": "https://www.together.ai/",
  uber: "https://www.uber.com/",
  vercel: "https://vercel.com/",
  vodafone: "https://www.vodafone.com/",
  voltagent: "https://voltagent.dev/",
  warp: "https://www.warp.dev/",
  webflow: "https://webflow.com/",
  wired: "https://www.wired.com/",
  wise: "https://wise.com/",
  "x.ai": "https://x.ai/",
  zapier: "https://zapier.com/",
}
const legacySourceUrls = {
  caldera: "https://caldera.xyz/",
  duolingo: "https://www.duolingo.com/",
}

const categoryMembers = {
  "AI & LLM Platforms": ["claude", "cohere", "elevenlabs", "minimax", "mistral.ai", "replicate", "runwayml", "together.ai", "x.ai"],
  "Developer Tools & IDEs": ["composio", "cursor", "expo", "mintlify", "ollama", "opencode.ai", "raycast", "resend", "sentry", "vercel", "voltagent", "warp"],
  "Backend, Database & DevOps": ["clickhouse", "hashicorp", "mongodb", "posthog", "sanity", "supabase"],
  "Productivity & SaaS": ["airtable", "cal", "clay", "intercom", "linear.app", "notion", "slack", "superhuman", "zapier"],
  "Design & Creative Tools": ["figma", "framer", "lovable", "miro", "webflow"],
  "Fintech & Crypto": ["binance", "kraken", "mastercard", "revolut", "stripe", "wise"],
  "E-commerce & Retail": ["nike", "shopify", "starbucks"],
  "Media & Consumer Tech": ["apple", "dell-1996", "hp", "meta", "nvidia", "pinterest", "spotify", "theverge", "wired"],
  "Travel & Mobility": ["airbnb", "uber"],
  "Education & Learning": ["duolingo"],
  Automotive: ["bmw", "bmw-m", "bugatti", "ferrari", "lamborghini", "renault", "tesla"],
  "Enterprise Technology": ["ibm", "vodafone"],
  "Aerospace & Frontier Tech": ["spacex"],
  "Gaming & Entertainment": ["caldera", "nintendo-2001", "playstation"],
}
const categoryBySlug = new Map(Object.entries(categoryMembers).flatMap(([category, slugs]) => slugs.map((item) => [item, category])))

function scalar(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  return trimmed
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) throw new Error("Missing frontmatter")
  const result = {}
  const stack = [{ indent: -1, value: result }]
  const lines = match[1].split(/\r?\n/)
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const raw = lines[lineIndex]
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue
    const indent = raw.match(/^ */)[0].length
    const entry = raw.trim().match(/^([^:]+):(?:\s*(.*))?$/)
    if (!entry) continue
    while (stack.at(-1).indent >= indent) stack.pop()
    const parent = stack.at(-1).value
    const key = entry[1].trim()
    const rest = entry[2] ?? ""
    if (rest === ">" || rest === "|") {
      const block = []
      while (lineIndex + 1 < lines.length) {
        const next = lines[lineIndex + 1]
        const nextIndent = next.match(/^ */)[0].length
        if (next.trim() && nextIndent <= indent) break
        lineIndex += 1
        block.push(next.trim())
      }
      parent[key] = rest === ">" ? block.filter(Boolean).join(" ") : block.join("\n").trim()
      continue
    }
    if (rest === "") {
      parent[key] = {}
      stack.push({ indent, value: parent[key] })
    } else parent[key] = scalar(rest)
  }
  return result
}

function parseLegacyMarkdown(markdown, folder) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/^Design System Inspired by\s+/i, "") ?? folder
  const description = markdown.match(/^##[^\n]*\n+([^#\n][\s\S]*?)(?=\n\n|\n#)/m)?.[1]?.replace(/\s+/g, " ").trim() ?? `${title} design system reference.`
  const colors = {}
  for (const match of markdown.matchAll(/(?:\*\*([^*]+)\*\*[^\n]*?)?`(#[0-9a-f]{3,8}|rgba?\([^`]+\))`/gi)) {
    const name = slug(match[1] ?? `color-${Object.keys(colors).length + 1}`)
    if (!Object.values(colors).includes(match[2])) colors[name] = match[2]
  }
  const typography = {}
  const tableRows = markdown.split(/\r?\n/).filter((line) => /^\|/.test(line) && !/^\|[- :|]+\|?$/.test(line))
  for (const row of tableRows) {
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim().replace(/`|\*\*/g, ""))
    const sizeIndex = cells.findIndex((cell) => /^\d+(?:\.\d+)?(?:px|rem)$/.test(cell))
    if (sizeIndex < 0 || /role|size/i.test(cells[0])) continue
    const role = slug(cells[0]) || `type-${Object.keys(typography).length + 1}`
    typography[role] = { fontFamily: cells[1] && !/^\d/.test(cells[1]) ? cells[1] : "Inter, system-ui, sans-serif", fontSize: cells[sizeIndex], fontWeight: Number(cells[sizeIndex + 1]) || 400, lineHeight: cells.find((cell, index) => index > sizeIndex && /^(?:\d+(?:\.\d+)?|\d+px)$/.test(cell) && cell !== cells[sizeIndex + 1]) ?? 1.5, letterSpacing: cells.find((cell) => /-?\d+(?:\.\d+)?(?:px|em)$/.test(cell) && cell !== cells[sizeIndex]) ?? 0 }
  }
  if (!Object.keys(typography).length) typography.body = { fontFamily: "Inter, system-ui, sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
  const pxValues = [...new Set([...markdown.matchAll(/\b(4|8|12|16|20|24|32|40|48|64|80|96|128)px\b/g)].map((match) => `${match[1]}px`))]
  const spacing = Object.fromEntries((pxValues.length ? pxValues : ["8px", "16px", "24px", "48px", "80px"]).map((value) => [value.replace("px", ""), value]))
  const radiusValues = [...new Set([...markdown.matchAll(/(?:radius|rounded)[^\n`]*(?:`)?(\d+px|9999px)/gi)].map((match) => match[1]))]
  const rounded = Object.fromEntries((radiusValues.length ? radiusValues : ["4px", "8px", "12px"]).map((value, index) => [["sm", "md", "lg", "xl", "pill"][index] ?? `r${index + 1}`, value]))
  const components = {}
  const componentBlock = markdown.match(/##\s+\d*\.?\s*(?:Components?|Component Patterns?)[\s\S]*?(?=\n##\s|$)/i)?.[0] ?? ""
  for (const match of componentBlock.matchAll(/^###\s+(.+)$/gm)) components[slug(match[1])] = { description: `${match[1]} treatment documented in the source analysis.` }
  if (!Object.keys(components).length) components["primary-button"] = { description: "Primary interaction treatment documented in the source analysis." }
  return { name: title, description, colors, typography, spacing, rounded, components }
}

const slug = (value) => String(value).replace(/^--/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const cssFont = (value) => String(value).includes(",") ? value : `'${String(value).replace(/'/g, "\\'")}', system-ui, sans-serif`

function tokenData(meta, brand, sourceUrl) {
  const colors = Object.entries(meta.colors ?? {})
  const typography = Object.entries(meta.typography ?? {})
  const spacing = Object.entries(meta.spacing ?? {})
  const radius = Object.entries(meta.rounded ?? meta.radius ?? {})
  const shadows = Object.entries(meta.shadows ?? meta.shadow ?? {})
  const fontFamilies = [...new Set(typography.map(([, value]) => value.fontFamily).filter(Boolean))]
  return {
    $schema: "https://tr.designtokens.org/format/",
    $description: `Design tokens for ${brand}`,
    meta: { name: brand, description: meta.description ?? "", theme: inferTheme(colors) },
    color: Object.fromEntries(colors.map(([name, value]) => [name, { $value: value, $type: "color", $description: `Use for the ${name.replace(/-/g, " ")} role.` }])),
    typography: Object.fromEntries(typography.map(([name, value]) => [name, { $value: { fontFamily: value.fontFamily ?? fontFamilies[0] ?? "system-ui", fontSize: value.fontSize ?? "16px", fontWeight: value.fontWeight ?? 400, lineHeight: value.lineHeight ?? 1.5, letterSpacing: value.letterSpacing ?? "0" }, $type: "typography", $description: `Typography style for ${name.replace(/-/g, " ")}.` }])),
    spacing: Object.fromEntries(spacing.map(([name, value]) => [name, { $value: value, $type: "dimension", $description: `Spacing step ${name}.` }])),
    radius: Object.fromEntries(radius.map(([name, value]) => [name, { $value: value, $type: "dimension", $description: `Border radius ${name}.` }])),
    shadow: Object.fromEntries(shadows.map(([name, value]) => [name, { $value: value, $type: "shadow", $description: `Shadow treatment ${name}.` }])),
    $extensions: { "com.design-md-editor.source": { url: sourceUrl, note: "Official brand website used for visual comparison." } },
  }
}

function inferTheme(colors) {
  const canvas = colors.find(([key]) => /^(canvas|background|bg|surface)$/.test(key))?.[1]
  if (typeof canvas !== "string" || !/^#[0-9a-f]{6}$/i.test(canvas)) return "light"
  const rgb = [1, 3, 5].map((at) => parseInt(canvas.slice(at, at + 2), 16))
  return rgb.reduce((a, b) => a + b, 0) < 384 ? "dark" : "light"
}

function cssFiles(meta, brand) {
  const blocks = []
  for (const [name, value] of Object.entries(meta.colors ?? {})) blocks.push([`--color-${slug(name)}`, value])
  const fonts = [...new Set(Object.values(meta.typography ?? {}).map((v) => v.fontFamily).filter(Boolean))]
  fonts.forEach((font, index) => blocks.push([`--font-${index ? `family-${index + 1}` : "primary"}`, cssFont(font)]))
  for (const [name, value] of Object.entries(meta.typography ?? {})) {
    blocks.push([`--text-${slug(name)}`, value.fontSize])
    blocks.push([`--leading-${slug(name)}`, value.lineHeight])
    blocks.push([`--tracking-${slug(name)}`, value.letterSpacing])
  }
  for (const [name, value] of Object.entries(meta.spacing ?? {})) blocks.push([`--spacing-${slug(name)}`, value])
  for (const [name, value] of Object.entries(meta.rounded ?? meta.radius ?? {})) blocks.push([`--radius-${slug(name)}`, value])
  for (const [name, value] of Object.entries(meta.shadows ?? meta.shadow ?? {})) blocks.push([`--shadow-${slug(name)}`, value])
  const valid = blocks.filter(([, value]) => value !== undefined && value !== "" && !/^[—–-]$/.test(String(value)))
  const body = valid.map(([name, value]) => `  ${name}: ${value};`).join("\n")
  return { variables: `/* ${brand} design tokens */\n:root {\n${body}\n}\n`, theme: `/* ${brand} Tailwind CSS v4 theme */\n@theme {\n${body}\n}\n` }
}

function preview(meta, brand, tokens, sourceUrl) {
  const colors = Object.entries(meta.colors ?? {})
  const types = Object.entries(meta.typography ?? {})
  const spacing = Object.entries(meta.spacing ?? {})
  const radius = Object.entries(meta.rounded ?? meta.radius ?? {})
  const components = Object.entries(meta.components ?? {})
  const canvas = colors.find(([n]) => /canvas|background|surface/.test(n))?.[1] ?? (tokens.meta.theme === "dark" ? "#111111" : "#ffffff")
  const ink = colors.find(([n]) => /^(ink|text|body|on-canvas)/.test(n))?.[1] ?? (tokens.meta.theme === "dark" ? "#ffffff" : "#111111")
  const accent = colors.find(([n]) => /primary|accent|brand/.test(n))?.[1] ?? ink
  const swatches = colors.map(([n, v]) => `<article class="swatch"><div style="background:${escapeHtml(v)}"></div><b>${escapeHtml(n)}</b><code>${escapeHtml(v)}</code></article>`).join("")
  const typeRows = types.map(([n, v]) => `<article class="type" style="font-family:${escapeHtml(v.fontFamily ?? "system-ui")};font-size:clamp(1rem,${escapeHtml(v.fontSize ?? "1rem")},3.5rem);font-weight:${escapeHtml(v.fontWeight ?? 400)};line-height:${escapeHtml(v.lineHeight ?? 1.2)};letter-spacing:${escapeHtml(v.letterSpacing ?? 0)}"><small>${escapeHtml(n)} · ${escapeHtml(v.fontSize ?? "")}</small>${escapeHtml(brand)}</article>`).join("")
  const metrics = [...spacing.map(([n,v]) => [n,v,"spacing"]), ...radius.map(([n,v]) => [n,v,"radius"])].map(([n,v,k]) => `<article class="metric"><b>${escapeHtml(n)}</b><span class="${k}" style="--size:${escapeHtml(v)}"></span><code>${escapeHtml(v)}</code></article>`).join("")
  const componentRows = components.slice(0, 12).map(([n,v]) => `<article class="component"><h3>${escapeHtml(n)}</h3><dl>${Object.entries(v).map(([k,x]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(x)}</dd>`).join("")}</dl></article>`).join("")
  return `<!doctype html><!-- Source website: ${escapeHtml(sourceUrl)}. Compare this extracted reference with the live official website; the website remains authoritative. --><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="design-source" content="${escapeHtml(sourceUrl)}"><title>${escapeHtml(brand)} Design System</title><style>:root{--canvas:${canvas};--ink:${ink};--accent:${accent}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.5 system-ui,sans-serif}nav{position:sticky;top:0;z-index:2;display:flex;gap:18px;padding:14px 5vw;background:color-mix(in srgb,var(--canvas) 88%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}a{color:inherit}main{width:min(1120px,90vw);margin:auto}header{padding:12vh 0 8vh;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}h1{font-size:clamp(3rem,9vw,8rem);line-height:.9;letter-spacing:-.06em;margin:0 0 28px}header p{max-width:720px;font-size:1.15rem}.source{display:inline-flex;padding:10px 16px;border:1px solid currentColor;border-radius:999px;text-decoration:none;font-weight:650}section{padding:70px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}h2{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.04em}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}.swatch,.component,.metric{border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);padding:14px;border-radius:12px}.swatch div{height:110px;border-radius:8px;margin-bottom:12px}.swatch code,.swatch b{display:block}.type{padding:24px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}.type small{display:block;font:12px/1.5 ui-monospace,monospace;opacity:.65}.metric{display:grid;gap:12px}.metric span{display:block;background:var(--accent)}.metric .spacing{width:min(var(--size),100%);height:12px}.metric .radius{width:70px;height:70px;border-radius:var(--size)}dl{display:grid;grid-template-columns:minmax(100px,.7fr) 1fr;gap:8px;margin:0}dt{opacity:.6}dd{margin:0;overflow-wrap:anywhere}footer{padding:40px 5vw;text-align:center}@media(max-width:600px){nav{overflow:auto}section{padding:48px 0}}</style></head><body><nav><a href="#colors">Colors</a><a href="#type">Typography</a><a href="#metrics">Spacing & Shapes</a><a href="#components">Components</a><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Official website ↗</a><a href="DESIGN.md">DESIGN.md</a><a href="tokens.json">Tokens</a><a href="variables.css">CSS</a><a href="theme.css">Tailwind</a></nav><main><header><p>DESIGN SYSTEM / ${escapeHtml(tokens.meta.theme.toUpperCase())}</p><h1>${escapeHtml(brand)}</h1><p>${escapeHtml(meta.description ?? "")}</p><p><a class="source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Compare with ${escapeHtml(brand)} official website ↗</a></p></header><section id="colors"><h2>Colors</h2><div class="grid">${swatches}</div></section><section id="type"><h2>Typography</h2>${typeRows}</section><section id="metrics"><h2>Spacing & Shapes</h2><div class="grid">${metrics}</div></section><section id="components"><h2>Components</h2><div class="grid">${componentRows}</div></section></main><footer>Source: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceUrl)}</a> · ${escapeHtml(brand)} design system reference</footer></body></html>`
}

function standardDesignMarkdown(meta, brand, sourceUrl) {
  const colors = Object.entries(meta.colors ?? {})
  const typography = Object.entries(meta.typography ?? {})
  const spacing = Object.entries(meta.spacing ?? {})
  const radius = Object.entries(meta.rounded ?? meta.radius ?? {})
  const shadows = Object.entries(meta.shadows ?? meta.shadow ?? {})
  const components = Object.entries(meta.components ?? {})
  const theme = inferTheme(colors)
  const fontGroups = new Map()
  for (const [, value] of typography) {
    const family = value.fontFamily ?? "system-ui, sans-serif"
    const group = fontGroups.get(family) ?? { weights: new Set(), sizes: new Set(), lineHeights: new Set(), tracking: new Set() }
    group.weights.add(value.fontWeight ?? 400); group.sizes.add(value.fontSize ?? "16px"); group.lineHeights.add(value.lineHeight ?? 1.5); group.tracking.add(value.letterSpacing ?? 0)
    fontGroups.set(family, group)
  }
  const colorRows = colors.map(([name, value]) => `| ${name.replace(/-/g, " ")} | \`${value}\` | \`--color-${slug(name)}\` | ${name.replace(/-/g, " ")} role extracted from the source design |`).join("\n")
  const fonts = [...fontGroups].map(([family, group], index) => `### ${family} · \`--font-${index ? `family-${index + 1}` : "primary"}\`\n- **Substitute:** Inter, system-ui, sans-serif\n- **Weights:** ${[...group.weights].join(", ")}\n- **Sizes:** ${[...group.sizes].join(", ")}\n- **Line height:** ${[...group.lineHeights].join(", ")}\n- **Letter spacing:** ${[...group.tracking].join(", ")}\n- **Role:** Brand typography family observed across the documented type scale.`).join("\n\n")
  const typeRows = typography.map(([name, value]) => `| ${name} | ${value.fontSize ?? "16px"} | ${value.lineHeight ?? 1.5} | ${value.letterSpacing ?? 0} | \`--text-${slug(name)}\` |`).join("\n")
  const spacingRows = spacing.map(([name, value]) => `| ${name} | ${value} | \`--spacing-${slug(name)}\` |`).join("\n")
  const radiusRows = radius.map(([name, value]) => `| ${name} | ${value} | \`--radius-${slug(name)}\` |`).join("\n")
  const shadowRows = shadows.map(([name, value]) => `| ${name} | \`${value}\` | \`--shadow-${slug(name)}\` |`).join("\n")
  const componentSections = components.map(([name, value]) => `### ${name.replace(/-/g, " ")}\n**Role:** ${name.replace(/-/g, " ")} component\n\n${Object.entries(value).map(([key, item]) => `- **${key}:** \`${item}\``).join("\n")}`).join("\n\n")
  const primary = colors.find(([name]) => /primary|accent|brand/.test(name))
  const canvas = colors.find(([name]) => /canvas|background|surface/.test(name))
  const ink = colors.find(([name]) => /ink|text|body/.test(name))
  return `# ${brand} — Style Reference
> ${meta.description ?? `${brand} design system reference.`}

**Theme:** ${theme}

**Source website:** [${sourceUrl}](${sourceUrl})  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
${colorRows}

## Tokens — Typography

${fonts}

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
${typeRows}

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
${spacingRows}

### Border Radius

| Name | Value | Token |
|---|---|---|
${radiusRows}
${shadowRows ? `\n### Shadows\n\n| Name | Value | Token |\n|---|---|---|\n${shadowRows}\n` : ""}
### Layout

- **Section gap:** ${meta.spacing?.section ?? meta.spacing?.xxl ?? "64px"}
- **Card padding:** ${meta.spacing?.lg ?? meta.spacing?.md ?? "24px"}
- **Element gap:** ${meta.spacing?.md ?? meta.spacing?.sm ?? "16px"}
- **Max content width:** 1200px

## Components

${componentSections}

## Do's and Don'ts

### Do

- Use ${primary ? `\`--color-${slug(primary[0])}\`` : "the documented primary token"} for the brand's primary interaction treatment.
- Keep page surfaces anchored to ${canvas ? `\`--color-${slug(canvas[0])}\`` : "the documented canvas token"}.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live ${brand} website](${sourceUrl}).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace ${ink ? `\`--color-${slug(ink[0])}\`` : "the documented text token"} with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](${sourceUrl}).
`
}

function annotateLegacyDesign(markdown, brand, sourceUrl) {
  const note = `> **Source website:** [${brand}](${sourceUrl}) — Compare this extracted reference with the live official website, which remains authoritative.\n\n`
  if (markdown.includes("**Source website:**")) {
    return markdown.replace(/> \*\*Source website:\*\*[\s\S]*?(?=## )/, `${note}`)
  }
  const firstSection = markdown.search(/^## /m)
  return firstSection >= 0 ? `${markdown.slice(0, firstSection)}${note}${markdown.slice(firstSection)}` : `${note}${markdown}`
}

function annotateLegacyPreview(html, brand, sourceUrl) {
  if (!html.trim()) return html
  if (html.includes('name="design-source"')) return html
  let output = html.replace(/<!doctype html>/i, `<!doctype html><!-- Source website: ${sourceUrl}. The live official website remains authoritative. -->`)
  output = output.replace(/<head>/i, `<head><meta name="design-source" content="${sourceUrl}">`)
  output = output.replace(/<body([^>]*)>/i, `<body$1><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="position:fixed;right:16px;bottom:16px;z-index:9999;padding:10px 14px;border-radius:999px;background:#111;color:#fff;font:600 13px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 18px rgba(0,0,0,.25)">Compare with ${brand} ↗</a>`)
  return output
}

function displayName(meta, folder) {
  const fromTitle = String(meta.name ?? "").replace(/[-_ ]?design[-_ ]?(analysis|system)?$/i, "")
  return fromTitle || folder.split(/[.-]/).map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ")
}

function category(folder) {
  const value = categoryBySlug.get(folder)
  if (!value) throw new Error(`Missing category for ${folder}`)
  return value
}

function tagsFor(folder, meta, theme) {
  const text = `${meta.description ?? ""}`.toLowerCase()
  const tags = [theme === "dark" ? "Dark UI" : "Light UI"]
  if (/editorial|magazine|publishing/.test(text)) tags.push("Editorial")
  if (/minimal|clean|restrained/.test(text)) tags.push("Minimal")
  if (/gradient|glow|atmospheric/.test(text)) tags.push("Gradient")
  if (/enterprise/.test(text)) tags.push("Enterprise")
  if (/developer|code|technical/.test(text)) tags.push("Developer-focused")
  if (/luxury|premium/.test(text)) tags.push("Luxury")
  if (/playful|friendly|joyful/.test(text)) tags.push("Playful")
  tags.push("Design System")
  return [...new Set(tags)].slice(0, 6)
}

const sourceFolders = fs.readdirSync(sourceRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !excluded.has(entry.name) && fs.existsSync(path.join(sourceRoot, entry.name, "DESIGN.md"))).map((entry) => entry.name)
if (sourceFolders.length !== 73) throw new Error(`Expected 73 themes, found ${sourceFolders.length}`)

const additions = []
for (const folder of sourceFolders) {
  const markdown = fs.readFileSync(path.join(sourceRoot, folder, "DESIGN.md"), "utf8")
  const meta = markdown.startsWith("---") ? parseFrontmatter(markdown) : parseLegacyMarkdown(markdown, folder)
  const brand = displayName(meta, folder)
  const sourceUrl = sourceUrls[folder]
  if (!sourceUrl) throw new Error(`Missing source URL for ${folder}`)
  const tokens = tokenData(meta, brand, sourceUrl)
  const css = cssFiles(meta, brand)
  const destination = path.join(targetRoot, folder)
  fs.mkdirSync(destination, { recursive: true })
  fs.writeFileSync(path.join(destination, "DESIGN.md"), standardDesignMarkdown(meta, brand, sourceUrl))
  fs.writeFileSync(path.join(destination, "tokens.json"), `${JSON.stringify(tokens, null, 2)}\n`)
  fs.writeFileSync(path.join(destination, "variables.css"), css.variables)
  fs.writeFileSync(path.join(destination, "theme.css"), css.theme)
  fs.writeFileSync(path.join(destination, "preview.html"), preview(meta, brand, tokens, sourceUrl))
  const previewColors = Object.values(meta.colors ?? {}).filter((value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)).slice(0, 5)
  additions.push({ id: folder, folder, name: brand, description: meta.description ?? `${brand} design system reference.`, tags: tagsFor(folder, meta, tokens.meta.theme), category: category(folder), previewColors, files: required })
}

const registryPath = path.join(targetRoot, "registry.json")
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"))
for (const entry of registry) {
  const sourceUrl = legacySourceUrls[entry.id]
  if (!sourceUrl) continue
  const directory = path.join(targetRoot, entry.folder)
  const designPath = path.join(directory, "DESIGN.md")
  fs.writeFileSync(designPath, annotateLegacyDesign(fs.readFileSync(designPath, "utf8"), entry.name, sourceUrl))
  const tokenPath = path.join(directory, "tokens.json")
  const tokenDocument = JSON.parse(fs.readFileSync(tokenPath, "utf8"))
  tokenDocument.$extensions ??= {}
  tokenDocument.$extensions["com.design-md-editor.source"] = { url: sourceUrl, note: "Official brand website used for visual comparison." }
  fs.writeFileSync(tokenPath, `${JSON.stringify(tokenDocument, null, 2)}\n`)
  const previewPath = path.join(directory, "preview.html")
  if (fs.existsSync(previewPath)) {
    fs.writeFileSync(previewPath, annotateLegacyPreview(fs.readFileSync(previewPath, "utf8"), entry.name, sourceUrl))
  } else {
    fs.writeFileSync(previewPath, `<!doctype html><!-- Intentionally blank preview placeholder. Source website: ${sourceUrl} --><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="design-source" content="${sourceUrl}"><title>${entry.name} preview placeholder</title></head><body><p><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Compare with ${entry.name} official website</a></p></body></html>\n`)
  }
  entry.files = required.filter((filename) => fs.existsSync(path.join(directory, filename)))
  entry.category = category(entry.id)
  entry.tags = tagsFor(entry.id, { description: entry.description }, tokenDocument.meta?.theme ?? "light")
}
const additionIds = new Set(additions.map((entry) => entry.id))
const merged = [...registry.filter((entry) => !additionIds.has(entry.id)), ...additions].sort((a, b) => a.name.localeCompare(b.name))
fs.writeFileSync(registryPath, `${JSON.stringify(merged, null, 2)}\n`)
console.log(`Generated ${additions.length} theme packages; registry now contains ${merged.length} brands.`)
