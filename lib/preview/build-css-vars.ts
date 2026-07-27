import type {
  DesignTokens,
  ParseResult,
  PreviewSemantics,
  PreviewTypeStyle,
} from "@/lib/types/tokens"
import { slugify } from "@/lib/utils"

export function buildTokenCssVars(
  tokens: DesignTokens
): Record<string, string> {
  const vars: Record<string, string> = {}

  for (const color of tokens.colors) {
    vars[`--color-${slugify(color.name)}`] = color.value
  }

  for (const gradient of tokens.gradients) {
    vars[`--gradient-${slugify(gradient.name)}`] = gradient.value
  }

  for (const font of tokens.typography.fontFamilies) {
    vars[`--font-${slugify(font.name)}`] = font.substitute || font.name
  }

  for (const style of tokens.typography.typeScale) {
    const slug = slugify(style.role)
    vars[`--type-${slug}-size`] = style.size
    if (style.lineHeight) vars[`--type-${slug}-line-height`] = style.lineHeight
    if (style.letterSpacing) {
      vars[`--type-${slug}-letter-spacing`] = style.letterSpacing
    }
  }

  for (const spacing of tokens.spacing) {
    vars[`--space-${slugify(spacing.name)}`] = spacing.value
  }

  for (const radius of tokens.radius) {
    vars[`--radius-${slugify(radius.name)}`] = radius.value
  }

  for (const shadow of tokens.shadows) {
    vars[`--shadow-${slugify(shadow.name)}`] = shadow.value
  }

  if (tokens.layout.sectionGap)
    vars["--layout-section-gap"] = tokens.layout.sectionGap
  if (tokens.layout.cardPadding)
    vars["--layout-card-padding"] = tokens.layout.cardPadding
  if (tokens.layout.elementGap)
    vars["--layout-element-gap"] = tokens.layout.elementGap
  if (tokens.layout.maxContentWidth)
    vars["--layout-max-width"] = tokens.layout.maxContentWidth

  return vars
}

function applyTypeStyleVars(
  vars: Record<string, string>,
  role: string,
  style: PreviewTypeStyle
) {
  vars[`--type-${role}-size`] = style.size
  if (style.lineHeight) vars[`--type-${role}-line-height`] = style.lineHeight
  if (style.letterSpacing)
    vars[`--type-${role}-letter-spacing`] = style.letterSpacing
}

export function buildSemanticCssVars(
  previewSemantics: PreviewSemantics
): Record<string, string> {
  const vars: Record<string, string> = {}
  const { colors, typography, surfaces, layout, canonicalKit } =
    previewSemantics

  vars["--color-primary"] = colors.primary.value
  vars["--color-secondary"] = colors.secondary.value
  vars["--color-surface"] = colors.surface.value
  vars["--color-background"] = colors.background.value
  vars["--color-text"] = colors.text.value
  vars["--color-muted"] = colors.muted.value
  vars["--color-border-subtle"] = colors.border.value
  vars["--color-success"] = colors.success.value
  vars["--color-warning"] = colors.warning.value
  vars["--color-danger"] = colors.danger.value

  vars["--font-display"] = typography.displayFont.value
  vars["--font-body"] = typography.bodyFont.value

  applyTypeStyleVars(vars, "display", typography.display.value)
  applyTypeStyleVars(vars, "heading", typography.heading.value)
  applyTypeStyleVars(vars, "body", typography.body.value)
  applyTypeStyleVars(vars, "label", typography.label.value)
  applyTypeStyleVars(vars, "caption", typography.caption.value)

  vars["--radius-card"] = surfaces.cardRadius.value
  vars["--radius-button"] = surfaces.buttonRadius.value
  vars["--radius-input"] = surfaces.inputRadius.value
  vars["--shadow-card"] = surfaces.cardShadow.value
  vars["--shadow-button"] = surfaces.buttonShadow.value

  vars["--layout-section-gap"] = layout.sectionGap.value
  vars["--layout-card-padding"] = layout.cardPadding.value
  vars["--layout-element-gap"] = layout.elementGap.value
  vars["--layout-max-width"] = layout.maxContentWidth.value

  vars["--preview-focus-ring"] = canonicalKit.focusRing
  vars["--preview-disabled-opacity"] = canonicalKit.disabledOpacity.toString()

  return vars
}

export function buildDocumentCssVars(
  documentModel: Pick<ParseResult, "tokens" | "previewSemantics">
): Record<string, string> {
  return {
    ...buildTokenCssVars(documentModel.tokens),
    ...buildSemanticCssVars(documentModel.previewSemantics),
  }
}
