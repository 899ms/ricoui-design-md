import type { DesignTokens } from "@/lib/types/tokens"
import { slugify } from "@/lib/utils"
import {
  isCanonicalCustomProperty,
  isCompleteGradientValue,
  isExportableTokenValue,
} from "@/lib/validation/token-syntax"

function canExportToken(token: string) {
  return !token.trim() || isCanonicalCustomProperty(token)
}

function tokenName(token: string, prefix: string, fallback: string) {
  return isCanonicalCustomProperty(token)
    ? token.trim()
    : `--${prefix}-${slugify(fallback)}`
}

/**
 * Exports design tokens in W3C DTCG format.
 * Each token has $value, $type, and $description.
 */
export function exportToJson(tokens: DesignTokens): string {
  const color: Record<string, unknown> = {}
  const gradient: Record<string, unknown> = {}
  const spacing: Record<string, unknown> = {}
  const radius: Record<string, unknown> = {}
  const shadow: Record<string, unknown> = {}

  const output: Record<string, unknown> = {
    $schema: "https://tr.designtokens.org/format/",
    $description: `Design tokens for ${tokens.meta.name}`,
    meta: tokens.meta,
    color,
    gradient,
    typography: {
      fontFamilies: tokens.typography.fontFamilies.filter(
        (font) => canExportToken(font.token) && Boolean(font.name.trim())
      ),
      typeScale: tokens.typography.typeScale.filter(
        (type) =>
          canExportToken(type.token) &&
          isExportableTokenValue(type.size) &&
          isExportableTokenValue(type.lineHeight) &&
          (!type.letterSpacing || isExportableTokenValue(type.letterSpacing))
      ),
    },
    spacing,
    radius,
    shadow,
    layout: Object.fromEntries(
      Object.entries(tokens.layout).filter(([, value]) =>
        isExportableTokenValue(value)
      )
    ),
  }

  for (const c of tokens.colors) {
    if (!isExportableTokenValue(c.value) || !canExportToken(c.token)) continue
    color[tokenName(c.token, "color", c.name)] = {
      $value: c.value,
      $type: "color",
      $description: c.role,
    }
  }

  for (const g of tokens.gradients) {
    if (
      !isExportableTokenValue(g.value) ||
      !isCompleteGradientValue(g.value) ||
      !canExportToken(g.token)
    )
      continue
    gradient[tokenName(g.token, "gradient", g.name)] = {
      $value: g.value,
      $type: "gradient",
      $description: g.role,
    }
  }

  for (const s of tokens.spacing) {
    if (!isExportableTokenValue(s.value) || !canExportToken(s.token)) continue
    spacing[tokenName(s.token, "spacing", s.name)] = {
      $value: s.value,
      $type: "dimension",
      $description: s.name,
    }
  }

  for (const r of tokens.radius) {
    if (!isExportableTokenValue(r.value) || !canExportToken(r.token)) continue
    radius[tokenName(r.token, "radius", r.name)] = {
      $value: r.value,
      $type: "dimension",
      $description: r.name,
    }
  }

  for (const s of tokens.shadows) {
    if (!isExportableTokenValue(s.value) || !canExportToken(s.token)) continue
    shadow[tokenName(s.token, "shadow", s.name)] = {
      $value: s.value,
      $type: "shadow",
      $description: s.name,
    }
  }

  return JSON.stringify(output, null, 2)
}
