import type {
  DocumentOrigin,
  EditorView,
  LibraryEntry,
  WorkspaceDocument,
} from "@/lib/types/tokens"

export type SyncStatus =
  | "local"
  | "offline"
  | "pending"
  | "syncing"
  | "synced"
  | "conflict"
  | "quota-blocked"
  | "error"

export interface SourceWorkspaceDocument {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  rawMarkdown: string
  initialRawMarkdown: string
  tags?: string[]
  category?: string
  pinned?: boolean
  origin: DocumentOrigin
  lastOpenedAt?: number
  notes?: string
}

export interface SourceWorkspaceSnapshot {
  version: 4
  workspaceName: string
  activeDomain: "workspace" | "library" | "brands"
  activeDocumentId: string | null
  activeView: EditorView
  documents: SourceWorkspaceDocument[]
  libraryEntries: LibraryEntry[]
  brandFavorites: string[]
}

export interface CloudWorkspace {
  id: string
  owner_id: string
  name: string
  version: number
}

export interface CloudDocument {
  id: string
  workspace_id: string
  owner_id: string
  name: string
  raw_markdown: string
  tags: string[]
  category: string | null
  pinned: boolean
  origin: DocumentOrigin
  last_opened_at: number | null
  notes: string | null
  version: number
  created_at: number
  updated_at: number
}

export interface CloudLibraryEntry {
  id: string
  workspace_id: string
  owner_id: string
  name: string
  description: string
  tags: string[]
  category: string | null
  md_content: string
  version: number
  created_at: number
  updated_at: number
}

export interface CloudWorkspacePreferences {
  workspace_id: string
  owner_id: string
  active_document_id: string | null
  active_view: CloudEditorView
  brand_favorites: string[]
  version: number
}

export type CloudEditorView = "source" | "structured" | "preview"

export interface SyncMutation {
  id: string
  ownerId: string
  workspaceId: string
  entity: "document" | "library_entry" | "preferences" | "tombstone"
  operation: "upsert" | "delete"
  entityId: string
  expectedVersion?: number
  payload: Record<string, unknown>
  payloadSignature?: string
  createdAt: number
  attempts: number
  blockedReason?: string
}

export interface SyncAcknowledgement {
  ownerId: string
  workspaceId: string
  entity: "document" | "library_entry"
  entityId: string
  version: number
  signature: string
  acknowledgedAt: number
}

export type SyncConflict =
  | {
      id: string
      ownerId: string
      workspaceId: string
      entity: "document"
      entityId: string
      remoteVersion: number
      remote: SourceWorkspaceDocument
      detectedAt: number
    }
  | {
      id: string
      ownerId: string
      workspaceId: string
      entity: "library_entry"
      entityId: string
      remoteVersion: number
      remote: LibraryEntry
      detectedAt: number
    }

export type DocumentConflictResolution =
  | "keep-local"
  | "keep-remote"
  | "save-as-new"

export interface LocalCloudBackup {
  createdAt: number
  snapshot: SourceWorkspaceSnapshot
}

export function toSourceDocument(
  document: WorkspaceDocument
): SourceWorkspaceDocument {
  return {
    id: document.id,
    name: document.name,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    rawMarkdown: document.rawMarkdown,
    initialRawMarkdown: document.initialRawMarkdown,
    tags: document.tags ? [...document.tags] : undefined,
    category: document.category,
    pinned: document.pinned,
    origin: document.origin,
    lastOpenedAt: document.lastOpenedAt,
    notes: document.notes,
  }
}
