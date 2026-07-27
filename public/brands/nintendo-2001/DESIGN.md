# Nintendo.com (2001) Analysis — Style Reference
> An analysis of Nintendo.com's 2001 design language — a brushed-periwinkle "console chrome" interface where every panel is a beveled metal plate, navigation glows amber over a halftone-dotted carbon bar, and bold outlined display type sits on circuit-board hero fields. A Y2K hardware aesthetic that treats the web page like the faceplate of a game system.

**Theme:** light

**Source website:** [https://www.nintendo.com/](https://www.nintendo.com/)  
Use the live official website to compare and validate this extracted snapshot. The current source website remains authoritative.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---|---|---|
| primary | `"#e60012"          # Nintendo Red — racetrack logo, alert` | `--color-primary` | primary role extracted from the source design |
| signal | `#f68d1f"           # Signal Orange — forward cues, submit, "Play It On` | `--color-signal` | signal role extracted from the source design |
| amber | `"#ecab37"            # Amber — utility buttons, info-box tabs, badges` | `--color-amber` | amber role extracted from the source design |
| nav gold | `"#e48600"         # Nav Gold — top-nav menu links` | `--color-nav-gold` | nav gold role extracted from the source design |
| canvas | `"#7a8aba"           # Periwinkle metallic — primary interface body` | `--color-canvas` | canvas role extracted from the source design |
| canvas soft | `"#9fbee7"      # Pale Sky — secondary-nav strip, light inset panels` | `--color-canvas-soft` | canvas soft role extracted from the source design |
| sky | `"#9fbee7"              # Pale Sky alias` | `--color-sky` | sky role extracted from the source design |
| lavender | `"#acace7"         # Pale Lavender — home hero field` | `--color-lavender` | lavender role extracted from the source design |
| ice | `"#c0d5e6"              # Pale Ice — news hero field` | `--color-ice` | ice role extracted from the source design |
| periwinkle | `"#8ba1d4"       # Light Periwinkle — raised mid panels` | `--color-periwinkle` | periwinkle role extracted from the source design |
| chrome indigo | `"#3d4f97"    # Chrome Indigo — beveled borders, tab edges` | `--color-chrome-indigo` | chrome indigo role extracted from the source design |
| muted indigo | `"#60619c"     # Muted Indigo — inactive tabs, secondary chrome` | `--color-muted-indigo` | muted indigo role extracted from the source design |
| platinum | `"#dedede"         # Platinum Gray — list-row / inset content surface` | `--color-platinum` | platinum role extracted from the source design |
| surface | `"#ffffff"          # White — content cards, list-row highlight` | `--color-surface` | surface role extracted from the source design |
| carbon | `"#21242e"           # Carbon Navy — nav bar, dark buttons, footer, ink` | `--color-carbon` | carbon role extracted from the source design |
| hairline | `"#5a5f8c"         # blended bevel divider` | `--color-hairline` | hairline role extracted from the source design |
| ink | `"#21242e"              # primary text on light` | `--color-ink` | ink role extracted from the source design |
| ink soft | `"#3d4f97"         # secondary text / chrome labels` | `--color-ink-soft` | ink soft role extracted from the source design |
| on primary | `"#ffffff"       # text on dark/red/orange chrome` | `--color-on-primary` | on primary role extracted from the source design |
| systems teal | `"#206479"     # Systems hero circuit-board cyan` | `--color-systems-teal` | systems teal role extracted from the source design |
| games red | `"#a7282b"        # Games F-1 racing hero` | `--color-games-red` | games red role extracted from the source design |
| error | `"#e60012"            # validation / destructive (shares brand red)` | `--color-error` | error role extracted from the source design |

## Tokens — Typography

### Arial · `--font-primary`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 700, 400
- **Sizes:** 13px, 11px, 15px, 12px, 10px
- **Line height:** 1, 1.1, 1.3, 1.4
- **Letter spacing:** 0.5px, 0
- **Role:** Brand typography family observed across the documented type scale.

### Arial Black · `--font-family-2`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 900
- **Sizes:** 44px
- **Line height:** 1
- **Letter spacing:** 0
- **Role:** Brand typography family observed across the documented type scale.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| nav-link | 13px | 1 | 0.5px | `--text-nav-link` |
| ui-label | 11px | 1.1 | 0.5px | `--text-ui-label` |
| display | 44px | 1 | 0 | `--text-display` |
| hero-tagline | 15px | 1.3 | 0 | `--text-hero-tagline` |
| body | 12px | 1.4 | 0 | `--text-body` |
| link | 12px | 1.4 | 0 | `--text-link` |
| micro | 10px | 1.3 | 0 | `--text-micro` |

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
| xxl | 32px | `--spacing-xxl` |
| section | 48px | `--spacing-section` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| none | 0px | `--radius-none` |
| xs | 2px | `--radius-xs` |
| sm | 4px | `--radius-sm` |
| md | 6px | `--radius-md` |
| lg | 10px | `--radius-lg` |
| full | 9999px | `--radius-full` |

### Layout

- **Section gap:** 48px
- **Card padding:** 16px
- **Element gap:** 12px
- **Max content width:** 1200px

## Components

### nav bar
**Role:** nav bar component

- **backgroundColor:** `{colors.carbon}`
- **textColor:** `{colors.nav-gold}`
- **typography:** `{typography.nav-link}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.sm}`
- **height:** `28px`

### subnav strip
**Role:** subnav strip component

- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.xs}`

### logo pill
**Role:** logo pill component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.primary}`
- **typography:** `{typography.display}`
- **rounded:** `{rounded.full}`
- **padding:** `{spacing.xs}`

### button primary
**Role:** button primary component

- **backgroundColor:** `{colors.amber}`
- **textColor:** `{colors.carbon}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.md}`

### button primary pressed
**Role:** button primary pressed component

- **backgroundColor:** `{colors.nav-gold}`
- **textColor:** `{colors.carbon}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.md}`

### button submit
**Role:** button submit component

- **backgroundColor:** `{colors.signal}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.lg}`

### button secondary
**Role:** button secondary component

- **backgroundColor:** `{colors.carbon}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.md}`

### button icon arrow
**Role:** button icon arrow component

- **backgroundColor:** `{colors.signal}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.full}`
- **size:** `22px`

### button arrow chip
**Role:** button arrow chip component

- **backgroundColor:** `{colors.signal}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.xs}`
- **size:** `18px`

### search field
**Role:** search field component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.xs}`
- **height:** `20px`

### text input
**Role:** text input component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.xs}`
- **height:** `20px`

### select dropdown
**Role:** select dropdown component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.xs}`
- **height:** `24px`

### field label
**Role:** field label component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.link}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.xxs}`

### form panel
**Role:** form panel component

- **backgroundColor:** `{colors.platinum}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.md}`
- **padding:** `{spacing.lg}`

### dotted divider
**Role:** dotted divider component

- **backgroundColor:** `{colors.muted-indigo}`
- **textColor:** `{colors.muted-indigo}`
- **rounded:** `{rounded.none}`
- **height:** `1px`

### hero panel
**Role:** hero panel component

- **backgroundColor:** `{colors.lavender}`
- **textColor:** `{colors.surface}`
- **typography:** `{typography.display}`
- **rounded:** `{rounded.md}`
- **padding:** `{spacing.lg}`

### section label bar
**Role:** section label bar component

- **backgroundColor:** `{colors.canvas}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.sm}`

### news row
**Role:** news row component

- **backgroundColor:** `{colors.platinum}`
- **textColor:** `{colors.ink-soft}`
- **typography:** `{typography.link}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.sm}`

### featured tile
**Role:** featured tile component

- **backgroundColor:** `{colors.carbon}`
- **textColor:** `{colors.on-primary}`
- **typography:** `{typography.micro}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.xxs}`

### poll panel
**Role:** poll panel component

- **backgroundColor:** `{colors.periwinkle}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.md}`
- **padding:** `{spacing.md}`

### radio option
**Role:** radio option component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.full}`
- **size:** `12px`

### info box
**Role:** info box component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.md}`

### promo card
**Role:** promo card component

- **backgroundColor:** `{colors.lavender}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.display}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.md}`

### system tile
**Role:** system tile component

- **backgroundColor:** `{colors.periwinkle}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.sm}`

### link row card
**Role:** link row card component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.body}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.sm}`

### calendar widget
**Role:** calendar widget component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.ink}`
- **typography:** `{typography.micro}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.sm}`

### left rail tab
**Role:** left rail tab component

- **backgroundColor:** `{colors.carbon}`
- **textColor:** `{colors.canvas-soft}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.xs}`

### footer bar
**Role:** footer bar component

- **backgroundColor:** `{colors.carbon}`
- **textColor:** `{colors.canvas-soft}`
- **typography:** `{typography.micro}`
- **rounded:** `{rounded.none}`
- **padding:** `{spacing.lg}`

### esrb badge
**Role:** esrb badge component

- **backgroundColor:** `{colors.amber}`
- **textColor:** `{colors.carbon}`
- **typography:** `{typography.micro}`
- **rounded:** `{rounded.xs}`
- **padding:** `{spacing.xxs}`

### esrb rating square
**Role:** esrb rating square component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.carbon}`
- **typography:** `{typography.ui-label}`
- **rounded:** `{rounded.xs}`
- **size:** `20px`

### mascot bubble
**Role:** mascot bubble component

- **backgroundColor:** `{colors.surface}`
- **textColor:** `{colors.carbon}`
- **typography:** `{typography.micro}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.sm}`

### ex pricing tier
**Role:** ex pricing tier component

- **description:** `Default Pricing tier card. Re-uses feature-card chrome with brand canvas-soft surface.`
- **backgroundColor:** `{colors.canvas-soft}`
- **textColor:** `{colors.ink}`
- **borderColor:** `{colors.hairline}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`

### ex pricing tier featured
**Role:** ex pricing tier featured component

- **description:** `Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode).`
- **backgroundColor:** `{colors.ink}`
- **textColor:** `{colors.on-primary}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`

### ex product selector
**Role:** ex product selector component

- **description:** `What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery).`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`

### ex cart drawer
**Role:** ex cart drawer component

- **description:** `Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart).`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`
- **item-divider:** `{colors.hairline}`

### ex app shell row
**Role:** ex app shell row component

- **description:** `Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.`
- **backgroundColor:** `{colors.canvas}`
- **activeIndicator:** `{colors.primary}`
- **rounded:** `{rounded.sm}`
- **padding:** `{spacing.sm} {spacing.md}`

### ex data table cell
**Role:** ex data table cell component

- **description:** `Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.`
- **headerBackground:** `{colors.canvas-soft}`
- **headerTypography:** `{typography.ui-label}`
- **bodyTypography:** `{typography.body}`
- **cellPadding:** `{spacing.xs} {spacing.sm}`
- **rowBorder:** `{colors.hairline}`

### ex auth form card
**Role:** ex auth form card component

- **description:** `Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`

### ex modal card
**Role:** ex modal card component

- **description:** `Modal dialog surface — same chrome as feature-card with elevated shadow.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.md}`

### ex empty state card
**Role:** ex empty state card component

- **description:** `Empty-state illustration frame.`
- **backgroundColor:** `{colors.canvas-soft}`
- **rounded:** `{rounded.lg}`
- **padding:** `{spacing.xl}`
- **captionTypography:** `{typography.body}`

### ex toast
**Role:** ex toast component

- **description:** `Toast notification surface — feature-card shape + medium shadow.`
- **backgroundColor:** `{colors.surface}`
- **rounded:** `{rounded.md}`
- **padding:** `{spacing.sm} {spacing.md}`
- **typography:** `{typography.body}`

## Do's and Don'ts

### Do

- Use `--color-primary` for the brand's primary interaction treatment.
- Keep page surfaces anchored to `--color-canvas`.
- Preserve every typography style's documented size, line height, and letter spacing.
- Compare major implementation decisions against [the live Nintendo.com (2001) Analysis website](https://www.nintendo.com/).

### Don't

- Do not introduce colors outside the documented color token set.
- Do not replace `--color-periwinkle` with an arbitrary neutral.
- Do not flatten documented component states or spacing relationships.
- Do not treat this extracted snapshot as newer than the live source website.

## Layout

Use the documented spacing scale and component geometry as the implementation baseline. Validate responsive composition and current page rhythm against [the live source](https://www.nintendo.com/).
