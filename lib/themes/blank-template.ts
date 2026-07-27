export const BLANK_TEMPLATE_NAME = "Untitled Design System"
export const BLANK_DOCUMENT_NAME = "Untitled.md"

export const BLANK_TEMPLATE_MD = `# ${BLANK_TEMPLATE_NAME} — Style Reference

> A starter design system. Replace this description with your brand voice and rationale.

**Theme:** light

This template includes every modeled section so the preview works from the first edit. Replace placeholder values with your brand tokens; the structured editor keeps the document in sync.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Background | \`#FFFFFF\` | \`--color-background\` | background, page canvas |
| Surface | \`#F8FAFC\` | \`--color-surface\` | surface, cards, panels |
| Text | \`#0F172A\` | \`--color-text\` | text, primary content |
| Muted | \`#64748B\` | \`--color-muted\` | muted, secondary text |
| Border | \`#CBD5E1\` | \`--color-border\` | border, dividers |
| Primary | \`#2563EB\` | \`--color-primary\` | primary, brand actions |
| Secondary | \`#7C3AED\` | \`--color-secondary\` | secondary, accent |
| Success | \`#16A34A\` | \`--color-success\` | success, positive feedback |
| Warning | \`#F59E0B\` | \`--color-warning\` | warning, caution |
| Danger | \`#DC2626\` | \`--color-danger\` | danger, destructive |

### Decorative / Gradient

| Name | Value | Token | Role |
|------|-------|-------|------|
| Brand Gradient | \`linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)\` | \`--gradient-brand\` | hero accents, badges |

## Tokens — Typography

### Inter — Geometric sans-serif · \`--font-display\`
- **Substitute:** Inter, system-ui, -apple-system, sans-serif
- **Weights:** 400, 500, 600, 700
- **Sizes:** 12-64px
- **Line height:** 1.1-1.6
- **Letter spacing:** -0.02em to 0
- **Role:** display, heading

### Inter — Geometric sans-serif · \`--font-body\`
- **Substitute:** Inter, system-ui, -apple-system, sans-serif
- **Weights:** 400, 500, 600
- **Sizes:** 12-18px
- **Line height:** 1.4-1.6
- **Letter spacing:** 0
- **Role:** body, ui

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| display | 48px | 1.1 | -0.03em | \`--type-display\` |
| heading | 28px | 1.2 | -0.02em | \`--type-heading\` |
| body | 16px | 1.6 | 0 | \`--type-body\` |
| label | 14px | 1.4 | 0 | \`--type-label\` |
| caption | 12px | 1.4 | 0.01em | \`--type-caption\` |

## Tokens — Spacing & Shapes

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| space-2 | 8px | \`--space-2\` |
| space-3 | 12px | \`--space-3\` |
| space-4 | 16px | \`--space-4\` |
| space-6 | 24px | \`--space-6\` |
| space-8 | 32px | \`--space-8\` |
| space-12 | 48px | \`--space-12\` |
| space-16 | 64px | \`--space-16\` |

### Border Radius

| Name | Value | Token |
|------|-------|-------|
| radius-sm | 4px | \`--radius-sm\` |
| radius-md | 8px | \`--radius-md\` |
| radius-lg | 12px | \`--radius-lg\` |
| radius-xl | 16px | \`--radius-xl\` |
| radius-full | 999px | \`--radius-full\` |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| shadow-sm | \`0 1px 2px rgba(15, 23, 42, 0.05)\` | \`--shadow-sm\` |
| shadow-md | \`0 4px 12px rgba(15, 23, 42, 0.08)\` | \`--shadow-md\` |
| shadow-lg | \`0 12px 30px rgba(15, 23, 42, 0.1)\` | \`--shadow-lg\` |

### Layout

- **Section gap:** 64px
- **Card padding:** 24px
- **Element gap:** 16px
- **Max content width:** 1120px

## Components

### Primary Button
**Role:** Primary action
A solid primary action button using Primary (#2563EB), White text, radius-md corners, 10px 18px padding, and label/600 typography.

### Card
**Role:** Surface container
A content container using Surface, radius-lg corners, shadow-md elevation, 24px padding, and a 1px solid Border.

### Input
**Role:** Form control
A text field using Background, a 1px solid Border, radius-md corners, 11px 13px padding, and a Primary focus ring at 28% alpha.

## Do's and Don'ts

### Do
- Reserve Primary for the most important action on a page
- Keep spacing consistent with the documented scale
- Add semantic role labels so the preview does not have to infer intent

### Don't
- Do not introduce colors outside the documented palette
- Do not mix unrelated radius scales on adjacent elements
- Do not stack more than two interactive elevation levels on one surface

## Imagery

Use approachable photography and flat illustration that stay consistent with the brand palette. Avoid mixing photography and illustration within the same card or hero.

## Layout

Use a single-column flow on small screens and a 12-column grid above the medium breakpoint. Treat the maximum content width as the outer container; on large screens, keep cards within eight columns to preserve generous whitespace.
`
