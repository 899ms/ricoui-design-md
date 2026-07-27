"use client"

import { useDesignStore } from "@/lib/store/design-store"

/**
 * Shared hydration gate. Workspace initialization is owned by
 * CloudSyncProvider so routes only consume readiness and cannot start a second
 * bootstrap path.
 */
export function useWorkspaceReady() {
  const hasHydrated = useDesignStore((state) => state.hasHydrated)
  const isHydrating = useDesignStore((state) => state.isHydrating)

  return { ready: hasHydrated && !isHydrating, hasHydrated, isHydrating }
}
