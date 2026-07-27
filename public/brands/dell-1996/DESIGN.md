# Dell 1996 Inspired — Style Reference
> An inspired interpretation of Dell.com's 1996 design language — a catalog-era enterprise web design built around a literal black page frame, vivid flat color-block "ribbon cards" tinted in sage, salmon, periwinkle, sky, peach and lime, chunky Helvetica-Black display titles, Times Roman body copy, and an entire visual vocabulary of pre-Photoshop hand-cut GIF stickers (NEW! bursts, award seals, beveled product photos).

**Theme:** light

**Source website:** [https://www.dell.com/](https://www.dell.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#e91d2a` | `--color-primary` | primary role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| canvas | `#ffffff` | `--color-canvas` | canvas role extracted from the source design |
| surface | `#ffffff` | `--color-surface` | surface role extracted from the source design |
| ink | `#000000` | `--color-ink` | ink role extracted from the source design |
| frame ink | `#000000` | `--color-frame-ink` | frame ink role extracted from the source design |
| yellow sticker | `#fcc20f` | `--color-yellow-sticker` | yellow sticker role extracted from the source design |
| purple stripe | `#6a26a4` | `--color-purple-stripe` | purple stripe role extracted from the source design |
| link | `#0000ee` | `--color-link` | link role extracted from the source design |
| tint olive | `#8e8a25` | `--color-tint-olive` | tint olive role extracted from the source design |
| tint sage | `#b3bd95` | `--color-tint-sage` | tint sage role extracted from the source design |
| tint salmon | `#d77a7a` | `--color-tint-salmon` | tint salmon role extracted from the source design |
| tint peach | `#e6915d` | `--color-tint-peach` | tint peach role extracted from the source design |
| tint lime | `#c0d4a7` | `--color-tint-lime` | tint lime role extracted from the source design |
| tint sky | `#9ab6c8` | `--color-tint-sky` | tint sky role extracted from the source design |
| tint steel | `#a5b8c0` | `--color-tint-steel` | tint steel role extracted from the source design |
| tint periwinkle | `#8c9ae0` | `--color-tint-periwinkle` | tint periwinkle role extracted from the source design |

## Tokens — Typography

### Arial Black · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 900
- **Sizes:** 36px, 24px
- **Line height:** 1, 1.05
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### Helvetica · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 700
- **Sizes:** 16px, 14px, 12px
- **Line height:** 1.2, 1
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### Times New Roman · `--font-family-3`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 14px, 12px, 11px
- **Line height:** 1.4, 1.35
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display | 36px | 1 | 0 | `--text-display` |
| heading-1 | 24px | 1.05 | 0 | `--text-heading-1` |
| heading-2 | 16px | 1.2 | 0 | `--text-heading-2` |
| heading-3 | 14px | 1.2 | 0 | `--text-heading-3` |
| body | 14px | 1.4 | 0 | `--text-body` |
| body-sm | 12px | 1.4 | 0 | `--text-body-sm` |
| caption | 11px | 1.35 | 0 | `--text-caption` |
| button | 12px | 1 | 0 | `--text-button` |
| link | 14px | 1.4 | 0 | `--text-link` |
| ui-label | 12px | 1 | 0 | `--text-ui-label` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xxs | 2px | `--spacing-xxs` |
| xs | 4px | `--spacing-xs` |
| s | 6px | `--spacing-s` |
| sm | 8px | `--spacing-sm` |
| m | 10px | `--spacing-m` |
| md | 12px | `--spacing-md` |
| lg | 16px | `--spacing-lg` |
| xl | 20px | `--spacing-xl` |
| xxl | 24px | `--spacing-xxl` |
| section-sm | 32px | `--spacing-section-sm` |
| section | 40px | `--spacing-section` |
| section-lg | 48px | `--spacing-section-lg` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| none | 0px | `--radius-none` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 40px
- **Card padding:** 16px
- **Element gap:** 12px
- **Max content width:** 1200px

## Components

### page frame
**Role:** page frame component

- **backgroundColor:** `{colors.frame-ink}`
- **textColor:** `{colors.canvas}`
- **rounded:** `{rounded.none}`
- **padding:** `8px`

### top banner
**Role:** top banner component

- **backgroundColor:** `{colors.frame-ink}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.heading-2}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### section eyebrow olive
**Role:** section eyebrow olive component

- **backgroundColor:** `{colors.tint-olive}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display}`
- **rounded:** `{rounded.none}`
- **padding:** `24px 16px`

### section eyebrow salmon
**Role:** section eyebrow salmon component

- **backgroundColor:** `{colors.tint-salmon}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display}`
- **rounded:** `{rounded.none}`
- **padding:** `24px 16px`

### ribbon card title
**Role:** ribbon card title component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.heading-3}`
- **rounded:** `{rounded.none}`
- **padding:** `6px 12px`

### ribbon card body sage
**Role:** ribbon card body sage component

- **backgroundColor:** `{colors.tint-sage}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### ribbon card body salmon
**Role:** ribbon card body salmon component

- **backgroundColor:** `{colors.tint-salmon}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### ribbon card body peach
**Role:** ribbon card body peach component

- **backgroundColor:** `{colors.tint-peach}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### ribbon card body lime
**Role:** ribbon card body lime component

- **backgroundColor:** `{colors.tint-lime}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### ribbon card body sky
**Role:** ribbon card body sky component

- **backgroundColor:** `{colors.tint-sky}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### ribbon card body steel
**Role:** ribbon card body steel component

- **backgroundColor:** `{colors.tint-steel}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### ribbon card body periwinkle
**Role:** ribbon card body periwinkle component

- **backgroundColor:** `{colors.tint-periwinkle}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `12px 16px`

### cta block red
**Role:** cta block red component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `16px`

### phone callout
**Role:** phone callout component

- **backgroundColor:** `{colors.frame-ink}`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.heading-2}`
- **rounded:** `{rounded.none}`
- **padding:** `4px 8px`

### buy a dell sticker
**Role:** buy a dell sticker component

- **backgroundColor:** `{colors.yellow-sticker}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `4px 8px`

### new burst sticker
**Role:** new burst sticker component

- **backgroundColor:** `{colors.yellow-sticker}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `4px 8px`

### cert seal
**Role:** cert seal component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.full}`
- **size:** `64px`

### icon label nav
**Role:** icon label nav component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.none}`
- **padding:** `8px`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.none}`
- **padding:** `4px 6px`

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.frame-ink}`
- **textColor:** `{colors.on-primary}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `6px 16px`

### button secondary
**Role:** button secondary component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `6px 16px`

### button text link
**Role:** button text link component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.link}`
- **typography:** `{typography.link}`
- **rounded:** `{rounded.none}`

### footer band
**Role:** footer band component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **typography:** `{typography.body-sm}`
- **padding:** `16px`

### ex pricing tier
**Role:** ex pricing tier component

- **description:** `Default Pricing tier card. Re-uses feature-card chrome with the base white surface.`
- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.frame-ink}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### ex pricing tier featured
**Role:** ex pricing tier featured component

- **description:** `Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode).`
- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### ex product selector
**Role:** ex product selector component

- **description:** `What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery).`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### ex cart drawer
**Role:** ex cart drawer component

- **description:** `Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart).`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`
- **item-divider:** `{colors.frame-ink}`

### ex app shell row
**Role:** ex app shell row component

- **description:** `Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.`
- **backgroundColor:** `{colors.canvas}`
- **activeIndicator:** `{colors.primary}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.sm} {spacing.md}`

### ex data table cell
**Role:** ex data table cell component

- **description:** `Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.`
- **headerBackground:** `{colors.surface}`
- **headerTypography:** `{typography.caption}`
- **bodyTypography:** `{typography.body-sm}`
- **cellPadding:** `{spacing.s} {spacing.md}`
- **rowBorder:** `{colors.frame-ink}`

### ex auth form card
**Role:** ex auth form card component

- **description:** `Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### ex modal card
**Role:** ex modal card component

- **description:** `Modal dialog surface — same chrome as feature-card with elevated shadow.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### ex empty state card
**Role:** ex empty state card component

- **description:** `Empty-state illustration frame.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.xl}`
- **captionTypography:** `{typography.body}`

### ex toast
**Role:** ex toast component

- **description:** `Toast notification surface — feature-card shape + medium shadow.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.md} {spacing.lg}`
- **typography:** `{typography.body-sm}`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Dell 1996 Inspired website](https://www.dell.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://www.dell.com/).
