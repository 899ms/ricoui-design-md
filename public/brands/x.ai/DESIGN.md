# xAI-Inspired — Style Reference
> An inspired interpretation of xAI's design language — Elon Musk's frontier-AI company whose web surface is a strict near-black canvas broken only by white pill outlines, occasional warm sunset / dusk gradient accents, a custom geometric sans (Universal Sans) for display, and an uppercase tracked monospace caption face; the whole system reads as engineered-cosmic, unmarketed.

**Theme:** dark

**Source website:** [https://x.ai/](https://x.ai/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#ffffff` | `--color-primary` | primary role extracted from the source design |
| on primary | `#0a0a0a` | `--color-on-primary` | on primary role extracted from the source design |
| ink | `#ffffff` | `--color-ink` | ink role extracted from the source design |
| ink hover | `#fafaf7` | `--color-ink-hover` | ink hover role extracted from the source design |
| body | `#dadbdf` | `--color-body` | body role extracted from the source design |
| body mid | `#7d8187` | `--color-body-mid` | body mid role extracted from the source design |
| mute | `#7d8187` | `--color-mute` | mute role extracted from the source design |
| hairline | `#212327` | `--color-hairline` | hairline role extracted from the source design |
| canvas | `#0a0a0a` | `--color-canvas` | canvas role extracted from the source design |
| canvas soft | `#1a1c20` | `--color-canvas-soft` | canvas soft role extracted from the source design |
| canvas card | `#191919` | `--color-canvas-card` | canvas card role extracted from the source design |
| canvas mid | `#363a3f` | `--color-canvas-mid` | canvas mid role extracted from the source design |
| accent sunset | `#ff7a17` | `--color-accent-sunset` | accent sunset role extracted from the source design |
| accent sunset soft | `#ffc285` | `--color-accent-sunset-soft` | accent sunset soft role extracted from the source design |
| accent dusk | `#7c3aed` | `--color-accent-dusk` | accent dusk role extracted from the source design |
| accent twilight | `#c4b5fd` | `--color-accent-twilight` | accent twilight role extracted from the source design |
| accent breeze | `#a0c3ec` | `--color-accent-breeze` | accent breeze role extracted from the source design |
| accent midnight | `#0d1726` | `--color-accent-midnight` | accent midnight role extracted from the source design |

## Tokens — Typography

### universalSans, Inter, system-ui, -apple-system, sans-serif · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 96px
- **Line height:** 96px
- **Letter spacing:** -2.4px
- **Role:** Brand typography family observed across the documented type scale.

### universalSans, Inter, system-ui, sans-serif · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 72px, 48px, 32px, 20px, 18px, 16px, 14px
- **Line height:** 72px, 48px, 36px, 28px, 24px, 20px
- **Letter spacing:** -1.8px, -1.2px, -0.6px, 0
- **Role:** Brand typography family observed across the documented type scale.

### GeistMono, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace · `--font-family-3`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 14px
- **Line height:** 20px
- **Letter spacing:** 1.4px
- **Role:** Brand typography family observed across the documented type scale.

### GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace · `--font-family-4`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 12px
- **Line height:** 16px
- **Letter spacing:** 1.2px
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-xl | 96px | 96px | -2.4px | `--text-display-xl` |
| display-lg | 72px | 72px | -1.8px | `--text-display-lg` |
| display-md | 48px | 48px | -1.2px | `--text-display-md` |
| display-sm | 32px | 36px | -0.6px | `--text-display-sm` |
| display-xs | 20px | 28px | 0 | `--text-display-xs` |
| body-lg | 18px | 28px | 0 | `--text-body-lg` |
| body-md | 16px | 24px | 0 | `--text-body-md` |
| body-sm | 14px | 20px | 0 | `--text-body-sm` |
| caption-mono | 14px | 20px | 1.4px | `--text-caption-mono` |
| caption-mono-sm | 12px | 16px | 1.2px | `--text-caption-mono-sm` |
| button-md | 14px | 20px | 0 | `--text-button-md` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xxs | 2px | `--spacing-xxs` |
| xs | 4px | `--spacing-xs` |
| sm | 8px | `--spacing-sm` |
| md | 12px | `--spacing-md` |
| lg | 16px | `--spacing-lg` |
| xl | 24px | `--spacing-xl` |
| 2xl | 32px | `--spacing-2xl` |
| 3xl | 48px | `--spacing-3xl` |
| 4xl | 64px | `--spacing-4xl` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| none | 0px | `--radius-none` |
| sm | 8px | `--radius-sm` |
| pill | 9999px | `--radius-pill` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 64px
- **Card padding:** 16px
- **Element gap:** 12px
- **Max content width:** 1200px

## Components

### nav bar
**Role:** nav bar component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`
- **padding:** `{spacing.md} {spacing.xl}`

### nav link
**Role:** nav link component

- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **borderColor:** `{colors.primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.xs} {spacing.md}`

### button outline on dark
**Role:** button outline on dark component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.sm} {spacing.lg}`

### button outline sm
**Role:** button outline sm component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `{spacing.xs} {spacing.md}`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.md} {spacing.lg}`

### card content
**Role:** card content component

- **backgroundColor:** `{colors.canvas-card}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### card feature product
**Role:** card feature product component

- **backgroundColor:** `{colors.canvas-card}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### hero band
**Role:** hero band component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-xl}`
- **padding:** `{spacing.4xl} {spacing.xl}`

### content band
**Role:** content band component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-md}`
- **padding:** `{spacing.4xl} {spacing.xl}`

### eyebrow mono
**Role:** eyebrow mono component

- **textColor:** `{colors.ink}`
- **typography:** `{typography.caption-mono}`

### divider hairline
**Role:** divider hairline component

- **borderColor:** `{colors.hairline}`

### footer
**Role:** footer component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.body}`
- **typography:** `{typography.body-sm}`
- **padding:** `{spacing.3xl} {spacing.xl}`

### ex pricing tier
**Role:** ex pricing tier component

- **description:** `Default Pricing tier card. Re-uses feature-card chrome with brand canvas-soft surface.`
- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### ex pricing tier featured
**Role:** ex pricing tier featured component

- **description:** `Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode).`
- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### ex product selector
**Role:** ex product selector component

- **description:** `What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery).`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### ex cart drawer
**Role:** ex cart drawer component

- **description:** `Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart).`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`
- **item-divider:** `{colors.hairline}`

### ex app shell row
**Role:** ex app shell row component

- **description:** `Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.`
- **backgroundColor:** `{colors.canvas}`
- **activeIndicator:** `{colors.primary}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.md} {spacing.lg}`

### ex data table cell
**Role:** ex data table cell component

- **description:** `Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.`
- **headerBackground:** `{colors.canvas-soft}`
- **headerTypography:** `{typography.caption-mono}`
- **bodyTypography:** `{typography.body-sm}`
- **cellPadding:** `{spacing.md} {spacing.lg}`
- **rowBorder:** `{colors.hairline}`

### ex auth form card
**Role:** ex auth form card component

- **description:** `Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### ex modal card
**Role:** ex modal card component

- **description:** `Modal dialog surface — same chrome as feature-card with elevated shadow.`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xl}`

### ex empty state card
**Role:** ex empty state card component

- **description:** `Empty-state illustration frame.`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.3xl}`
- **captionTypography:** `{typography.body-md}`

### ex toast
**Role:** ex toast component

- **description:** `Toast notification surface — feature-card shape + medium shadow.`
- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.md} {spacing.lg}`
- **typography:** `{typography.body-sm}`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live xAI-Inspired website](https://x.ai/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://x.ai/).
