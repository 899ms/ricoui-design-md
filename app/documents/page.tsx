"use client"

import { useWorkspaceReady } from "@/hooks/use-workspace-ready"
import { WorkspaceGallery } from "@/components/workspace-gallery/workspace-gallery"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function DocumentsPage() {
  const { ready } = useWorkspaceReady()

  if (!ready) {
    return <PageLoadingSkeleton />
  }

  return <WorkspaceGallery />
}
