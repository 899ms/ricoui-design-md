# Slacc-Inspired — Style Reference
> An inspired interpretation of Slacc's design language — a workplace messaging brand built on a deep aubergine primary, with cream-lavender hero gradients, blue inline links, and pill CTAs. The system pairs a proprietary humanist sans for display with a separate utility sans for body, and stages product UI mockups inside soft pastel-mesh hero composites that act as both decoration and feature explanation.

**Theme:** light

**Source website:** [https://slack.com/](https://slack.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#4a154b` | `--color-primary` | primary role extracted from the source design |
| primary deep | `#481a54` | `--color-primary-deep` | primary deep role extracted from the source design |
| primary press | `#611f69` | `--color-primary-press` | primary press role extracted from the source design |
| primary tint | `#592466` | `--color-primary-tint` | primary tint role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| ink | `#1d1d1d` | `--color-ink` | ink role extracted from the source design |
| ink mute | `#696969` | `--color-ink-mute` | ink mute role extracted from the source design |
| link blue | `#1264a3` | `--color-link-blue` | link blue role extracted from the source design |
| link hover | `#3860be` | `--color-link-hover` | link hover role extracted from the source design |
| canvas | `#ffffff` | `--color-canvas` | canvas role extracted from the source design |
| canvas cream | `#f4ede4` | `--color-canvas-cream` | canvas cream role extracted from the source design |
| canvas lavender | `#f9f0ff` | `--color-canvas-lavender` | canvas lavender role extracted from the source design |
| surface elev | `#ffffff` | `--color-surface-elev` | surface elev role extracted from the source design |
| surface aubergine | `#4a154b` | `--color-surface-aubergine` | surface aubergine role extracted from the source design |
| hairline | `#e6e6e6` | `--color-hairline` | hairline role extracted from the source design |
| hairline strong | `#000000` | `--color-hairline-strong` | hairline strong role extracted from the source design |
| semantic error | `#cc4117` | `--color-semantic-error` | semantic error role extracted from the source design |
| semantic success | `#007a5a` | `--color-semantic-success` | semantic success role extracted from the source design |
| on aubergine mute | `#d9bdde` | `--color-on-aubergine-mute` | on aubergine mute role extracted from the source design |

## Tokens — Typography

### Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 700, 600
- **Sizes:** 64px, 58px, 50px, 32px, 24px, 22px, 18px
- **Line height:** 1.12, 1.25, 1.33, 1.4, 1.56
- **Letter spacing:** -0.768px, -0.464px, -0.6px, -0.256px, -0.096px, 0, -0.0216px
- **Role:** Brand typography family observed across the documented type scale.

### Salesforce-Sans, system-ui, -apple-system, sans-serif · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 400, 700
- **Sizes:** 18px, 16px, 14.4px, 14px, 12px
- **Line height:** 1.55, 1.5, 1, 1.38, 1.43
- **Letter spacing:** -0.0216px, 0, 0.16px, 0.2px, 0.144px, 0.1px, 0.96px
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-xxl | 64px | 1.12 | -0.768px | `--text-display-xxl` |
| display-xl | 58px | 1.25 | -0.464px | `--text-display-xl` |
| display-lg | 50px | 1.12 | -0.6px | `--text-display-lg` |
| display-md | 32px | 1.25 | -0.256px | `--text-display-md` |
| heading-lg | 24px | 1.33 | -0.096px | `--text-heading-lg` |
| heading-md | 22px | 1.4 | 0 | `--text-heading-md` |
| heading-sm | 18px | 1.56 | -0.0216px | `--text-heading-sm` |
| body-lg | 18px | 1.55 | -0.0216px | `--text-body-lg` |
| body-md | 16px | 1.55 | 0 | `--text-body-md` |
| body-strong | 16px | 1.5 | 0.16px | `--text-body-strong` |
| button-lg | 18px | 1 | 0 | `--text-button-lg` |
| button-md | 16px | 1.38 | 0.2px | `--text-button-md` |
| button-cap | 14.4px | 1 | 0.144px | `--text-button-cap` |
| caption | 14px | 1.43 | 0.1px | `--text-caption` |
| micro-cap | 12px | 1 | 0.96px | `--text-micro-cap` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xs | 4px | `--spacing-xs` |
| sm | 8px | `--spacing-sm` |
| md | 12px | `--spacing-md` |
| lg | 16px | `--spacing-lg` |
| xl | 20px | `--spacing-xl` |
| xxl | 24px | `--spacing-xxl` |
| huge | 28px | `--spacing-huge` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| xs | 2px | `--radius-xs` |
| sm | 4px | `--radius-sm` |
| md | 8px | `--radius-md` |
| lg | 12px | `--radius-lg` |
| xl | 16px | `--radius-xl` |
| xxl | 48px | `--radius-xxl` |
| pill | 90px | `--radius-pill` |

### Layout

- **Section gap:** 24px
- **Card padding:** 16px
- **Element gap:** 12px
- **Max content width:** 1200px

## Components

### button primary pill
**Role:** button primary pill component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `14px 28px`

### button primary pill pressed
**Role:** button primary pill pressed component

- **backgroundColor:** `{colors.primary-press}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `14px 28px`

### button secondary pill
**Role:** button secondary pill component

- **backgroundColor:** `{colors.canvas-lavender}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `10px 30px`

### button outline aubergine
**Role:** button outline aubergine component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `14px 28px`

### button outline on aubergine
**Role:** button outline on aubergine component

- **backgroundColor:** `{colors.surface-aubergine}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.pill}`
- **padding:** `14px 28px`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `10px 12px`

### pill cap shade
**Role:** pill cap shade component

- **backgroundColor:** `{colors.canvas-cream}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.micro-cap}`
- **rounded:** `{rounded.pill}`
- **padding:** `4px 12px`

### card pricing
**Role:** card pricing component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `32px`

### card pricing featured
**Role:** card pricing featured component

- **backgroundColor:** `{colors.surface-aubergine}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `32px`

### card feature cream
**Role:** card feature cream component

- **backgroundColor:** `{colors.canvas-cream}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `32px`

### card aubergine band
**Role:** card aubergine band component

- **backgroundColor:** `{colors.surface-aubergine}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-lg}`
- **rounded:** `{rounded.xl}`
- **padding:** `48px`

### card stat
**Role:** card stat component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.display-lg}`
- **rounded:** `{rounded.xl}`
- **padding:** `32px`

### nav bar light
**Role:** nav bar light component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xs}`
- **padding:** `16px 24px`

### link on light
**Role:** link on light component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.link-blue}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xs}`
- **padding:** `0px`

### link on aubergine
**Role:** link on aubergine component

- **backgroundColor:** `{colors.surface-aubergine}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xs}`
- **padding:** `0px`

### footer aubergine
**Role:** footer aubergine component

- **backgroundColor:** `{colors.surface-aubergine}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.caption}`
- **rounded:** `{rounded.xs}`
- **padding:** `32px 24px`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Slacc-Inspired website](https://slack.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://slack.com/).
