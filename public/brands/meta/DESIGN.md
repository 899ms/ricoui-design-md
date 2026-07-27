# Meta — Style Reference
> Meta's design system spans hardware commerce (Quest VR, Ray-Ban Meta AI glasses) and brand surfaces with a confident product-merchandising voice. The system pairs a stark white canvas with full-bleed photographic product cards, a confident Optimistic VF wordmark/headline face, dual-CTA hero patterns (black primary + outlined secondary), and a saturated cobalt blue (#0064E0) for in-product purchase actions. Pill-shaped 100px-radius buttons, generous 24-32px card rounding, and tight three-tier text hierarchy carry across homepage, product detail (PDP), buy-now configurator, and accessory subpages.

**Theme:** light

**Source website:** [https://www.meta.com/](https://www.meta.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#0064e0` | `--color-primary` | primary role extracted from the source design |
| primary deep | `#0457cb` | `--color-primary-deep` | primary deep role extracted from the source design |
| primary soft | `#0091ff` | `--color-primary-soft` | primary soft role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| ink button | `#000000` | `--color-ink-button` | ink button role extracted from the source design |
| on ink button | `#ffffff` | `--color-on-ink-button` | on ink button role extracted from the source design |
| fb blue | `#1876f2` | `--color-fb-blue` | fb blue role extracted from the source design |
| meta link | `#385898` | `--color-meta-link` | meta link role extracted from the source design |
| oculus purple | `#a121ce` | `--color-oculus-purple` | oculus purple role extracted from the source design |
| success | `#31a24c` | `--color-success` | success role extracted from the source design |
| success bg | `#24e400` | `--color-success-bg` | success bg role extracted from the source design |
| attention | `#f2a918` | `--color-attention` | attention role extracted from the source design |
| warning | `#f7b928` | `--color-warning` | warning role extracted from the source design |
| warning bg | `#ffe200` | `--color-warning-bg` | warning bg role extracted from the source design |
| critical | `#e41e3f` | `--color-critical` | critical role extracted from the source design |
| critical strong | `#f0284a` | `--color-critical-strong` | critical strong role extracted from the source design |
| canvas | `#ffffff` | `--color-canvas` | canvas role extracted from the source design |
| surface soft | `#f1f4f7` | `--color-surface-soft` | surface soft role extracted from the source design |
| ink deep | `#0a1317` | `--color-ink-deep` | ink deep role extracted from the source design |
| ink | `#1c1e21` | `--color-ink` | ink role extracted from the source design |
| charcoal | `#444950` | `--color-charcoal` | charcoal role extracted from the source design |
| slate | `#4b4c4f` | `--color-slate` | slate role extracted from the source design |
| steel | `#5d6c7b` | `--color-steel` | steel role extracted from the source design |
| stone | `#8595a4` | `--color-stone` | stone role extracted from the source design |
| hairline | `#ced0d4` | `--color-hairline` | hairline role extracted from the source design |
| hairline soft | `#dee3e9` | `--color-hairline-soft` | hairline soft role extracted from the source design |
| disabled text | `#bcc0c4` | `--color-disabled-text` | disabled text role extracted from the source design |

## Tokens — Typography

### Optimistic VF · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 500, 300, 700, 400
- **Sizes:** 64px, 48px, 36px, 28px, 24px, 18px, 16px, 14px, 12px
- **Line height:** 1.16, 1.17, 1.28, 1.21, 1.25, 1.44, 1.5, 1.43, 1.33
- **Letter spacing:** 0, -0.16px, -0.14px
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| hero-display | 64px | 1.16 | 0 | `--text-hero-display` |
| display-lg | 48px | 1.17 | 0 | `--text-display-lg` |
| heading-lg | 36px | 1.28 | 0 | `--text-heading-lg` |
| heading-md | 28px | 1.21 | 0 | `--text-heading-md` |
| heading-sm | 24px | 1.25 | 0 | `--text-heading-sm` |
| subtitle-lg | 18px | 1.44 | 0 | `--text-subtitle-lg` |
| subtitle-md | 18px | 1.44 | 0 | `--text-subtitle-md` |
| body-md-bold | 16px | 1.5 | -0.16px | `--text-body-md-bold` |
| body-md | 16px | 1.5 | -0.16px | `--text-body-md` |
| body-sm-bold | 14px | 1.43 | -0.14px | `--text-body-sm-bold` |
| body-sm | 14px | 1.43 | -0.14px | `--text-body-sm` |
| caption-bold | 12px | 1.33 | 0 | `--text-caption-bold` |
| caption | 12px | 1.33 | 0 | `--text-caption` |
| button-md | 14px | 1.43 | -0.14px | `--text-button-md` |
| link-md | 16px | 1.5 | -0.16px | `--text-link-md` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xxs | 4px | `--spacing-xxs` |
| xs | 8px | `--spacing-xs` |
| sm | 10px | `--spacing-sm` |
| md | 12px | `--spacing-md` |
| base | 16px | `--spacing-base` |
| lg | 20px | `--spacing-lg` |
| xl | 24px | `--spacing-xl` |
| xxl | 32px | `--spacing-xxl` |
| xxxl | 40px | `--spacing-xxxl` |
| section-sm | 48px | `--spacing-section-sm` |
| section | 64px | `--spacing-section` |
| section-lg | 80px | `--spacing-section-lg` |
| hero | 120px | `--spacing-hero` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| xs | 2px | `--radius-xs` |
| sm | 4px | `--radius-sm` |
| md | 6px | `--radius-md` |
| lg | 8px | `--radius-lg` |
| xl | 16px | `--radius-xl` |
| xxl | 24px | `--radius-xxl` |
| xxxl | 32px | `--radius-xxxl` |
| feature | 40px | `--radius-feature` |
| full | 100px | `--radius-full` |
| circle | 9999px | `--radius-circle` |

### Layout

- **Section gap:** 64px
- **Card padding:** 20px
- **Element gap:** 12px
- **Max content width:** 1200px

## Components

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.ink-button}`
- **textColor:** `{colors.on-ink-button}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.full}`
- **padding:** `14px 30px`

### button primary pressed
**Role:** button primary pressed component

- **backgroundColor:** `{colors.charcoal}`
- **textColor:** `{colors.on-ink-button}`

### button primary disabled
**Role:** button primary disabled component

- **backgroundColor:** `{colors.disabled-text}`
- **textColor:** `{colors.canvas}`

### button buy cta
**Role:** button buy cta component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.full}`
- **padding:** `14px 30px`

### button buy cta pressed
**Role:** button buy cta pressed component

- **backgroundColor:** `{colors.primary-deep}`
- **textColor:** `{colors.on-primary}`

### button secondary
**Role:** button secondary component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink-deep}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.full}`
- **padding:** `12px 28px`
- **border:** `2px solid {colors.ink-deep}`

### button ghost
**Role:** button ghost component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink-deep}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.full}`
- **padding:** `10px 22px`
- **border:** `2px solid rgba(10, 19, 23, 0.12)`

### button pill tab
**Role:** button pill tab component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm-bold}`
- **rounded:** `{rounded.full}`
- **padding:** `8px 16px`
- **border:** `1px solid {colors.hairline}`

### button pill tab active
**Role:** button pill tab active component

- **backgroundColor:** `{colors.ink-deep}`
- **textColor:** `{colors.canvas}`

### button icon circular
**Role:** button icon circular component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.circle}`
- **size:** `40px`

### card product feature
**Role:** card product feature component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xxxl}`
- **padding:** `{spacing.xxl}`
- **border:** `1px solid {colors.hairline-soft}`

### card feature photo
**Role:** card feature photo component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xxxl}`
- **padding:** `0`
- **border:** `none`

### card promo strip
**Role:** card promo strip component

- **backgroundColor:** `{colors.ink-deep}`
- **textColor:** `{colors.canvas}`
- **rounded:** `{rounded.xxxl}`
- **padding:** `{spacing.section}`

### card icon feature
**Role:** card icon feature component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.xl}`

### card checkout summary
**Role:** card checkout summary component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.xl}`
- **border:** `1px solid {colors.hairline-soft}`
- **shadow:** `rgba(20, 22, 26, 0.3) 0px 1px 4px 0px`

### product thumbnail
**Role:** product thumbnail component

- **backgroundColor:** `{colors.surface-soft}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.base}`
- **aspect-ratio:** `1 / 1`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`
- **border:** `1px solid {colors.hairline}`
- **height:** `44px`

### text input focused
**Role:** text input focused component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **border:** `2px solid {colors.fb-blue}`

### text input error
**Role:** text input error component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **border:** `1px solid {colors.critical-strong}`

### search pill
**Role:** search pill component

- **backgroundColor:** `{colors.surface-soft}`
- **textColor:** `{colors.steel}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.full}`
- **padding:** `{spacing.md} {spacing.lg}`
- **height:** `40px`

### radio option
**Role:** radio option component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.lg}`
- **border:** `1px solid rgba(10, 19, 23, 0.12)`

### radio option selected
**Role:** radio option selected component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.lg}`
- **border:** `2px solid #0143b5`

### color swatch circle
**Role:** color swatch circle component

- **rounded:** `{rounded.circle}`
- **size:** `32px`
- **border:** `2px solid {colors.canvas}`

### badge promo yellow
**Role:** badge promo yellow component

- **backgroundColor:** `{colors.warning}`
- **textColor:** `{colors.ink-deep}`
- **typography:** `{typography.caption-bold}`
- **rounded:** `{rounded.full}`
- **padding:** `4px 10px`

### badge attention
**Role:** badge attention component

- **backgroundColor:** `{colors.attention}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.caption-bold}`
- **rounded:** `{rounded.full}`
- **padding:** `4px 10px`

### badge success
**Role:** badge success component

- **backgroundColor:** `{colors.success}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.caption-bold}`
- **rounded:** `{rounded.full}`
- **padding:** `4px 10px`

### badge critical
**Role:** badge critical component

- **backgroundColor:** `{colors.critical}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.caption-bold}`
- **rounded:** `{rounded.full}`
- **padding:** `4px 10px`

### promo banner
**Role:** promo banner component

- **backgroundColor:** `{colors.ink-deep}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.body-sm-bold}`
- **padding:** `{spacing.md} {spacing.xl}`

### faq accordion item
**Role:** faq accordion item component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.xl}`
- **border:** `1px solid {colors.hairline-soft}`

### why buy tile
**Role:** why buy tile component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.xxl} {spacing.xl}`
- **border:** `1px solid {colors.hairline-soft}`

### warranty card
**Role:** warranty card component

- **backgroundColor:** `{colors.surface-soft}`
- **rounded:** `{rounded.xxl}`
- **padding:** `{spacing.xxl}`

### footer region
**Role:** footer region component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.steel}`
- **typography:** `{typography.body-sm}`
- **padding:** `{spacing.section} {spacing.xxl}`
- **border:** `1px solid {colors.hairline-soft}`

### hero band marketing
**Role:** hero band marketing component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.canvas}`
- **typography:** `{typography.hero-display}`
- **rounded:** `{rounded.xxxl}`
- **padding:** `{spacing.section-lg}`

### product gallery pdp
**Role:** product gallery pdp component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xxxl}`
- **padding:** `{spacing.base}`

### color sku picker row
**Role:** color sku picker row component

- **backgroundColor:** `{colors.surface-soft}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.base}`

### feature icon row
**Role:** feature icon row component

- **backgroundColor:** `{colors.canvas}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.xl}`
- **border:** `1px solid {colors.hairline-soft}`

### tech specs table
**Role:** tech specs table component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-sm}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.lg}`
- **border:** `1px solid {colors.hairline-soft}`

### testimonial customer card
**Role:** testimonial customer card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `{spacing.xxl}`
- **border:** `1px solid {colors.hairline-soft}`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Meta website](https://www.meta.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink-button` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://www.meta.com/).
