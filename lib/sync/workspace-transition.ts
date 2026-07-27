export type WorkspaceTransitionPhase =
  | "local"
  | "entering-cloud"
  | "cloud"
  | "cloud-error"
  | "leaving-cloud"

export interface LocalImportCatalogItem {
  id: string
  name: string
  bytes: number
}

export interface LocalImportCatalog {
  documents: LocalImportCatalogItem[]
  libraryEntries: LocalImportCatalogItem[]
}

export interface LocalImportResult {
  imported: number
  skipped: number
}

export type LocalImportUnavailableReason =
  | "source-too-large"
  | "count-limit"
  | "storage-limit"

export function getLocalImportUnavailableReason({
  itemBytes,
  currentCount,
  selectedCount,
  countLimit,
  currentBytes,
  selectedBytes,
  accountByteLimit,
  sourceByteLimit,
  selected,
}: {
  itemBytes: number
  currentCount: number
  selectedCount: number
  countLimit: number
  currentBytes: number
  selectedBytes: number
  accountByteLimit: number
  sourceByteLimit: number
  selected: boolean
}): LocalImportUnavailableReason | null {
  if (itemBytes > sourceByteLimit) return "source-too-large"
  if (!selected && currentCount + selectedCount >= countLimit) {
    return "count-limit"
  }
  if (
    !selected &&
    currentBytes + selectedBytes + itemBytes > accountByteLimit
  ) {
    return "storage-limit"
  }
  return null
}

export const LOCAL_IMPORT_DECISION_PREFIX = "rico-v15.1-local-import-decision:"
export const WORKSPACE_BOOTSTRAP_HINT_KEY = "design-md-workspace-bootstrap-v1"

export type WorkspaceBootstrapHintV1 =
  | { version: 1; scope: "local" }
  | { version: 1; scope: "cloud"; ownerId: string }

export function parseWorkspaceBootstrapHint(
  value: string | null
): WorkspaceBootstrapHintV1 | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<WorkspaceBootstrapHintV1>
    if (parsed.version !== 1) return null
    if (parsed.scope === "local") return { version: 1, scope: "local" }
    if (
      parsed.scope === "cloud" &&
      "ownerId" in parsed &&
      typeof parsed.ownerId === "string" &&
      parsed.ownerId.length > 0
    ) {
      return { version: 1, scope: "cloud", ownerId: parsed.ownerId }
    }
  } catch {
    return null
  }
  return null
}

export function readWorkspaceBootstrapHint(): WorkspaceBootstrapHintV1 | null {
  if (typeof window === "undefined") return null
  return parseWorkspaceBootstrapHint(
    window.localStorage.getItem(WORKSPACE_BOOTSTRAP_HINT_KEY)
  )
}

export function writeWorkspaceBootstrapHint(hint: WorkspaceBootstrapHintV1) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    WORKSPACE_BOOTSTRAP_HINT_KEY,
    JSON.stringify(hint)
  )
}

export function localImportDecisionKey(ownerId: string) {
  return `${LOCAL_IMPORT_DECISION_PREFIX}${ownerId}`
}

export const LOCAL_COPY_HIDDEN_PREFIX = "rico-v15.2-local-copy-hidden:"

export function localCopyHiddenKey(ownerId: string) {
  return `${LOCAL_COPY_HIDDEN_PREFIX}${ownerId}`
}

export function readLocalCopyHidden(ownerId: string | undefined): boolean {
  if (typeof window === "undefined" || !ownerId) return false
  return window.localStorage.getItem(localCopyHiddenKey(ownerId)) === "1"
}

export function writeLocalCopyHidden(
  ownerId: string | undefined,
  hidden: boolean
) {
  if (typeof window === "undefined" || !ownerId) return
  if (hidden) {
    window.localStorage.setItem(localCopyHiddenKey(ownerId), "1")
  } else {
    window.localStorage.removeItem(localCopyHiddenKey(ownerId))
  }
}

export function hasLocalImportSources(catalog: LocalImportCatalog) {
  return catalog.documents.length > 0 || catalog.libraryEntries.length > 0
}

export function shouldPromptForLocalImport(
  catalog: LocalImportCatalog,
  decision: string | null
) {
  return hasLocalImportSources(catalog) && decision !== "decided"
}

export function shouldHideWorkspace({
  authReady,
  hasBootstrapHint,
  userId,
  activeCloudOwnerId,
  phase,
}: {
  authReady: boolean
  hasBootstrapHint: boolean
  userId: string | null
  activeCloudOwnerId: string | null
  phase: WorkspaceTransitionPhase
}) {
  if (phase === "cloud-error") return true
  if (!authReady) return !hasBootstrapHint
  if (userId) {
    return phase !== "cloud" || activeCloudOwnerId !== userId
  }
  return phase !== "local" || activeCloudOwnerId !== null
}
