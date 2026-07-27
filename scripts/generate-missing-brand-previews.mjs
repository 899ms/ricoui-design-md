import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const publicRoot = path.join(root, "public", "brands")
const docsRoot = path.join(root, "docs", "themes")

const brands = [
  {
    slug: "bmw-m",
    name: "BMW M",
    source: "https://www.bmw-m.com/",
    tone: "motorsport",
    canvas: "#000000",
    surface: "#1a1a1a",
    surface2: "#262626",
    ink: "#ffffff",
    muted: "#bbbbbb",
    accent: "#1c69d4",
    accent2: "#e22718",
    border: "#3c3c3c",
    onAccent: "#ffffff",
    displayFont: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    bodyFont: "'Barlow', 'Helvetica Neue', sans-serif",
    googleFonts: "Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600",
    hero: "Engineered for the apex.",
    artKicker: "M POWER / 1972—NOW",
    artTitle: "M",
    gradients: [
      ["M Tricolor", "linear-gradient(90deg,#0066b1 0 33%,#1c69d4 33% 66%,#e22718 66%)", "The motorsport signature used as a controlled divider."],
    ],
    components: ["Primary drive CTA", "Category tab", "Motorsport story card", "Cockpit input"],
    dos: ["Keep the canvas pure black (#000000).", "Use the M tricolor as a compact signature.", "Set headlines in uppercase condensed display type.", "Let photography and strong cropping carry the energy."],
    donts: ["Do not soften the system with pastel surfaces.", "Do not use rounded cards beyond the documented 6px.", "Do not turn all three M colors into competing CTAs.", "Do not add ornamental shadows to flat panels."],
  },
  {
    slug: "dell-1996",
    name: "Dell 1996",
    source: "https://www.dell.com/",
    tone: "retro",
    canvas: "#ffffff",
    surface: "#b3bd95",
    surface2: "#9ab6c8",
    ink: "#000000",
    muted: "#333333",
    accent: "#e91d2a",
    accent2: "#6a26a4",
    border: "#000000",
    onAccent: "#ffffff",
    displayFont: "'Archivo Black', Impact, sans-serif",
    bodyFont: "'Libre Baskerville', 'Times New Roman', serif",
    googleFonts: "Archivo+Black&family=Libre+Baskerville:wght@400;700",
    hero: "Direct from the catalog era.",
    artKicker: "WORLD WIDE WEB / 1996",
    artTitle: "DELL",
    gradients: [],
    components: ["Catalog order button", "Ribbon navigation", "Product specification card", "Email order field"],
    dos: ["Frame the white page with literal black borders.", "Use flat sage, salmon and periwinkle content ribbons.", "Pair chunky sans headlines with Times-style body copy.", "Keep links visibly blue and underlined."],
    donts: ["Do not modernize the page with glass blur.", "Do not round catalog panels or controls.", "Do not replace flat tints with soft gradients.", "Do not hide the utilitarian table structure."],
  },
  {
    slug: "hp",
    name: "HP",
    source: "https://www.hp.com/",
    tone: "chevron",
    canvas: "#ffffff",
    surface: "#f7f7f7",
    surface2: "#c9e0fc",
    ink: "#1a1a1a",
    muted: "#636363",
    accent: "#024ad8",
    accent2: "#296ef9",
    border: "#e8e8e8",
    onAccent: "#ffffff",
    displayFont: "'Instrument Sans', 'Helvetica Neue', sans-serif",
    bodyFont: "'Instrument Sans', 'Helvetica Neue', sans-serif",
    googleFonts: "Instrument+Sans:wdth,wght@75..100,400..700",
    hero: "Technology that moves with you.",
    artKicker: "HP / HUMAN PROGRESS",
    artTitle: "hp",
    gradients: [
      ["Electric Blue", "linear-gradient(135deg,#0e3191,#024ad8 55%,#296ef9)", "A restrained digital-blue range for hero and CTA emphasis."],
    ],
    components: ["Electric blue CTA", "Product category tab", "Device feature card", "Support search field"],
    dos: ["Reserve HP Electric Blue for decisive actions.", "Use angular chevrons as directional decoration.", "Keep product cards clean with 8–16px corners.", "Anchor long pages with a dark navy closing band."],
    donts: ["Do not add multiple competing accent colors.", "Do not use heavy shadows around product imagery.", "Do not over-round compact controls.", "Do not reduce display headings to utility weights."],
  },
  {
    slug: "linear.app",
    name: "Linear",
    source: "https://linear.app/",
    tone: "precision",
    canvas: "#010102",
    surface: "#0f1011",
    surface2: "#18191a",
    ink: "#f7f8f8",
    muted: "#8a8f98",
    accent: "#5e6ad2",
    accent2: "#828fff",
    border: "#23252a",
    onAccent: "#ffffff",
    displayFont: "'Manrope', 'SF Pro Display', sans-serif",
    bodyFont: "'Manrope', 'SF Pro Text', sans-serif",
    googleFonts: "Manrope:wght@400;500;600;700",
    hero: "Plan and build products.",
    artKicker: "SYSTEM / ISSUE LIN-2048",
    artTitle: "Linear",
    gradients: [
      ["Lavender Focus", "radial-gradient(circle at 50% 35%,rgba(130,143,255,.46),rgba(94,106,210,.12) 38%,transparent 70%)", "A quiet focus glow used behind product moments."],
    ],
    components: ["Lavender primary action", "Selected pricing tab", "Issue status card", "Focused command input"],
    dos: ["Keep the canvas at the near-black #010102.", "Use lavender only for focus and primary actions.", "Preserve tight tracking on display typography.", "Separate panels with one-pixel charcoal hairlines."],
    donts: ["Do not brighten the canvas into generic navy.", "Do not scatter lavender as decoration.", "Do not apply large diffuse shadows to cards.", "Do not loosen compact product-interface rhythm."],
  },
  {
    slug: "mistral.ai",
    name: "Mistral AI",
    source: "https://mistral.ai/",
    tone: "sunset",
    canvas: "#fff8e0",
    surface: "#fffaeb",
    surface2: "#fff0c2",
    ink: "#1f1f1f",
    muted: "#6b5b48",
    accent: "#fa520f",
    accent2: "#ffd900",
    border: "#e6d5a8",
    onAccent: "#ffffff",
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    googleFonts: "Cormorant+Garamond:wght@500;600&family=DM+Sans:opsz,wght@9..40,400..600",
    hero: "Frontier intelligence, openly made.",
    artKicker: "LE CHAT / LA PLATEFORME",
    artTitle: "MISTRAL",
    gradients: [
      ["Sunset", "linear-gradient(135deg,#ffd900 0%,#ffb83e 32%,#fa520f 68%,#8f1d00 100%)", "The signature atmospheric transition used with landscape imagery."],
      ["Cream Light", "linear-gradient(180deg,#fffaeb,#fff0c2)", "Warm paper depth for editorial product sections."],
    ],
    components: ["Orange primary CTA", "Model capability card", "Research article tile", "Contact form field"],
    dos: ["Use cream as the dominant paper surface.", "Reserve saturated orange for primary actions.", "Pair editorial serif display with a clean utility sans.", "Close major compositions with the sunset color band."],
    donts: ["Do not cool the palette with generic blue.", "Do not use sunset colors at equal visual weight everywhere.", "Do not replace warm cream with pure clinical white.", "Do not flatten editorial headings into a single sans family."],
  },
  {
    slug: "nintendo-2001",
    name: "Nintendo 2001",
    source: "https://www.nintendo.com/",
    tone: "chrome",
    canvas: "#7a8aba",
    surface: "#9fbee7",
    surface2: "#dedede",
    ink: "#21242e",
    muted: "#3d4f97",
    accent: "#e60012",
    accent2: "#f68d1f",
    border: "#3d4f97",
    onAccent: "#ffffff",
    displayFont: "'Russo One', 'Arial Black', sans-serif",
    bodyFont: "'Rajdhani', Arial, sans-serif",
    googleFonts: "Rajdhani:wght@400;600;700&family=Russo+One",
    hero: "Power on the web.",
    artKicker: "NINTENDO.COM / 2001",
    artTitle: "NINTENDO",
    gradients: [
      ["Console Chrome", "linear-gradient(180deg,#c0d5e6 0%,#8ba1d4 48%,#3d4f97 50%,#9fbee7 100%)", "A hard-stop metallic bevel for console-like panels."],
      ["Amber Signal", "linear-gradient(180deg,#ffd36b,#e48600)", "Navigation glow and forward-action signal."],
    ],
    components: ["Amber navigation control", "Beveled game panel", "News cartridge card", "Player login field"],
    dos: ["Build panels as beveled metallic plates.", "Use amber for navigation and forward cues.", "Set display text in bold outlined hardware type.", "Keep periwinkle chrome as the dominant interface body."],
    donts: ["Do not remove the hard bevel highlights.", "Do not turn the Y2K interface into flat minimalism.", "Do not use large modern corner radii.", "Do not replace compact UI labels with editorial typography."],
  },
  {
    slug: "opencode.ai",
    name: "OpenCode",
    source: "https://opencode.ai/",
    tone: "terminal",
    canvas: "#fdfcfc",
    surface: "#f8f7f7",
    surface2: "#201d1d",
    ink: "#201d1d",
    muted: "#646262",
    accent: "#201d1d",
    accent2: "#9a9898",
    border: "rgba(15,0,0,.18)",
    onAccent: "#fdfcfc",
    displayFont: "'IBM Plex Mono', monospace",
    bodyFont: "'IBM Plex Mono', monospace",
    googleFonts: "IBM+Plex+Mono:wght@400;500;600;700",
    hero: "The open source coding agent.",
    artKicker: "OPENCODE / TTY-01",
    artTitle: ">_",
    gradients: [],
    components: ["Solid terminal command", "Bracketed text action", "TUI output panel", "Command input"],
    dos: ["Use monospaced type for every visible word.", "Keep the warm cream canvas and near-black ink.", "Use [ + ] and [ − ] markers as structural punctuation.", "Separate sections with single hairline rules."],
    donts: ["Do not introduce non-monospace display fonts.", "Do not add gradients, glows or soft shadows.", "Do not round rectangles beyond 4px.", "Do not replace terminal density with oversized marketing cards."],
  },
  {
    slug: "slack",
    name: "Slack",
    source: "https://slack.com/",
    tone: "collaboration",
    canvas: "#ffffff",
    surface: "#f4ede4",
    surface2: "#f9f0ff",
    ink: "#1d1d1d",
    muted: "#696969",
    accent: "#4a154b",
    accent2: "#1264a3",
    border: "#e6e6e6",
    onAccent: "#ffffff",
    displayFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    googleFonts: "DM+Sans:opsz,wght@9..40,400..700",
    hero: "Where work flows together.",
    artKicker: "CHANNEL / DESIGN-SYSTEM",
    artTitle: "#",
    gradients: [
      ["Cream Mesh", "radial-gradient(circle at 20% 20%,#f9f0ff,transparent 42%),radial-gradient(circle at 80% 75%,#d9f5f2,transparent 38%),#f4ede4", "Soft collaboration atmosphere behind product compositions."],
      ["Aubergine", "linear-gradient(135deg,#4a154b,#611f69)", "High-confidence brand band for key closing moments."],
    ],
    components: ["Aubergine primary CTA", "Pill secondary action", "Channel message card", "Workspace search field"],
    dos: ["Anchor key actions in deep aubergine.", "Use cream and lavender as soft section surfaces.", "Keep CTAs pill-shaped and high contrast.", "Use blue for inline links, not primary buttons."],
    donts: ["Do not turn the accent palette into confetti.", "Do not place low-contrast purple text on aubergine.", "Do not square off large call-to-action controls.", "Do not use product screenshots without a soft framing surface."],
  },
  {
    slug: "spacex",
    name: "SpaceX",
    source: "https://www.spacex.com/",
    tone: "orbital",
    canvas: "#000000",
    surface: "#0a0a0a",
    surface2: "#161616",
    ink: "#ffffff",
    muted: "#b6b6be",
    accent: "#ffffff",
    accent2: "#6d8fb8",
    border: "#3a3a3f",
    onAccent: "#000000",
    displayFont: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    bodyFont: "'Barlow', Arial, sans-serif",
    googleFonts: "Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500",
    hero: "Making life multiplanetary.",
    artKicker: "FLIGHT / STARSHIP",
    artTitle: "SPACEX",
    gradients: [],
    components: ["Outlined mission CTA", "Launch status label", "Mission image band", "Updates signup field"],
    dos: ["Use pure black as the primary canvas.", "Set mission headlines in uppercase condensed type.", "Keep UI chrome minimal over immersive imagery.", "Use one outlined action per major visual band."],
    donts: ["Do not add ornamental color to navigation.", "Do not use soft pastel cards on the black canvas.", "Do not over-round controls beyond the documented pill.", "Do not let UI decoration compete with mission imagery."],
  },
  {
    slug: "together.ai",
    name: "Together AI",
    source: "https://www.together.ai/",
    tone: "spectrum",
    canvas: "#010120",
    surface: "#10112d",
    surface2: "#313641",
    ink: "#ffffff",
    muted: "#b8b8c4",
    accent: "#fc4c02",
    accent2: "#bdbbff",
    border: "#313641",
    onAccent: "#ffffff",
    displayFont: "'Manrope', sans-serif",
    bodyFont: "'Manrope', sans-serif",
    googleFonts: "IBM+Plex+Mono:wght@500;600&family=Manrope:wght@400;500;600",
    hero: "The AI acceleration cloud.",
    artKicker: "INFERENCE / RESEARCH",
    artTitle: "TOGETHER",
    gradients: [
      ["Compute Spectrum", "linear-gradient(90deg,#fc4c02,#ef2cc1 52%,#bdbbff)", "The single chromatic brand rail connecting dark infrastructure bands."],
      ["Mint Signal", "linear-gradient(135deg,#c8f6f9,#bdbbff)", "A cool research accent for diagrams and data moments."],
    ],
    components: ["Spectrum primary CTA", "Model endpoint card", "Research metric tile", "API key input"],
    dos: ["Alternate dark infrastructure bands with clear content sections.", "Use the orange–magenta–periwinkle rail as one gesture.", "Pair display sans with uppercase mono labels.", "Keep data cards crisp and grid-aligned."],
    donts: ["Do not split the spectrum into unrelated accent colors.", "Do not use heavy rounded consumer-app cards.", "Do not hide technical hierarchy behind decoration.", "Do not dilute dark hero contrast with gray text."],
  },
  {
    slug: "x.ai",
    name: "xAI",
    source: "https://x.ai/",
    tone: "cosmic",
    canvas: "#0a0a0a",
    surface: "#191919",
    surface2: "#1a1c20",
    ink: "#ffffff",
    muted: "#7d8187",
    accent: "#ffffff",
    accent2: "#ff7a17",
    border: "#212327",
    onAccent: "#0a0a0a",
    displayFont: "'Manrope', sans-serif",
    bodyFont: "'Manrope', sans-serif",
    googleFonts: "IBM+Plex+Mono:wght@500&family=Manrope:wght@400;500;600",
    hero: "Understand the universe.",
    artKicker: "GROK / FRONTIER AI",
    artTitle: "xAI",
    gradients: [
      ["Sunset Dusk", "radial-gradient(circle at 72% 28%,#ffc285 0%,#ff7a17 15%,#7c3aed 37%,#0d1726 68%,#0a0a0a 100%)", "A rare cosmic accent against the strict black surface."],
    ],
    components: ["White pill CTA", "Research navigation link", "Model capability card", "Prompt input"],
    dos: ["Keep the near-black canvas uninterrupted.", "Use white pill outlines for primary interaction.", "Reserve sunset gradients for rare cosmic moments.", "Set captions in uppercase tracked monospace."],
    donts: ["Do not turn dusk accents into a page-wide rainbow.", "Do not add conventional SaaS card shadows.", "Do not introduce soft rounded containers everywhere.", "Do not over-explain the interface with decorative labels."],
  },
  {
    slug: "caldera",
    name: "Caldera",
    source: "https://caldera.xyz/",
    tone: "pixel",
    canvas: "#e2e2df",
    surface: "#f7f6f2",
    surface2: "#070607",
    ink: "#070607",
    muted: "#555552",
    accent: "#fc5000",
    accent2: "#524ae9",
    border: "#b9b9b4",
    onAccent: "#ffffff",
    displayFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    googleFonts: "DM+Sans:opsz,wght@9..40,400..700",
    hero: "Build worlds onchain.",
    description: "A basalt-gray rollup platform energized by digital orange, isolated cyber violet, oversized type and pixel-grid technical texture.",
    artKicker: "ROLLUPS / METALAYER",
    artTitle: "CALDERA",
    gradients: [
      ["Digital Heat", "linear-gradient(135deg,#fc5000,#f5f28e)", "Orange energy resolving into pixel glare."],
      ["Cyber Field", "linear-gradient(135deg,#524ae9,#070607)", "Violet infrastructure depth for technical surfaces."],
    ],
    components: ["Digital orange CTA", "Ghost navigation action", "Rollup stats card", "Network configuration input"],
    dos: ["Use basalt gray as the broad environmental canvas.", "Pair digital orange with isolated cyber violet.", "Let oversized type collide with compact technical labels.", "Use pixel grids and sharp color fields as texture."],
    donts: ["Do not smooth every surface into generic gradients.", "Do not use orange and violet at equal weight in every section.", "Do not replace the near-black technical surface with navy.", "Do not make the layout uniformly polite or centered."],
  },
  {
    slug: "duolingo",
    name: "Duolingo",
    source: "https://www.duolingo.com/",
    tone: "playful",
    canvas: "#ffffff",
    surface: "#f7f7f7",
    surface2: "#e5e5e5",
    ink: "#3c3c3c",
    muted: "#777777",
    accent: "#58cc02",
    accent2: "#1cb0f6",
    border: "#e5e5e5",
    onAccent: "#ffffff",
    displayFont: "'Nunito', sans-serif",
    bodyFont: "'Nunito', sans-serif",
    googleFonts: "Nunito:wght@400;500;600;700;800",
    hero: "Learning made delightfully addictive.",
    description: "A cheerful learning system built from bright green progress, rounded geometry, tactile 3D buttons and a reward-driven accent palette.",
    artKicker: "LESSON / STREAK 07",
    artTitle: "DUO",
    gradients: [
      ["Lesson Green", "linear-gradient(180deg,#58cc02,#46a302)", "Progress fills and primary button depth."],
      ["Super", "linear-gradient(135deg,#ce82ff,#1cb0f6)", "Premium achievements and celebratory badges."],
      ["Streak", "linear-gradient(135deg,#ff9600,#ffc800)", "Warm feedback for learning streaks."],
    ],
    components: ["3D green CTA", "Outlined secondary action", "Lesson progress card", "Answer input"],
    dos: ["Use green for primary actions and progress.", "Keep buttons and badges fully pill-shaped.", "Preserve the four-pixel pressed-button depth.", "Use warm accents for gamification feedback."],
    donts: ["Do not use green as long-form text color.", "Do not flatten the primary button interaction.", "Do not introduce sharp card corners.", "Do not use thin display weights below 400."],
  },
]

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")

const cssValue = (value, fallback) => {
  const text = String(value ?? "")
  const match = text.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/i)
  return match?.[0] ?? fallback
}

const dimensionValue = (value, fallback = "0px") => {
  const match = String(value ?? "").match(/-?\d*\.?\d+(?:px|rem|em|%)\b/i)
  return match?.[0] ?? fallback
}

const entries = (document, key) => Object.entries(document[key] ?? {})
  .map(([name, token]) => [name, token?.$value ?? token])

const unique = (values) => [...new Set(values)]

function excerpt(value, limit = 360) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim()
  if (text.length <= limit) return text
  const shortened = text.slice(0, limit)
  return `${shortened.slice(0, shortened.lastIndexOf(" "))}…`
}

function tokenName(name) {
  return String(name).replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function renderPreview(config, tokens) {
  const colors = entries(tokens, "color")
    .map(([name, value]) => [name, cssValue(value, null)])
    .filter(([, value]) => value)
    .slice(0, 18)
  const typography = entries(tokens, "typography").slice(0, 9)
  const spacing = entries(tokens, "spacing").slice(0, 9)
  const radii = entries(tokens, "radius").slice(0, 7)
  const shadows = entries(tokens, "shadow").slice(0, 5)
  const observedFonts = unique(entries(tokens, "typography")
    .map(([, value]) => value?.fontFamily)
    .filter(Boolean))
    .slice(0, 4)

  const swatches = colors.map(([name, value]) => `
        <article class="swatch reveal">
          <div class="swatch-color" style="background:${escapeHtml(value)}"></div>
          <div class="swatch-copy"><strong>${escapeHtml(tokenName(name))}</strong><code>${escapeHtml(value)}</code><span>--color-${escapeHtml(name)}</span></div>
        </article>`).join("")

  const typeRows = typography.map(([name, value], index) => {
    const fontSize = dimensionValue(value?.fontSize, index < 2 ? "48px" : "16px")
    const family = index < 3 ? config.displayFont : config.bodyFont
    const weight = Number(value?.fontWeight) || (index < 3 ? 600 : 400)
    const lineHeight = value?.lineHeight ?? 1.4
    const tracking = value?.letterSpacing ?? 0
    return `
        <article class="type-row reveal">
          <div class="type-meta"><strong>${escapeHtml(name)}</strong><code>${escapeHtml(fontSize)} · ${escapeHtml(weight)} · ${escapeHtml(lineHeight)} · ${escapeHtml(tracking)}</code></div>
          <div class="type-sample" style="font-family:${family};font-size:clamp(1rem,${escapeHtml(fontSize)},3.75rem);font-weight:${escapeHtml(weight)};line-height:${escapeHtml(lineHeight)};letter-spacing:${escapeHtml(tracking)}">${escapeHtml(index < 3 ? config.hero : `${config.name} builds a recognizable visual language.`)}</div>
        </article>`
  }).join("")

  const spacingItems = spacing.map(([name, value]) => {
    const size = dimensionValue(value, "8px")
    const pixels = Number.parseFloat(size) || 8
    const height = Math.min(96, Math.max(8, pixels * 1.15))
    return `<div class="space-item reveal"><span class="space-bar" style="height:${height}px"></span><strong>${escapeHtml(name)}</strong><code>${escapeHtml(size)}</code></div>`
  }).join("")

  const radiusItems = radii.map(([name, value]) => {
    const radius = dimensionValue(value, "0px")
    return `<article class="radius-item reveal"><div style="border-radius:${escapeHtml(radius)}"></div><strong>${escapeHtml(name)}</strong><code>${escapeHtml(radius)}</code></article>`
  }).join("")

  const shadowContent = shadows.length
    ? `<div class="shadow-grid">${shadows.map(([name, value]) => `<article class="shadow-item reveal" style="box-shadow:${escapeHtml(String(value))}"><strong>${escapeHtml(name)}</strong><code>${escapeHtml(String(value))}</code></article>`).join("")}</div>`
    : `<div class="flat-note reveal"><span>00</span><div><strong>Flat by design</strong><p>No shadow tokens are documented for ${escapeHtml(config.name)}. Surface contrast, borders and composition create hierarchy instead.</p></div></div>`

  const gradientContent = config.gradients.length
    ? `<section class="section" id="treatments"><div class="section-head reveal"><p class="eyebrow">Signature treatments</p><h2>Color in motion.</h2><p>Brand-specific transitions and surface gestures documented for ${escapeHtml(config.name)}.</p></div><div class="gradient-grid">${config.gradients.map(([name, background, description]) => `<article class="gradient-card reveal" style="background:${background}"><div><strong>${escapeHtml(name)}</strong><p>${escapeHtml(description)}</p></div></article>`).join("")}</div></section>`
    : ""

  const fontRows = observedFonts.length
    ? observedFonts.map((font, index) => `<div class="font-row"><span>${index === 0 ? "Primary" : `Family ${index + 1}`}</span><strong>${escapeHtml(font)}</strong><small>${index === 0 ? `Previewed with ${escapeHtml(config.displayFont.replaceAll("'", ""))}` : "Documented brand family"}</small></div>`).join("")
    : `<div class="font-row"><span>Primary</span><strong>${escapeHtml(config.displayFont.replaceAll("'", ""))}</strong><small>Open-source preview substitute</small></div>`

  const componentCards = config.components.map((name, index) => {
    const preview = index === 0
      ? `<button class="button button-primary">${escapeHtml(name)}</button><button class="button button-primary state-demo">Hover / active</button>`
      : index === 1
        ? `<button class="button button-secondary">${escapeHtml(name)}</button><button class="button button-quiet">Quiet action</button>`
        : index === 2
          ? `<article class="mini-card"><span class="mini-label">Featured</span><strong>${escapeHtml(name)}</strong><p>Brand surface, type and border treatments working as one component.</p><div class="mini-progress"><span></span></div></article>`
          : `<label class="demo-field"><span>${escapeHtml(name)}</span><input value="Focused state" aria-label="${escapeHtml(name)}"><small>Documented focus treatment</small></label>`
    return `<article class="component-card reveal"><header><div><span>0${index + 1}</span><h3>${escapeHtml(name)}</h3></div><code>${index === 0 ? ".button-primary" : index === 1 ? ".button-secondary" : index === 2 ? ".brand-card" : "input:focus"}</code></header><div class="component-stage">${preview}</div></article>`
  }).join("")

  const doItems = config.dos.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
  const dontItems = config.donts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
  const colorCount = colors.length
  const typeCount = entries(tokens, "typography").length
  const spacingCount = entries(tokens, "spacing").length
  const radiusCount = entries(tokens, "radius").length
  const description = excerpt(config.description || tokens.meta?.description || `${config.name} design system reference.`)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="design-source" content="${escapeHtml(config.source)}">
  <title>${escapeHtml(config.name)} — Design System Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${config.googleFonts}&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box}
    :root{
      --canvas:${config.canvas};--surface:${config.surface};--surface-2:${config.surface2};
      --ink:${config.ink};--muted:${config.muted};--accent:${config.accent};--accent-2:${config.accent2};
      --border:${config.border};--on-accent:${config.onAccent};
      --display:${config.displayFont};--body:${config.bodyFont};
      --radius:${config.tone === "retro" || config.tone === "terminal" ? "4px" : config.tone === "playful" ? "18px" : "12px"};
      --section-space:clamp(72px,10vw,132px);
    }
    html{scroll-behavior:smooth}
    body{margin:0;background:var(--canvas);color:var(--ink);font:400 16px/1.55 var(--body);-webkit-font-smoothing:antialiased}
    ::selection{background:var(--accent);color:var(--on-accent)}
    a{color:inherit}
    button,input{font:inherit}
    code{font:500 11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}
    .page-shell{min-height:100vh;overflow:hidden;background:var(--canvas)}
    .wrap{width:min(1120px,calc(100% - 48px));margin-inline:auto}
    .nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;min-height:68px;padding:0 max(24px,calc((100vw - 1120px)/2));border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--canvas) 88%,transparent);backdrop-filter:blur(18px)}
    .brand-lockup{display:flex;align-items:center;gap:12px;text-decoration:none;font:700 18px/1 var(--display);letter-spacing:-.02em}
    .brand-lockup i{width:11px;height:11px;background:var(--accent);border-radius:${config.tone === "retro" || config.tone === "terminal" ? "0" : "50%"};box-shadow:16px 0 0 var(--accent-2)}
    .nav-links{display:flex;align-items:center;gap:4px}.nav-links a{padding:8px 10px;color:var(--muted);text-decoration:none;font-size:12px;font-weight:600}.nav-links a:hover{color:var(--ink)}
    .source-link{border:1px solid var(--border);border-radius:999px!important;margin-left:8px;color:var(--ink)!important}
    .hero{position:relative;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.75fr);gap:clamp(40px,7vw,96px);align-items:center;min-height:calc(100vh - 68px);padding-block:clamp(72px,10vw,132px);border-bottom:1px solid var(--border)}
    .hero-copy{position:relative;z-index:2}.eyebrow{margin:0 0 18px;color:var(--accent);font:700 11px/1.2 ui-monospace,SFMono-Regular,monospace;letter-spacing:.16em;text-transform:uppercase}
    .hero h1{max-width:790px;margin:0;font:600 clamp(58px,9.4vw,132px)/.86 var(--display);letter-spacing:-.055em;text-wrap:balance}
    .hero-summary{max-width:680px;margin:30px 0 0;color:var(--muted);font-size:clamp(16px,1.6vw,19px);line-height:1.65}
    .hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px}
    .button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 18px;border:1px solid var(--border);border-radius:${config.tone === "retro" || config.tone === "terminal" ? "4px" : "999px"};cursor:pointer;text-decoration:none;font-weight:700;transition:transform .18s,background .18s,color .18s,border-color .18s}
    .button:active{transform:translateY(2px)}.button-primary{border-color:var(--accent);background:var(--accent);color:var(--on-accent)}.button-primary:hover{filter:brightness(1.08);transform:translateY(-2px)}
    .button-secondary{background:transparent;color:var(--ink)}.button-secondary:hover,.button-quiet:hover{border-color:var(--accent);color:var(--accent)}.button-quiet{border-color:transparent;background:transparent;color:var(--muted)}
    .hero-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:34px}.hero-stats span{padding:6px 10px;border:1px solid var(--border);border-radius:999px;color:var(--muted);font:600 11px/1.2 ui-monospace,SFMono-Regular,monospace}
    .hero-art{position:relative;min-height:480px;border:1px solid var(--border);border-radius:calc(var(--radius) * 1.5);overflow:hidden;background:var(--surface);isolation:isolate}
    .hero-art::before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 68% 30%,color-mix(in srgb,var(--accent) 70%,transparent),transparent 32%),radial-gradient(circle at 20% 80%,color-mix(in srgb,var(--accent-2) 45%,transparent),transparent 38%);filter:blur(16px);opacity:.68}
    .art-grid{position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--border) 70%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--border) 70%,transparent) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 90%)}
    .art-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:28px}.art-content small{font:700 10px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.14em;color:var(--muted)}
    .art-title{font:700 clamp(66px,9vw,122px)/.75 var(--display);letter-spacing:-.07em;color:var(--ink);text-transform:${config.tone === "linear" ? "none" : "uppercase"};overflow-wrap:anywhere}
    .art-chips{display:flex;gap:7px}.art-chips span{height:7px;flex:1;background:var(--accent)}.art-chips span:nth-child(2){background:var(--accent-2)}.art-chips span:nth-child(3){background:var(--ink)}
    .section{padding-block:var(--section-space);border-bottom:1px solid var(--border)}
    .section-head{display:grid;grid-template-columns:minmax(130px,.35fr) minmax(260px,.9fr) minmax(260px,.75fr);gap:24px;align-items:start;margin-bottom:48px}.section-head .eyebrow{margin-top:9px}.section-head h2{margin:0;font:600 clamp(38px,6vw,72px)/.95 var(--display);letter-spacing:-.045em}.section-head>p:last-child{margin:6px 0 0;color:var(--muted);line-height:1.7}
    .color-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.swatch{min-width:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--surface)}.swatch-color{height:132px;border-bottom:1px solid var(--border)}.swatch-copy{display:grid;gap:3px;padding:14px}.swatch-copy strong{font-size:13px}.swatch-copy code,.swatch-copy span{color:var(--muted);font-size:10px;overflow-wrap:anywhere}
    .gradient-grid{display:grid;grid-template-columns:repeat(${Math.min(3, Math.max(1, config.gradients.length))},1fr);gap:14px}.gradient-card{display:flex;align-items:flex-end;min-height:280px;padding:24px;border:1px solid var(--border);border-radius:calc(var(--radius) * 1.4);overflow:hidden}.gradient-card>div{max-width:360px;padding:16px;background:color-mix(in srgb,var(--canvas) 82%,transparent);color:var(--ink);border:1px solid color-mix(in srgb,var(--border) 70%,transparent);border-radius:var(--radius);backdrop-filter:blur(14px)}.gradient-card strong{font:600 22px/1.1 var(--display)}.gradient-card p{margin:8px 0 0;color:var(--muted);font-size:12px}
    .type-table{border-top:1px solid var(--border)}.type-row{display:grid;grid-template-columns:210px minmax(0,1fr);gap:32px;align-items:center;padding:26px 0;border-bottom:1px solid var(--border)}.type-meta{display:grid;gap:5px}.type-meta strong{font-size:12px;text-transform:uppercase}.type-meta code{color:var(--muted)}.type-sample{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .font-table{margin-top:42px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}.font-row{display:grid;grid-template-columns:100px 1fr 1fr;gap:20px;padding:17px 20px;border-bottom:1px solid var(--border);background:var(--surface)}.font-row:last-child{border-bottom:0}.font-row span,.font-row small{color:var(--muted);font-size:11px}.font-row strong{font-family:var(--display)}
    .metric-title{margin:46px 0 20px;font:600 20px/1.2 var(--display)}.spacing-grid{display:flex;align-items:flex-end;gap:12px;min-height:150px;padding:24px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.space-item{display:grid;flex:1;gap:6px;justify-items:center;min-width:44px}.space-bar{display:block;width:100%;max-width:72px;background:var(--accent);border-radius:3px 3px 0 0}.space-item strong{font-size:11px}.space-item code{color:var(--muted);font-size:9px}
    .radius-grid,.shadow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}.radius-item,.shadow-item{display:grid;place-items:center;gap:10px;min-height:160px;padding:18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.radius-item>div{width:72px;height:72px;border:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface))}.radius-item code,.shadow-item code{color:var(--muted);text-align:center}.shadow-item{min-height:130px;margin:10px;background:var(--surface)}
    .flat-note{display:flex;align-items:center;gap:22px;padding:28px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.flat-note>span{font:700 44px/1 var(--display);color:var(--accent)}.flat-note p{margin:4px 0 0;color:var(--muted)}
    .surface-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.surface-card{min-height:180px;padding:20px;border:1px solid var(--border);border-radius:var(--radius);display:flex;flex-direction:column;justify-content:flex-end}.surface-card strong{font:600 22px/1 var(--display)}.surface-card code{margin-top:8px;color:var(--muted)}
    .component-list{display:grid;gap:18px}.component-card{border:1px solid var(--border);border-radius:calc(var(--radius) * 1.25);overflow:hidden;background:var(--surface)}.component-card>header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:17px 20px;border-bottom:1px solid var(--border)}.component-card>header>div{display:flex;align-items:center;gap:14px}.component-card header span{color:var(--accent);font:600 10px/1 ui-monospace,monospace}.component-card h3{margin:0;font:600 16px/1.2 var(--display)}.component-card header code{color:var(--muted)}.component-stage{display:flex;align-items:center;gap:12px;min-height:170px;padding:30px;background:color-mix(in srgb,var(--surface) 65%,var(--canvas));overflow:auto}.state-demo{filter:brightness(1.08);transform:translateY(-2px)}
    .mini-card{width:min(340px,100%);padding:22px;border:1px solid var(--border);border-radius:var(--radius);background:var(--canvas)}.mini-card strong{display:block;margin-top:10px;font:600 22px/1.2 var(--display)}.mini-card p{color:var(--muted);font-size:13px}.mini-label{color:var(--accent);font:700 10px/1 ui-monospace,monospace;text-transform:uppercase}.mini-progress{height:6px;margin-top:18px;background:var(--border);overflow:hidden;border-radius:99px}.mini-progress span{display:block;width:68%;height:100%;background:var(--accent)}
    .demo-field{display:grid;gap:7px;width:min(390px,100%);font-size:12px;font-weight:600}.demo-field input{width:100%;padding:13px 14px;border:1px solid var(--accent);border-radius:${config.tone === "retro" || config.tone === "terminal" ? "2px" : "8px"};outline:3px solid color-mix(in srgb,var(--accent) 18%,transparent);background:var(--canvas);color:var(--ink)}.demo-field small{color:var(--muted);font-weight:400}
    .guide-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.guide-card{padding:28px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.guide-card.do{border-top:4px solid var(--accent)}.guide-card.dont{border-top:4px solid var(--accent-2)}.guide-card h3{margin:0 0 22px;font:600 24px/1 var(--display)}.guide-card ul{display:grid;gap:13px;margin:0;padding:0;list-style:none}.guide-card li{position:relative;padding-left:22px;color:var(--muted);font-size:14px}.guide-card li::before{position:absolute;left:0;color:var(--accent);font-weight:800}.guide-card.do li::before{content:"+"}.guide-card.dont li::before{content:"×";color:var(--accent-2)}
    .footer{display:flex;justify-content:space-between;gap:30px;padding:44px max(24px,calc((100vw - 1120px)/2));color:var(--muted);font-size:12px}.footer-links{display:flex;flex-wrap:wrap;gap:18px}.footer a:hover{color:var(--ink)}
    .reveal{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}.reveal.visible{opacity:1;transform:none}
    body[data-tone="retro"]{background:#000}.page-shell[data-tone="retro"]{width:min(1180px,calc(100% - 28px));margin:auto;border-inline:10px solid #000}.page-shell[data-tone="retro"] .nav{backdrop-filter:none;background:#fff}.page-shell[data-tone="retro"] .hero-art,.page-shell[data-tone="retro"] .component-card{box-shadow:8px 8px 0 #000}.page-shell[data-tone="retro"] .hero h1{text-transform:uppercase}.page-shell[data-tone="retro"] .art-grid{background-size:8px 8px}
    .page-shell[data-tone="motorsport"] .hero-art::after{content:"";position:absolute;left:0;right:0;bottom:32%;height:18px;background:linear-gradient(90deg,#0066b1 0 33%,#1c69d4 33% 66%,#e22718 66%)}
    .page-shell[data-tone="chevron"] .hero-art::after{content:"";position:absolute;width:230px;height:460px;right:-100px;top:10px;background:var(--accent);transform:skewX(-24deg);opacity:.75}
    .page-shell[data-tone="precision"] .hero-art{box-shadow:0 0 90px rgba(94,106,210,.18)}.page-shell[data-tone="precision"] .art-grid{background-size:24px 24px}
    .page-shell[data-tone="sunset"] .hero-art::before{background:linear-gradient(155deg,#ffd900,#fa520f 60%,#6f1700);filter:none;opacity:1}.page-shell[data-tone="sunset"] .art-title{font-family:'Cormorant Garamond',serif}
    .page-shell[data-tone="chrome"] .hero-art,.page-shell[data-tone="chrome"] .component-card{box-shadow:inset 3px 3px 0 #d7e6f5,inset -4px -4px 0 #3d4f97,6px 7px 0 rgba(33,36,46,.25)}.page-shell[data-tone="chrome"] .nav{background:#21242e;color:#fff}.page-shell[data-tone="chrome"] .nav-links a{color:#ecab37}
    .page-shell[data-tone="chrome"] .source-link{color:#ecab37!important;border-color:#60619c}
    .page-shell[data-tone="terminal"] *{border-radius:4px!important}.page-shell[data-tone="terminal"] .hero-art::before{background:#201d1d;filter:none;opacity:1}.page-shell[data-tone="terminal"] .art-grid{background-image:linear-gradient(rgba(253,252,252,.07) 1px,transparent 1px);background-size:100% 24px}.page-shell[data-tone="terminal"] .art-title{color:#fdfcfc}.page-shell[data-tone="terminal"] .art-content small{color:#9a9898}
    .page-shell[data-tone="collaboration"] .hero-art::after{content:"";position:absolute;width:120px;height:120px;border-radius:32px;right:28px;top:28px;background:conic-gradient(#36c5f0 0 25%,#2eb67d 0 50%,#ecb22e 0 75%,#e01e5a 0)}
    .page-shell[data-tone="orbital"] .hero-art::before{background:radial-gradient(circle at 72% 72%,#d9e5ef 0 2%,#536779 3%,#14202b 17%,transparent 36%),radial-gradient(circle,#fff 0 1px,transparent 1.5px);background-size:auto,29px 29px;filter:none;opacity:.8}.page-shell[data-tone="orbital"] h1,.page-shell[data-tone="orbital"] h2{text-transform:uppercase}
    .page-shell[data-tone="spectrum"] .hero-art::after{content:"";position:absolute;left:0;right:0;bottom:0;height:18px;background:linear-gradient(90deg,#fc4c02,#ef2cc1,#bdbbff)}
    .page-shell[data-tone="cosmic"] .hero-art::before{background:radial-gradient(circle at 66% 30%,#ffc285,#ff7a17 10%,#7c3aed 28%,#0d1726 54%,#0a0a0a 75%);filter:none;opacity:1}
    .page-shell[data-tone="pixel"] .hero-art::after{content:"";position:absolute;inset:auto 0 0 auto;width:52%;height:44%;background:linear-gradient(90deg,var(--accent) 50%,transparent 0),linear-gradient(var(--accent-2) 50%,transparent 0);background-size:38px 38px;mix-blend-mode:multiply}
    .page-shell[data-tone="playful"] .button-primary{box-shadow:0 4px 0 #46a302}.page-shell[data-tone="playful"] .button-primary:active{box-shadow:0 2px 0 #46a302}.page-shell[data-tone="playful"] .hero-art{border-radius:28px}.page-shell[data-tone="playful"] .hero-art::after{content:"★";position:absolute;right:34px;top:28px;color:#ffc800;font-size:64px;transform:rotate(12deg)}
    @media(max-width:900px){.nav-links a:not(.source-link){display:none}.hero{grid-template-columns:1fr;min-height:auto}.hero-art{min-height:380px}.section-head{grid-template-columns:1fr}.section-head .eyebrow{margin-bottom:0}.color-grid{grid-template-columns:repeat(2,1fr)}.gradient-grid{grid-template-columns:1fr}.type-row{grid-template-columns:1fr}.surface-grid{grid-template-columns:1fr}.font-row{grid-template-columns:80px 1fr}.font-row small{grid-column:2}.guide-grid{grid-template-columns:1fr}}
    @media(max-width:560px){.wrap{width:min(100% - 28px,1120px)}.nav{padding-inline:14px}.brand-lockup{font-size:15px}.source-link{font-size:10px!important}.hero h1{font-size:clamp(48px,17vw,82px)}.hero-art{min-height:320px}.color-grid{grid-template-columns:1fr 1fr}.swatch-color{height:100px}.spacing-grid{overflow-x:auto;align-items:flex-end}.space-item{min-width:58px}.component-stage{padding:20px;align-items:flex-start;flex-direction:column}.footer{flex-direction:column}.page-shell[data-tone="retro"]{width:100%;border-inline:5px solid #000}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.reveal{opacity:1;transform:none;transition:none}.button{transition:none}}
  </style>
</head>
<body>
  <div class="page-shell" data-tone="${escapeHtml(config.tone)}">
    <nav class="nav" aria-label="Preview navigation">
      <a class="brand-lockup" href="#top"><i aria-hidden="true"></i>${escapeHtml(config.name)}</a>
      <div class="nav-links">
        <a href="#colors">Colors</a><a href="#typography">Type</a><a href="#spacing">Metrics</a><a href="#components">Components</a>
        <a class="source-link" href="${escapeHtml(config.source)}" target="_blank" rel="noopener noreferrer">Official site ↗</a>
      </div>
    </nav>

    <main class="wrap" id="top">
      <header class="hero">
        <div class="hero-copy reveal">
          <p class="eyebrow">${escapeHtml(config.name)} / Design system</p>
          <h1>${escapeHtml(config.hero)}</h1>
          <p class="hero-summary">${escapeHtml(description)}</p>
          <div class="hero-actions">
            <a class="button button-primary" href="DESIGN.md" download>Download spec</a>
            <a class="button button-secondary" href="tokens.json" download>Tokens JSON</a>
            <a class="button button-quiet" href="variables.css" download>Variables CSS</a>
            <a class="button button-quiet" href="theme.css" download>Tailwind theme</a>
          </div>
          <div class="hero-stats"><span>${colorCount} colors</span><span>${typeCount} type styles</span><span>${spacingCount} spacing steps</span><span>${radiusCount} radii</span></div>
        </div>
        <div class="hero-art reveal" aria-label="${escapeHtml(config.name)} visual signature">
          <div class="art-grid"></div><div class="art-content"><small>${escapeHtml(config.artKicker)}</small><div class="art-title">${escapeHtml(config.artTitle)}</div><div class="art-chips"><span></span><span></span><span></span></div></div>
        </div>
      </header>

      <section class="section" id="colors">
        <div class="section-head reveal"><p class="eyebrow">01 / Foundation</p><h2>Color tokens.</h2><p>Real values from the packaged ${escapeHtml(config.name)} design reference. Semantic names remain searchable in CSS and JSON exports.</p></div>
        <div class="color-grid">${swatches}</div>
      </section>

      ${gradientContent}

      <section class="section" id="typography">
        <div class="section-head reveal"><p class="eyebrow">02 / Typography</p><h2>Voice at every scale.</h2><p>Documented sizes, weights, line heights and tracking. Proprietary families fall back to an open-source preview substitute.</p></div>
        <div class="type-table">${typeRows}</div>
        <h3 class="metric-title">Font families</h3><div class="font-table">${fontRows}</div>
      </section>

      <section class="section" id="spacing">
        <div class="section-head reveal"><p class="eyebrow">03 / Geometry</p><h2>Rhythm and shape.</h2><p>Spacing and corner geometry are presented directly from the package rather than normalized into a generic scale.</p></div>
        <h3 class="metric-title">Spacing scale</h3><div class="spacing-grid">${spacingItems}</div>
        <h3 class="metric-title">Border radius</h3><div class="radius-grid">${radiusItems}</div>
        <h3 class="metric-title">Shadows</h3>${shadowContent}
      </section>

      <section class="section" id="surfaces">
        <div class="section-head reveal"><p class="eyebrow">04 / Depth</p><h2>Surface hierarchy.</h2><p>Three working levels show how the brand creates hierarchy using contrast, borders and restrained elevation.</p></div>
        <div class="surface-grid"><article class="surface-card reveal" style="background:var(--canvas)"><strong>Canvas</strong><code>${escapeHtml(config.canvas)}</code></article><article class="surface-card reveal" style="background:var(--surface)"><strong>Surface</strong><code>${escapeHtml(config.surface)}</code></article><article class="surface-card reveal" style="background:var(--surface-2);color:${escapeHtml(config.tone === "sunset" || config.tone === "retro" || config.tone === "chrome" || config.tone === "playful" ? config.ink : config.ink)}"><strong>Emphasis</strong><code>${escapeHtml(config.surface2)}</code></article></div>
      </section>

      <section class="section" id="components">
        <div class="section-head reveal"><p class="eyebrow">05 / Components</p><h2>Brand behavior.</h2><p>Live controls combine the documented palette, typography, geometry and interaction hierarchy.</p></div>
        <div class="component-list">${componentCards}</div>
      </section>

      <section class="section" id="guidelines">
        <div class="section-head reveal"><p class="eyebrow">06 / Guidelines</p><h2>Keep it recognizable.</h2><p>Concrete implementation guardrails for preserving the visual character of ${escapeHtml(config.name)}.</p></div>
        <div class="guide-grid"><article class="guide-card do reveal"><h3>Do / Embrace</h3><ul>${doItems}</ul></article><article class="guide-card dont reveal"><h3>Don't / Avoid</h3><ul>${dontItems}</ul></article></div>
      </section>
    </main>

    <footer class="footer"><span>${escapeHtml(config.name)} design system preview</span><div class="footer-links"><a href="#colors">Colors</a><a href="#typography">Typography</a><a href="#spacing">Spacing</a><a href="#components">Components</a><a href="${escapeHtml(config.source)}" target="_blank" rel="noopener noreferrer">Compare official site ↗</a></div></footer>
  </div>
  <script>
    const observer = new IntersectionObserver((items) => {
      items.forEach((item) => {
        if (!item.isIntersecting) return
        item.target.classList.add("visible")
        observer.unobserve(item.target)
      })
    }, { threshold: 0.08, rootMargin: "0px 0px -32px" })
    document.querySelectorAll(".reveal").forEach((element, index) => {
      element.style.transitionDelay = String(Math.min(index % 6, 4) * 45) + "ms"
      observer.observe(element)
    })
  </script>
</body>
</html>
`
}

for (const config of brands) {
  const sourceDirectory = path.join(publicRoot, config.slug)
  const tokenPath = path.join(sourceDirectory, "tokens.json")
  if (!fs.existsSync(tokenPath)) throw new Error(`Missing tokens for ${config.slug}`)
  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf8"))
  const output = renderPreview(config, tokens)
  const docsDirectory = path.join(docsRoot, config.slug)
  fs.mkdirSync(docsDirectory, { recursive: true })
  fs.writeFileSync(path.join(docsDirectory, "preview.html"), output)
  fs.writeFileSync(path.join(sourceDirectory, "preview.html"), output)
}

console.log(`Generated and synchronized ${brands.length} brand previews.`)
