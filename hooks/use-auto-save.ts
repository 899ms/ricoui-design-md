"use client"

import { useSyncExternalStore } from "react"
import {
  clearPersistedWorkspaceState,
  getWorkspaceSaveStatus,
  subscribeWorkspaceSaveStatus,
  type SaveStatus,
} from "@/lib/storage/workspace-persistence"

export type { SaveStatus }

/**
 * Save-state hook backed by the IndexedDB workspace persistence layer.
 */
export function useAutoSave() {
  const status = useSyncExternalStore(
    subscribeWorkspaceSaveStatus,
    (): SaveStatus => getWorkspaceSaveStatus(),
    (): SaveStatus => "idle"
  )

  const clearSavedData = async () => {
    try {
      await clearPersistedWorkspaceState()
    } catch {
      return
    }
  }

  return { status, clearSavedData }
}
