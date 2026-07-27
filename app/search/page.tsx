"use client"

import { useWorkspaceReady } from "@/hooks/use-workspace-ready"
import { SearchPage } from "@/components/search/search-page"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function SearchRoutePage() {
  const { ready } = useWorkspaceReady()

  if (!ready) {
    return <PageLoadingSkeleton />
  }

  return <SearchPage />
}
