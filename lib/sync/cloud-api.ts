import type { SupabaseClient } from "@supabase/supabase-js"
import {
  fromCloudDocument,
  fromCloudEditorView,
  fromCloudLibraryEntry,
  toCloudEditorView,
} from "@/lib/sync/cloud-mappers"
import type {
  CloudDocument,
  CloudLibraryEntry,
  CloudWorkspace,
  CloudWorkspacePreferences,
  SourceWorkspaceSnapshot,
  SyncMutation,
} from "@/lib/sync/types"

export interface CloudDownload {
  snapshot: SourceWorkspaceSnapshot
  documentVersions: Record<string, number>
  libraryVersions: Record<string, number>
  preferencesVersion?: number
  workspaceVersion: number
}

export async function ensureCloudWorkspace(
  client: SupabaseClient,
  ownerId: string,
  name: string
): Promise<CloudWorkspace> {
  const existing = await client
    .from("workspaces")
    .select("id, owner_id, name, version")
    .eq("owner_id", ownerId)
    .maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return existing.data as CloudWorkspace

  const created = await client
    .from("workspaces")
    .insert({ owner_id: ownerId, name })
    .select("id, owner_id, name, version")
    .single()
  if (created.error) throw created.error
  return created.data as CloudWorkspace
}

export async function downloadCloudSnapshot(
  client: SupabaseClient,
  workspace: CloudWorkspace
): Promise<CloudDownload> {
  const [documents, libraryEntries, preferences] = await Promise.all([
    client.from("documents").select("*").eq("workspace_id", workspace.id),
    client.from("library_entries").select("*").eq("workspace_id", workspace.id),
    client
      .from("workspace_preferences")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ])
  if (documents.error) throw documents.error
  if (libraryEntries.error) throw libraryEntries.error
  if (preferences.error) throw preferences.error

  const preference = preferences.data as CloudWorkspacePreferences | null
  const remoteDocuments = documents.data as CloudDocument[]
  const remoteLibraryEntries = libraryEntries.data as CloudLibraryEntry[]
  return {
    snapshot: {
      version: 4,
      workspaceName: workspace.name,
      activeDomain: "workspace",
      activeDocumentId: preference?.active_document_id ?? null,
      activeView: fromCloudEditorView(preference?.active_view),
      documents: remoteDocuments.map(fromCloudDocument),
      libraryEntries: remoteLibraryEntries.map((entry) => ({
        ...fromCloudLibraryEntry(entry),
        previewColors: [],
        metadataChips: {},
      })),
      brandFavorites: preference?.brand_favorites ?? [],
    },
    documentVersions: Object.fromEntries(
      remoteDocuments.map((item) => [item.id, item.version])
    ),
    libraryVersions: Object.fromEntries(
      remoteLibraryEntries.map((item) => [item.id, item.version])
    ),
    preferencesVersion: preference?.version,
    workspaceVersion: workspace.version,
  }
}

export async function getCloudWorkspaceRevision(
  client: SupabaseClient,
  workspaceId: string
): Promise<number> {
  const result = await client
    .from("workspaces")
    .select("id, version")
    .eq("id", workspaceId)
    .single()
  if (result.error) throw result.error
  return (result.data as Pick<CloudWorkspace, "id" | "version">).version
}

export async function supportsWorkspaceRevision(
  client: SupabaseClient
): Promise<boolean> {
  const result = await client.rpc("workspace_revision_ready")
  return !result.error && result.data === true
}

export async function downloadCloudSnapshotConsistent(
  client: SupabaseClient,
  workspace: CloudWorkspace
): Promise<CloudDownload> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const before = await getCloudWorkspaceRevision(client, workspace.id)
    const download = await downloadCloudSnapshot(client, {
      ...workspace,
      version: before,
    })
    const after = await getCloudWorkspaceRevision(client, workspace.id)
    if (before === after) return { ...download, workspaceVersion: after }
  }
  throw new Error("RICO_WORKSPACE_CHANGED_DURING_DOWNLOAD")
}

export async function getCloudDocument(
  client: SupabaseClient,
  documentId: string
): Promise<CloudDocument | null> {
  const result = await client
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle()
  if (result.error) throw result.error
  return (result.data as CloudDocument | null) ?? null
}

export async function getCloudLibraryEntry(
  client: SupabaseClient,
  entryId: string
): Promise<CloudLibraryEntry | null> {
  const result = await client
    .from("library_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle()
  if (result.error) throw result.error
  return (result.data as CloudLibraryEntry | null) ?? null
}

/**
 * Delete every row the user owns across the sync tables (data-level account
 * erasure). RLS lets owners delete their own rows; children are deleted first
 * so nothing is orphaned. The auth.users row is intentionally left in place —
 * removing it would require a service_role key the project deliberately avoids
 * (see GUIDE.md). Combined with signOut + local clear, all user content is gone.
 */
export async function purgeAccountData(
  client: SupabaseClient,
  ownerId: string
): Promise<void> {
  for (const table of [
    "documents",
    "library_entries",
    "workspace_preferences",
    "sync_tombstones",
    "workspaces",
  ]) {
    const result = await client
      .from(table)
      .delete()
      .eq("owner_id", ownerId)
      .select("id")
    if (result.error) throw result.error
  }
}

export async function applyCloudMutation(
  client: SupabaseClient,
  mutation: SyncMutation
) {
  if (mutation.entity === "tombstone") {
    // Tombstones carry no `id`; their natural key is the
    // (workspace_id, entity_type, entity_id) unique constraint. Without an
    // explicit onConflict target, PostgREST falls back to the PK and the
    // upsert degrades to an INSERT that collides with that constraint (error
    // 23505) on repeat deletes. Target the natural key and ignore duplicates
    // so a tombstone write is idempotent and the queued mutation can drain.
    const result = await client.from("sync_tombstones").upsert(mutation.payload, {
      onConflict: "workspace_id,entity_type,entity_id",
      ignoreDuplicates: true,
    })
    if (result.error) throw result.error
    return { conflict: false, version: undefined }
  }

  const table =
    mutation.entity === "document"
      ? "documents"
      : mutation.entity === "library_entry"
        ? "library_entries"
        : "workspace_preferences"
  const idColumn = mutation.entity === "preferences" ? "workspace_id" : "id"
  // Older queued mutations may still contain the editor-facing `document`
  // value. The cloud schema intentionally calls that view `source`, so repair
  // the payload at the network boundary as well as when creating new writes.
  const payload =
    mutation.entity === "preferences" && "active_view" in mutation.payload
      ? {
          ...mutation.payload,
          active_view: toCloudEditorView(mutation.payload.active_view),
        }
      : mutation.payload

  if (mutation.operation === "delete") {
    const request = client.from(table).delete().eq(idColumn, mutation.entityId)
    const guardedRequest =
      mutation.expectedVersion === undefined
        ? request
        : request.eq("version", mutation.expectedVersion)
    const result = await guardedRequest.select("id")
    if (result.error) throw result.error
    return {
      conflict:
        mutation.expectedVersion !== undefined && result.data.length === 0,
      version: undefined,
    }
  }

  if (mutation.expectedVersion === undefined) {
    const result = await client
      .from(table)
      .upsert(payload)
      .select("version")
      .maybeSingle()
    if (result.error) throw result.error
    return {
      conflict: false,
      version: result.data?.version as number | undefined,
    }
  }

  const result = await client
    .from(table)
    .update(payload)
    .eq(idColumn, mutation.entityId)
    .eq("version", mutation.expectedVersion)
    .select("version")
  if (result.error) throw result.error
  return {
    conflict: result.data.length === 0,
    version: result.data[0]?.version as number | undefined,
  }
}
