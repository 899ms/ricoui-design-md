# HP — Style Reference
> An inspired interpretation of HP's design language — a white-paper enterprise-consumer system anchored by HP Electric Blue (`#024ad8`) as the lone signal CTA, near-black ink (`#1a1a1a`) for headlines, geometric Forma-DJR sans throughout, and angular blue-chevron decorations that nod to the HP wordmark's slashes. Cards round at 8–16px, photos sit in soft 16px frames, and dark navy slabs anchor the customer-story and "how can we help" closing bands.

**Theme:** light

**Source website:** [https://www.hp.com/](https://www.hp.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `#024ad8` | `--color-primary` | primary role extracted from the source design |
| primary bright | `#296ef9` | `--color-primary-bright` | primary bright role extracted from the source design |
| primary deep | `#0e3191` | `--color-primary-deep` | primary deep role extracted from the source design |
| primary soft | `#c9e0fc` | `--color-primary-soft` | primary soft role extracted from the source design |
| on primary | `#ffffff` | `--color-on-primary` | on primary role extracted from the source design |
| ink | `#1a1a1a` | `--color-ink` | ink role extracted from the source design |
| ink deep | `#000000` | `--color-ink-deep` | ink deep role extracted from the source design |
| ink soft | `#292929` | `--color-ink-soft` | ink soft role extracted from the source design |
| on ink | `#ffffff` | `--color-on-ink` | on ink role extracted from the source design |
| canvas | `#ffffff` | `--color-canvas` | canvas role extracted from the source design |
| paper | `#ffffff` | `--color-paper` | paper role extracted from the source design |
| cloud | `#f7f7f7` | `--color-cloud` | cloud role extracted from the source design |
| fog | `#e8e8e8` | `--color-fog` | fog role extracted from the source design |
| steel | `#c2c2c2` | `--color-steel` | steel role extracted from the source design |
| graphite | `#636363` | `--color-graphite` | graphite role extracted from the source design |
| charcoal | `#3d3d3d` | `--color-charcoal` | charcoal role extracted from the source design |
| hairline | `#e8e8e8` | `--color-hairline` | hairline role extracted from the source design |
| hairline strong | `#c2c2c2` | `--color-hairline-strong` | hairline strong role extracted from the source design |
| link | `#024ad8` | `--color-link` | link role extracted from the source design |
| link pressed | `#0e3191` | `--color-link-pressed` | link pressed role extracted from the source design |
| bloom coral | `#ff5050` | `--color-bloom-coral` | bloom coral role extracted from the source design |
| bloom rose | `#f9d4d2` | `--color-bloom-rose` | bloom rose role extracted from the source design |
| bloom deep | `#b3262b` | `--color-bloom-deep` | bloom deep role extracted from the source design |
| bloom wine | `#5a1313` | `--color-bloom-wine` | bloom wine role extracted from the source design |
| storm mist | `#8ebdce` | `--color-storm-mist` | storm mist role extracted from the source design |
| storm sea | `#7fadbe` | `--color-storm-sea` | storm sea role extracted from the source design |
| storm deep | `#356373` | `--color-storm-deep` | storm deep role extracted from the source design |
| error | `#b3262b` | `--color-error` | error role extracted from the source design |

## Tokens — Typography

### Forma DJR Micro · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 500, 400, 700, 600
- **Sizes:** 72px, 56px, 44px, 32px, 24px, 20px, 18px, 16px, 14px, 12px, 12.6px
- **Line height:** 1, 1.17, 1.33, 1.38, 1.5, 1.3, 1.4
- **Letter spacing:** 0, 0.7px, 0.126px
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| display-xxl | 72px | 1 | 0 | `--text-display-xxl` |
| display-xl | 56px | 1 | 0 | `--text-display-xl` |
| display-lg | 44px | 1 | 0 | `--text-display-lg` |
| display-md | 32px | 1 | 0 | `--text-display-md` |
| display-sm | 24px | 1.17 | 0 | `--text-display-sm` |
| display-xs | 20px | 1 | 0 | `--text-display-xs` |
| body-lg | 18px | 1.33 | 0 | `--text-body-lg` |
| body-md | 16px | 1.38 | 0 | `--text-body-md` |
| body-emphasis | 16px | 1.38 | 0 | `--text-body-emphasis` |
| caption-md | 14px | 1.5 | 0 | `--text-caption-md` |
| caption-sm | 12px | 1.33 | 0 | `--text-caption-sm` |
| caption-bold | 14px | 1.3 | 0 | `--text-caption-bold` |
| link-md | 16px | 1.38 | 0 | `--text-link-md` |
| button-md | 14px | 1.4 | 0.7px | `--text-button-md` |
| button-sm | 12.6px | 1 | 0.126px | `--text-button-sm` |
| price-md | 24px | 1.17 | 0 | `--text-price-md` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| xxs | 4px | `--spacing-xxs` |
| xs | 8px | `--spacing-xs` |
| sm | 12px | `--spacing-sm` |
| md | 16px | `--spacing-md` |
| lg | 20px | `--spacing-lg` |
| xl | 24px | `--spacing-xl` |
| xxl | 32px | `--spacing-xxl` |
| section | 80px | `--spacing-section` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| none | 0px | `--radius-none` |
| xs | 2px | `--radius-xs` |
| sm | 3px | `--radius-sm` |
| md | 4px | `--radius-md` |
| lg | 8px | `--radius-lg` |
| xl | 16px | `--radius-xl` |
| pill | 9999px | `--radius-pill` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 80px
- **Card padding:** 20px
- **Element gap:** 16px
- **Max content width:** 1200px

## Components

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 24px`
- **height:** `44px`

### button primary pressed
**Role:** button primary pressed component

- **backgroundColor:** `{colors.primary-deep}`
- **textColor:** `{colors.on-primary}`

### button primary disabled
**Role:** button primary disabled component

- **backgroundColor:** `{colors.steel}`
- **textColor:** `{colors.on-primary}`

### button ink
**Role:** button ink component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 24px`
- **height:** `44px`

### button outline
**Role:** button outline component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 24px`
- **height:** `44px`

### button outline ink
**Role:** button outline ink component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.button-md}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 24px`
- **height:** `44px`

### button text link
**Role:** button text link component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.link-md}`
- **padding:** `4px 0`

### badge pill ink
**Role:** badge pill ink component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.lg}`
- **padding:** `6px 12px`

### badge pill outline
**Role:** badge pill outline component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.lg}`
- **padding:** `6px 12px`

### badge sale coral
**Role:** badge sale coral component

- **backgroundColor:** `{colors.bloom-coral}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.caption-bold}`
- **rounded:** `{rounded.sm}`
- **padding:** `4px 8px`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 16px`
- **height:** `44px`

### text input focused
**Role:** text input focused component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`

### text input search
**Role:** text input search component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.md}`
- **padding:** `12px 16px`
- **height:** `40px`

### card product
**Role:** card product component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `24px`

### card product feature
**Role:** card product feature component

- **backgroundColor:** `{colors.cloud}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `32px`

### card pricing tier
**Role:** card pricing tier component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `24px`

### card pricing tier featured
**Role:** card pricing tier featured component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `24px`

### card customer story
**Role:** card customer story component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `16px`

### card article tile
**Role:** card article tile component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `16px`

### card category icon
**Role:** card category icon component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-emphasis}`
- **rounded:** `{rounded.lg}`
- **padding:** `16px`

### promo strip dark
**Role:** promo strip dark component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-md}`
- **rounded:** `{rounded.xl}`
- **padding:** `48px`

### hero promo card
**Role:** hero promo card component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **rounded:** `{rounded.xl}`
- **padding:** `32px`

### utility strip
**Role:** utility strip component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.caption-md}`
- **height:** `36px`
- **padding:** `0 24px`

### nav bar top
**Role:** nav bar top component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **height:** `64px`
- **padding:** `0 32px`

### nav link
**Role:** nav link component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-md}`
- **padding:** `8px 16px`

### category tab
**Role:** category tab component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-emphasis}`
- **rounded:** `{rounded.pill}`
- **padding:** `8px 20px`

### category tab active
**Role:** category tab active component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.pill}`

### faq row
**Role:** faq row component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body-emphasis}`
- **rounded:** `{rounded.lg}`
- **padding:** `20px 24px`

### chevron decoration
**Role:** chevron decoration component

- **backgroundColor:** `{colors.primary}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.none}`

### help band dark
**Role:** help band dark component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-md}`
- **padding:** `64px 32px`

### footer dark
**Role:** footer dark component

- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.body-md}`
- **padding:** `64px 32px`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live HP website](https://www.hp.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-ink` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://www.hp.com/).
