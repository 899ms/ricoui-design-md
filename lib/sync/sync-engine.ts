import type { DesignStore } from "@/lib/types/tokens"
import {
  toSourceDocument,
  type SourceWorkspaceSnapshot,
  type SyncMutation,
} from "@/lib/sync/types"

function createMutationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function buildSourceWorkspaceSnapshot(
  state: Pick<
    DesignStore,
    | "workspaceName"
    | "activeDocumentId"
    | "activeView"
    | "documents"
    | "libraryEntries"
    | "brandFavorites"
  >
): SourceWorkspaceSnapshot {
  return {
    version: 4,
    workspaceName: state.workspaceName,
    activeDomain: "workspace",
    activeDocumentId: state.activeDocumentId,
    activeView: state.activeView,
    documents: state.documents.map(toSourceDocument),
    libraryEntries: state.libraryEntries.map((entry) => ({ ...entry })),
    brandFavorites: [...state.brandFavorites],
  }
}

export function createSyncMutation(
  input: Omit<SyncMutation, "id" | "createdAt" | "attempts">
): SyncMutation {
  return {
    ...input,
    id: createMutationId(),
    createdAt: Date.now(),
    attempts: 0,
  }
}

/** Compare only fields that are actually synchronized and user-controlled. */
export function sourceDocumentSyncSignature(
  document: SourceWorkspaceSnapshot["documents"][number]
) {
  return JSON.stringify({
    name: document.name,
    rawMarkdown: document.rawMarkdown.replace(/\r\n?/g, "\n"),
    tags: document.tags ?? [],
    category: document.category ?? null,
    pinned: document.pinned ?? false,
    origin: document.origin,
    notes: document.notes ?? null,
  })
}

export function libraryEntrySyncSignature(
  entry: SourceWorkspaceSnapshot["libraryEntries"][number]
) {
  return JSON.stringify({
    name: entry.name,
    description: entry.description,
    tags: entry.tags,
    category: entry.category ?? null,
    mdContent: entry.mdContent.replace(/\r\n?/g, "\n"),
  })
}

export type SourceChangeDisposition =
  | "same"
  | "pending-local"
  | "take-remote"
  | "push-local"
  | "conflict"

export function classifySourceChange(input: {
  localSignature: string
  remoteSignature: string
  acknowledgedSignature?: string
  hasPendingMutation: boolean
  hasPersistedConflict: boolean
}): SourceChangeDisposition {
  if (input.localSignature === input.remoteSignature) return "same"
  if (input.hasPersistedConflict) return "conflict"
  if (input.hasPendingMutation) return "pending-local"
  if (!input.acknowledgedSignature) return "conflict"
  if (input.localSignature === input.acknowledgedSignature) return "take-remote"
  if (input.remoteSignature === input.acknowledgedSignature) return "push-local"
  return "conflict"
}

export function shouldReplaceQueuedMutation(
  queued: SyncMutation,
  incoming: SyncMutation
) {
  return (
    queued.ownerId === incoming.ownerId &&
    queued.workspaceId === incoming.workspaceId &&
    queued.entity === incoming.entity &&
    queued.entityId === incoming.entityId &&
    (queued.entity === "document" ||
      queued.entity === "library_entry" ||
      queued.operation === incoming.operation)
  )
}

export function getSyncErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    return [record.message, record.code, record.details, record.hint]
      .filter((value): value is string => typeof value === "string")
      .join(" ")
  }
  return String(error)
}

export function isQuotaBlockedError(error: unknown) {
  return /RICO_(QUOTA|CLOUD_GROWTH_FROZEN)/.test(getSyncErrorMessage(error))
}

export function countPendingSources(mutations: SyncMutation[]) {
  return new Set(
    mutations.map((mutation) => {
      if (mutation.entity !== "tombstone")
        return `${mutation.entity}:${mutation.entityId}`
      const entityType = mutation.payload.entity_type
      const entityId = mutation.payload.entity_id
      return `${String(entityType ?? "tombstone")}:${String(entityId ?? mutation.entityId)}`
    })
  ).size
}
