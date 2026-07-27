"use client"

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type {
  BatchImportIssue,
  BatchImportResult,
  AiTaskState,
  Brand,
  ColorToken,
  CreateDocumentOptions,
  DesignStore,
  DesignTokens,
  DocumentOrigin,
  DocumentDiagnostic,
  DocumentSectionDataKey,
  GradientToken,
  ImportDiagnosticsReport,
  ImportSuggestionAction,
  LibraryEntry,
  LayoutToken,
  Meta,
  ParseResult,
  RawSections,
  RadiusToken,
  ShadowToken,
  SpacingToken,
  ThemeMetadataChips,
  TypeScaleToken,
  FontFamilyToken,
  WorkspaceDocument,
} from "@/lib/types/tokens"
import { parseDesignMd } from "@/lib/parser/parse-design-md"
import { rewriteMarkdownSections } from "@/lib/export/export-md"
import { buildImportDiagnostics } from "@/lib/diagnostics/build-import-diagnostics"
import { fetchBrandMarkdown, fetchBrands } from "@/lib/brands"
import {
  BLANK_DOCUMENT_NAME,
  BLANK_TEMPLATE_MD,
} from "@/lib/themes/blank-template"
import { normalizeLineEndings } from "@/lib/utils"
import {
  buildWorkspaceContentSignature,
  buildWorkspaceSignature,
  flushWorkspacePersistNow,
  getActiveWorkspaceScope,
  loadWorkspaceSnapshot,
  markWorkspaceHydrated,
  markWorkspacePersistenceBlocked,
  markWorkspacePersistenceAvailable,
  scheduleWorkspacePersist,
  type PersistedWorkspaceSnapshot,
} from "@/lib/storage/workspace-persistence"
import {
  CLOUD_DOCUMENT_LIMIT,
  CLOUD_LIBRARY_LIMIT,
} from "@/lib/sync/cloud-limits"
import {
  toSourceDocument,
  type SourceWorkspaceDocument,
  type SourceWorkspaceSnapshot,
} from "@/lib/sync/types"
import { validateGeneratedDesign } from "@/lib/ai/validate-generated-design"
import { getDocumentRevision } from "@/lib/document-revision"
import { getMarkdownDocumentCapability } from "@/lib/document-capability"
import { applyLibraryProjectUrl } from "@/lib/library/project-url"

const DEFAULT_WORKSPACE_NAME = "工作台"
const MAX_IMPORT_SIZE_BYTES = 500 * 1024
const LAST_OPENED_TOUCH_INTERVAL_MS = 5 * 60 * 1000

const EMPTY_RAW: RawSections = {
  components: [],
  dosDonts: { dos: [], donts: [] },
  imagery: "",
  layout: "",
}

function cloneRawSections(rawSections: RawSections): RawSections {
  return JSON.parse(JSON.stringify(rawSections)) as RawSections
}

function cloneTokens(tokens: DesignTokens): DesignTokens {
  return JSON.parse(JSON.stringify(tokens)) as DesignTokens
}

function cloneParseResult(result: ParseResult): ParseResult {
  return JSON.parse(JSON.stringify(result)) as ParseResult
}

function cloneImportDiagnostics(
  report: ImportDiagnosticsReport
): ImportDiagnosticsReport {
  return JSON.parse(JSON.stringify(report)) as ImportDiagnosticsReport
}

function cloneDocument(document: WorkspaceDocument): WorkspaceDocument {
  return JSON.parse(JSON.stringify(document)) as WorkspaceDocument
}

function cloneLibraryEntry(entry: LibraryEntry): LibraryEntry {
  return JSON.parse(JSON.stringify(entry)) as LibraryEntry
}

function buildDiagnostics(
  kind: DocumentDiagnostic["kind"],
  message: string
): DocumentDiagnostic {
  return { kind, message }
}

function sanitizeListItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean)
}

function buildImportDiagnosticsReport(
  result: ParseResult,
  markdown: string
): ImportDiagnosticsReport {
  return buildImportDiagnostics(result, markdown)
}

function ensureDocumentOrigin(
  document: WorkspaceDocument,
  brands: Brand[]
): DocumentOrigin {
  if (document.origin) {
    return document.origin
  }

  const legacyDocument = document as WorkspaceDocument & {
    sourceThemeId?: string
  }
  const sourceThemeId = legacyDocument.sourceThemeId
  if (!sourceThemeId) return { kind: "blank" }
  const brandIds = new Set(brands.map((b) => b.id))
  if (brandIds.has(sourceThemeId)) return { kind: "brand", id: sourceThemeId }
  return { kind: "library", id: sourceThemeId }
}

function createDocumentId() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function createLibraryEntryId() {
  return `lib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function pickPreviewColorsFromTokens(tokens: DesignTokens): string[] {
  const seen = new Set<string>()
  const palette: string[] = []
  for (const color of tokens.colors) {
    const value = color.value?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    palette.push(value)
    if (palette.length >= 5) break
  }
  return palette
}

function buildMetadataChipsFromParseResult(
  result: ParseResult
): ThemeMetadataChips {
  const { previewSemantics } = result
  const radiusValue =
    previewSemantics.surfaces.cardRadius.value ||
    previewSemantics.surfaces.buttonRadius.value ||
    undefined
  return {
    displayFont:
      previewSemantics.typography.displayFont.label ||
      previewSemantics.typography.displayFont.value ||
      undefined,
    bodyFont:
      previewSemantics.typography.bodyFont.label ||
      previewSemantics.typography.bodyFont.value ||
      undefined,
    accent: previewSemantics.colors.primary.value || undefined,
    radius: radiusValue,
  }
}

function buildMetadataChipsFromMarkdown(markdown: string): ThemeMetadataChips {
  try {
    const result = parseDesignMd(markdown)
    return buildMetadataChipsFromParseResult(result)
  } catch {
    return {}
  }
}

function clearActiveDocumentState(state: DesignStore) {
  state.tokens = null
  state.rawSections = cloneRawSections(EMPTY_RAW)
  state.initialTokens = null
  state.initialRawSections = cloneRawSections(EMPTY_RAW)
  state.rawMarkdown = ""
  state.initialRawMarkdown = ""
  state.parsedDocument = null
  state.lastValidParsedDocument = null
  state.documentDiagnostics = []
  state.importDiagnostics = null
  state.parseStatus = "idle"
  state.parseError = null
}

function hydrateStateFromDocument(
  state: DesignStore,
  document: WorkspaceDocument | null
) {
  if (!document) {
    clearActiveDocumentState(state)
    return
  }

  state.tokens = cloneTokens(document.tokens)
  state.rawSections = cloneRawSections(document.rawSections)
  state.initialTokens = cloneTokens(document.initialTokens)
  state.initialRawSections = cloneRawSections(document.initialRawSections)
  state.rawMarkdown = document.rawMarkdown
  state.initialRawMarkdown = document.initialRawMarkdown
  state.parsedDocument = document.parsedDocument
    ? cloneParseResult(document.parsedDocument)
    : null
  state.lastValidParsedDocument = document.lastValidParsedDocument
    ? cloneParseResult(document.lastValidParsedDocument)
    : null
  state.documentDiagnostics = [...document.documentDiagnostics]
  const importDiagnostics =
    document.importDiagnostics ??
    (document.parsedDocument
      ? buildImportDiagnosticsReport(
          document.parsedDocument,
          document.rawMarkdown
        )
      : document.lastValidParsedDocument
        ? buildImportDiagnosticsReport(
            document.lastValidParsedDocument,
            document.rawMarkdown
          )
        : null)
  state.importDiagnostics = importDiagnostics
    ? cloneImportDiagnostics(importDiagnostics)
    : null
  document.importDiagnostics = importDiagnostics
    ? cloneImportDiagnostics(importDiagnostics)
    : null
  state.parseStatus = document.parseStatus
  state.parseError = document.parseError
  if (!getMarkdownDocumentCapability(document.rawMarkdown).canStructuredEdit) {
    state.activeView = "document"
  }
}

function getDocumentIndex(
  state: Pick<DesignStore, "documents" | "activeDocumentId">,
  documentId = state.activeDocumentId
) {
  if (!documentId) return -1
  return state.documents.findIndex((document) => document.id === documentId)
}

function getActiveDocument(
  state: Pick<DesignStore, "documents" | "activeDocumentId">
) {
  const index = getDocumentIndex(state)
  return index >= 0 ? state.documents[index] : null
}

function syncActiveStateToDocument(state: DesignStore) {
  const document = getActiveDocument(state)
  if (!document || !state.tokens) return

  const previousSourceSignature = JSON.stringify({
    rawMarkdown: document.rawMarkdown,
    initialRawMarkdown: document.initialRawMarkdown,
    origin: document.origin,
  })

  document.tokens = cloneTokens(state.tokens)
  document.rawSections = cloneRawSections(state.rawSections)
  document.initialTokens = state.initialTokens
    ? cloneTokens(state.initialTokens)
    : cloneTokens(state.tokens)
  document.initialRawSections = cloneRawSections(state.initialRawSections)
  document.rawMarkdown = state.rawMarkdown
  document.initialRawMarkdown = state.initialRawMarkdown
  document.parsedDocument = state.parsedDocument
    ? cloneParseResult(state.parsedDocument)
    : null
  document.lastValidParsedDocument = state.lastValidParsedDocument
    ? cloneParseResult(state.lastValidParsedDocument)
    : null
  document.documentDiagnostics = [...state.documentDiagnostics]
  document.importDiagnostics = state.importDiagnostics
    ? cloneImportDiagnostics(state.importDiagnostics)
    : null
  document.parseStatus = state.parseStatus
  document.parseError = state.parseError
  if (document.origin.generation) {
    const validation = validateGeneratedDesign(state.rawMarkdown, {
      cssEvidence: document.origin.generation.cssEvidence,
    })
    document.origin.generation.status =
      validation.quality === "invalid"
        ? "blocked"
        : validation.quality === "review"
          ? "warning"
          : "ready"
    document.origin.generation.issues = validation.issues
    document.origin.generation.validatedRevision = getDocumentRevision(
      state.rawMarkdown
    )
  }
  const nextSourceSignature = JSON.stringify({
    rawMarkdown: document.rawMarkdown,
    initialRawMarkdown: document.initialRawMarkdown,
    origin: document.origin,
  })
  if (previousSourceSignature !== nextSourceSignature) {
    document.updatedAt = Date.now()
  }
}

function applyLiveParsedResult(
  state: DesignStore,
  result: ParseResult,
  markdown: string
) {
  state.tokens = cloneTokens(result.tokens)
  state.rawSections = cloneRawSections(result.rawSections)
  state.rawMarkdown = markdown
  state.parsedDocument = cloneParseResult(result)
  state.lastValidParsedDocument = cloneParseResult(result)
  state.documentDiagnostics = []
  state.importDiagnostics = buildImportDiagnosticsReport(result, markdown)
  state.parseStatus = "valid"
  state.parseError = null
}

function canApplyStructuredEdit(state: DesignStore): state is DesignStore & {
  tokens: DesignTokens
  parsedDocument: ParseResult
} {
  return (
    !!state.tokens && !!state.parsedDocument && state.parseStatus === "valid"
  )
}

function buildWorkspaceDocument(
  rawInput: string,
  name?: string,
  origin: DocumentOrigin = { kind: "blank" }
): WorkspaceDocument {
  // Skeleton offsets are computed over LF-normalized text; every document
  // must be normalized before it enters the store (PROJECT-REVIEW B1).
  const markdown = normalizeLineEndings(rawInput)
  const now = Date.now()

  try {
    const result = parseDesignMd(markdown)
    const importDiagnostics = buildImportDiagnosticsReport(result, markdown)

    return {
      id: createDocumentId(),
      name: name?.trim() || result.tokens.meta.name || "未命名文档",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      tokens: cloneTokens(result.tokens),
      rawSections: cloneRawSections(result.rawSections),
      initialTokens: cloneTokens(result.tokens),
      initialRawSections: cloneRawSections(result.rawSections),
      rawMarkdown: markdown,
      initialRawMarkdown: markdown,
      parsedDocument: cloneParseResult(result),
      lastValidParsedDocument: cloneParseResult(result),
      documentDiagnostics: [],
      importDiagnostics: cloneImportDiagnostics(importDiagnostics),
      parseStatus: "valid",
      parseError: null,
      tags: [],
      pinned: false,
      origin,
    }
  } catch (cause) {
    // Source preservation is more important than understanding every Markdown
    // dialect. Keep an empty internal model so the existing editor/store shape
    // remains compatible, while the raw source stays fully editable.
    const fallback = parseDesignMd("")
    const message =
      cause instanceof Error ? cause.message : "当前 Markdown 无法结构化解析"
    return {
      id: createDocumentId(),
      name: name?.trim() || "未命名文档",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      tokens: cloneTokens(fallback.tokens),
      rawSections: cloneRawSections(fallback.rawSections),
      initialTokens: cloneTokens(fallback.tokens),
      initialRawSections: cloneRawSections(fallback.rawSections),
      rawMarkdown: markdown,
      initialRawMarkdown: markdown,
      parsedDocument: null,
      lastValidParsedDocument: null,
      documentDiagnostics: [buildDiagnostics("parse-error", message)],
      importDiagnostics: null,
      parseStatus: "invalid",
      parseError: message,
      tags: [],
      pinned: false,
      origin,
    }
  }
}

function buildWorkspaceDocumentFromSource(
  source: SourceWorkspaceDocument,
  brands: Brand[]
) {
  const document = buildWorkspaceDocument(
    source.rawMarkdown,
    source.name,
    ensureDocumentOrigin(
      { ...source, origin: source.origin } as WorkspaceDocument,
      brands
    )
  )
  document.id = source.id
  document.createdAt = source.createdAt
  document.updatedAt = source.updatedAt
  document.lastOpenedAt = source.lastOpenedAt
  document.initialRawMarkdown = normalizeLineEndings(
    source.initialRawMarkdown || source.rawMarkdown
  )
  try {
    const initialResult = parseDesignMd(document.initialRawMarkdown)
    document.initialTokens = cloneTokens(initialResult.tokens)
    document.initialRawSections = cloneRawSections(initialResult.rawSections)
  } catch {
    // Preserve the current parsed document and source text if an old initial
    // snapshot cannot be parsed; the source remains exportable and editable.
  }
  document.tags = source.tags ? [...source.tags] : []
  document.category = source.category
  document.pinned = source.pinned ?? false
  document.notes = source.notes
  return document
}

function hydrateCloudLibraryEntry(entry: LibraryEntry): LibraryEntry {
  const metadataChips = buildMetadataChipsFromMarkdown(entry.mdContent)
  const previewColors =
    entry.previewColors.length > 0
      ? [...entry.previewColors]
      : (() => {
          try {
            return pickPreviewColorsFromTokens(
              parseDesignMd(entry.mdContent).tokens
            )
          } catch {
            return []
          }
        })()
  return { ...entry, previewColors, metadataChips }
}

function createEmptyBatchImportResult(totalCount: number): BatchImportResult {
  return {
    totalCount,
    successCount: 0,
    createdIds: [],
    failed: [],
    skipped: [],
  }
}

function getFileImportIssue(file: File): BatchImportIssue | null {
  if (!file.name.toLowerCase().endsWith(".md")) {
    return {
      filename: file.name || "未命名文件",
      kind: "invalid-type",
      reason: "仅支持 .md 文件。",
    }
  }

  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    return {
      filename: file.name || "未命名文件",
      kind: "too-large",
      reason: "文件太大，最大支持 500KB。",
    }
  }

  return null
}

function addAndActivateDocument(
  state: DesignStore,
  document: WorkspaceDocument,
  placeAtStart = true
) {
  if (placeAtStart) {
    state.documents.unshift(document)
  } else {
    state.documents.push(document)
  }
  state.activeDocumentId = document.id
  hydrateStateFromDocument(state, document)
}

function buildPersistedWorkspaceSnapshot(
  state: Pick<
    DesignStore,
    | "workspaceName"
    | "documents"
    | "activeDocumentId"
    | "activeView"
    | "libraryEntries"
    | "brandFavorites"
  >
): PersistedWorkspaceSnapshot {
  return {
    version: 4,
    workspaceName: state.workspaceName,
    activeDomain: "workspace",
    activeDocumentId: state.activeDocumentId,
    activeView: state.activeView,
    documents: state.documents.map(toSourceDocument),
    libraryEntries: state.libraryEntries.map((entry) =>
      cloneLibraryEntry(entry)
    ),
    brandFavorites: [...state.brandFavorites],
  }
}

function syncMarkdownFromState(
  state: DesignStore,
  dataKeys: DocumentSectionDataKey[]
) {
  if (!canApplyStructuredEdit(state)) return

  const rewrite = rewriteMarkdownSections(
    state.rawMarkdown,
    state.parsedDocument,
    dataKeys,
    state.tokens,
    state.rawSections
  )
  const result = parseDesignMd(rewrite.markdown)
  applyLiveParsedResult(state, result, rewrite.markdown)

  if (rewrite.appliedKeys.length === 0) {
    // No skeleton block matched: the re-parse above reverted the caller's
    // token mutation. Surface it instead of failing silently (B4).
    state.documentDiagnostics.push(
      buildDiagnostics(
        "structured-edit-skipped",
        "该区块未在文档中建模，本次结构化修改未写入 Markdown。"
      )
    )
    console.warn(
      `[design-md] structured edit skipped: no section block matches ${dataKeys.join(", ")}`
    )
  }

  syncActiveStateToDocument(state)
}

function applyImportSuggestionAction(
  state: DesignStore,
  action: ImportSuggestionAction,
  touchedKeys: Set<DocumentSectionDataKey>
) {
  if (!state.tokens) return

  switch (action.type) {
    case "set-color-role": {
      const color = state.tokens.colors[action.index]
      if (!color) return
      color.role = action.role
      touchedKeys.add("tokens.colors")
      return
    }
    case "set-font-role": {
      const font = state.tokens.typography.fontFamilies[action.index]
      if (!font) return
      font.role = action.role
      touchedKeys.add(`tokens.typography.fontFamilies.${action.index}`)
      return
    }
    case "set-component-role": {
      const component = state.tokens.components[action.index]
      if (!component) return
      component.role = action.role
      touchedKeys.add(`tokens.components.${action.index}`)
      return
    }
    case "set-meta-description":
      state.tokens.meta.description = action.description
      touchedKeys.add("tokens.meta")
      return
    case "set-meta-theme":
      state.tokens.meta.theme = action.theme
      touchedKeys.add("tokens.meta")
      return
    case "none":
      return
  }
}

function hydratePersistedSnapshotDocuments(
  documents: SourceWorkspaceDocument[],
  brands: Brand[]
) {
  return documents.map((document) =>
    buildWorkspaceDocumentFromSource(document, brands)
  )
}

// Legacy full-snapshot hydration is retained solely for inspecting old persisted
// records during recovery; v4 uses hydratePersistedSnapshotDocuments above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hydrateSnapshotDocuments(
  documents: WorkspaceDocument[],
  brands: Brand[]
) {
  return documents.map((document) => {
    const cloned = cloneDocument(document)
    cloned.origin = ensureDocumentOrigin(cloned, brands)

    // Legacy snapshots may contain CRLF uploads whose persisted skeleton
    // offsets are shifted — normalize and re-parse once on load (B1).
    if (/\r/.test(cloned.rawMarkdown)) {
      cloned.rawMarkdown = normalizeLineEndings(cloned.rawMarkdown)
      cloned.initialRawMarkdown = normalizeLineEndings(
        cloned.initialRawMarkdown
      )
      try {
        const result = parseDesignMd(cloned.rawMarkdown)
        cloned.tokens = cloneTokens(result.tokens)
        cloned.rawSections = cloneRawSections(result.rawSections)
        cloned.parsedDocument = cloneParseResult(result)
        cloned.lastValidParsedDocument = cloneParseResult(result)
        cloned.documentDiagnostics = []
        cloned.importDiagnostics = buildImportDiagnosticsReport(
          result,
          cloned.rawMarkdown
        )
        cloned.parseStatus = "valid"
        cloned.parseError = null
      } catch {
        // Keep the previous parse fields; the document re-parses on next edit.
      }
    }

    return cloned
  })
}

function loadSnapshotIntoState(
  state: DesignStore,
  snapshot: PersistedWorkspaceSnapshot | null
) {
  if (!snapshot || snapshot.documents.length === 0) {
    state.workspaceName = DEFAULT_WORKSPACE_NAME
    state.documents = snapshot
      ? hydratePersistedSnapshotDocuments(snapshot.documents, state.brands)
      : []
    state.libraryEntries = snapshot?.libraryEntries
      ? snapshot.libraryEntries.map((entry) => cloneLibraryEntry(entry))
      : []
    state.brandFavorites = snapshot?.brandFavorites
      ? [...snapshot.brandFavorites]
      : []
    state.activeDocumentId = null
    state.activeView = snapshot?.activeView ?? "structured"
    clearActiveDocumentState(state)
    return
  }

  state.workspaceName = snapshot.workspaceName || DEFAULT_WORKSPACE_NAME
  state.documents = hydratePersistedSnapshotDocuments(
    snapshot.documents,
    state.brands
  )
  state.libraryEntries = (snapshot.libraryEntries ?? []).map((entry) =>
    cloneLibraryEntry(entry)
  )
  state.brandFavorites = snapshot.brandFavorites
    ? [...snapshot.brandFavorites]
    : []
  state.activeView = snapshot.activeView ?? "structured"

  const fallbackActiveId =
    snapshot.activeDocumentId &&
    state.documents.some(
      (document) => document.id === snapshot.activeDocumentId
    )
      ? snapshot.activeDocumentId
      : (state.documents[0]?.id ?? null)

  state.activeDocumentId = fallbackActiveId
  hydrateStateFromDocument(state, getActiveDocument(state))
}

export const useDesignStore = create<DesignStore>()(
  immer((set, get) => ({
    workspaceName: DEFAULT_WORKSPACE_NAME,
    documents: [],
    libraryEntries: [],
    brandFavorites: [],
    activeDocumentId: null,
    tokens: null,
    rawSections: cloneRawSections(EMPTY_RAW),
    initialRawSections: cloneRawSections(EMPTY_RAW),
    initialTokens: null,
    rawMarkdown: "",
    initialRawMarkdown: "",
    parsedDocument: null,
    lastValidParsedDocument: null,
    documentDiagnostics: [],
    importDiagnostics: null,
    parseStatus: "idle",
    parseError: null,
    activeView: "structured",
    hasHydrated: false,
    isHydrating: false,
    hydrationError: null,
    brands: [],
    aiTask: { status: "idle" } satisfies AiTaskState,
    aiAssistInvitationDocumentId: null,

    setAiTask: (patch) =>
      set((state) => {
        state.aiTask = { ...state.aiTask, ...patch }
      }),
    dismissAiAssistInvitation: () =>
      set((state) => {
        state.aiAssistInvitationDocumentId = null
      }),
    setImportDiagnostics: (report) =>
      set((state) => {
        state.importDiagnostics = report
        const activeDocument = getActiveDocument(state)
        if (activeDocument) {
          activeDocument.importDiagnostics = report
          activeDocument.updatedAt = Date.now()
        }
      }),

    initializeWorkspace: async () => {
      const state = get()
      if (state.hasHydrated || state.isHydrating) return

      set((draft) => {
        draft.isHydrating = true
        draft.hydrationError = null
      })

      try {
        const snapshot = await loadWorkspaceSnapshot(new Set())
        const signature = buildWorkspaceSignature(snapshot)
        const contentSignature = buildWorkspaceContentSignature(snapshot)

        set((draft) => {
          loadSnapshotIntoState(draft, snapshot)
          draft.hasHydrated = true
          draft.isHydrating = false
          draft.hydrationError = null
        })

        markWorkspacePersistenceAvailable()
        markWorkspaceHydrated(signature, contentSignature)

        // Brand references are independent from workspace ownership and must
        // never block local/cloud cache hydration.
        void fetchBrands()
          .then((loadedBrands) => {
            set((draft) => {
              draft.brands = loadedBrands
            })
          })
          .catch(() => undefined)
      } catch (error) {
        set((draft) => {
          draft.hasHydrated = false
          draft.isHydrating = false
          draft.hydrationError =
            error instanceof Error ? error.message : "无法读取本地工作区"
        })

        // The stored snapshot could not be read — block persistence for this
        // session so an empty workspace can never overwrite it (B5).
        markWorkspacePersistenceBlocked()
        throw error
      }
    },

    replaceWorkspaceFromCloud: (snapshot: SourceWorkspaceSnapshot) =>
      set((state) => {
        state.workspaceName = snapshot.workspaceName || DEFAULT_WORKSPACE_NAME
        state.documents = snapshot.documents.map((document) =>
          buildWorkspaceDocumentFromSource(document, state.brands)
        )
        state.libraryEntries = snapshot.libraryEntries.map(
          hydrateCloudLibraryEntry
        )
        state.brandFavorites = [...snapshot.brandFavorites]
        state.activeView = snapshot.activeView
        state.activeDocumentId =
          snapshot.activeDocumentId &&
          state.documents.some(
            (document) => document.id === snapshot.activeDocumentId
          )
            ? snapshot.activeDocumentId
            : (state.documents[0]?.id ?? null)
        hydrateStateFromDocument(state, getActiveDocument(state))
      }),

    replaceDocumentFromCloud: (documentId, remote) =>
      set((state) => {
        const index = state.documents.findIndex(
          (document) => document.id === documentId
        )
        if (index === -1) return
        const remoteDocument = buildWorkspaceDocumentFromSource(
          remote,
          state.brands
        )
        state.documents[index] = remoteDocument
        if (state.activeDocumentId === documentId) {
          state.activeDocumentId = remoteDocument.id
          hydrateStateFromDocument(state, remoteDocument)
        }
      }),

    splitDocumentConflict: (documentId, remote) => {
      let createdId: string | null = null
      set((state) => {
        const index = state.documents.findIndex(
          (document) => document.id === documentId
        )
        if (index === -1) return

        const localDocument = cloneDocument(state.documents[index])
        const now = Date.now()
        localDocument.id = createDocumentId()
        localDocument.name = `${localDocument.name || "未命名文档"}（本机版本）`
        localDocument.createdAt = now
        localDocument.updatedAt = now
        localDocument.lastOpenedAt = now
        localDocument.origin = { kind: "duplicate", id: documentId }

        const remoteDocument = buildWorkspaceDocumentFromSource(
          remote,
          state.brands
        )
        state.documents[index] = remoteDocument
        state.documents.unshift(localDocument)
        state.activeDocumentId = localDocument.id
        hydrateStateFromDocument(state, localDocument)
        createdId = localDocument.id
      })
      return createdId
    },

    switchDocument: (documentId) =>
      set((state) => {
        if (state.activeDocumentId === documentId) return
        const nextDocument = state.documents.find(
          (document) => document.id === documentId
        )
        if (!nextDocument) return

        syncActiveStateToDocument(state)
        state.activeDocumentId = documentId
        const now = Date.now()
        if (
          !nextDocument.lastOpenedAt ||
          now - nextDocument.lastOpenedAt >= LAST_OPENED_TOUCH_INTERVAL_MS
        ) {
          nextDocument.lastOpenedAt = now
        }
        hydrateStateFromDocument(state, nextDocument)
      }),

    renameDocument: (documentId, name) =>
      set((state) => {
        const nextName = name.trim()
        if (!nextName) return

        const document = state.documents.find((item) => item.id === documentId)
        if (!document) return

        document.name = nextName
        document.updatedAt = Date.now()
      }),

    duplicateDocument: (documentId) =>
      set((state) => {
        syncActiveStateToDocument(state)

        const source = state.documents.find(
          (document) => document.id === documentId
        )
        if (!source) return

        const duplicate = cloneDocument(source)
        const now = Date.now()

        duplicate.id = createDocumentId()
        duplicate.name = `${source.name} 副本`
        duplicate.createdAt = now
        duplicate.updatedAt = now
        duplicate.lastOpenedAt = now
        duplicate.origin = {
          kind: "duplicate",
          id: source.id,
          generation: source.origin.generation
            ? structuredClone(source.origin.generation)
            : undefined,
        }

        state.documents.unshift(duplicate)
        state.activeDocumentId = duplicate.id
        hydrateStateFromDocument(state, duplicate)
      }),

    deleteDocument: (documentId) =>
      set((state) => {
        syncActiveStateToDocument(state)

        const index = state.documents.findIndex(
          (document) => document.id === documentId
        )
        if (index === -1) return
        const deletingActiveDocument = state.activeDocumentId === documentId

        state.documents.splice(index, 1)

        if (!deletingActiveDocument) {
          return
        }

        if (state.documents.length === 0) {
          state.activeDocumentId = null
          clearActiveDocumentState(state)
          return
        }

        const nextDocument =
          state.documents[index] ??
          state.documents[index - 1] ??
          state.documents[0]

        state.activeDocumentId = nextDocument.id
        hydrateStateFromDocument(state, nextDocument)
      }),

    updateRawMarkdown: (rawInput: string) =>
      set((state) => {
        if (!state.activeDocumentId) return

        const markdown = normalizeLineEndings(rawInput)
        state.rawMarkdown = markdown

        try {
          const result = parseDesignMd(markdown)
          applyLiveParsedResult(state, result, markdown)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "无法解析文档"
          state.parsedDocument = null
          state.parseStatus = state.lastValidParsedDocument
            ? "degraded"
            : "invalid"
          state.parseError = message
          state.documentDiagnostics = state.lastValidParsedDocument
            ? [
                buildDiagnostics("parse-error", message),
                buildDiagnostics(
                  "preview-degraded",
                  "预览正在显示上一次成功解析的版本。"
                ),
              ]
            : [buildDiagnostics("parse-error", message)]
        }

        syncActiveStateToDocument(state)
      }),

    setActiveView: (view) =>
      set((state) => {
        state.activeView = view
      }),

    updateColor: (index: number, patch: Partial<ColorToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.colors[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, ["tokens.colors"])
      }),

    updateGradient: (index: number, patch: Partial<GradientToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.gradients[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, ["tokens.gradients"])
      }),

    updateFontFamily: (index: number, patch: Partial<FontFamilyToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.typography.fontFamilies[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, [
          `tokens.typography.fontFamilies.${index}`,
        ])
      }),

    updateTypeScale: (index: number, patch: Partial<TypeScaleToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.typography.typeScale[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, ["tokens.typography.typeScale"])
      }),

    updateSpacing: (index: number, patch: Partial<SpacingToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.spacing[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, ["tokens.spacing"])
      }),

    updateRadius: (index: number, patch: Partial<RadiusToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.radius[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, ["tokens.radius"])
      }),

    updateShadow: (index: number, patch: Partial<ShadowToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.shadows[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, ["tokens.shadows"])
      }),

    updateLayout: (patch: Partial<LayoutToken>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        Object.assign(state.tokens.layout, patch)
        syncMarkdownFromState(state, ["tokens.layout"])
      }),

    updateMeta: (patch: Partial<Meta>) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        Object.assign(state.tokens.meta, patch)
        syncMarkdownFromState(state, ["tokens.meta"])
      }),

    applyImportSuggestion: (suggestionId) =>
      set((state) => {
        if (!canApplyStructuredEdit(state) || !state.importDiagnostics) return

        const suggestion = state.importDiagnostics.suggestions.find(
          (item) => item.id === suggestionId
        )
        if (!suggestion || suggestion.action.type === "none") return

        const touchedKeys = new Set<DocumentSectionDataKey>()
        applyImportSuggestionAction(state, suggestion.action, touchedKeys)

        if (touchedKeys.size === 0) return
        syncMarkdownFromState(state, [...touchedKeys])
      }),

    applyAllImportSuggestions: () =>
      set((state) => {
        if (!canApplyStructuredEdit(state) || !state.importDiagnostics) return

        const touchedKeys = new Set<DocumentSectionDataKey>()
        state.importDiagnostics.suggestions.forEach((suggestion) => {
          if (suggestion.action.type === "none") return
          applyImportSuggestionAction(state, suggestion.action, touchedKeys)
        })

        if (touchedKeys.size === 0) return
        syncMarkdownFromState(state, [...touchedKeys])
      }),

    updateComponent: (index, patch) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        const target = state.tokens.components[index]
        if (!target) return
        Object.assign(target, patch)
        syncMarkdownFromState(state, [`tokens.components.${index}`])
      }),

    updateDosDonts: (kind, items) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        state.rawSections.dosDonts[kind] = sanitizeListItems(items)
        syncMarkdownFromState(state, [
          kind === "dos" ? "rawSections.dos" : "rawSections.donts",
          "rawSections.dosDonts",
        ])
      }),

    updateImagery: (value) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        state.rawSections.imagery = value
        syncMarkdownFromState(state, ["rawSections.imagery"])
      }),

    updateLayoutProse: (value) =>
      set((state) => {
        if (!canApplyStructuredEdit(state)) return
        state.rawSections.layout = value
        syncMarkdownFromState(state, ["rawSections.layout"])
      }),

    resetAll: () =>
      set((state) => {
        if (!state.initialTokens || !state.initialRawMarkdown) return

        const result = parseDesignMd(state.initialRawMarkdown)
        applyLiveParsedResult(state, result, state.initialRawMarkdown)
        state.initialTokens = cloneTokens(state.initialTokens)
        state.initialRawSections = cloneRawSections(state.initialRawSections)
        syncActiveStateToDocument(state)
      }),

    resetTab: (tab: string) =>
      set((state) => {
        const initial = state.initialTokens
        if (!initial || !state.tokens || !canApplyStructuredEdit(state)) return

        const initialTokens = cloneTokens(initial)
        switch (tab) {
          case "colors":
            state.tokens.colors = initialTokens.colors
            state.tokens.gradients = initialTokens.gradients
            syncMarkdownFromState(state, ["tokens.colors", "tokens.gradients"])
            break
          case "typography":
            state.tokens.typography = initialTokens.typography
            syncMarkdownFromState(state, [
              ...initialTokens.typography.fontFamilies.map(
                (_, index) => `tokens.typography.fontFamilies.${index}` as const
              ),
              "tokens.typography.typeScale",
            ])
            break
          case "spacing":
            state.tokens.spacing = initialTokens.spacing
            syncMarkdownFromState(state, ["tokens.spacing"])
            break
          case "radius":
            state.tokens.radius = initialTokens.radius
            syncMarkdownFromState(state, ["tokens.radius"])
            break
          case "shadows":
            state.tokens.shadows = initialTokens.shadows
            syncMarkdownFromState(state, ["tokens.shadows"])
            break
          case "layout":
            state.tokens.layout = initialTokens.layout
            syncMarkdownFromState(state, ["tokens.layout"])
            break
          case "meta":
            state.tokens.meta = initialTokens.meta
            syncMarkdownFromState(state, ["tokens.meta"])
            break
          case "components":
            state.tokens.components = initialTokens.components
            syncMarkdownFromState(
              state,
              initialTokens.components.map(
                (_, index) => `tokens.components.${index}` as const
              )
            )
            break
          case "dos-donts":
            state.rawSections.dosDonts = cloneRawSections(
              state.initialRawSections
            ).dosDonts
            syncMarkdownFromState(state, [
              "rawSections.dos",
              "rawSections.donts",
              "rawSections.dosDonts",
            ])
            break
          case "imagery":
            state.rawSections.imagery = state.initialRawSections.imagery
            syncMarkdownFromState(state, ["rawSections.imagery"])
            break
          case "layout-prose":
            state.rawSections.layout = state.initialRawSections.layout
            syncMarkdownFromState(state, ["rawSections.layout"])
            break
        }
      }),

    createDocument: async (options: CreateDocumentOptions) => {
      const source = options.source
      let createdId: string | null = null

      if (
        getActiveWorkspaceScope().kind === "cloud" &&
        get().documents.length >= CLOUD_DOCUMENT_LIMIT
      )
        return null

      if (source === "upload") {
        if (!options.file) return null
        const result = await get().createDocumentsFromFiles([options.file])
        return result.createdIds.at(-1) ?? null
      }

      if (source === "blank") {
        set((state) => {
          syncActiveStateToDocument(state)
          const document = buildWorkspaceDocument(
            options.content ?? BLANK_TEMPLATE_MD,
            options.name?.trim() || BLANK_DOCUMENT_NAME,
            { kind: "blank", generation: options.generation }
          )
          addAndActivateDocument(state, document)
          createdId = document.id
        })
        return createdId
      }

      if (source === "brand") {
        const sourceId = options.sourceId
        if (!sourceId) return null
        const brand = get().brands.find((item: Brand) => item.id === sourceId)
        if (!brand) return null
        const mdContent = await fetchBrandMarkdown(brand)
        if (!mdContent) return null

        set((state) => {
          syncActiveStateToDocument(state)
          const storedBrand = state.brands.find((item) => item.id === brand.id)
          if (storedBrand) storedBrand.mdContent = mdContent
          const document = buildWorkspaceDocument(
            mdContent,
            options.name?.trim() || brand.name,
            { kind: "brand", id: brand.id }
          )
          addAndActivateDocument(state, document)
          createdId = document.id
        })

        return createdId
      }

      if (source === "library") {
        const sourceId = options.sourceId
        if (!sourceId) return null
        const libraryEntry = get().libraryEntries.find(
          (item) => item.id === sourceId
        )
        if (!libraryEntry) return null

        set((state) => {
          syncActiveStateToDocument(state)
          const document = buildWorkspaceDocument(
            libraryEntry.mdContent,
            options.name?.trim() || libraryEntry.name,
            { kind: "library", id: libraryEntry.id }
          )
          addAndActivateDocument(state, document)
          createdId = document.id
        })

        return createdId
      }

      if (source === "duplicate") {
        const sourceId = options.sourceId
        if (!sourceId) return null

        set((state) => {
          syncActiveStateToDocument(state)

          const sourceDocument = state.documents.find(
            (document) => document.id === sourceId
          )
          if (!sourceDocument) return

          const duplicate = cloneDocument(sourceDocument)
          const now = Date.now()
          duplicate.id = createDocumentId()
          duplicate.name = options.name?.trim() || `${sourceDocument.name} 副本`
          duplicate.createdAt = now
          duplicate.updatedAt = now
          duplicate.lastOpenedAt = now
          duplicate.origin = {
            kind: "duplicate",
            id: sourceDocument.id,
            generation: sourceDocument.origin.generation
              ? structuredClone(sourceDocument.origin.generation)
              : undefined,
          }

          state.documents.unshift(duplicate)
          state.activeDocumentId = duplicate.id
          hydrateStateFromDocument(state, duplicate)
          createdId = duplicate.id
        })

        return createdId
      }

      return null
    },

    createDocumentsFromFiles: async (files) => {
      const fileList = Array.from(files)
      const result = createEmptyBatchImportResult(fileList.length)
      const documentsToCreate: WorkspaceDocument[] = []
      const remainingCloudSlots =
        getActiveWorkspaceScope().kind === "cloud"
          ? Math.max(0, CLOUD_DOCUMENT_LIMIT - get().documents.length)
          : Number.POSITIVE_INFINITY

      for (const file of fileList) {
        if (documentsToCreate.length >= remainingCloudSlots) {
          result.skipped.push({
            filename: file.name || "未命名文件",
            kind: "quota",
            reason: `云端草稿最多 ${CLOUD_DOCUMENT_LIMIT} 个，请先删除不需要的草稿。`,
          })
          continue
        }
        const issue = getFileImportIssue(file)
        if (issue) {
          result.skipped.push(issue)
          continue
        }

        try {
          const content = await file.text()
          const baseName = file.name.replace(/\.md$/i, "") || undefined
          const document = buildWorkspaceDocument(content, baseName, {
            kind: "upload",
          })
          documentsToCreate.push(document)
          result.createdIds.push(document.id)
        } catch (error) {
          result.failed.push({
            filename: file.name || "未命名文件",
            kind: "parse-error",
            reason:
              error instanceof Error
                ? error.message
                : "导入失败，请检查文件内容。",
          })
        }
      }

      result.successCount = documentsToCreate.length

      if (documentsToCreate.length > 0) {
        set((state) => {
          syncActiveStateToDocument(state)
          for (const document of documentsToCreate) {
            addAndActivateDocument(state, document)
          }
          state.aiAssistInvitationDocumentId =
            documentsToCreate.at(-1)?.id ?? null
        })
      }

      return result
    },

    setDocumentTags: (documentId, tags) =>
      set((state) => {
        const document = state.documents.find((doc) => doc.id === documentId)
        if (!document) return
        const normalized = Array.from(
          new Set(tags.map((tag) => tag.trim()).filter(Boolean))
        )
        document.tags = normalized
        document.updatedAt = Date.now()
      }),

    setDocumentCategory: (documentId, category) =>
      set((state) => {
        const document = state.documents.find((doc) => doc.id === documentId)
        if (!document) return
        const next = category?.trim() || undefined
        document.category = next
        document.updatedAt = Date.now()
      }),

    setDocumentPinned: (documentId, pinned) =>
      set((state) => {
        const document = state.documents.find((doc) => doc.id === documentId)
        if (!document) return
        document.pinned = pinned
        document.updatedAt = Date.now()
      }),

    publishDocumentToLibrary: (documentId, input, options) => {
      const document = get().documents.find((doc) => doc.id === documentId)
      if (!document || !document.rawMarkdown.trim()) return null

      const publishedMarkdown = applyLibraryProjectUrl(
        document.rawMarkdown,
        input.projectUrl
      )
      const trimmedName = input.name.trim() || document.name
      const trimmedDescription =
        input.description.trim() || document.tokens.meta.description || ""
      const tags = Array.from(
        new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))
      )
      const previewColors = pickPreviewColorsFromTokens(document.tokens)
      const metadataChips: ThemeMetadataChips = document.parsedDocument
        ? buildMetadataChipsFromParseResult(document.parsedDocument)
        : document.lastValidParsedDocument
          ? buildMetadataChipsFromParseResult(document.lastValidParsedDocument)
          : buildMetadataChipsFromMarkdown(publishedMarkdown)

      const now = Date.now()
      let publishedId: string | null = null
      const mode = options?.mode ?? "auto"

      set((state) => {
        const liveDocument = state.documents.find(
          (doc) => doc.id === documentId
        )
        if (!liveDocument) return

        const originLibraryId =
          liveDocument.origin.kind === "library" ? liveDocument.origin.id : null
        const canOverwrite =
          mode !== "new" &&
          !!originLibraryId &&
          state.libraryEntries.some((entry) => entry.id === originLibraryId)

        if (canOverwrite) {
          const entry = state.libraryEntries.find(
            (item) => item.id === originLibraryId
          )
          if (!entry) return
          entry.name = trimmedName
          entry.description = trimmedDescription
          entry.tags = tags
          entry.category = input.category?.trim() || undefined
          entry.previewColors = previewColors
          entry.metadataChips = metadataChips
          entry.mdContent = publishedMarkdown
          entry.updatedAt = now
          publishedId = entry.id
        } else {
          if (
            getActiveWorkspaceScope().kind === "cloud" &&
            state.libraryEntries.length >= CLOUD_LIBRARY_LIMIT
          )
            return
          const id = createLibraryEntryId()
          state.libraryEntries.unshift({
            id,
            name: trimmedName,
            description: trimmedDescription,
            tags,
            category: input.category?.trim() || undefined,
            previewColors,
            metadataChips,
            mdContent: publishedMarkdown,
            createdAt: now,
            updatedAt: now,
          })
          publishedId = id
        }

        if (!publishedId) return
        liveDocument.origin = {
          kind: "library",
          id: publishedId,
          generation: liveDocument.origin.generation,
        }
        liveDocument.updatedAt = now
        if (state.activeDocumentId === liveDocument.id) {
          state.activeDocumentId = liveDocument.id
        }
      })

      return publishedId
    },

    saveBrandToLibrary: async (brandId, overrides) => {
      if (
        getActiveWorkspaceScope().kind === "cloud" &&
        get().libraryEntries.length >= CLOUD_LIBRARY_LIMIT
      )
        return null
      const brand = get().brands.find((item: Brand) => item.id === brandId)
      if (!brand) return null
      const mdContent = await fetchBrandMarkdown(brand)
      if (!mdContent) return null

      const metadataChips = buildMetadataChipsFromMarkdown(mdContent)
      const now = Date.now()
      const id = createLibraryEntryId()
      const name = overrides?.name?.trim() || `${brand.name} 副本`
      const description = overrides?.description?.trim() || brand.description
      const tags = Array.from(
        new Set(
          (overrides?.tags ?? brand.tags)
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        )
      )

      set((state) => {
        const storedBrand = state.brands.find((item) => item.id === brand.id)
        if (storedBrand) storedBrand.mdContent = mdContent
        state.libraryEntries.unshift({
          id,
          name,
          description,
          tags,
          category: overrides?.category?.trim() || brand.category || undefined,
          previewColors: [...brand.previewColors],
          metadataChips,
          mdContent,
          createdAt: now,
          updatedAt: now,
        })
      })

      return id
    },

    renameLibraryEntry: (libraryId, name) =>
      set((state) => {
        const entry = state.libraryEntries.find((item) => item.id === libraryId)
        if (!entry) return
        const next = name.trim()
        if (!next) return
        entry.name = next
        entry.updatedAt = Date.now()
      }),

    updateLibraryEntry: (libraryId, patch) =>
      set((state) => {
        const entry = state.libraryEntries.find((item) => item.id === libraryId)
        if (!entry) return
        if (typeof patch.name === "string" && patch.name.trim()) {
          entry.name = patch.name.trim()
        }
        if (typeof patch.description === "string") {
          entry.description = patch.description
        }
        if (typeof patch.mdContent === "string") {
          entry.mdContent = patch.mdContent
        }
        if (Array.isArray(patch.tags)) {
          entry.tags = Array.from(
            new Set(patch.tags.map((tag) => tag.trim()).filter(Boolean))
          )
        }
        if (typeof patch.category !== "undefined") {
          entry.category = patch.category?.trim() || undefined
        }
        entry.updatedAt = Date.now()
      }),

    deleteLibraryEntry: (libraryId) =>
      set((state) => {
        const index = state.libraryEntries.findIndex(
          (item) => item.id === libraryId
        )
        if (index === -1) return
        state.libraryEntries.splice(index, 1)
      }),

    deleteLibraryEntries: (libraryIds) => {
      const ids = new Set(libraryIds)
      if (ids.size === 0) return
      set((state) => {
        state.libraryEntries = state.libraryEntries.filter(
          (entry) => !ids.has(entry.id)
        )
      })
    },

    duplicateLibraryEntry: (libraryId) => {
      if (
        getActiveWorkspaceScope().kind === "cloud" &&
        get().libraryEntries.length >= CLOUD_LIBRARY_LIMIT
      )
        return null
      const source = get().libraryEntries.find((item) => item.id === libraryId)
      if (!source) return null
      const now = Date.now()
      const id = createLibraryEntryId()
      set((state) => {
        state.libraryEntries.unshift({
          ...cloneLibraryEntry(source),
          id,
          name: `${source.name} 副本`,
          createdAt: now,
          updatedAt: now,
        })
      })
      return id
    },

    toggleLibraryEntryFavorite: (libraryId) =>
      set((state) => {
        const entry = state.libraryEntries.find((item) => item.id === libraryId)
        if (!entry) return
        entry.favorited = !entry.favorited
        entry.updatedAt = Date.now()
      }),

    toggleBrandFavorite: (brandId) =>
      set((state) => {
        const index = state.brandFavorites.indexOf(brandId)
        if (index === -1) {
          state.brandFavorites.push(brandId)
        } else {
          state.brandFavorites.splice(index, 1)
        }
      }),

    renameTaxonomyTag: (oldTag, newTag) => {
      const result = { drafts: 0, library: 0 }
      const from = oldTag.trim()
      const to = newTag.trim()
      if (!from || !to || from === to) return result
      set((state) => {
        const now = Date.now()
        for (const doc of state.documents) {
          if (!doc.tags?.includes(from)) continue
          const next = Array.from(
            new Set(doc.tags.map((tag) => (tag === from ? to : tag)))
          )
          if (next.join(" ") === (doc.tags ?? []).join(" ")) continue
          doc.tags = next
          doc.updatedAt = now
          result.drafts += 1
        }
        for (const entry of state.libraryEntries) {
          if (!entry.tags.includes(from)) continue
          entry.tags = Array.from(
            new Set(entry.tags.map((tag) => (tag === from ? to : tag)))
          )
          entry.updatedAt = now
          result.library += 1
        }
      })
      return result
    },

    mergeTaxonomyTag: (sourceTag, targetTag) => {
      const result = { drafts: 0, library: 0 }
      const source = sourceTag.trim()
      const target = targetTag.trim()
      if (!source || !target || source === target) return result
      set((state) => {
        const now = Date.now()
        for (const doc of state.documents) {
          if (!doc.tags?.includes(source)) continue
          const next = Array.from(
            new Set([...doc.tags.filter((tag) => tag !== source), target])
          )
          if (next.length === (doc.tags ?? []).length && next.includes(target))
            continue
          doc.tags = next
          doc.updatedAt = now
          result.drafts += 1
        }
        for (const entry of state.libraryEntries) {
          if (!entry.tags.includes(source)) continue
          entry.tags = Array.from(
            new Set([...entry.tags.filter((tag) => tag !== source), target])
          )
          entry.updatedAt = now
          result.library += 1
        }
      })
      return result
    },

    deleteTaxonomyTag: (tag) => {
      const result = { drafts: 0, library: 0 }
      const target = tag.trim()
      if (!target) return result
      set((state) => {
        const now = Date.now()
        for (const doc of state.documents) {
          if (!doc.tags?.includes(target)) continue
          doc.tags = doc.tags.filter((value) => value !== target)
          doc.updatedAt = now
          result.drafts += 1
        }
        for (const entry of state.libraryEntries) {
          if (!entry.tags.includes(target)) continue
          entry.tags = entry.tags.filter((value) => value !== target)
          entry.updatedAt = now
          result.library += 1
        }
      })
      return result
    },

    renameTaxonomyCategory: (oldCategory, newCategory) => {
      const result = { drafts: 0, library: 0 }
      const from = oldCategory.trim()
      const to = newCategory.trim()
      if (!from || !to || from === to) return result
      set((state) => {
        const now = Date.now()
        for (const doc of state.documents) {
          if (doc.category !== from) continue
          doc.category = to
          doc.updatedAt = now
          result.drafts += 1
        }
        for (const entry of state.libraryEntries) {
          if (entry.category !== from) continue
          entry.category = to
          entry.updatedAt = now
          result.library += 1
        }
      })
      return result
    },

    mergeTaxonomyCategory: (sourceCategory, targetCategory) => {
      const result = { drafts: 0, library: 0 }
      const source = sourceCategory.trim()
      const target = targetCategory.trim()
      if (!source || !target || source === target) return result
      set((state) => {
        const now = Date.now()
        for (const doc of state.documents) {
          if (doc.category !== source) continue
          doc.category = target
          doc.updatedAt = now
          result.drafts += 1
        }
        for (const entry of state.libraryEntries) {
          if (entry.category !== source) continue
          entry.category = target
          entry.updatedAt = now
          result.library += 1
        }
      })
      return result
    },

    clearTaxonomyCategory: (category) => {
      const result = { drafts: 0, library: 0 }
      const target = category.trim()
      if (!target) return result
      set((state) => {
        const now = Date.now()
        for (const doc of state.documents) {
          if (doc.category !== target) continue
          doc.category = undefined
          doc.updatedAt = now
          result.drafts += 1
        }
        for (const entry of state.libraryEntries) {
          if (entry.category !== target) continue
          entry.category = undefined
          entry.updatedAt = now
          result.library += 1
        }
      })
      return result
    },
  }))
)

useDesignStore.subscribe((state) => {
  if (!state.hasHydrated || state.isHydrating) return

  scheduleWorkspacePersist(buildPersistedWorkspaceSnapshot(state))
})

// Flush pending (debounced) persistence when the tab is being hidden or
// closed, so the last ~500ms of edits survive (PROJECT-REVIEW B11).
if (typeof window !== "undefined") {
  const flushPersistence = () => {
    const state = useDesignStore.getState()
    if (!state.hasHydrated || state.isHydrating) return
    flushWorkspacePersistNow(buildPersistedWorkspaceSnapshot(state))
  }

  window.addEventListener("pagehide", flushPersistence)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersistence()
  })
}
