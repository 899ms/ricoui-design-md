import type {
  DesignTokens,
  DocumentSectionDataKey,
  DocumentSectionSkeleton,
  RawSections,
} from "@/lib/types/tokens"

export type StructuredWorkflowKey =
  | "brand"
  | "typography"
  | "surfaces"
  | "layout"
  | "components"
  | "guidelines"

export interface StructuredEditorVisibility {
  brandIdentity: boolean
  colors: boolean
  gradients: boolean
  fontFamilies: boolean
  typeScale: boolean
  radius: boolean
  shadows: boolean
  density: boolean
  spacing: boolean
  layoutTokens: boolean
  layoutProse: boolean
  components: boolean
  dosDonts: boolean
  imagery: boolean
  previewDos: boolean
  previewDonts: boolean
  previewImagery: boolean
  workflows: StructuredWorkflowKey[]
}

function hasDataKey(
  sectionSkeleton: DocumentSectionSkeleton[],
  key: DocumentSectionDataKey
): boolean {
  return sectionSkeleton.some((section) => section.dataKey === key)
}

function hasDataKeyPrefix(
  sectionSkeleton: DocumentSectionSkeleton[],
  prefix: string
): boolean {
  return sectionSkeleton.some((section) => section.dataKey?.startsWith(prefix))
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

export function getStructuredEditorVisibility({
  tokens,
  rawSections,
  sectionSkeleton,
}: {
  tokens: DesignTokens
  rawSections: RawSections
  sectionSkeleton: DocumentSectionSkeleton[]
}): StructuredEditorVisibility {
  const brandIdentity =
    hasText(tokens.meta.name) ||
    hasText(tokens.meta.description) ||
    hasDataKey(sectionSkeleton, "tokens.meta")
  const colors = tokens.colors.length > 0
  const gradients = tokens.gradients.length > 0
  const fontFamilies = tokens.typography.fontFamilies.length > 0
  const typeScale = tokens.typography.typeScale.length > 0
  const radius = tokens.radius.length > 0
  const shadows = tokens.shadows.length > 0
  const density = hasText(rawSections.density)
  const spacing = tokens.spacing.length > 0
  const layoutTokens =
    Object.values(tokens.layout).some(hasText) ||
    hasDataKey(sectionSkeleton, "tokens.layout")
  const layoutProse =
    hasText(rawSections.layout) ||
    hasDataKey(sectionSkeleton, "rawSections.layout")
  const components =
    tokens.components.length > 0 ||
    hasDataKeyPrefix(sectionSkeleton, "tokens.components.")
  const dosDonts =
    rawSections.dosDonts.dos.length > 0 ||
    rawSections.dosDonts.donts.length > 0 ||
    hasDataKey(sectionSkeleton, "rawSections.dosDonts") ||
    hasDataKey(sectionSkeleton, "rawSections.dos") ||
    hasDataKey(sectionSkeleton, "rawSections.donts")
  const imagery =
    hasText(rawSections.imagery) ||
    hasDataKey(sectionSkeleton, "rawSections.imagery")

  const workflowVisibility: Record<StructuredWorkflowKey, boolean> = {
    brand: brandIdentity || colors || gradients,
    typography: fontFamilies || typeScale,
    surfaces: radius || shadows || density,
    layout: spacing || layoutTokens || layoutProse,
    components,
    guidelines: dosDonts || imagery,
  }

  return {
    brandIdentity,
    colors,
    gradients,
    fontFamilies,
    typeScale,
    radius,
    shadows,
    density,
    spacing,
    layoutTokens,
    layoutProse,
    components,
    dosDonts,
    imagery,
    previewDos: rawSections.dosDonts.dos.length > 0,
    previewDonts: rawSections.dosDonts.donts.length > 0,
    previewImagery: hasText(rawSections.imagery),
    workflows: (
      [
        "brand",
        "typography",
        "surfaces",
        "layout",
        "components",
        "guidelines",
      ] as StructuredWorkflowKey[]
    ).filter((workflow) => workflowVisibility[workflow]),
  }
}
