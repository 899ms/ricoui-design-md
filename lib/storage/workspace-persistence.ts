"use client"

import type {
  EditorView,
  LibraryEntry,
  WorkspaceDocument,
} from "@/lib/types/tokens"
import type {
  LocalCloudBackup,
  SyncAcknowledgement,
  SyncConflict,
  SyncMutation,
} from "@/lib/sync/types"
import { shouldReplaceQueuedMutation } from "@/lib/sync/sync-engine"
import type {
  SourceWorkspaceDocument,
  SourceWorkspaceSnapshot,
} from "@/lib/sync/types"
import type { UrlSourcePackage } from "@/lib/types/url-generation"

const DB_NAME = "design-md-editor-db"
const STORE_NAME = "workspace"
const SYNC_STORE_NAME = "sync"
const WORKSPACE_KEY = "primary"
const CLOUD_WORKSPACE_PREFIX = "cloud:"
const AI_SETTINGS_KEY = "ai-settings"
const URL_SOURCE_CACHE_KEY = "url-source-cache-v1"
const LOCAL_CLOUD_BACKUP_KEY = "local-cloud-backup"
const SYNC_MUTATION_PREFIX = "mutation:"
const SYNC_CONFLICT_PREFIX = "conflict:"
const SYNC_ACK_PREFIX = "ack:"
const DB_VERSION = 4
const SAVE_DEBOUNCE_MS = 500
const SAVED_DISPLAY_MS = 2000
const URL_SOURCE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const URL_SOURCE_CACHE_LIMIT = 8

interface CachedUrlSourceEntry {
  key: string
  savedAt: number
  payload: UrlSourcePackage
}

interface CachedUrlSourceCollection {
  version: 1
  entries: CachedUrlSourceEntry[]
}

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error"

export interface PersistedWorkspaceSnapshotV3 {
  version: 3
  workspaceName: string
  activeDomain: "workspace" | "library" | "brands"
  activeDocumentId: string | null
  activeView: EditorView
  documents: WorkspaceDocument[]
  libraryEntries: LibraryEntry[]
  brandFavorites?: string[]
}

export interface PersistedWorkspaceSnapshotV4 extends SourceWorkspaceSnapshot {
  version: 4
}

export type PersistedWorkspaceSnapshot = PersistedWorkspaceSnapshotV4

export interface PersistedCloudWorkspaceEnvelopeV1 {
  kind: "cloud-workspace-envelope"
  envelopeVersion: 1
  ownerId: string
  workspaceId: string
  workspaceVersion: number
  snapshot: PersistedWorkspaceSnapshot
  documentVersions: Record<string, number>
  libraryVersions: Record<string, number>
  preferencesVersion?: number
  lastSyncedAt: number
}

export type WorkspaceScope =
  | { kind: "local" }
  | { kind: "cloud"; ownerId: string }

const LOCAL_WORKSPACE_SCOPE: WorkspaceScope = { kind: "local" }
let activeWorkspaceScope: WorkspaceScope = LOCAL_WORKSPACE_SCOPE

function workspaceKey(scope: WorkspaceScope) {
  return scope.kind === "local"
    ? WORKSPACE_KEY
    : `${CLOUD_WORKSPACE_PREFIX}${scope.ownerId}`
}

export function getActiveWorkspaceScope(): WorkspaceScope {
  return activeWorkspaceScope
}

export function setActiveWorkspaceScope(scope: WorkspaceScope) {
  activeWorkspaceScope = scope
  queuedSignature = ""
  clearPersistenceTimers()
  saveStatusStore.setLastSavedSignature("")
  saveStatusStore.setLastSavedContentSignature("")
  saveStatusStore.setStatus("idle")
}

type PersistedAny = {
  version?: number
  workspaceName?: string
  activeDomain?: "workspace" | "library" | "brands"
  activeDocumentId?: string | null
  activeView?: EditorView
  documents?: Array<WorkspaceDocument | SourceWorkspaceDocument>
  userThemes?: LibraryEntry[]
  libraryEntries?: LibraryEntry[]
  brandFavorites?: string[]
}

function isCloudWorkspaceEnvelope(
  value: unknown
): value is PersistedCloudWorkspaceEnvelopeV1 {
  if (!value || typeof value !== "object") return false
  const envelope = value as Partial<PersistedCloudWorkspaceEnvelopeV1>
  return (
    envelope.kind === "cloud-workspace-envelope" &&
    envelope.envelopeVersion === 1 &&
    typeof envelope.ownerId === "string" &&
    typeof envelope.workspaceId === "string" &&
    typeof envelope.workspaceVersion === "number" &&
    Boolean(envelope.snapshot)
  )
}

function toSourceWorkspaceDocument(
  document: WorkspaceDocument | SourceWorkspaceDocument,
  brandIds: Set<string>,
  libraryEntryIds: Set<string>
): SourceWorkspaceDocument | null {
  if (
    !document ||
    typeof document !== "object" ||
    !("rawMarkdown" in document)
  ) {
    return null
  }

  const legacyDocument = document as WorkspaceDocument & {
    sourceThemeId?: string
  }
  const legacyId = legacyDocument.sourceThemeId
  const origin =
    document.origin ??
    (legacyId && brandIds.has(legacyId)
      ? { kind: "brand" as const, id: legacyId }
      : legacyId && libraryEntryIds.has(legacyId)
        ? { kind: "library" as const, id: legacyId }
        : { kind: "blank" as const })
  return {
    id: document.id,
    name: document.name,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    rawMarkdown: document.rawMarkdown,
    initialRawMarkdown: document.initialRawMarkdown ?? document.rawMarkdown,
    tags: document.tags,
    category: document.category,
    pinned: document.pinned,
    origin,
    lastOpenedAt: document.lastOpenedAt,
    notes: document.notes,
  }
}

export function migrateWorkspaceSnapshot(
  raw: PersistedAny | PersistedCloudWorkspaceEnvelopeV1 | null,
  brandIds: Set<string>
): PersistedWorkspaceSnapshot | null {
  if (!raw) return null
  if (isCloudWorkspaceEnvelope(raw)) raw = raw.snapshot

  if (raw.version === 4) {
    return {
      version: 4,
      workspaceName: raw.workspaceName ?? "工作台",
      activeDomain: raw.activeDomain ?? "workspace",
      activeDocumentId: raw.activeDocumentId ?? null,
      activeView: raw.activeView ?? "structured",
      documents: Array.isArray(raw.documents)
        ? raw.documents
            .map((document) =>
              toSourceWorkspaceDocument(document, brandIds, new Set())
            )
            .filter(
              (document): document is SourceWorkspaceDocument =>
                document !== null
            )
        : [],
      libraryEntries: Array.isArray(raw.libraryEntries)
        ? raw.libraryEntries
        : [],
      brandFavorites: Array.isArray(raw.brandFavorites)
        ? raw.brandFavorites
        : [],
    }
  }

  const libraryEntries = Array.isArray(raw.libraryEntries)
    ? raw.libraryEntries
    : Array.isArray(raw.userThemes)
      ? raw.userThemes
      : []
  const libraryEntryIds = new Set(libraryEntries.map((entry) => entry.id))
  const documents = Array.isArray(raw.documents)
    ? raw.documents
        .map((document) =>
          toSourceWorkspaceDocument(document, brandIds, libraryEntryIds)
        )
        .filter(
          (document): document is SourceWorkspaceDocument => document !== null
        )
    : []

  return {
    version: 4,
    workspaceName: raw.workspaceName ?? "工作台",
    activeDomain: raw.activeDomain ?? "workspace",
    activeDocumentId: raw.activeDocumentId ?? null,
    activeView: raw.activeView ?? "structured",
    documents,
    libraryEntries,
    brandFavorites: Array.isArray(raw.brandFavorites) ? raw.brandFavorites : [],
  }
}

function openWorkspaceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
      if (!database.objectStoreNames.contains(SYNC_STORE_NAME)) {
        database.createObjectStore(SYNC_STORE_NAME)
      } else if ((event as IDBVersionChangeEvent).oldVersion < 4) {
        // Pre-V15 mutations belong to the former merged-workspace model. The
        // visible `primary` snapshot remains the local workspace, but none of
        // the old queue/ack/conflict records may be replayed into V15.
        request.transaction?.objectStore(SYNC_STORE_NAME).clear()
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error("无法打开工作台数据库"))
  })
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openWorkspaceDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error("工作台持久化请求失败"))

    transaction.oncomplete = () => {
      database.close()
    }
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("工作台持久化事务失败"))
      database.close()
    }
  })
}

function withWorkspaceStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
) {
  return withStore(STORE_NAME, mode, callback)
}

function withSyncStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
) {
  return withStore(SYNC_STORE_NAME, mode, callback)
}

export async function loadWorkspaceSnapshot(
  brandIds: Set<string> = new Set(),
  scope: WorkspaceScope = activeWorkspaceScope
): Promise<PersistedWorkspaceSnapshot | null> {
  const snapshot = await withWorkspaceStore("readonly", (store) =>
    store.get(workspaceKey(scope))
  )

  return migrateWorkspaceSnapshot(
    (snapshot as PersistedAny | undefined) ?? null,
    brandIds
  )
}

export async function loadCloudWorkspaceEnvelope(
  ownerId: string
): Promise<PersistedCloudWorkspaceEnvelopeV1 | null> {
  const value = await withWorkspaceStore("readonly", (store) =>
    store.get(workspaceKey({ kind: "cloud", ownerId }))
  )
  if (!isCloudWorkspaceEnvelope(value) || value.ownerId !== ownerId) return null
  return value
}

export async function saveCloudWorkspaceEnvelope(
  envelope: PersistedCloudWorkspaceEnvelopeV1
): Promise<void> {
  await withWorkspaceStore("readwrite", (store) =>
    store.put(
      envelope,
      workspaceKey({ kind: "cloud", ownerId: envelope.ownerId })
    )
  )
}

export function canReuseCloudWorkspaceEnvelope(
  envelope: PersistedCloudWorkspaceEnvelopeV1 | null,
  workspace: { id: string; version: number }
) {
  return (
    envelope?.workspaceId === workspace.id &&
    envelope.workspaceVersion === workspace.version
  )
}

export async function saveWorkspaceSnapshot(
  snapshot: PersistedWorkspaceSnapshot,
  scope: WorkspaceScope = activeWorkspaceScope
): Promise<void> {
  if (scope.kind === "cloud") {
    const envelope = await loadCloudWorkspaceEnvelope(scope.ownerId)
    if (envelope) {
      await saveCloudWorkspaceEnvelope({
        ...envelope,
        snapshot,
      })
      return
    }
  }
  await withWorkspaceStore("readwrite", (store) =>
    store.put(snapshot, workspaceKey(scope))
  )
}

export async function clearWorkspaceSnapshot(
  scope: WorkspaceScope = activeWorkspaceScope
): Promise<void> {
  await withWorkspaceStore("readwrite", (store) =>
    store.delete(workspaceKey(scope))
  )
}

export function buildWorkspaceSignature(
  snapshot: PersistedWorkspaceSnapshot | null
): string {
  return snapshot ? JSON.stringify(snapshot) : ""
}

/**
 * Signature for user-authored content only. Navigation state, recent-opened
 * timestamps, favorites, and derived preview metadata still persist, but they
 * must not make the editor claim that the active document was saved.
 */
export function buildWorkspaceContentSignature(
  snapshot: PersistedWorkspaceSnapshot | null
): string {
  if (!snapshot) return ""
  return JSON.stringify({
    workspaceName: snapshot.workspaceName,
    documents: snapshot.documents.map((document) => ({
      id: document.id,
      name: document.name,
      rawMarkdown: document.rawMarkdown,
      initialRawMarkdown: document.initialRawMarkdown,
      tags: document.tags ?? [],
      category: document.category ?? null,
      pinned: document.pinned ?? false,
      origin: document.origin,
      notes: document.notes ?? null,
    })),
    libraryEntries: snapshot.libraryEntries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      tags: entry.tags,
      category: entry.category ?? null,
      mdContent: entry.mdContent,
    })),
  })
}

type SaveStatusListener = () => void

const listeners = new Set<SaveStatusListener>()

const saveStatusStore = {
  status: "idle" as SaveStatus,
  lastSavedSignature: "",
  lastSavedContentSignature: "",
  subscribe(listener: SaveStatusListener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return this.status
  },
  getLastSavedSignature() {
    return this.lastSavedSignature
  },
  getLastSavedContentSignature() {
    return this.lastSavedContentSignature
  },
  setStatus(nextStatus: SaveStatus) {
    if (this.status === nextStatus) return
    this.status = nextStatus
    listeners.forEach((listener) => listener())
  },
  setLastSavedSignature(signature: string) {
    this.lastSavedSignature = signature
  },
  setLastSavedContentSignature(signature: string) {
    this.lastSavedContentSignature = signature
  },
}

let queuedSignature = ""
let saveTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let saveSequence = 0
// Set when the initial snapshot load failed: persisting an empty in-memory
// workspace over data we could not read would destroy it (PROJECT-REVIEW B5).
let persistenceBlocked = false

function clearPersistenceTimers() {
  if (saveTimer) clearTimeout(saveTimer)
  if (idleTimer) clearTimeout(idleTimer)
  saveTimer = null
  idleTimer = null
}

function clearSaveTimer() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = null
}

export function subscribeWorkspaceSaveStatus(listener: SaveStatusListener) {
  return saveStatusStore.subscribe(listener)
}

export function getWorkspaceSaveStatus() {
  return saveStatusStore.getSnapshot()
}

export function markWorkspaceHydrated(
  signature: string,
  contentSignature: string
) {
  queuedSignature = signature
  saveStatusStore.setLastSavedSignature(signature)
  saveStatusStore.setLastSavedContentSignature(contentSignature)
  clearPersistenceTimers()
  saveStatusStore.setStatus("idle")
}

/** Disable all writes for this session (until reload). */
export function markWorkspacePersistenceBlocked() {
  persistenceBlocked = true
  clearPersistenceTimers()
  saveStatusStore.setStatus("error")
}

export function markWorkspacePersistenceAvailable() {
  persistenceBlocked = false
}

export function scheduleWorkspacePersist(snapshot: PersistedWorkspaceSnapshot) {
  if (persistenceBlocked) return

  const signature = buildWorkspaceSignature(snapshot)
  const contentSignature = buildWorkspaceContentSignature(snapshot)
  const announce =
    contentSignature !== saveStatusStore.getLastSavedContentSignature()
  queuedSignature = signature

  if (!signature) {
    clearPersistenceTimers()
    saveStatusStore.setStatus("idle")
    return
  }

  if (signature === saveStatusStore.getLastSavedSignature()) {
    clearSaveTimer()
    return
  }

  if (announce) clearPersistenceTimers()
  else clearSaveTimer()
  if (announce) saveStatusStore.setStatus("unsaved")

  const requestSequence = ++saveSequence
  const scope = activeWorkspaceScope
  saveTimer = setTimeout(async () => {
    if (announce) saveStatusStore.setStatus("saving")

    try {
      await saveWorkspaceSnapshot(snapshot, scope)

      if (requestSequence !== saveSequence) {
        if (
          announce &&
          queuedSignature !== saveStatusStore.getLastSavedSignature()
        ) {
          saveStatusStore.setStatus("unsaved")
        }
        return
      }

      saveStatusStore.setLastSavedSignature(signature)
      saveStatusStore.setLastSavedContentSignature(contentSignature)
      if (announce) {
        saveStatusStore.setStatus("saved")
        idleTimer = setTimeout(() => {
          if (queuedSignature === signature) {
            saveStatusStore.setStatus("idle")
          }
        }, SAVED_DISPLAY_MS)
      }
    } catch {
      saveStatusStore.setStatus("error")
    }
  }, SAVE_DEBOUNCE_MS)
}

export async function clearPersistedWorkspaceState() {
  await clearWorkspaceSnapshot(activeWorkspaceScope)
  queuedSignature = ""
  saveStatusStore.setLastSavedSignature("")
  saveStatusStore.setLastSavedContentSignature("")
  clearPersistenceTimers()
  saveStatusStore.setStatus("idle")
}

/** Read the local-only AI settings from the same IndexedDB database. */
export async function loadAiSettings<T>(): Promise<T | null> {
  const value = await withWorkspaceStore("readonly", (store) =>
    store.get(AI_SETTINGS_KEY)
  )
  return (value as T | undefined) ?? null
}

/** Persist local-only AI settings. The API key never enters workspace snapshots. */
export async function saveAiSettings<T>(settings: T): Promise<void> {
  await withWorkspaceStore("readwrite", (store) =>
    store.put(settings, AI_SETTINGS_KEY)
  )
}

function normalizeUrlSourceCacheKey(rawUrl: string) {
  const url = new URL(rawUrl)
  url.hash = ""
  return url.toString()
}

export async function loadUrlSourcePackage(
  rawUrl: string,
  now = Date.now()
): Promise<UrlSourcePackage | null> {
  const key = normalizeUrlSourceCacheKey(rawUrl)
  const value = await withWorkspaceStore("readonly", (store) =>
    store.get(URL_SOURCE_CACHE_KEY)
  )
  const collection = value as CachedUrlSourceCollection | undefined
  if (collection?.version !== 1 || !Array.isArray(collection.entries)) {
    return null
  }
  const entry = collection.entries.find((candidate) => candidate.key === key)
  if (!entry || now - entry.savedAt > URL_SOURCE_CACHE_TTL_MS) return null
  return entry.payload
}

export async function saveUrlSourcePackage(
  rawUrl: string,
  payload: UrlSourcePackage,
  now = Date.now()
): Promise<void> {
  const key = normalizeUrlSourceCacheKey(rawUrl)
  const value = await withWorkspaceStore("readonly", (store) =>
    store.get(URL_SOURCE_CACHE_KEY)
  )
  const collection = value as CachedUrlSourceCollection | undefined
  const entries =
    collection?.version === 1 && Array.isArray(collection.entries)
      ? collection.entries
      : []
  const freshEntries = entries
    .filter(
      (entry) =>
        entry.key !== key && now - entry.savedAt <= URL_SOURCE_CACHE_TTL_MS
    )
    .sort((left, right) => right.savedAt - left.savedAt)
    .slice(0, URL_SOURCE_CACHE_LIMIT - 1)

  await withWorkspaceStore("readwrite", (store) =>
    store.put(
      {
        version: 1,
        entries: [{ key, savedAt: now, payload }, ...freshEntries],
      } satisfies CachedUrlSourceCollection,
      URL_SOURCE_CACHE_KEY
    )
  )
}

export async function saveLocalCloudBackup(
  backup: LocalCloudBackup
): Promise<void> {
  await withSyncStore("readwrite", (store) =>
    store.put(backup, LOCAL_CLOUD_BACKUP_KEY)
  )
}

export async function loadLocalCloudBackup(): Promise<LocalCloudBackup | null> {
  const backup = await withSyncStore("readonly", (store) =>
    store.get(LOCAL_CLOUD_BACKUP_KEY)
  )
  return (backup as LocalCloudBackup | undefined) ?? null
}

export async function clearLocalCloudBackup(): Promise<void> {
  await withSyncStore("readwrite", (store) =>
    store.delete(LOCAL_CLOUD_BACKUP_KEY)
  )
}

export async function clearAllSyncState(): Promise<void> {
  await withSyncStore("readwrite", (store) => store.clear())
}

let syncMutationWrite: Promise<void> = Promise.resolve()

export function enqueueSyncMutation(mutation: SyncMutation): Promise<void> {
  const write = syncMutationWrite.then(async () => {
    const queued = await listSyncMutations()
    await Promise.all(
      queued
        .filter((item) => shouldReplaceQueuedMutation(item, mutation))
        .map((item) => removeSyncMutation(item.id))
    )
    await withSyncStore("readwrite", (store) =>
      store.put(mutation, `${SYNC_MUTATION_PREFIX}${mutation.id}`)
    )
  })
  syncMutationWrite = write.catch(() => undefined)
  return write
}

export async function listSyncMutations(): Promise<SyncMutation[]> {
  const values = await withSyncStore("readonly", (store) => store.getAll())
  return (values as unknown[])
    .filter(
      (value): value is SyncMutation =>
        !!value &&
        typeof value === "object" &&
        "id" in value &&
        "entity" in value &&
        "operation" in value
    )
    .sort((left, right) => left.createdAt - right.createdAt)
}

export async function removeSyncMutation(id: string): Promise<void> {
  await withSyncStore("readwrite", (store) =>
    store.delete(`${SYNC_MUTATION_PREFIX}${id}`)
  )
}

export async function updateSyncMutation(
  mutation: SyncMutation
): Promise<void> {
  await enqueueSyncMutation(mutation)
}

export function removeSyncMutationsForEntity(
  ownerId: string,
  workspaceId: string,
  entity: "document" | "library_entry",
  entityId: string
): Promise<void> {
  const write = syncMutationWrite.then(async () => {
    const queued = await listSyncMutations()
    await Promise.all(
      queued
        .filter(
          (mutation) =>
            mutation.ownerId === ownerId &&
            mutation.workspaceId === workspaceId &&
            mutation.entity === entity &&
            mutation.entityId === entityId
        )
        .map((mutation) => removeSyncMutation(mutation.id))
    )
  })
  syncMutationWrite = write.catch(() => undefined)
  return write
}

export async function saveSyncConflict(conflict: SyncConflict): Promise<void> {
  await withSyncStore("readwrite", (store) =>
    store.put(conflict, `${SYNC_CONFLICT_PREFIX}${conflict.id}`)
  )
}

export async function listSyncConflicts(): Promise<SyncConflict[]> {
  const values = await withSyncStore("readonly", (store) => store.getAll())
  return (values as unknown[])
    .filter(
      (value): value is SyncConflict =>
        !!value &&
        typeof value === "object" &&
        "id" in value &&
        "remoteVersion" in value &&
        "remote" in value &&
        "entity" in value
    )
    .sort((left, right) => left.detectedAt - right.detectedAt)
}

export async function removeSyncConflict(id: string): Promise<void> {
  await withSyncStore("readwrite", (store) =>
    store.delete(`${SYNC_CONFLICT_PREFIX}${id}`)
  )
}

function syncAcknowledgementKey(acknowledgement: SyncAcknowledgement) {
  return `${SYNC_ACK_PREFIX}${acknowledgement.ownerId}:${acknowledgement.workspaceId}:${acknowledgement.entity}:${acknowledgement.entityId}`
}

export async function saveSyncAcknowledgement(
  acknowledgement: SyncAcknowledgement
): Promise<void> {
  await withSyncStore("readwrite", (store) =>
    store.put(acknowledgement, syncAcknowledgementKey(acknowledgement))
  )
}

export async function listSyncAcknowledgements(): Promise<
  SyncAcknowledgement[]
> {
  const values = await withSyncStore("readonly", (store) => store.getAll())
  return (values as unknown[]).filter(
    (value): value is SyncAcknowledgement =>
      !!value &&
      typeof value === "object" &&
      "ownerId" in value &&
      "workspaceId" in value &&
      "entityId" in value &&
      "signature" in value &&
      "acknowledgedAt" in value &&
      "version" in value &&
      !("remote" in value)
  )
}

/**
 * Persist immediately, skipping the debounce. Called from pagehide /
 * visibilitychange so the last ~500ms of edits are not lost when the tab
 * closes (PROJECT-REVIEW B11).
 */
export function flushWorkspacePersistNow(snapshot: PersistedWorkspaceSnapshot) {
  if (persistenceBlocked) return

  const signature = buildWorkspaceSignature(snapshot)
  const contentSignature = buildWorkspaceContentSignature(snapshot)
  const announce =
    contentSignature !== saveStatusStore.getLastSavedContentSignature()
  if (!signature || signature === saveStatusStore.getLastSavedSignature()) {
    return
  }

  queuedSignature = signature
  clearPersistenceTimers()
  const requestSequence = ++saveSequence
  const scope = activeWorkspaceScope
  if (announce) saveStatusStore.setStatus("saving")

  void saveWorkspaceSnapshot(snapshot, scope)
    .then(() => {
      if (requestSequence !== saveSequence) return
      saveStatusStore.setLastSavedSignature(signature)
      saveStatusStore.setLastSavedContentSignature(contentSignature)
      if (announce) saveStatusStore.setStatus("saved")
    })
    .catch(() => {
      saveStatusStore.setStatus("error")
    })
}
