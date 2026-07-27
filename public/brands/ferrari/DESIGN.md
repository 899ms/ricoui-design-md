# Ferrari — Style Reference
> A luxury-automotive brand whose marketing surfaces read as cinematic editorial. The base canvas is **near-black** (`#181818`) holding pure white display type; white-canvas bands appear only inside specific editorial contexts (preowned listings, pricing tables). The single brand voltage is **Rosso Corsa** (`#da291c`) — the iconic Ferrari racing red — used scarcely on primary CTAs, the Cavallino mark, and Formula 1 race-position highlights. Type runs **FerrariSans** at modest weights (display 500, body 400) — never bombastic. Spacing follows an explicit 8px token ladder (`xxxs` 4px through `super` 128px); generous editorial pacing throughout. The brand's strongest visual signature is the **full-bleed cinematic hero photograph** that fills the viewport top with car photography, model details, or trackside livery — followed by a tighter editorial body layout below.

**Theme:** dark

**Source website:** [https://www.ferrari.com/](https://www.ferrari.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#da291c` | `--color-primary` | primary role extracted from the source design |
| primary active | `#b01e0a` | `--color-primary-active` | primary active role extracted from the source design |
| primary hover | `#9d2211` | `--color-primary-hover` | primary hover role extracted from the source design |
| ink | `#ffffff` | `--color-ink` | ink role extracted from the source design |
| body | `#969696` | `--color-body` | body role extracted from the source design |
| body strong | `#ffffff` | `--color-body-strong` | body strong role extracted from the source design |
| body on light | `#181818` | `--color-body-on-light` | body on light role extracted from the source design |
| muted | `#666666` | `--color-muted` | muted role extracted from the source design |
| muted soft | `#8f8f8f` | `--color-muted-soft` | muted soft role extracted from the source design |
| hairline | `#303030` | `--color-hairline` | hairline role extracted from the source design |
| hairline on light | `#d2d2d2` | `--color-hairline-on-light` | hairline on light role extracted from the source design |
| hairline soft | `#ebebeb` | `--color-hairline-soft` | hairline soft role extracted from the source design |
| canvas | `#181818` | `--color-canvas` | canvas role extracted from the source design |
| canvas elevated | `#303030` | `--color-canvas-elevated` | canvas elevated role extracted from the source design |
| canvas light | `#ffffff` | `--color-canvas-light` | canvas light role extracted from the source design |
| surface card | `#303030` | `--color-surface-card` | surface card role extracted from the source design |
| surface soft light | `#f7f7f7` | `--color-surface-soft-light` | surface soft light role extracted from the source design |
| surface strong light | `#ebebeb` | `--color-surface-strong-light` | surface strong light role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| on dark | `#ffffff` | `--color-on-dark` | on dark role extracted from the source design |
| on light | `#181818` | `--color-on-light` | on light role extracted from the source design |
| accent yellow hypersail | `#fff200` | `--color-accent-yellow-hypersail` | accent yellow hypersail role extracted from the source design |
| accent yellow | `#f6e500` | `--color-accent-yellow` | accent yellow role extracted from the source design |
| semantic info | `#4c98b9` | `--color-semantic-info` | semantic info role extracted from the source design |
| semantic success | `#03904a` | `--color-semantic-success` | semantic success role extracted from the source design |
| semantic warning | `#f13a2c` | `--color-semantic-warning` | semantic warning role extracted from the source design |

## Tokens — Typography

### 'FerrariSans', -apple-system, system-ui, sans-serif · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 500
- **Sizes:** 80px
- **Line height:** 1.05
- **Letter spacing:** -1.6px
- **Role:** Brand typography family observed across the documented type scale.

### 'FerrariSans', sans-serif · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 500, 700, 400, 600
- **Sizes:** 56px, 36px, 26px, 18px, 16px, 14px, 13px, 12px, 11px, 80px
- **Line height:** 1.1, 1.2, 1.5, 1.4, 1
- **Letter spacing:** -1.12px, -0.36px, 0.195px, 0, 0.08px, 1.1px, 1.4px, 0.65px, -1.6px
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-mega | 80px | 1.05 | -1.6px | `--text-display-mega` |
| display-xl | 56px | 1.1 | -1.12px | `--text-display-xl` |
| display-lg | 36px | 1.2 | -0.36px | `--text-display-lg` |
| display-md | 26px | 1.5 | 0.195px | `--text-display-md` |
| title-md | 18px | 1.2 | 0 | `--text-title-md` |
| title-sm | 16px | 1.4 | 0.08px | `--text-title-sm` |
| body-md | 14px | 1.5 | 0 | `--text-body-md` |
| body-sm | 13px | 1.5 | 0 | `--text-body-sm` |
| caption | 12px | 1.4 | 0 | `--text-caption` |
| caption-uppercase | 11px | 1.4 | 1.1px | `--text-caption-uppercase` |
| button | 14px | 1 | 1.4px | `--text-button` |
| nav-link | 13px | 1.4 | 0.65px | `--text-nav-link` |
| number-display | 80px | 1 | -1.6px | `--text-number-display` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xxxs | 4px | `--spacing-xxxs` |
| xxs | 8px | `--spacing-xxs` |
| xs | 16px | `--spacing-xs` |
| sm | 24px | `--spacing-sm` |
| md | 32px | `--spacing-md` |
| lg | 48px | `--spacing-lg` |
| xl | 64px | `--spacing-xl` |
| xxl | 96px | `--spacing-xxl` |
| super | 128px | `--spacing-super` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| none | 0px | `--radius-none` |
| xs | 2px | `--radius-xs` |
| sm | 4px | `--radius-sm` |
| md | 6px | `--radius-md` |
| lg | 8px | `--radius-lg` |
| xl | 12px | `--radius-xl` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 96px
- **Card padding:** 48px
- **Element gap:** 32px
- **Max content width:** 1200px

## Components

### top nav on dark
**Role:** top nav on dark component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.nav-link}`
- **height:** `64px`

### top nav on light
**Role:** top nav on light component

- **backgroundColor:** `{colors.canvas-light}`
- **textColor:** `{colors.body-on-light}`
- **typography:** `{typography.nav-link}`
- **height:** `64px`

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `14px 32px`
- **height:** `48px`

### button primary active
**Role:** button primary active component

- **backgroundColor:** `{colors.primary-active}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.none}`

### button outline on dark
**Role:** button outline on dark component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `13px 31px`
- **height:** `48px`

### button outline on light
**Role:** button outline on light component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.body-on-light}`
- **typography:** `{typography.button}`
- **rounded:** `{rounded.none}`
- **padding:** `13px 31px`
- **height:** `48px`

### button tertiary text
**Role:** button tertiary text component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button}`

### hero band cinema
**Role:** hero band cinema component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-mega}`
- **padding:** `0`

### hero band light
**Role:** hero band light component

- **backgroundColor:** `{colors.canvas-light}`
- **textColor:** `{colors.body-on-light}`
- **typography:** `{typography.display-xl}`
- **padding:** `96px`

### feature card photo
**Role:** feature card photo component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.title-md}`
- **rounded:** `{rounded.none}`
- **padding:** `0`

### feature card light
**Role:** feature card light component

- **backgroundColor:** `{colors.canvas-light}`
- **textColor:** `{colors.body-on-light}`
- **typography:** `{typography.title-md}`
- **rounded:** `{rounded.none}`
- **padding:** `32px`

### livery band
**Role:** livery band component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-lg}`
- **padding:** `96px`

### preowned listing card
**Role:** preowned listing card component

- **backgroundColor:** `{colors.canvas-light}`
- **textColor:** `{colors.body-on-light}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.none}`
- **padding:** `24px`

### spec cell
**Role:** spec cell component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.number-display}`
- **padding:** `24px 0`

### race position cell
**Role:** race position cell component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.number-display}`

### race calendar row
**Role:** race calendar row component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **padding:** `16px 0`

### driver card
**Role:** driver card component

- **backgroundColor:** `{colors.canvas-elevated}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.title-md}`
- **rounded:** `{rounded.none}`
- **padding:** `24px`

### text input on dark
**Role:** text input on dark component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `14px 16px`
- **height:** `48px`

### text input on light
**Role:** text input on light component

- **backgroundColor:** `{colors.canvas-light}`
- **textColor:** `{colors.body-on-light}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `14px 16px`
- **height:** `48px`

### badge pill
**Role:** badge pill component

- **backgroundColor:** `{colors.canvas-elevated}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.caption-uppercase}`
- **rounded:** `{rounded.full}`
- **padding:** `4px 12px`

### cta band dark
**Role:** cta band dark component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display-lg}`
- **padding:** `96px`

### newsletter input band
**Role:** newsletter input band component

- **backgroundColor:** `{colors.canvas-elevated}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.sm}`
- **padding:** `32px`

### footer dark
**Role:** footer dark component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.body}`
- **typography:** `{typography.body-sm}`
- **padding:** `64px 48px`

### footer link
**Role:** footer link component

- **backgroundColor:** `transparent`
- **textColor:** `{colors.body}`
- **typography:** `{typography.body-sm}`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Ferrari website](https://www.ferrari.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://www.ferrari.com/).
