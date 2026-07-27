"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslations } from "next-intl"
import {
  fromCloudDocument,
  fromCloudLibraryEntry,
  toCloudEditorView,
  toCloudDocument,
  toCloudLibraryEntry,
} from "@/lib/sync/cloud-mappers"
import {
  applyCloudMutation,
  downloadCloudSnapshotConsistent,
  ensureCloudWorkspace,
  getCloudWorkspaceRevision,
  getCloudDocument,
  getCloudLibraryEntry,
  supportsWorkspaceRevision,
} from "@/lib/sync/cloud-api"
import { getBrowserSupabaseClient } from "@/lib/sync/supabase"
import {
  buildSourceWorkspaceSnapshot,
  classifySourceChange,
  countPendingSources,
  createSyncMutation,
  getSyncErrorMessage,
  isQuotaBlockedError,
  libraryEntrySyncSignature,
  sourceDocumentSyncSignature,
} from "@/lib/sync/sync-engine"
import {
  buildWorkspaceContentSignature,
  buildWorkspaceSignature,
  canReuseCloudWorkspaceEnvelope,
  clearAllSyncState,
  clearWorkspaceSnapshot,
  enqueueSyncMutation,
  listSyncAcknowledgements,
  listSyncConflicts,
  listSyncMutations,
  loadCloudWorkspaceEnvelope,
  loadWorkspaceSnapshot,
  markWorkspaceHydrated,
  removeSyncConflict,
  removeSyncMutation,
  removeSyncMutationsForEntity,
  saveCloudWorkspaceEnvelope,
  saveWorkspaceSnapshot,
  saveSyncAcknowledgement,
  saveSyncConflict,
  setActiveWorkspaceScope,
  updateSyncMutation,
  type WorkspaceScope,
} from "@/lib/storage/workspace-persistence"
import { useDesignStore } from "@/lib/store/design-store"
import { useSyncState } from "@/lib/sync/sync-state"
import type {
  DocumentConflictResolution,
  SourceWorkspaceSnapshot,
  SyncAcknowledgement,
  SyncConflict,
  SyncMutation,
} from "@/lib/sync/types"
import { useAccountDialog } from "@/components/account-dialog-provider"
import {
  CLOUD_ACCOUNT_MARKDOWN_BYTES,
  CLOUD_DOCUMENT_LIMIT,
  CLOUD_LIBRARY_LIMIT,
  CLOUD_SOURCE_MARKDOWN_BYTES,
  getUtf8ByteLength,
} from "@/lib/sync/cloud-limits"
import {
  localImportDecisionKey,
  readWorkspaceBootstrapHint,
  shouldHideWorkspace,
  shouldPromptForLocalImport,
  writeWorkspaceBootstrapHint,
  type LocalImportCatalog,
  type LocalImportResult,
  type WorkspaceBootstrapHintV1,
  type WorkspaceTransitionPhase,
} from "@/lib/sync/workspace-transition"

function snapshotSignature(snapshot: SourceWorkspaceSnapshot) {
  return JSON.stringify(snapshot)
}

function copiedSourceId(prefix: "doc" | "lib") {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}_${suffix}`
}

type ConflictResolutionResult = "resolved" | "remote-changed" | "unavailable"

export interface CloudSyncContextValue {
  resolveDocumentConflict: (
    conflictId: string,
    resolution: DocumentConflictResolution
  ) => Promise<ConflictResolutionResult>
  signOut: (force?: boolean) => Promise<void>
  getLocalImportCatalog: () => Promise<LocalImportCatalog>
  importLocalSources: (keys: string[]) => Promise<LocalImportResult>
  workspacePhase: WorkspaceTransitionPhase
  workspaceInteractive: boolean
  workspaceError: string | null
  retryWorkspaceTransition: () => void
  localImportPromptOpen: boolean
  localImportCatalog: LocalImportCatalog
  finishLocalImportPrompt: () => void
}

function buildLocalImportCatalog(
  snapshot: SourceWorkspaceSnapshot | null
): LocalImportCatalog {
  return {
    documents: (snapshot?.documents ?? []).map((document) => ({
      id: document.id,
      name: document.name,
      bytes: getUtf8ByteLength(document.rawMarkdown),
    })),
    libraryEntries: (snapshot?.libraryEntries ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      bytes: getUtf8ByteLength(entry.mdContent),
    })),
  }
}

function emptyLocalWorkspaceSnapshot(): SourceWorkspaceSnapshot {
  return {
    version: 4,
    workspaceName: "工作台",
    activeDomain: "workspace",
    activeDocumentId: null,
    activeView: "document",
    documents: [],
    libraryEntries: [],
    brandFavorites: [],
  }
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null)

export function useCloudSync() {
  const value = useContext(CloudSyncContext)
  if (!value)
    throw new Error("useCloudSync must be used inside CloudSyncProvider")
  return value
}

function conflictId(
  ownerId: string,
  workspaceId: string,
  entity: "document" | "library_entry",
  entityId: string
) {
  return `${ownerId}:${workspaceId}:${entity}:${entityId}`
}

function mutationIsPaused(mutation: SyncMutation, conflicts: SyncConflict[]) {
  return conflicts.some(
    (conflict) =>
      conflict.ownerId === mutation.ownerId &&
      conflict.workspaceId === mutation.workspaceId &&
      conflict.entity === mutation.entity &&
      conflict.entityId === mutation.entityId
  )
}

function buildMutations(
  previous: SourceWorkspaceSnapshot,
  next: SourceWorkspaceSnapshot,
  ownerId: string,
  workspaceId: string,
  documentVersions: Map<string, number>,
  libraryVersions: Map<string, number>,
  preferencesVersion?: number
) {
  const mutations: SyncMutation[] = []
  const previousDocuments = new Map(
    previous.documents.map((item) => [item.id, item])
  )
  const nextDocuments = new Map(next.documents.map((item) => [item.id, item]))
  for (const document of next.documents) {
    if (
      previousDocuments.has(document.id) &&
      sourceDocumentSyncSignature(previousDocuments.get(document.id)!) ===
        sourceDocumentSyncSignature(document)
    )
      continue
    mutations.push(
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "document",
        operation: "upsert",
        entityId: document.id,
        expectedVersion: documentVersions.get(document.id),
        payload: toCloudDocument(document, ownerId, workspaceId),
        payloadSignature: sourceDocumentSyncSignature(document),
      })
    )
  }
  for (const document of previous.documents) {
    if (nextDocuments.has(document.id)) continue
    mutations.push(
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "tombstone",
        operation: "upsert",
        entityId: document.id,
        payload: {
          workspace_id: workspaceId,
          owner_id: ownerId,
          entity_type: "document",
          entity_id: document.id,
          deleted_at: Date.now(),
        },
      }),
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "document",
        operation: "delete",
        entityId: document.id,
        expectedVersion: documentVersions.get(document.id),
        payload: {},
      })
    )
  }

  const previousLibrary = new Map(
    previous.libraryEntries.map((item) => [item.id, item])
  )
  const nextLibrary = new Map(
    next.libraryEntries.map((item) => [item.id, item])
  )
  for (const entry of next.libraryEntries) {
    if (
      previousLibrary.has(entry.id) &&
      libraryEntrySyncSignature(previousLibrary.get(entry.id)!) ===
        libraryEntrySyncSignature(entry)
    )
      continue
    mutations.push(
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "library_entry",
        operation: "upsert",
        entityId: entry.id,
        expectedVersion: libraryVersions.get(entry.id),
        payload: toCloudLibraryEntry(entry, ownerId, workspaceId),
        payloadSignature: libraryEntrySyncSignature(entry),
      })
    )
  }
  for (const entry of previous.libraryEntries) {
    if (nextLibrary.has(entry.id)) continue
    mutations.push(
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "tombstone",
        operation: "upsert",
        entityId: entry.id,
        payload: {
          workspace_id: workspaceId,
          owner_id: ownerId,
          entity_type: "library_entry",
          entity_id: entry.id,
          deleted_at: Date.now(),
        },
      }),
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "library_entry",
        operation: "delete",
        entityId: entry.id,
        expectedVersion: libraryVersions.get(entry.id),
        payload: {},
      })
    )
  }

  const previousPreferences = JSON.stringify({
    activeDocumentId: previous.activeDocumentId,
    activeView: previous.activeView,
    brandFavorites: previous.brandFavorites,
  })
  const nextPreferences = JSON.stringify({
    activeDocumentId: next.activeDocumentId,
    activeView: next.activeView,
    brandFavorites: next.brandFavorites,
  })
  if (previousPreferences !== nextPreferences) {
    mutations.push(
      createSyncMutation({
        ownerId,
        workspaceId,
        entity: "preferences",
        operation: "upsert",
        entityId: workspaceId,
        expectedVersion: preferencesVersion,
        payload: {
          workspace_id: workspaceId,
          owner_id: ownerId,
          active_document_id: next.activeDocumentId,
          active_view: toCloudEditorView(next.activeView),
          brand_favorites: next.brandFavorites,
        },
      })
    )
  }
  return mutations
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Sync")
  const { user, authReady, signOut: signOutAuth } = useAccountDialog()
  const authenticatedOwnerId = user?.id ?? null
  const initializeWorkspace = useDesignStore(
    (state) => state.initializeWorkspace
  )
  const hasHydrated = useDesignStore((state) => state.hasHydrated)
  const replaceWorkspaceFromCloud = useDesignStore(
    (state) => state.replaceWorkspaceFromCloud
  )
  const replaceDocumentFromCloud = useDesignStore(
    (state) => state.replaceDocumentFromCloud
  )
  const splitDocumentConflict = useDesignStore(
    (state) => state.splitDocumentConflict
  )
  const setStatus = useSyncState((state) => state.setStatus)
  const setPendingCount = useSyncState((state) => state.setPendingCount)
  const markSynced = useSyncState((state) => state.markSynced)
  const retryToken = useSyncState((state) => state.retryToken)
  const setSourceVersion = useSyncState((state) => state.setSourceVersion)
  const setConflicts = useSyncState((state) => state.setConflicts)
  const upsertConflict = useSyncState((state) => state.upsertConflict)
  const removeConflictFromState = useSyncState((state) => state.removeConflict)
  const previousSnapshot = useRef<SourceWorkspaceSnapshot | null>(null)
  const documentVersions = useRef(new Map<string, number>())
  const libraryVersions = useRef(new Map<string, number>())
  const preferencesVersion = useRef<number | undefined>(undefined)
  const workspaceVersion = useRef<number | null>(null)
  const workspaceId = useRef<string | null>(null)
  const [bootstrapHint, setBootstrapHint] =
    useState<WorkspaceBootstrapHintV1 | null>(null)
  const [bootstrapHintReady, setBootstrapHintReady] = useState(false)
  const hintedOwnerId =
    bootstrapHint?.scope === "cloud" ? bootstrapHint.ownerId : null
  const activeCloudOwner = useRef<string | null>(null)
  const flushing = useRef(false)
  const flushRequested = useRef(false)
  const localVersionRebases = useRef(new Map<string, Map<number, number>>())
  const signOutInProgress = useRef(false)
  // Bumped by the retry handler to force the init effect to re-run when the
  // workspace was never set up (init failed). Lets "sync now" recover instead
  // of no-oping on a null workspaceId.
  const [initRunId, setInitRunId] = useState(0)
  const [workspacePhase, setWorkspacePhase] =
    useState<WorkspaceTransitionPhase>("local")
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [visibleCloudOwnerId, setVisibleCloudOwnerId] = useState<string | null>(
    null
  )
  const [localImportPromptOpen, setLocalImportPromptOpen] = useState(false)
  const [localImportCatalog, setLocalImportCatalog] =
    useState<LocalImportCatalog>({ documents: [], libraryEntries: [] })
  const syncTranslations = useRef(t)

  useEffect(() => {
    syncTranslations.current = t
  }, [t])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hint = readWorkspaceBootstrapHint()
      if (hint?.scope === "cloud") {
        activeCloudOwner.current = hint.ownerId
        setVisibleCloudOwnerId(hint.ownerId)
        setWorkspacePhase("cloud")
      }
      setBootstrapHint(hint)
      setBootstrapHintReady(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!bootstrapHintReady) return
    const scope: WorkspaceScope = hintedOwnerId
      ? { kind: "cloud", ownerId: hintedOwnerId }
      : { kind: "local" }
    setActiveWorkspaceScope(scope)
    void initializeWorkspace().catch((error) => {
      setWorkspaceError(
        error instanceof Error
          ? error.message
          : syncTranslations.current("initializeFailed")
      )
      setWorkspacePhase("cloud-error")
    })
  }, [bootstrapHintReady, hintedOwnerId, initializeWorkspace])

  const flush = useCallback(async () => {
    const client = getBrowserSupabaseClient()
    const ownerId = user?.id
    const currentWorkspaceId = workspaceId.current
    if (!client || !ownerId || !currentWorkspaceId) return
    if (flushing.current) {
      flushRequested.current = true
      return
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline")
      return
    }
    const initialQueue = (await listSyncMutations()).filter(
      (mutation) =>
        mutation.ownerId === ownerId &&
        mutation.workspaceId === currentWorkspaceId
    )
    if (initialQueue.length === 0) {
      setPendingCount(0)
      markSynced()
      return
    }
    flushing.current = true
    setStatus("syncing")
    try {
      let hadQuotaBlock = false
      while (true) {
        const conflicts = useSyncState.getState().conflicts
        const mutations = (await listSyncMutations()).filter(
          (mutation) =>
            mutation.ownerId === ownerId &&
            mutation.workspaceId === currentWorkspaceId
        )
        setPendingCount(countPendingSources(mutations))
        const mutation = mutations.find(
          (item) => !item.blockedReason && !mutationIsPaused(item, conflicts)
        )
        if (!mutation) break

        let outcome
        let effectiveMutation = mutation
        try {
          if (
            (mutation.entity === "document" ||
              mutation.entity === "library_entry") &&
            mutation.expectedVersion !== undefined
          ) {
            const transitions = localVersionRebases.current.get(
              `${mutation.entity}:${mutation.entityId}`
            )
            let expectedVersion = mutation.expectedVersion
            const visited = new Set<number>()
            while (
              transitions?.has(expectedVersion) &&
              !visited.has(expectedVersion)
            ) {
              visited.add(expectedVersion)
              expectedVersion = transitions.get(expectedVersion)!
            }
            if (expectedVersion !== mutation.expectedVersion)
              effectiveMutation = { ...mutation, expectedVersion }
          }
          outcome = await applyCloudMutation(client, effectiveMutation)
        } catch (error) {
          if (!isQuotaBlockedError(error)) throw error
          await updateSyncMutation({
            ...mutation,
            blockedReason: getSyncErrorMessage(error) || "RICO_QUOTA_BLOCKED",
            attempts: mutation.attempts + 1,
          })
          setStatus(
            "quota-blocked",
            "云端配额已满；这份内容仍保存在本机，其他同步会继续。"
          )
          hadQuotaBlock = true
          continue
        }
        if (outcome.conflict && mutation.entity === "document") {
          const remote = await getCloudDocument(client, mutation.entityId)
          if (remote) {
            documentVersions.current.set(remote.id, remote.version)
            setSourceVersion(remote.id, remote.version)
            const conflict: SyncConflict = {
              id: conflictId(
                ownerId,
                currentWorkspaceId,
                "document",
                mutation.entityId
              ),
              ownerId,
              workspaceId: currentWorkspaceId,
              entity: "document",
              entityId: mutation.entityId,
              remoteVersion: remote.version,
              remote: fromCloudDocument(remote),
              detectedAt: Date.now(),
            }
            await saveSyncConflict(conflict)
            upsertConflict(conflict)
          }
          await removeSyncMutationsForEntity(
            ownerId,
            currentWorkspaceId,
            "document",
            mutation.entityId
          )
        } else if (outcome.conflict && mutation.entity === "library_entry") {
          const remote = await getCloudLibraryEntry(client, mutation.entityId)
          if (remote) {
            libraryVersions.current.set(remote.id, remote.version)
            setSourceVersion(remote.id, remote.version)
            const remoteEntry = {
              ...fromCloudLibraryEntry(remote),
              previewColors: [],
              metadataChips: {},
            }
            const conflict: SyncConflict = {
              id: conflictId(
                ownerId,
                currentWorkspaceId,
                "library_entry",
                mutation.entityId
              ),
              ownerId,
              workspaceId: currentWorkspaceId,
              entity: "library_entry",
              entityId: mutation.entityId,
              remoteVersion: remote.version,
              remote: remoteEntry,
              detectedAt: Date.now(),
            }
            await saveSyncConflict(conflict)
            upsertConflict(conflict)
          }
          await removeSyncMutationsForEntity(
            ownerId,
            currentWorkspaceId,
            "library_entry",
            mutation.entityId
          )
        } else if (outcome.conflict) {
          await removeSyncMutation(mutation.id)
        } else {
          if (outcome.version !== undefined) {
            if (mutation.entity === "document") {
              documentVersions.current.set(mutation.entityId, outcome.version)
            }
            if (mutation.entity === "library_entry") {
              libraryVersions.current.set(mutation.entityId, outcome.version)
            }
            if (
              (mutation.entity === "document" ||
                mutation.entity === "library_entry") &&
              effectiveMutation.expectedVersion !== undefined
            ) {
              const key = `${mutation.entity}:${mutation.entityId}`
              const transitions =
                localVersionRebases.current.get(key) ??
                new Map<number, number>()
              transitions.set(
                effectiveMutation.expectedVersion,
                outcome.version
              )
              localVersionRebases.current.set(key, transitions)
            }
            if (
              mutation.entity === "document" ||
              mutation.entity === "library_entry"
            ) {
              setSourceVersion(mutation.entityId, outcome.version)
              if (mutation.payloadSignature)
                await saveSyncAcknowledgement({
                  ownerId,
                  workspaceId: currentWorkspaceId,
                  entity: mutation.entity,
                  entityId: mutation.entityId,
                  version: outcome.version,
                  signature: mutation.payloadSignature,
                  acknowledgedAt: Date.now(),
                })
            }
            if (mutation.entity === "preferences")
              preferencesVersion.current = outcome.version
          }
          await removeSyncMutation(mutation.id)
        }
      }
      if (hadQuotaBlock) setStatus("quota-blocked")
      else if (useSyncState.getState().conflicts.length > 0)
        setStatus("conflict")
      else markSynced()

      try {
        const revision = await getCloudWorkspaceRevision(
          client,
          currentWorkspaceId
        )
        workspaceVersion.current = revision
        await saveCloudWorkspaceEnvelope({
          kind: "cloud-workspace-envelope",
          envelopeVersion: 1,
          ownerId,
          workspaceId: currentWorkspaceId,
          workspaceVersion: revision,
          snapshot: buildSourceWorkspaceSnapshot(useDesignStore.getState()),
          documentVersions: Object.fromEntries(documentVersions.current),
          libraryVersions: Object.fromEntries(libraryVersions.current),
          preferencesVersion: preferencesVersion.current,
          lastSyncedAt: Date.now(),
        })
      } catch {
        // The next resume can safely reconcile again if metadata refresh fails.
      }
    } catch (error) {
      const pending = (await listSyncMutations()).filter(
        (mutation) =>
          mutation.ownerId === ownerId &&
          mutation.workspaceId === currentWorkspaceId
      )
      setPendingCount(countPendingSources(pending))
      setStatus(
        "error",
        getSyncErrorMessage(error) || syncTranslations.current("failed")
      )
    } finally {
      flushing.current = false
      if (flushRequested.current) {
        flushRequested.current = false
        queueMicrotask(() => void flush())
      }
    }
  }, [
    markSynced,
    setPendingCount,
    setStatus,
    setSourceVersion,
    upsertConflict,
    user?.id,
  ])

  useEffect(() => {
    if (!hasHydrated || !authReady) return

    if (!authenticatedOwnerId) {
      workspaceId.current = null
      previousSnapshot.current = null
      setConflicts([])
      setStatus("local")
      if (hasHydrated) {
        if (signOutInProgress.current) return
        if (authReady) {
          writeWorkspaceBootstrapHint({ version: 1, scope: "local" })
        }
        const previousOwner = activeCloudOwner.current
        if (previousOwner) {
          setWorkspacePhase("leaving-cloud")
        } else {
          setVisibleCloudOwnerId(null)
          setWorkspacePhase("local")
          return
        }
        setWorkspaceError(null)
        setLocalImportPromptOpen(false)
        const localScope: WorkspaceScope = { kind: "local" }
        setActiveWorkspaceScope(localScope)
        void loadWorkspaceSnapshot(new Set(), localScope)
          .then(async (snapshot) => {
            const restoredSnapshot = snapshot ?? emptyLocalWorkspaceSnapshot()
            replaceWorkspaceFromCloud(restoredSnapshot)
            markWorkspaceHydrated(
              buildWorkspaceSignature(restoredSnapshot),
              buildWorkspaceContentSignature(restoredSnapshot)
            )
            if (previousOwner) {
              await clearAllSyncState()
              await clearWorkspaceSnapshot({
                kind: "cloud",
                ownerId: previousOwner,
              })
            }
            activeCloudOwner.current = null
            setVisibleCloudOwnerId(null)
            setWorkspacePhase("local")
          })
          .catch((error) => {
            setWorkspaceError(
              error instanceof Error
                ? error.message
                : syncTranslations.current("initializeFailed")
            )
            setWorkspacePhase("cloud-error")
          })
      }
      return
    }
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    const initialize = async () => {
      const restoringHintedOwner =
        activeCloudOwner.current === authenticatedOwnerId
      if (!restoringHintedOwner) setWorkspacePhase("entering-cloud")
      setWorkspaceError(null)
      setLocalImportPromptOpen(false)
      const client = getBrowserSupabaseClient()
      if (!client) throw new Error(syncTranslations.current("initializeFailed"))
      const storedLocalSnapshot = await loadWorkspaceSnapshot(new Set(), {
        kind: "local",
      })
      const signedOutSnapshot =
        activeCloudOwner.current === null
          ? buildSourceWorkspaceSnapshot(useDesignStore.getState())
          : storedLocalSnapshot
      if (!signedOutSnapshot) {
        throw new Error(syncTranslations.current("localWorkspaceUnavailable"))
      }
      if (activeCloudOwner.current === null) {
        await saveWorkspaceSnapshot(signedOutSnapshot, { kind: "local" })
      }
      const cachedEnvelope =
        await loadCloudWorkspaceEnvelope(authenticatedOwnerId)
      let workspace
      let remote
      try {
        workspace = await ensureCloudWorkspace(
          client,
          authenticatedOwnerId,
          signedOutSnapshot.workspaceName
        )
        const revisionSupported = await supportsWorkspaceRevision(client)
        const reusableEnvelope =
          canReuseCloudWorkspaceEnvelope(cachedEnvelope, workspace) &&
          revisionSupported
            ? cachedEnvelope
            : null
        if (reusableEnvelope) {
          remote = {
            snapshot: reusableEnvelope.snapshot,
            documentVersions: reusableEnvelope.documentVersions,
            libraryVersions: reusableEnvelope.libraryVersions,
            preferencesVersion: reusableEnvelope.preferencesVersion,
            workspaceVersion: reusableEnvelope.workspaceVersion,
          }
        } else {
          setStatus("syncing")
          remote = await downloadCloudSnapshotConsistent(client, workspace)
        }
      } catch (error) {
        if (!cachedEnvelope) throw error
        workspace = {
          id: cachedEnvelope.workspaceId,
          owner_id: authenticatedOwnerId,
          name: cachedEnvelope.snapshot.workspaceName,
          version: cachedEnvelope.workspaceVersion,
        }
        remote = {
          snapshot: cachedEnvelope.snapshot,
          documentVersions: cachedEnvelope.documentVersions,
          libraryVersions: cachedEnvelope.libraryVersions,
          preferencesVersion: cachedEnvelope.preferencesVersion,
          workspaceVersion: cachedEnvelope.workspaceVersion,
        }
        setStatus("offline")
      }
      if (cancelled) return
      const cloudScope: WorkspaceScope = {
        kind: "cloud",
        ownerId: authenticatedOwnerId,
      }
      setActiveWorkspaceScope(cloudScope)
      activeCloudOwner.current = authenticatedOwnerId
      const queued = (await listSyncMutations()).filter(
        (mutation) =>
          mutation.ownerId === authenticatedOwnerId &&
          mutation.workspaceId === workspace.id
      )
      const cachedSnapshot = await loadWorkspaceSnapshot(new Set(), cloudScope)
      const localSnapshot =
        queued.length > 0 && cachedSnapshot ? cachedSnapshot : remote.snapshot
      await saveWorkspaceSnapshot(localSnapshot, cloudScope)
      workspaceId.current = workspace.id
      localVersionRebases.current.clear()
      documentVersions.current = new Map(
        Object.entries(remote.documentVersions)
      )
      libraryVersions.current = new Map(Object.entries(remote.libraryVersions))
      Object.entries({
        ...remote.documentVersions,
        ...remote.libraryVersions,
      }).forEach(([id, version]) => setSourceVersion(id, version))
      preferencesVersion.current = remote.preferencesVersion
      workspaceVersion.current = remote.workspaceVersion

      const persistedConflicts = (await listSyncConflicts()).filter(
        (conflict) =>
          conflict.ownerId === authenticatedOwnerId &&
          conflict.workspaceId === workspace.id
      )
      const acknowledgements = (await listSyncAcknowledgements()).filter(
        (acknowledgement) =>
          acknowledgement.ownerId === authenticatedOwnerId &&
          acknowledgement.workspaceId === workspace.id
      )
      const acknowledgementBySource = new Map(
        acknowledgements.map((acknowledgement) => [
          `${acknowledgement.entity}:${acknowledgement.entityId}`,
          acknowledgement,
        ])
      )
      const persistedBySource = new Map(
        persistedConflicts.map((conflict) => [
          `${conflict.entity}:${conflict.entityId}`,
          conflict,
        ])
      )
      const pendingSources = new Set(
        queued.map((mutation) => `${mutation.entity}:${mutation.entityId}`)
      )
      const nextConflicts: SyncConflict[] = []
      const nextAcknowledgements: SyncAcknowledgement[] = []
      const remoteDocuments = new Map(
        remote.snapshot.documents.map((document) => [document.id, document])
      )
      const documents = localSnapshot.documents.map((local) => {
        const cloud = remoteDocuments.get(local.id)
        remoteDocuments.delete(local.id)
        if (!cloud) return local
        const localSignature = sourceDocumentSyncSignature(local)
        const cloudSignature = sourceDocumentSyncSignature(cloud)
        const key = `document:${local.id}`
        const acknowledgement = acknowledgementBySource.get(key)
        const existing = persistedBySource.get(key)
        const disposition = classifySourceChange({
          localSignature,
          remoteSignature: cloudSignature,
          acknowledgedSignature: acknowledgement?.signature,
          hasPendingMutation: pendingSources.has(key),
          hasPersistedConflict: existing?.entity === "document",
        })
        if (disposition === "same") {
          nextAcknowledgements.push({
            ownerId: authenticatedOwnerId,
            workspaceId: workspace.id,
            entity: "document",
            entityId: local.id,
            version: remote.documentVersions[local.id] ?? 1,
            signature: cloudSignature,
            acknowledgedAt: Date.now(),
          })
          return local
        }

        if (disposition === "conflict" && existing?.entity === "document") {
          nextConflicts.push({
            ...existing,
            remoteVersion:
              remote.documentVersions[local.id] ?? existing.remoteVersion,
            remote: cloud,
          })
        } else if (disposition === "pending-local") {
          return local
        } else if (disposition === "take-remote" && acknowledgement) {
          nextAcknowledgements.push({
            ...acknowledgement,
            version:
              remote.documentVersions[local.id] ?? acknowledgement.version,
            signature: cloudSignature,
            acknowledgedAt: Date.now(),
          })
          return cloud
        } else if (disposition === "conflict") {
          nextConflicts.push({
            id: conflictId(
              authenticatedOwnerId,
              workspace.id,
              "document",
              local.id
            ),
            ownerId: authenticatedOwnerId,
            workspaceId: workspace.id,
            entity: "document",
            entityId: local.id,
            remoteVersion: remote.documentVersions[local.id] ?? 1,
            remote: cloud,
            detectedAt: Date.now(),
          })
        }
        return local
      })
      for (const cloud of remoteDocuments.values()) {
        if (!pendingSources.has(`document:${cloud.id}`)) {
          documents.push(cloud)
          nextAcknowledgements.push({
            ownerId: authenticatedOwnerId,
            workspaceId: workspace.id,
            entity: "document",
            entityId: cloud.id,
            version: remote.documentVersions[cloud.id] ?? 1,
            signature: sourceDocumentSyncSignature(cloud),
            acknowledgedAt: Date.now(),
          })
        }
      }

      const remoteLibrary = new Map(
        remote.snapshot.libraryEntries.map((entry) => [entry.id, entry])
      )
      const libraryEntries = localSnapshot.libraryEntries.map((local) => {
        const cloud = remoteLibrary.get(local.id)
        remoteLibrary.delete(local.id)
        if (!cloud) return local
        const localSignature = libraryEntrySyncSignature(local)
        const cloudSignature = libraryEntrySyncSignature(cloud)
        const key = `library_entry:${local.id}`
        const acknowledgement = acknowledgementBySource.get(key)
        const existing = persistedBySource.get(key)
        const disposition = classifySourceChange({
          localSignature,
          remoteSignature: cloudSignature,
          acknowledgedSignature: acknowledgement?.signature,
          hasPendingMutation: pendingSources.has(key),
          hasPersistedConflict: existing?.entity === "library_entry",
        })
        if (disposition === "same") {
          nextAcknowledgements.push({
            ownerId: authenticatedOwnerId,
            workspaceId: workspace.id,
            entity: "library_entry",
            entityId: local.id,
            version: remote.libraryVersions[local.id] ?? 1,
            signature: cloudSignature,
            acknowledgedAt: Date.now(),
          })
          return local
        }

        if (
          disposition === "conflict" &&
          existing?.entity === "library_entry"
        ) {
          nextConflicts.push({
            ...existing,
            remoteVersion:
              remote.libraryVersions[local.id] ?? existing.remoteVersion,
            remote: cloud,
          })
        } else if (disposition === "pending-local") {
          return local
        } else if (disposition === "take-remote" && acknowledgement) {
          nextAcknowledgements.push({
            ...acknowledgement,
            version:
              remote.libraryVersions[local.id] ?? acknowledgement.version,
            signature: cloudSignature,
            acknowledgedAt: Date.now(),
          })
          return cloud
        } else if (disposition === "conflict") {
          nextConflicts.push({
            id: conflictId(
              authenticatedOwnerId,
              workspace.id,
              "library_entry",
              local.id
            ),
            ownerId: authenticatedOwnerId,
            workspaceId: workspace.id,
            entity: "library_entry",
            entityId: local.id,
            remoteVersion: remote.libraryVersions[local.id] ?? 1,
            remote: cloud,
            detectedAt: Date.now(),
          })
        }
        return local
      })
      for (const cloud of remoteLibrary.values()) {
        if (!pendingSources.has(`library_entry:${cloud.id}`)) {
          libraryEntries.push(cloud)
          nextAcknowledgements.push({
            ownerId: authenticatedOwnerId,
            workspaceId: workspace.id,
            entity: "library_entry",
            entityId: cloud.id,
            version: remote.libraryVersions[cloud.id] ?? 1,
            signature: libraryEntrySyncSignature(cloud),
            acknowledgedAt: Date.now(),
          })
        }
      }

      const nextConflictIds = new Set(nextConflicts.map((item) => item.id))
      await Promise.all([
        ...nextConflicts.map(saveSyncConflict),
        ...nextAcknowledgements.map(saveSyncAcknowledgement),
        ...persistedConflicts
          .filter((item) => !nextConflictIds.has(item.id))
          .map((item) => removeSyncConflict(item.id)),
      ])
      setConflicts(nextConflicts)

      const mergedSnapshot: SourceWorkspaceSnapshot = {
        ...localSnapshot,
        documents,
        libraryEntries,
        brandFavorites: Array.from(
          new Set([
            ...remote.snapshot.brandFavorites,
            ...localSnapshot.brandFavorites,
          ])
        ),
      }
      replaceWorkspaceFromCloud(mergedSnapshot)
      previousSnapshot.current = mergedSnapshot
      await saveCloudWorkspaceEnvelope({
        kind: "cloud-workspace-envelope",
        envelopeVersion: 1,
        ownerId: authenticatedOwnerId,
        workspaceId: workspace.id,
        workspaceVersion: remote.workspaceVersion,
        snapshot: mergedSnapshot,
        documentVersions: remote.documentVersions,
        libraryVersions: remote.libraryVersions,
        preferencesVersion: remote.preferencesVersion,
        lastSyncedAt: Date.now(),
      })
      const initialMutations = buildMutations(
        remote.snapshot,
        mergedSnapshot,
        authenticatedOwnerId,
        workspace.id,
        documentVersions.current,
        libraryVersions.current,
        preferencesVersion.current
      ).filter(
        (mutation) =>
          !mutationIsPaused(mutation, nextConflicts) &&
          !pendingSources.has(`${mutation.entity}:${mutation.entityId}`)
      )
      await Promise.all(initialMutations.map(enqueueSyncMutation))
      if (initialMutations.length > 0) {
        setPendingCount(countPendingSources(initialMutations))
        setStatus("pending")
      }
      unsubscribe = useDesignStore.subscribe((state) => {
        if (!previousSnapshot.current || !workspaceId.current) return
        const nextSnapshot = buildSourceWorkspaceSnapshot(state)
        if (
          snapshotSignature(nextSnapshot) ===
          snapshotSignature(previousSnapshot.current)
        )
          return
        const mutations = buildMutations(
          previousSnapshot.current,
          nextSnapshot,
          authenticatedOwnerId,
          workspaceId.current,
          documentVersions.current,
          libraryVersions.current,
          preferencesVersion.current
        ).filter(
          (mutation) =>
            !mutationIsPaused(mutation, useSyncState.getState().conflicts)
        )
        previousSnapshot.current = nextSnapshot
        if (mutations.length === 0) return
        void Promise.all(mutations.map(enqueueSyncMutation)).then(() => {
          setPendingCount(countPendingSources(mutations))
          setStatus("pending")
          void flush()
        })
      })
      await flush()
      if (cancelled) return
      const nextLocalImportCatalog = buildLocalImportCatalog(signedOutSnapshot)
      setLocalImportCatalog(nextLocalImportCatalog)
      setVisibleCloudOwnerId(authenticatedOwnerId)
      setWorkspacePhase("cloud")
      writeWorkspaceBootstrapHint({
        version: 1,
        scope: "cloud",
        ownerId: authenticatedOwnerId,
      })
      if (
        shouldPromptForLocalImport(
          nextLocalImportCatalog,
          window.localStorage.getItem(
            localImportDecisionKey(authenticatedOwnerId)
          )
        )
      ) {
        setLocalImportPromptOpen(true)
      }
    }
    void initialize().catch((error) => {
      if (!cancelled) {
        const message =
          error instanceof Error
            ? error.message
            : syncTranslations.current("initializeFailed")
        setStatus("error", message)
        setWorkspaceError(message)
        setWorkspacePhase("cloud-error")
      }
    })
    let hiddenAt: number | null = document.hidden ? Date.now() : null
    const handleOnline = () => setInitRunId((value) => value + 1)
    const handleOffline = () => setStatus("offline")
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= 5 * 60 * 1000) {
        setInitRunId((value) => value + 1)
      }
      hiddenAt = null
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      cancelled = true
      unsubscribe?.()
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [
    flush,
    hasHydrated,
    initRunId,
    replaceWorkspaceFromCloud,
    setConflicts,
    setPendingCount,
    setStatus,
    setSourceVersion,
    authenticatedOwnerId,
    authReady,
  ])

  const resolveDocumentConflict = useCallback(
    async (
      conflictIdValue: string,
      resolution: DocumentConflictResolution
    ): Promise<ConflictResolutionResult> => {
      const conflict = useSyncState
        .getState()
        .conflicts.find((item) => item.id === conflictIdValue)
      const client = getBrowserSupabaseClient()
      const ownerId = user?.id
      const currentWorkspaceId = workspaceId.current
      if (
        !conflict ||
        conflict.entity !== "document" ||
        !client ||
        !ownerId ||
        !currentWorkspaceId ||
        conflict.ownerId !== ownerId ||
        conflict.workspaceId !== currentWorkspaceId
      )
        return "unavailable"

      const clearConflict = async () => {
        await removeSyncConflict(conflict.id)
        removeConflictFromState(conflict.id)
      }

      if (resolution === "keep-remote") {
        await saveSyncAcknowledgement({
          ownerId,
          workspaceId: currentWorkspaceId,
          entity: "document",
          entityId: conflict.entityId,
          version: conflict.remoteVersion,
          signature: sourceDocumentSyncSignature(conflict.remote),
          acknowledgedAt: Date.now(),
        })
        replaceDocumentFromCloud(conflict.entityId, conflict.remote)
        await clearConflict()
        void flush()
        return "resolved"
      }

      if (resolution === "save-as-new") {
        await saveSyncAcknowledgement({
          ownerId,
          workspaceId: currentWorkspaceId,
          entity: "document",
          entityId: conflict.entityId,
          version: conflict.remoteVersion,
          signature: sourceDocumentSyncSignature(conflict.remote),
          acknowledgedAt: Date.now(),
        })
        const createdId = splitDocumentConflict(
          conflict.entityId,
          conflict.remote
        )
        if (!createdId) return "unavailable"
        await clearConflict()
        void flush()
        return "resolved"
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setStatus("offline")
        return "unavailable"
      }
      const local = buildSourceWorkspaceSnapshot(
        useDesignStore.getState()
      ).documents.find((document) => document.id === conflict.entityId)
      if (!local) return "unavailable"

      const outcome = await applyCloudMutation(
        client,
        createSyncMutation({
          ownerId,
          workspaceId: currentWorkspaceId,
          entity: "document",
          operation: "upsert",
          entityId: local.id,
          expectedVersion: conflict.remoteVersion,
          payload: toCloudDocument(local, ownerId, currentWorkspaceId),
        })
      )
      if (outcome.conflict) {
        const latest = await getCloudDocument(client, conflict.entityId)
        if (latest) {
          const nextConflict: SyncConflict = {
            ...conflict,
            remoteVersion: latest.version,
            remote: fromCloudDocument(latest),
          }
          documentVersions.current.set(latest.id, latest.version)
          setSourceVersion(latest.id, latest.version)
          await saveSyncConflict(nextConflict)
          upsertConflict(nextConflict)
        }
        return "remote-changed"
      }

      if (outcome.version !== undefined) {
        documentVersions.current.set(local.id, outcome.version)
        setSourceVersion(local.id, outcome.version)
        await saveSyncAcknowledgement({
          ownerId,
          workspaceId: currentWorkspaceId,
          entity: "document",
          entityId: local.id,
          version: outcome.version,
          signature: sourceDocumentSyncSignature(local),
          acknowledgedAt: Date.now(),
        })
      }
      await removeSyncMutationsForEntity(
        ownerId,
        currentWorkspaceId,
        "document",
        local.id
      )
      await clearConflict()
      markSynced()
      return "resolved"
    },
    [
      flush,
      markSynced,
      removeConflictFromState,
      replaceDocumentFromCloud,
      setSourceVersion,
      setStatus,
      splitDocumentConflict,
      upsertConflict,
      user?.id,
    ]
  )

  const signOut = useCallback(
    async (force = false) => {
      const ownerId = user?.id
      if (!ownerId) {
        await signOutAuth()
        return
      }
      signOutInProgress.current = true
      setWorkspacePhase("leaving-cloud")
      setWorkspaceError(null)
      setLocalImportPromptOpen(false)
      const localScope: WorkspaceScope = { kind: "local" }
      let localSnapshot: SourceWorkspaceSnapshot | null = null
      let authenticationCleared = false
      try {
        if (!force) {
          await flush()
          const currentWorkspaceId = workspaceId.current
          const pending = (await listSyncMutations()).filter(
            (mutation) =>
              mutation.ownerId === ownerId &&
              mutation.workspaceId === currentWorkspaceId
          )
          const conflicts = useSyncState
            .getState()
            .conflicts.filter((conflict) => conflict.ownerId === ownerId)
          if (pending.length > 0 || conflicts.length > 0) {
            throw new Error(
              `RICO_SIGNOUT_BLOCKED:${countPendingSources(pending)}:${conflicts.length}`
            )
          }
        }

        localSnapshot = await loadWorkspaceSnapshot(new Set(), localScope)
        await signOutAuth(force)
        authenticationCleared = true
        writeWorkspaceBootstrapHint({ version: 1, scope: "local" })
        await clearAllSyncState()
        await clearWorkspaceSnapshot({ kind: "cloud", ownerId })
        setActiveWorkspaceScope(localScope)
        activeCloudOwner.current = null
        workspaceId.current = null
        previousSnapshot.current = null
        const restoredSnapshot = localSnapshot ?? emptyLocalWorkspaceSnapshot()
        replaceWorkspaceFromCloud(restoredSnapshot)
        markWorkspaceHydrated(
          buildWorkspaceSignature(restoredSnapshot),
          buildWorkspaceContentSignature(restoredSnapshot)
        )
        setVisibleCloudOwnerId(null)
        setWorkspacePhase("local")
        useSyncState.getState().reset()
      } catch (error) {
        if (authenticationCleared) {
          setActiveWorkspaceScope(localScope)
          activeCloudOwner.current = null
          workspaceId.current = null
          previousSnapshot.current = null
          const restoredSnapshot =
            localSnapshot ?? emptyLocalWorkspaceSnapshot()
          replaceWorkspaceFromCloud(restoredSnapshot)
          markWorkspaceHydrated(
            buildWorkspaceSignature(restoredSnapshot),
            buildWorkspaceContentSignature(restoredSnapshot)
          )
          setVisibleCloudOwnerId(null)
          setWorkspacePhase("local")
          useSyncState.getState().reset()
        } else {
          setWorkspacePhase("cloud")
        }
        throw error
      } finally {
        signOutInProgress.current = false
      }
    },
    [flush, replaceWorkspaceFromCloud, signOutAuth, user?.id]
  )

  const getLocalImportCatalog = useCallback(async () => {
    const snapshot = await loadWorkspaceSnapshot(new Set(), { kind: "local" })
    return buildLocalImportCatalog(snapshot)
  }, [])

  const retryWorkspaceTransition = useCallback(() => {
    setWorkspaceError(null)
    if (!hasHydrated) {
      setWorkspacePhase(hintedOwnerId ? "cloud" : "local")
      void initializeWorkspace().catch((error) => {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : syncTranslations.current("initializeFailed")
        )
        setWorkspacePhase("cloud-error")
      })
      return
    }
    setWorkspacePhase(user ? "entering-cloud" : "leaving-cloud")
    setInitRunId((value) => value + 1)
  }, [hasHydrated, hintedOwnerId, initializeWorkspace, user])

  const finishLocalImportPrompt = useCallback(() => {
    if (user) {
      window.localStorage.setItem(localImportDecisionKey(user.id), "decided")
    }
    setLocalImportPromptOpen(false)
  }, [user])

  const importLocalSources = useCallback(
    async (keys: string[]) => {
      const selected = new Set(keys)
      const local = await loadWorkspaceSnapshot(new Set(), { kind: "local" })
      if (!local || !user) return { imported: 0, skipped: selected.size }
      const current = buildSourceWorkspaceSnapshot(useDesignStore.getState())
      const documents = [...current.documents]
      const libraryEntries = [...current.libraryEntries]
      let bytes =
        documents.reduce(
          (total, document) => total + getUtf8ByteLength(document.rawMarkdown),
          0
        ) +
        libraryEntries.reduce(
          (total, entry) => total + getUtf8ByteLength(entry.mdContent),
          0
        )
      let imported = 0
      let skipped = 0
      const now = Date.now()

      for (const document of local.documents) {
        if (!selected.has(`document:${document.id}`)) continue
        const sourceBytes = getUtf8ByteLength(document.rawMarkdown)
        if (
          documents.length >= CLOUD_DOCUMENT_LIMIT ||
          sourceBytes > CLOUD_SOURCE_MARKDOWN_BYTES ||
          bytes + sourceBytes > CLOUD_ACCOUNT_MARKDOWN_BYTES
        ) {
          skipped += 1
          continue
        }
        documents.push({
          ...structuredClone(document),
          id: copiedSourceId("doc"),
          name: `${document.name}（本地副本）`,
          createdAt: now,
          updatedAt: now,
        })
        bytes += sourceBytes
        imported += 1
      }
      for (const entry of local.libraryEntries) {
        if (!selected.has(`library_entry:${entry.id}`)) continue
        const sourceBytes = getUtf8ByteLength(entry.mdContent)
        if (
          libraryEntries.length >= CLOUD_LIBRARY_LIMIT ||
          sourceBytes > CLOUD_SOURCE_MARKDOWN_BYTES ||
          bytes + sourceBytes > CLOUD_ACCOUNT_MARKDOWN_BYTES
        ) {
          skipped += 1
          continue
        }
        libraryEntries.push({
          ...structuredClone(entry),
          id: copiedSourceId("lib"),
          name: `${entry.name}（本地副本）`,
          createdAt: now,
          updatedAt: now,
        })
        bytes += sourceBytes
        imported += 1
      }

      if (imported > 0)
        replaceWorkspaceFromCloud({
          ...current,
          documents,
          libraryEntries,
        })
      return { imported, skipped }
    },
    [replaceWorkspaceFromCloud, user]
  )

  useEffect(() => {
    if (retryToken === 0) return
    void (async () => {
      const ownerId = user?.id
      const currentWorkspaceId = workspaceId.current
      if (ownerId && currentWorkspaceId) {
        const mutations = (await listSyncMutations()).filter(
          (mutation) =>
            mutation.ownerId === ownerId &&
            mutation.workspaceId === currentWorkspaceId &&
            mutation.blockedReason
        )
        await Promise.all(
          mutations.map((mutation) =>
            updateSyncMutation({ ...mutation, blockedReason: undefined })
          )
        )
        await flush()
        setInitRunId((value) => value + 1)
      } else {
        setInitRunId((value) => value + 1)
      }
    })()
  }, [flush, retryToken, user?.id])

  const hideWorkspace = shouldHideWorkspace({
    authReady,
    hasBootstrapHint: bootstrapHint !== null,
    userId: user?.id ?? null,
    activeCloudOwnerId: visibleCloudOwnerId,
    phase: workspacePhase,
  })

  const contextValue = useMemo<CloudSyncContextValue>(
    () => ({
      resolveDocumentConflict,
      signOut,
      getLocalImportCatalog,
      importLocalSources,
      workspacePhase,
      workspaceInteractive: !hideWorkspace,
      workspaceError,
      retryWorkspaceTransition,
      localImportPromptOpen: localImportPromptOpen && !hideWorkspace,
      localImportCatalog,
      finishLocalImportPrompt,
    }),
    [
      finishLocalImportPrompt,
      getLocalImportCatalog,
      hideWorkspace,
      importLocalSources,
      localImportCatalog,
      localImportPromptOpen,
      resolveDocumentConflict,
      retryWorkspaceTransition,
      signOut,
      workspaceError,
      workspacePhase,
    ]
  )

  return (
    <CloudSyncContext.Provider value={contextValue}>
      {children}
    </CloudSyncContext.Provider>
  )
}
