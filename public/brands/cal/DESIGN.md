# Cal.com — Style Reference
> A clean, calendar-software-first interface anchored on white canvas with black primary CTAs and custom Cal Sans display typography. The system reads as friendly modern SaaS — generous whitespace, soft-rounded cards (~12px), product UI fragments shown directly inside cards, and a dark navy footer that visually closes long-scroll pages. Brand voltage comes from the Cal Sans display headline (a custom geometric face) and from product UI artifacts shown in-card rather than from accent colors.

**Theme:** light

**Source website:** [https://cal.com/](https://cal.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#111111` | `--color-primary` | primary role extracted from the source design |
| primary active | `#242424` | `--color-primary-active` | primary active role extracted from the source design |
| primary disabled | `#e5e7eb` | `--color-primary-disabled` | primary disabled role extracted from the source design |
| ink | `#111111` | `--color-ink` | ink role extracted from the source design |
| body | `#374151` | `--color-body` | body role extracted from the source design |
| muted | `#6b7280` | `--color-muted` | muted role extracted from the source design |
| muted soft | `#898989` | `--color-muted-soft` | muted soft role extracted from the source design |
| hairline | `#e5e7eb` | `--color-hairline` | hairline role extracted from the source design |
| hairline soft | `#f3f4f6` | `--color-hairline-soft` | hairline soft role extracted from the source design |
| canvas | `#ffffff` | `--color-canvas` | canvas role extracted from the source design |
| surface soft | `#f8f9fa` | `--color-surface-soft` | surface soft role extracted from the source design |
| surface card | `#f5f5f5` | `--color-surface-card` | surface card role extracted from the source design |
| surface strong | `#e5e7eb` | `--color-surface-strong` | surface strong role extracted from the source design |
| surface dark | `#101010` | `--color-surface-dark` | surface dark role extracted from the source design |
| surface dark elevated | `#1a1a1a` | `--color-surface-dark-elevated` | surface dark elevated role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| on dark | `#ffffff` | `--color-on-dark` | on dark role extracted from the source design |
| on dark soft | `#a1a1aa` | `--color-on-dark-soft` | on dark soft role extracted from the source design |
| brand accent | `#3b82f6` | `--color-brand-accent` | brand accent role extracted from the source design |
| success | `#10b981` | `--color-success` | success role extracted from the source design |
| warning | `#f59e0b` | `--color-warning` | warning role extracted from the source design |
| error | `#ef4444` | `--color-error` | error role extracted from the source design |
| badge orange | `#fb923c` | `--color-badge-orange` | badge orange role extracted from the source design |
| badge pink | `#ec4899` | `--color-badge-pink` | badge pink role extracted from the source design |
| badge violet | `#8b5cf6` | `--color-badge-violet` | badge violet role extracted from the source design |
| badge emerald | `#34d399` | `--color-badge-emerald` | badge emerald role extracted from the source design |

## Tokens — Typography

### Cal Sans, Inter, sans-serif · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 600
- **Sizes:** 64px, 48px, 36px, 28px
- **Line height:** 1.05, 1.1, 1.15, 1.2
- **Letter spacing:** -2px, -1.5px, -1px, -0.5px
- **Role:** Brand typography family observed across the documented type scale.

### Inter, sans-serif · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 600, 400, 500
- **Sizes:** 22px, 18px, 16px, 14px, 13px
- **Line height:** 1.3, 1.4, 1.5, 1
- **Letter spacing:** -0.3px, 0
- **Role:** Brand typography family observed across the documented type scale.

### JetBrains Mono, ui-monospace, monospace · `--font-family-3`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400
- **Sizes:** 14px
- **Line height:** 1.5
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-xl | 64px | 1.05 | -2px | `--text-display-xl` |
| display-lg | 48px | 1.1 | -1.5px | `--text-display-lg` |
| display-md | 36px | 1.15 | -1px | `--text-display-md` |
| display-sm | 28px | 1.2 | -0.5px | `--text-display-sm` |
| title-lg | 22px | 1.3 | -0.3px | `--text-title-lg` |
| title-md | 18px | 1.4 | 0 | `--text-title-md` |
| title-sm | 16px | 1.4 | 0 | `--text-title-sm` |
| body-md | 16px | 1.5 | 0 | `--text-body-md` |
| body-sm | 14px | 1.5 | 0 | `--text-body-sm` |
| caption | 13px | 1.4 | 0 | `--text-caption` |
| code | 14px | 1.5 | 0 | `--text-code` |
| button | 14px | 1 | 0 | `--text-button` |
| nav-link | 14px | 1.4 | 0 | `--text-nav-link` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
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
| xs | 4px | `--radius-xs` |
| sm | 6px | `--radius-sm` |
| md | 8px | `--radius-md` |
| lg | 12px | `--radius-lg` |
| xl | 16px | `--radius-xl` |
| pill | 9999px | `--radius-pill` |
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
- **rounded:** `{rounded.md}`
- **padding:** `12px 20px`
- **height:** `40px`

### button primary active
**Role:** button primary active component

- **backgroundColor:** `{colors.primary-active}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.md}`

### button primary disabled
**Role:** button primary disabled component

- **backgroundColor:** `{colors.primary-disabled}`
- **textColor:** `{colors.muted}`
- **rounded:** `{rounded.md}`

### button secondary
**Role:** button secondary component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 20px`
- **height:** `40px`

### button icon circular
**Role:** button icon circular component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.full}`
- **size:** `36px`

### button text link
**Role:** button text link component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`

### text link
**Role:** text link component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`

### top nav
**Role:** top nav component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.nav-link}`
- **height:** `64px`

### nav pill group
**Role:** nav pill group component

- **backgroundColor:** `{colors.surface-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.nav-link}`
- **rounded:** `{rounded.pill}`
- **padding:** `6px`

### hero band
**Role:** hero band component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-xl}`
- **padding:** `96px`

### hero app mockup card
**Role:** hero app mockup card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`

### feature card
**Role:** feature card component

- **backgroundColor:** `{colors.surface-card}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.title-md}`
- **rounded:** `{rounded.lg}`
- **padding:** `32px`

### feature icon card
**Role:** feature icon card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.title-sm}`
- **rounded:** `{rounded.lg}`
- **padding:** `24px`

### product mockup card
**Role:** product mockup card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.lg}`
- **padding:** `24px`

### testimonial card
**Role:** testimonial card component

- **backgroundColor:** `{colors.surface-card}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.lg}`
- **padding:** `24px`

### pricing tier card
**Role:** pricing tier card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.title-lg}`
- **rounded:** `{rounded.lg}`
- **padding:** `32px`

### pricing tier card featured
**Role:** pricing tier card featured component

- **backgroundColor:** `{colors.surface-dark}`
- **textColor:** `{colors.on-dark}`
- **typography:** `{typography.title-lg}`
- **rounded:** `{rounded.lg}`
- **padding:** `32px`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.md}`
- **padding:** `10px 14px`
- **height:** `40px`

### text input focused
**Role:** text input focused component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.md}`

### category tab
**Role:** category tab component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.muted}`
- **typography:** `{typography.nav-link}`
- **padding:** `8px 14px`
- **rounded:** `{rounded.md}`

### category tab active
**Role:** category tab active component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.nav-link}`
- **rounded:** `{rounded.md}`

### avatar circle
**Role:** avatar circle component

- **backgroundColor:** `{colors.surface-card}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.full}`
- **size:** `36px`

### badge pill
**Role:** badge pill component

- **backgroundColor:** `{colors.surface-card}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.caption}`
- **rounded:** `{rounded.pill}`
- **padding:** `4px 12px`

### rating stars
**Role:** rating stars component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.badge-orange}`
- **typography:** `{typography.caption}`

### cta band light
**Role:** cta band light component

- **backgroundColor:** `{colors.surface-card}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-sm}`
- **rounded:** `{rounded.lg}`
- **padding:** `48px`

### footer
**Role:** footer component

- **backgroundColor:** `{colors.surface-dark}`
- **textColor:** `{colors.on-dark-soft}`
- **typography:** `{typography.body-sm}`
- **padding:** `64px`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Cal.com website](https://cal.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://cal.com/).
