"use client"

import { useWorkspaceReady } from "@/hooks/use-workspace-ready"
import { LibraryGalleryPage } from "@/components/theme-gallery-page/theme-gallery-page"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function LibraryPage() {
  const { ready } = useWorkspaceReady()

  if (!ready) {
    return <PageLoadingSkeleton />
  }

  return <LibraryGalleryPage />
}
