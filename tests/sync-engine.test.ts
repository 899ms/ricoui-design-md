import { describe, expect, it, vi } from "vitest"
import { applyCloudMutation } from "@/lib/sync/cloud-api"
import {
  fromCloudDocument,
  fromCloudEditorView,
  toCloudDocument,
  toCloudEditorView,
} from "@/lib/sync/cloud-mappers"
import { migrateWorkspaceSnapshot } from "@/lib/storage/workspace-persistence"
import {
  createSyncMutation,
  countPendingSources,
  classifySourceChange,
  getSyncErrorMessage,
  isQuotaBlockedError,
  libraryEntrySyncSignature,
  shouldReplaceQueuedMutation,
  sourceDocumentSyncSignature,
} from "@/lib/sync/sync-engine"
import type { SourceWorkspaceDocument } from "@/lib/sync/types"

const document: SourceWorkspaceDocument = {
  id: "doc_1",
  name: "Example",
  createdAt: 1,
  updatedAt: 2,
  rawMarkdown: "# Example",
  initialRawMarkdown: "# Example",
  tags: ["demo"],
  pinned: true,
  origin: { kind: "blank" },
}

describe("V9 sync primitives", () => {
  it("round-trips source document fields without derived parser data", () => {
    const cloud = toCloudDocument(document, "user_1", "workspace_1")
    expect(cloud).not.toHaveProperty("tokens")
    expect(cloud).not.toHaveProperty("initial_raw_markdown")
    expect(fromCloudDocument({ ...cloud, version: 1 })).toEqual(document)
  })

  it("maps the document view to the cloud schema's source value", () => {
    expect(toCloudEditorView("document")).toBe("source")
    expect(toCloudEditorView("source")).toBe("source")
    expect(fromCloudEditorView("source")).toBe("document")
  })

  it("repairs a stale queued preferences payload before sending it", async () => {
    const request = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn().mockResolvedValue({
        data: [{ version: 3 }],
        error: null,
      }),
    }
    request.update.mockReturnValue(request)
    request.eq.mockReturnValue(request)
    const client = { from: vi.fn().mockReturnValue(request) }

    await applyCloudMutation(client as never, {
      id: "mutation_1",
      ownerId: "user_1",
      workspaceId: "workspace_1",
      entity: "preferences",
      operation: "upsert",
      entityId: "workspace_1",
      expectedVersion: 2,
      payload: {
        workspace_id: "workspace_1",
        owner_id: "user_1",
        active_view: "document",
      },
      createdAt: 1,
      attempts: 0,
    })

    expect(request.update).toHaveBeenCalledWith(
      expect.objectContaining({ active_view: "source" })
    )
  })

  it("targets the tombstone natural key and ignores duplicates", async () => {
    const upsert = vi.fn().mockReturnValue({
      error: null,
    })
    const client = { from: vi.fn().mockReturnValue({ upsert }) }

    const result = await applyCloudMutation(client as never, {
      id: "mutation_1",
      ownerId: "user_1",
      workspaceId: "workspace_1",
      entity: "tombstone",
      operation: "upsert",
      entityId: "doc_1",
      payload: {
        workspace_id: "workspace_1",
        owner_id: "user_1",
        entity_type: "document",
        entity_id: "doc_1",
        deleted_at: 123,
      },
      createdAt: 1,
      attempts: 0,
    })

    // The upsert must declare the natural-key conflict target so PostgREST
    // does not fall back to the PK (the payload never carries `id`), and must
    // ignore duplicates so a repeat delete is idempotent instead of throwing 23505.
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "workspace_1",
        owner_id: "user_1",
        entity_type: "document",
        entity_id: "doc_1",
        deleted_at: 123,
      }),
      {
        onConflict: "workspace_id,entity_type,entity_id",
        ignoreDuplicates: true,
      }
    )
    expect(result).toEqual({ conflict: false, version: undefined })
  })

  it("identifies superseded queued mutations for the same entity", () => {
    const first = createSyncMutation({
      ownerId: "user_1",
      workspaceId: "workspace_1",
      entity: "document",
      operation: "upsert",
      entityId: "doc_1",
      payload: {},
    })
    const second = { ...first, id: "other" }
    const other = { ...first, entityId: "doc_2" }
    const deletion = { ...second, operation: "delete" as const }
    expect(shouldReplaceQueuedMutation(first, second)).toBe(true)
    expect(shouldReplaceQueuedMutation(first, deletion)).toBe(true)
    expect(shouldReplaceQueuedMutation(first, other)).toBe(false)
  })

  it("compares only synchronized, user-controlled document fields", () => {
    const withLocalBookkeeping = {
      ...document,
      createdAt: 99,
      updatedAt: 100,
      initialRawMarkdown: "# Older local baseline",
    }
    expect(sourceDocumentSyncSignature(withLocalBookkeeping)).toBe(
      sourceDocumentSyncSignature(document)
    )
    expect(
      sourceDocumentSyncSignature({
        ...withLocalBookkeeping,
        rawMarkdown: "# Changed",
      })
    ).not.toBe(sourceDocumentSyncSignature(document))
  })

  it("pauses only when local and remote both changed from the acknowledgement", () => {
    expect(
      classifySourceChange({
        localSignature: "base",
        remoteSignature: "remote",
        acknowledgedSignature: "base",
        hasPendingMutation: false,
        hasPersistedConflict: false,
      })
    ).toBe("take-remote")
    expect(
      classifySourceChange({
        localSignature: "local",
        remoteSignature: "base",
        acknowledgedSignature: "base",
        hasPendingMutation: false,
        hasPersistedConflict: false,
      })
    ).toBe("push-local")
    expect(
      classifySourceChange({
        localSignature: "local",
        remoteSignature: "remote",
        acknowledgedSignature: "base",
        hasPendingMutation: false,
        hasPersistedConflict: false,
      })
    ).toBe("conflict")
    expect(
      classifySourceChange({
        localSignature: "local",
        remoteSignature: "remote",
        acknowledgedSignature: "base",
        hasPendingMutation: true,
        hasPersistedConflict: false,
      })
    ).toBe("pending-local")
  })

  it("ignores derived Library preview data when detecting cloud changes", () => {
    const entry = {
      id: "lib_1",
      name: "Library",
      description: "Description",
      tags: ["demo"],
      mdContent: "# Library",
      createdAt: 1,
      updatedAt: 2,
      previewColors: ["#fff"],
      metadataChips: { accent: "#fff" },
    }
    expect(
      libraryEntrySyncSignature({
        ...entry,
        updatedAt: 999,
        previewColors: ["#000"],
        metadataChips: { accent: "#000" },
      })
    ).toBe(libraryEntrySyncSignature(entry))
  })

  it("keeps legacy and invalid Markdown as source-only v4 data", () => {
    const migrated = migrateWorkspaceSnapshot(
      {
        version: 3,
        workspaceName: "Legacy",
        activeDocumentId: document.id,
        activeView: "structured",
        documents: [
          {
            ...document,
            rawMarkdown: "## broken [",
            tokens: { shouldNotPersist: true },
            parsedDocument: { shouldNotPersist: true },
          } as never,
        ],
        libraryEntries: [],
      },
      new Set()
    )

    expect(migrated?.version).toBe(4)
    expect(migrated?.documents[0]?.rawMarkdown).toBe("## broken [")
    expect(migrated?.documents[0]).not.toHaveProperty("tokens")
    expect(JSON.stringify(migrated)).not.toContain("shouldNotPersist")
    const exportedBackup = JSON.parse(
      JSON.stringify({ createdAt: 3, snapshot: migrated })
    )
    expect(exportedBackup.snapshot.documents[0].rawMarkdown).toBe("## broken [")
  })

  it("carries optimistic versions and tombstones without document contents", () => {
    const mutation = createSyncMutation({
      ownerId: "user_1",
      workspaceId: "workspace_1",
      entity: "tombstone",
      operation: "upsert",
      entityId: document.id,
      expectedVersion: 4,
      payload: {
        workspace_id: "workspace_1",
        entity_type: "document",
        entity_id: document.id,
      },
    })

    expect(mutation.expectedVersion).toBe(4)
    expect(mutation.payload).not.toHaveProperty("raw_markdown")
  })

  it("recognizes quota codes from plain PostgREST error objects", () => {
    const error = {
      code: "P0001",
      message: "RICO_QUOTA_DOCUMENTS",
      details: null,
    }
    expect(getSyncErrorMessage(error)).toContain("RICO_QUOTA_DOCUMENTS")
    expect(isQuotaBlockedError(error)).toBe(true)
    expect(isQuotaBlockedError({ message: "network unavailable" })).toBe(false)
  })

  it("counts pending sources instead of raw document and tombstone mutations", () => {
    const deletion = createSyncMutation({
      ownerId: "user_1",
      workspaceId: "workspace_1",
      entity: "document",
      operation: "delete",
      entityId: "doc_1",
      payload: {},
    })
    const tombstone = createSyncMutation({
      ownerId: "user_1",
      workspaceId: "workspace_1",
      entity: "tombstone",
      operation: "upsert",
      entityId: "doc_1",
      payload: { entity_type: "document", entity_id: "doc_1" },
    })
    expect(countPendingSources([deletion, tombstone])).toBe(1)
  })
})
