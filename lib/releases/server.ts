import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"
import {
  buildReleaseArtifactBundle,
  RELEASE_EXPORTER_VERSION,
} from "@/lib/export/export-zip"
import { buildArtifactManifest, sha256Hex } from "@/lib/export/artifact-hash"
import { createAdminSupabaseClient } from "@/lib/sync/supabase-server"
import type { PublishReleaseRequest, ReleaseRecord } from "@/lib/releases/types"

const BUCKET = "design-releases"

export class ReleaseError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
  }
}

export async function publishRelease(
  ownerId: string,
  input: PublishReleaseRequest
): Promise<ReleaseRecord> {
  const admin = createAdminSupabaseClient()
  const existing = await admin
    .from("document_releases")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("client_request_id", input.clientRequestId)
    .maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data?.status === "complete")
    return existing.data as ReleaseRecord
  if (existing.data)
    throw new ReleaseError(409, "publish-in-progress", "交付版本仍在生成中")

  const table =
    input.sourceKind === "document" ? "documents" : "library_entries"
  const markdownColumn =
    input.sourceKind === "document" ? "raw_markdown" : "md_content"
  const sourceResult = await admin
    .from(table)
    .select(`id, workspace_id, owner_id, name, version, ${markdownColumn}`)
    .eq("id", input.sourceId)
    .eq("owner_id", ownerId)
    .maybeSingle()
  if (sourceResult.error) throw sourceResult.error
  if (!sourceResult.data)
    throw new ReleaseError(404, "source-not-found", "没有找到已同步的来源")
  const source = sourceResult.data as unknown as Record<string, unknown>
  if (source.version !== input.expectedVersion)
    throw new ReleaseError(
      409,
      "source-version-changed",
      "云端来源版本已变化，请同步后重试"
    )
  const markdown = String(source[markdownColumn] ?? "").replace(/\r\n?/g, "\n")
  const sourceHash = await sha256Hex(new TextEncoder().encode(markdown))
  if (sourceHash !== input.expectedSha256)
    throw new ReleaseError(
      409,
      "source-hash-changed",
      "云端内容与当前编辑内容不一致"
    )
  const compiled = compileDesignArtifacts(markdown)
  if (!compiled.ok)
    throw new ReleaseError(
      422,
      "source-invalid",
      "DESIGN.md 暂时无法生成派生文件"
    )
  const bundle = buildReleaseArtifactBundle(
    compiled.artifacts.tokens,
    compiled.artifacts.rawSections,
    compiled.artifacts.markdown
  )
  if (bundle.zip.length > 2 * 1024 * 1024)
    throw new ReleaseError(413, "zip-too-large", "交付包超过 2MiB")
  if (bundle.uncompressedBytes > 4 * 1024 * 1024)
    throw new ReleaseError(413, "content-too-large", "交付内容超过 4MiB")
  const releaseId = crypto.randomUUID()
  const workspaceId = String(source.workspace_id)
  const objectPath = `${ownerId}/${workspaceId}/${releaseId}/release.zip`
  const [zipHash, manifest] = await Promise.all([
    sha256Hex(bundle.zip),
    buildArtifactManifest(bundle),
  ])
  const pending = await admin
    .from("document_releases")
    .insert({
      id: releaseId,
      owner_id: ownerId,
      workspace_id: workspaceId,
      source_kind: input.sourceKind,
      source_id: input.sourceId,
      source_name: String(source.name),
      source_version: input.expectedVersion,
      source_sha256: sourceHash,
      exporter_version: RELEASE_EXPORTER_VERSION,
      object_path: objectPath,
      stored_bytes: bundle.zip.length,
      uncompressed_bytes: bundle.uncompressedBytes,
      manifest,
      client_request_id: input.clientRequestId,
    })
    .select("*")
    .single()
  if (pending.error) throw pending.error

  let uploaded = false
  try {
    const upload = await admin.storage
      .from(BUCKET)
      .upload(objectPath, bundle.zip, {
        contentType: "application/zip",
        upsert: false,
      })
    if (upload.error) throw upload.error
    uploaded = true
    const completed = await admin
      .from("document_releases")
      .update({
        status: "complete",
        zip_sha256: zipHash,
        completed_at: new Date().toISOString(),
      })
      .eq("id", releaseId)
      .eq("owner_id", ownerId)
      .eq("status", "pending")
      .select("*")
      .single()
    if (completed.error) throw completed.error

    const stale = await admin
      .from("document_releases")
      .select("id, object_path")
      .eq("owner_id", ownerId)
      .eq("source_kind", input.sourceKind)
      .eq("source_id", input.sourceId)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .range(2, 99)
    if (!stale.error && stale.data.length > 0) {
      const paths = stale.data.map((item) => item.object_path)
      const removed = await admin.storage.from(BUCKET).remove(paths)
      if (!removed.error) {
        await admin
          .from("document_releases")
          .delete()
          .eq("owner_id", ownerId)
          .in(
            "id",
            stale.data.map((item) => item.id)
          )
      }
    }
    return completed.data as ReleaseRecord
  } catch (error) {
    if (uploaded) await admin.storage.from(BUCKET).remove([objectPath])
    await admin
      .from("document_releases")
      .delete()
      .eq("id", releaseId)
      .eq("owner_id", ownerId)
    throw error
  }
}

export async function deleteRelease(ownerId: string, releaseId: string) {
  const admin = createAdminSupabaseClient()
  const found = await admin
    .from("document_releases")
    .select("id, object_path")
    .eq("id", releaseId)
    .eq("owner_id", ownerId)
    .maybeSingle()
  if (found.error) throw found.error
  if (!found.data) throw new ReleaseError(404, "not-found", "交付版本不存在")
  const marked = await admin
    .from("document_releases")
    .update({ status: "deleting" })
    .eq("id", releaseId)
    .eq("owner_id", ownerId)
  if (marked.error) throw marked.error
  const removed = await admin.storage
    .from(BUCKET)
    .remove([found.data.object_path])
  if (removed.error) {
    await admin
      .from("document_releases")
      .update({ status: "complete" })
      .eq("id", releaseId)
    throw removed.error
  }
  const deleted = await admin
    .from("document_releases")
    .delete()
    .eq("id", releaseId)
    .eq("owner_id", ownerId)
  if (deleted.error) throw deleted.error
}
