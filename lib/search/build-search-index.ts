import type { Brand, LibraryEntry, WorkspaceDocument } from "@/lib/types/tokens"

export type SearchSource = "draft" | "library" | "brand"

export interface SearchItem {
  id: string
  source: SearchSource
  name: string
  description: string
  tags: string[]
  category?: string
  /** Precomputed lowercased haystack used for in-memory substring matching. */
  haystack: string
}

export const SEARCH_SOURCE_LABELS: Record<SearchSource, string> = {
  draft: "草稿 draft drafts",
  library: "设计库 library",
  brand: "品牌 brand brands",
}

/**
 * Cap how much of the `DESIGN.md` content contributes to the search haystack.
 * V6 search is client-side and in-memory; capping keeps matching performant
 * (PRD §4.4: "when useful and performant") while still letting users find a
 * draft by tokens, section names, or copy inside the document.
 */
const MAX_CONTENT_CHARS = 4000

function buildHaystack(
  source: SearchSource,
  parts: Array<string | undefined | null>
): string {
  return [SEARCH_SOURCE_LABELS[source], ...parts]
    .filter(
      (part): part is string => typeof part === "string" && part.length > 0
    )
    .join(" ")
    .toLowerCase()
}

function itemFromDocument(document: WorkspaceDocument): SearchItem {
  const description = document.notes ?? ""
  return {
    id: document.id,
    source: "draft",
    name: document.name,
    description,
    tags: document.tags ?? [],
    category: document.category,
    haystack: buildHaystack("draft", [
      document.name,
      description,
      (document.tags ?? []).join(" "),
      document.category,
      document.rawMarkdown.slice(0, MAX_CONTENT_CHARS),
    ]),
  }
}

function itemFromLibraryEntry(entry: LibraryEntry): SearchItem {
  return {
    id: entry.id,
    source: "library",
    name: entry.name,
    description: entry.description,
    tags: entry.tags,
    category: entry.category,
    haystack: buildHaystack("library", [
      entry.name,
      entry.description,
      entry.tags.join(" "),
      entry.category,
      entry.mdContent.slice(0, MAX_CONTENT_CHARS),
    ]),
  }
}

function itemFromBrand(brand: Brand): SearchItem {
  return {
    id: brand.id,
    source: "brand",
    name: brand.name,
    description: brand.description,
    tags: brand.tags,
    category: brand.category,
    haystack: buildHaystack("brand", [
      brand.name,
      brand.description,
      brand.tags.join(" "),
      brand.category,
      brand.mdContent.slice(0, MAX_CONTENT_CHARS),
    ]),
  }
}

/**
 * Build a flat, source-tagged search index across the three V6 sources:
 * Drafts (`WorkspaceDocument[]`), Library (`LibraryEntry[]`), and Brands
 * (`Brand[]`). Order is preserved as drafts → library → brands so the grouping
 * step can rely on a stable partition.
 */
export function buildSearchIndex(
  documents: WorkspaceDocument[],
  libraryEntries: LibraryEntry[],
  brands: Brand[]
): SearchItem[] {
  return [
    ...documents.map(itemFromDocument),
    ...libraryEntries.map(itemFromLibraryEntry),
    ...brands.map(itemFromBrand),
  ]
}

/**
 * Score-based in-memory matcher. A name hit outranks body/tag hits so the most
 * relevant result floats within a source group. Returns items in score order
 * (ties fall back to index order).
 */
export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  const matches: { item: SearchItem; score: number; index: number }[] = []
  items.forEach((item, index) => {
    if (!item.haystack.includes(normalized)) return
    const nameHit = item.name.toLowerCase().includes(normalized)
    const score = nameHit ? 2 : 1
    matches.push({ item, score, index })
  })

  matches.sort((a, b) => b.score - a.score || a.index - b.index)
  return matches.map((entry) => entry.item)
}
