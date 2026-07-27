"use client"

import { create } from "zustand"
import type { SyncConflict, SyncStatus } from "@/lib/sync/types"

const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  local: "仅本机",
  offline: "离线，等待同步",
  pending: "等待同步",
  syncing: "正在同步",
  synced: "已同步",
  conflict: "云同步已暂停",
  "quota-blocked": "云端配额已满，本地内容仍安全",
  error: "同步需要处理",
}

export function getSyncStatusLabel(status: SyncStatus) {
  return SYNC_STATUS_LABELS[status]
}

interface SyncState {
  status: SyncStatus
  pendingCount: number
  lastSyncedAt: number | null
  error: string | null
  retryToken: number
  sourceVersions: Record<string, number>
  conflicts: SyncConflict[]
  setStatus: (status: SyncStatus, error?: string | null) => void
  setPendingCount: (count: number) => void
  markSynced: () => void
  requestRetry: () => void
  setSourceVersion: (sourceId: string, version: number) => void
  setConflicts: (conflicts: SyncConflict[]) => void
  upsertConflict: (conflict: SyncConflict) => void
  removeConflict: (conflictId: string) => void
  reset: () => void
}

export const useSyncState = create<SyncState>((set) => ({
  status: "local",
  pendingCount: 0,
  lastSyncedAt: null,
  error: null,
  retryToken: 0,
  sourceVersions: {},
  conflicts: [],
  setStatus: (status, error = null) => set({ status, error }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  markSynced: () =>
    set((state) => ({
      status: state.conflicts.length > 0 ? "conflict" : "synced",
      pendingCount: 0,
      error: null,
      lastSyncedAt: Date.now(),
    })),
  requestRetry: () => set((state) => ({ retryToken: state.retryToken + 1 })),
  setSourceVersion: (sourceId, version) =>
    set((state) => ({
      sourceVersions: { ...state.sourceVersions, [sourceId]: version },
    })),
  setConflicts: (conflicts) =>
    set((state) => ({
      conflicts,
      status:
        conflicts.length > 0 && state.status === "synced"
          ? "conflict"
          : state.status,
    })),
  upsertConflict: (conflict) =>
    set((state) => ({
      conflicts: [
        ...state.conflicts.filter((item) => item.id !== conflict.id),
        conflict,
      ],
      status: "conflict",
      error: null,
    })),
  removeConflict: (conflictId) =>
    set((state) => {
      const conflicts = state.conflicts.filter((item) => item.id !== conflictId)
      return {
        conflicts,
        status:
          conflicts.length === 0 && state.status === "conflict"
            ? "synced"
            : state.status,
      }
    }),
  reset: () =>
    set({
      status: "local",
      pendingCount: 0,
      lastSyncedAt: null,
      error: null,
      sourceVersions: {},
      conflicts: [],
    }),
}))
