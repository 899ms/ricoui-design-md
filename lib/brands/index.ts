import type { Brand, ThemeMetadataChips } from "@/lib/types/tokens"

export const REQUIRED_BRAND_FILES = [
  "DESIGN.md",
  "tokens.json",
  "variables.css",
  "theme.css",
] as const

export const OPTIONAL_BRAND_FILES = ["preview.html"] as const

// Presentation assets are intentionally separate from the downloadable brand
// package. Covers may be PNG for backwards compatibility; newly synced website
// screenshots use WebP. Favicons keep their source format.
export const BRAND_MEDIA_FILES = [
  "cover.png",
  "cover.webp",
  "preview.mp4",
  "favicon.ico",
  "favicon.jpg",
  "favicon.png",
  "favicon.svg",
  "favicon.webp",
] as const

type RequiredBrandFile = (typeof REQUIRED_BRAND_FILES)[number]
type OptionalBrandFile = (typeof OPTIONAL_BRAND_FILES)[number]
type BrandCoverFile =
  | "cover.png"
  | "cover.webp"
  | `${string}-cover.webp`
  | `cover_${string}.webp`
type BrandFaviconFile = `favicon.${"ico" | "jpg" | "png" | "svg" | "webp"}`
type BrandMediaFile = BrandCoverFile | BrandFaviconFile | "preview.mp4"
type KnownBrandFile = RequiredBrandFile | OptionalBrandFile | BrandMediaFile

interface RegistryEntry {
  id: string
  folder: string
  name: string
  website: string
  description: string
  tags: string[]
  category: string
  previewColors: string[]
  files: string[]
  cover?: BrandCoverFile
  favicon?: BrandFaviconFile
}

const mdCache = new Map<string, string>()

export async function fetchBrands(): Promise<Brand[]> {
  const response = await fetch("/brands/registry.json")
  if (!response.ok) throw new Error("无法加载品牌注册表")
  const registry: RegistryEntry[] = await response.json()

  return registry.map((entry) => {
    const listedFiles = new Set(entry.files)
    const missingFiles = REQUIRED_BRAND_FILES.filter(
      (filename) => !listedFiles.has(filename)
    )
    const metadataChips: ThemeMetadataChips = {
      accent: entry.previewColors[0],
    }
    return {
      id: entry.id,
      folder: entry.folder,
      name: entry.name,
      website: entry.website,
      description: entry.description,
      tags: entry.tags,
      category: entry.category,
      previewColors: entry.previewColors,
      files: [...entry.files],
      designMdUrl: getBrandAssetUrl(entry.folder, "DESIGN.md"),
      previewUrl: listedFiles.has("preview.html")
        ? getBrandAssetUrl(entry.folder, "preview.html")
        : undefined,
      tokensUrl: listedFiles.has("tokens.json")
        ? getBrandAssetUrl(entry.folder, "tokens.json")
        : undefined,
      variablesUrl: listedFiles.has("variables.css")
        ? getBrandAssetUrl(entry.folder, "variables.css")
        : undefined,
      themeCssUrl: listedFiles.has("theme.css")
        ? getBrandAssetUrl(entry.folder, "theme.css")
        : undefined,
      imageUrl: entry.cover
        ? getBrandAssetUrl(entry.folder, entry.cover)
        : undefined,
      faviconUrl: entry.favicon
        ? getBrandAssetUrl(entry.folder, entry.favicon)
        : undefined,
      videoUrl: listedFiles.has("preview.mp4")
        ? getBrandAssetUrl(entry.folder, "preview.mp4")
        : undefined,
      isComplete: missingFiles.length === 0,
      missingFiles,
      // Brand Markdown is intentionally lazy. Listing and Home only need the
      // registry metadata; loading every source here used to block workspace
      // hydration behind dozens of sequential network round trips.
      mdContent: mdCache.get(entry.id) ?? "",
      metadataChips,
    }
  })
}

export async function fetchBrandMarkdown(brand: Brand): Promise<string | null> {
  if (brand.mdContent) return brand.mdContent

  const cached = mdCache.get(brand.id)
  if (cached) return cached

  try {
    const response = await fetch(brand.designMdUrl)
    if (!response.ok) return null
    const markdown = await response.text()
    mdCache.set(brand.id, markdown)
    return markdown
  } catch {
    return null
  }
}

export function getBrandAssetUrl(
  folder: string,
  filename: KnownBrandFile
): string {
  return `/brands/${folder}/${filename}`
}

export type { Brand, RegistryEntry }
