import type { EditorView, LibraryEntry } from "@/lib/types/tokens"
import type {
  CloudDocument,
  CloudEditorView,
  CloudLibraryEntry,
  SourceWorkspaceDocument,
} from "@/lib/sync/types"

export function toCloudEditorView(view: unknown): CloudEditorView {
  if (view === "document" || view === "source") return "source"
  if (view === "preview") return "preview"
  return "structured"
}

export function fromCloudEditorView(view: unknown): EditorView {
  if (view === "source" || view === "document") return "document"
  if (view === "preview") return "preview"
  return "structured"
}

export function toCloudDocument(
  document: SourceWorkspaceDocument,
  ownerId: string,
  workspaceId: string
) {
  return {
    id: document.id,
    workspace_id: workspaceId,
    owner_id: ownerId,
    name: document.name,
    raw_markdown: document.rawMarkdown,
    tags: document.tags ?? [],
    category: document.category ?? null,
    pinned: document.pinned ?? false,
    origin: document.origin,
    last_opened_at: document.lastOpenedAt ?? null,
    notes: document.notes ?? null,
    created_at: document.createdAt,
    updated_at: document.updatedAt,
  }
}

export function fromCloudDocument(
  document: CloudDocument
): SourceWorkspaceDocument {
  return {
    id: document.id,
    name: document.name,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    rawMarkdown: document.raw_markdown,
    initialRawMarkdown: document.raw_markdown,
    tags: document.tags,
    category: document.category ?? undefined,
    pinned: document.pinned,
    origin: document.origin,
    lastOpenedAt: document.last_opened_at ?? undefined,
    notes: document.notes ?? undefined,
  }
}

export function toCloudLibraryEntry(
  entry: LibraryEntry,
  ownerId: string,
  workspaceId: string
) {
  return {
    id: entry.id,
    workspace_id: workspaceId,
    owner_id: ownerId,
    name: entry.name,
    description: entry.description,
    tags: entry.tags,
    category: entry.category ?? null,
    md_content: entry.mdContent,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  }
}

export function fromCloudLibraryEntry(
  entry: CloudLibraryEntry
): Omit<LibraryEntry, "previewColors" | "metadataChips"> {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    tags: entry.tags,
    category: entry.category ?? undefined,
    mdContent: entry.md_content,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }
}
