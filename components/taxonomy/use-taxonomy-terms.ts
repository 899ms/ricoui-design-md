"use client"

import { useMemo } from "react"
import { useDesignStore } from "@/lib/store/design-store"

export interface TaxonomyTerm {
  value: string
  drafts: number
  library: number
  total: number
}

export interface TaxonomyTerms {
  tags: TaxonomyTerm[]
  categories: TaxonomyTerm[]
  tagNames: string[]
  categoryNames: string[]
}

interface Counts {
  drafts: number
  library: number
}

/**
 * Derive user-owned tag/category terms from workspace drafts + Library
 * entries only. Built-in Brand package metadata is intentionally excluded
 * (V7-PRD §7.2). Used by the Save-to-Library inputs and the Taxonomy Manager.
 */
export function useTaxonomyTerms(): TaxonomyTerms {
  const documents = useDesignStore((state) => state.documents)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)

  return useMemo(() => {
    const tagMap = new Map<string, Counts>()
    const catMap = new Map<string, Counts>()
    const ensure = (map: Map<string, Counts>, key: string): Counts => {
      let entry = map.get(key)
      if (!entry) {
        entry = { drafts: 0, library: 0 }
        map.set(key, entry)
      }
      return entry
    }

    for (const doc of documents) {
      for (const tag of doc.tags ?? []) {
        const key = tag.trim()
        if (!key) continue
        ensure(tagMap, key).drafts += 1
      }
      const category = doc.category?.trim()
      if (category) ensure(catMap, category).drafts += 1
    }
    for (const entry of libraryEntries) {
      for (const tag of entry.tags) {
        const key = tag.trim()
        if (!key) continue
        ensure(tagMap, key).library += 1
      }
      const category = entry.category?.trim()
      if (category) ensure(catMap, category).library += 1
    }

    const toTerms = (
      map: Map<string, Counts>,
      alpha: boolean
    ): TaxonomyTerm[] => {
      const terms = Array.from(map.entries()).map(([value, counts]) => ({
        value,
        drafts: counts.drafts,
        library: counts.library,
        total: counts.drafts + counts.library,
      }))
      if (alpha) terms.sort((a, b) => a.value.localeCompare(b.value))
      else
        terms.sort(
          (a, b) => b.total - a.total || a.value.localeCompare(b.value)
        )
      return terms
    }

    const tags = toTerms(tagMap, false)
    const categories = toTerms(catMap, true)

    return {
      tags,
      categories,
      tagNames: tags.map((term) => term.value),
      categoryNames: categories.map((term) => term.value),
    }
  }, [documents, libraryEntries])
}
