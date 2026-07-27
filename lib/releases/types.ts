export type ReleaseSourceKind = "document" | "library_entry"

export interface PublishReleaseRequest {
  sourceKind: ReleaseSourceKind
  sourceId: string
  expectedVersion: number
  expectedSha256: string
  clientRequestId: string
}

export interface ReleaseRecord {
  id: string
  source_kind: ReleaseSourceKind
  source_id: string
  source_name: string
  source_version: number
  exporter_version: string
  zip_sha256: string | null
  stored_bytes: number
  uncompressed_bytes: number
  manifest: Array<{
    name: string
    mediaType: string
    bytes: number
    sha256: string
  }>
  status: "pending" | "complete" | "deleting"
  created_at: string
  completed_at: string | null
}
