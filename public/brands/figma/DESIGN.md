# Figma — Style Reference
> A confident black-and-white editorial frame interrupted by oversized, hand-cut pastel color blocks. The marketing canvas is rigorously monochrome — figmaSans variable type, pure white surfaces, pure black ink, pill-shaped CTAs — while each story section drops the page into a saturated lime, lavender, cream, mint, or pink panel that reads like a sticky note placed on a clean desk. The result is a design system that feels both technical and joyful — a tool for serious work, made by people who like color.

**Theme:** light

**Source website:** [https://www.figma.com/](https://www.figma.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#000000` | `--color-primary` | primary role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| ink | `#000000` | `--color-ink` | ink role extracted from the source design |
| canvas | `#ffffff` | `--color-canvas` | canvas role extracted from the source design |
| inverse canvas | `#000000` | `--color-inverse-canvas` | inverse canvas role extracted from the source design |
| inverse ink | `#ffffff` | `--color-inverse-ink` | inverse ink role extracted from the source design |
| on inverse soft | `#ffffff` | `--color-on-inverse-soft` | on inverse soft role extracted from the source design |
| hairline | `#e6e6e6` | `--color-hairline` | hairline role extracted from the source design |
| hairline soft | `#f1f1f1` | `--color-hairline-soft` | hairline soft role extracted from the source design |
| surface soft | `#f7f7f5` | `--color-surface-soft` | surface soft role extracted from the source design |
| block lime | `#dceeb1` | `--color-block-lime` | block lime role extracted from the source design |
| block lilac | `#c5b0f4` | `--color-block-lilac` | block lilac role extracted from the source design |
| block cream | `#f4ecd6` | `--color-block-cream` | block cream role extracted from the source design |
| block pink | `#efd4d4` | `--color-block-pink` | block pink role extracted from the source design |
| block mint | `#c8e6cd` | `--color-block-mint` | block mint role extracted from the source design |
| block coral | `#f3c9b6` | `--color-block-coral` | block coral role extracted from the source design |
| block navy | `#1f1d3d` | `--color-block-navy` | block navy role extracted from the source design |
| accent magenta | `#ff3d8b` | `--color-accent-magenta` | accent magenta role extracted from the source design |
| semantic success | `#1ea64a` | `--color-semantic-success` | semantic success role extracted from the source design |
| overlay scrim | `#000000` | `--color-overlay-scrim` | overlay scrim role extracted from the source design |

## Tokens — Typography

### figmaSans · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 340, 540, 700, 330, 320, 480
- **Sizes:** 86px, 64px, 26px, 24px, 20px, 18px, 16px
- **Line height:** 1, 1.1, 1.35, 1.45, 1.4
- **Letter spacing:** -1.72px, -0.96px, -0.26px, 0, -0.14px, -0.10px
- **Role:** Brand typography family observed across the documented type scale.

### figmaMono · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 18px, 12px
- **Line height:** 1.3, 1
- **Letter spacing:** 0.54px, 0.60px
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-xl | 86px | 1 | -1.72px | `--text-display-xl` |
| display-lg | 64px | 1.1 | -0.96px | `--text-display-lg` |
| headline | 26px | 1.35 | -0.26px | `--text-headline` |
| subhead | 26px | 1.35 | -0.26px | `--text-subhead` |
| card-title | 24px | 1.45 | 0 | `--text-card-title` |
| body-lg | 20px | 1.4 | -0.14px | `--text-body-lg` |
| body | 18px | 1.45 | -0.26px | `--text-body` |
| body-sm | 16px | 1.45 | -0.14px | `--text-body-sm` |
| link | 20px | 1.4 | -0.10px | `--text-link` |
| button | 20px | 1.4 | -0.10px | `--text-button` |
| eyebrow | 18px | 1.3 | 0.54px | `--text-eyebrow` |
| caption | 12px | 1 | 0.60px | `--text-caption` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| hair | 1px | `--spacing-hair` |
| xxs | 4px | `--spacing-xxs` |
| xs | 8px | `--spacing-xs` |
| sm | 12px | `--spacing-sm` |
| md | 16px | `--spacing-md` |
| lg | 24px | `--spacing-lg` |
| xl | 32px | `--spacing-xl` |
| xxl | 48px | `--spacing-xxl` |
| section | 96px | `--spacing-section` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| xs | 2px | `--radius-xs` |
| sm | 6px | `--radius-sm` |
| md | 8px | `--radius-md` |
| lg | 24px | `--radius-lg` |
| xl | 32px | `--radius-xl` |
| pill | 50px | `--radius-pill` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 96px
- **Card padding:** 24px
- **Element gap:** 16px
- **Max content width:** 1200px

## Components

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.pill}`
- **padding:** `10px 20px`

### button primary pressed
**Role:** button primary pressed component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.pill}`

### button secondary
**Role:** button secondary component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.pill}`
- **padding:** `8px 18px 10px`

### button tertiary text
**Role:** button tertiary text component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.link}`
- **rounded:** `{rounded.full}`
- **padding:** `8px 12px`

### button icon circular
**Role:** button icon circular component

- **backgroundColor:** `{colors.surface-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.full}`
- **size:** `40px`

### button icon circular inverse
**Role:** button icon circular inverse component

- **backgroundColor:** `{colors.on-inverse-soft}`
- **textColor:** `{colors.inverse-ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.full}`
- **size:** `40px`

### button magenta promo
**Role:** button magenta promo component

- **backgroundColor:** `{colors.accent-magenta}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.pill}`
- **padding:** `10px 18px`

### pricing tab default
**Role:** pricing tab default component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.pill}`
- **padding:** `8px 18px`

### pricing tab selected
**Role:** pricing tab selected component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.pill}`
- **padding:** `8px 18px`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 14px`

### text input focused
**Role:** text input focused component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 14px`

### pricing card
**Role:** pricing card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.lg}`
- **padding:** `24px`

### pricing card feature row
**Role:** pricing card feature row component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.xs}`

### color block section
**Role:** color block section component

- **backgroundColor:** `{colors.block-lime}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.subhead}`
- **rounded:** `{rounded.lg}`
- **padding:** `48px`

### color block section lilac
**Role:** color block section lilac component

- **backgroundColor:** `{colors.block-lilac}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.subhead}`
- **rounded:** `{rounded.lg}`
- **padding:** `48px`

### color block section navy
**Role:** color block section navy component

- **backgroundColor:** `{colors.block-navy}`
- **textColor:** `{colors.inverse-ink}`
- **typography:** `{typography.subhead}`
- **rounded:** `{rounded.lg}`
- **padding:** `48px`

### promo banner lilac
**Role:** promo banner lilac component

- **backgroundColor:** `{colors.block-lilac}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.md}`
- **padding:** `16px 24px`

### template card
**Role:** template card component

- **backgroundColor:** `{colors.surface-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.md}`
- **padding:** `16px`

### feature illustration tile
**Role:** feature illustration tile component

- **backgroundColor:** `{colors.surface-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.eyebrow}`
- **rounded:** `{rounded.md}`
- **padding:** `24px`

### top nav
**Role:** top nav component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.xs}`
- **height:** `56px`

### marquee strip
**Role:** marquee strip component

- **backgroundColor:** `{colors.inverse-canvas}`
- **textColor:** `{colors.inverse-ink}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.xs}`
- **height:** `36px`

### comparison checkmark
**Role:** comparison checkmark component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.semantic-success}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.full}`
- **size:** `16px`

### footer
**Role:** footer component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.caption}`
- **rounded:** `{rounded.xs}`
- **padding:** `64px 32px`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Figma website](https://www.figma.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://www.figma.com/).
