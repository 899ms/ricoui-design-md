// Design Token Types — Based on W3C DTCG (Design Tokens Community Group) spec
// Internal representation, exported as W3C DTCG format on demand

import type { SourceWorkspaceSnapshot } from "@/lib/sync/types"
import type { UrlSourceKind } from "@/lib/types/url-generation"

export interface DesignTokens {
  meta: Meta
  colors: ColorToken[]
  gradients: GradientToken[]
  typography: TypographyTokens
  spacing: SpacingToken[]
  radius: RadiusToken[]
  shadows: ShadowToken[]
  layout: LayoutToken
  components: ComponentToken[]
}

export interface Meta {
  name: string
  description: string
  theme: "light" | "dark"
}

export interface ColorToken {
  name: string
  value: string
  token: string
  role: string
}

export interface GradientToken {
  name: string
  value: string
  token: string
  role: string
}

export interface TypographyTokens {
  fontFamilies: FontFamilyToken[]
  typeScale: TypeScaleToken[]
}

export interface FontFamilyToken {
  name: string
  token: string
  substitute: string
  weights: number[]
  role: string
}

export interface TypeScaleToken {
  role: string
  size: string
  lineHeight: string
  letterSpacing: string
  token: string
}

export interface SpacingToken {
  name: string
  value: string
  token: string
}

export interface RadiusToken {
  name: string
  value: string
  token: string
}

export interface ShadowToken {
  name: string
  value: string
  token: string
}

export interface LayoutToken {
  sectionGap: string
  cardPadding: string
  elementGap: string
  maxContentWidth: string
}

export interface ComponentToken {
  name: string
  role: string
  description: string
}

// Raw sections preserved from original Markdown for backward export
export interface RawSections {
  components: RawSection[]
  dosDonts: {
    dos: string[]
    donts: string[]
  }
  imagery: string
  layout: string
  density?: string
  [key: string]: unknown
}

export interface RawSection {
  heading: string
  role: string
  body: string
}

export type DocumentSectionDataKey =
  | "tokens.meta"
  | "tokens.colors"
  | "tokens.gradients"
  | `tokens.typography.fontFamilies.${number}`
  | "tokens.typography.typeScale"
  | "tokens.spacing"
  | "tokens.radius"
  | "tokens.shadows"
  | "tokens.layout"
  | `tokens.components.${number}`
  | `rawSections.components.${number}`
  | "rawSections.dosDonts"
  | "rawSections.dos"
  | "rawSections.donts"
  | "rawSections.imagery"
  | "rawSections.layout"
  | "rawSections.density"

export type DocumentSectionKind =
  | "preamble"
  | "heading"
  | "colors"
  | "gradients"
  | "typography-font"
  | "typography-type-scale"
  | "spacing"
  | "radius"
  | "shadows"
  | "layout-tokens"
  | "components"
  | "dos"
  | "donts"
  | "imagery"
  | "layout-prose"
  | "unknown"

export interface DocumentSectionSkeleton {
  id: string
  kind: DocumentSectionKind
  raw: string
  start: number
  end: number
  order: number
  depth: number
  modeled: boolean
  title: string
  headingText?: string
  dataKey?: DocumentSectionDataKey
}

export type PreviewSemanticResolution = "explicit" | "inferred" | "fallback"

export interface PreviewSemanticValue<T> {
  value: T
  resolution: PreviewSemanticResolution
  token?: string
  label?: string
}

export interface PreviewTypeStyle {
  role: string
  size: string
  lineHeight: string
  letterSpacing: string
  token: string
}

export interface SemanticColorRoles {
  primary: PreviewSemanticValue<string>
  secondary: PreviewSemanticValue<string>
  surface: PreviewSemanticValue<string>
  background: PreviewSemanticValue<string>
  text: PreviewSemanticValue<string>
  muted: PreviewSemanticValue<string>
  border: PreviewSemanticValue<string>
  success: PreviewSemanticValue<string>
  warning: PreviewSemanticValue<string>
  danger: PreviewSemanticValue<string>
}

export interface SemanticTypographyRoles {
  displayFont: PreviewSemanticValue<string>
  bodyFont: PreviewSemanticValue<string>
  display: PreviewSemanticValue<PreviewTypeStyle>
  heading: PreviewSemanticValue<PreviewTypeStyle>
  body: PreviewSemanticValue<PreviewTypeStyle>
  label: PreviewSemanticValue<PreviewTypeStyle>
  caption: PreviewSemanticValue<PreviewTypeStyle>
}

export interface SemanticSurfaceRoles {
  cardRadius: PreviewSemanticValue<string>
  buttonRadius: PreviewSemanticValue<string>
  inputRadius: PreviewSemanticValue<string>
  cardShadow: PreviewSemanticValue<string>
  buttonShadow: PreviewSemanticValue<string>
}

export interface SemanticLayoutRoles {
  sectionGap: PreviewSemanticValue<string>
  cardPadding: PreviewSemanticValue<string>
  elementGap: PreviewSemanticValue<string>
  maxContentWidth: PreviewSemanticValue<string>
}

export interface CanonicalButtonSpec {
  label: string
  variant: "primary" | "secondary" | "ghost"
  background: string
  foreground: string
  border: string
  shadow: string
  radius: string
}

export interface CanonicalFieldSpec {
  label: string
  kind: "input" | "textarea" | "select"
  background: string
  foreground: string
  border: string
  radius: string
  placeholder: string
}

export interface CanonicalBadgeSpec {
  label: string
  background: string
  foreground: string
}

export interface CanonicalAlertSpec {
  tone: "success" | "warning" | "danger"
  background: string
  foreground: string
  border: string
}

export interface CanonicalSurfaceSpec {
  background: string
  foreground: string
  border: string
  shadow: string
  radius: string
}

export interface CanonicalPreviewKit {
  buttons: {
    primary: CanonicalButtonSpec
    secondary: CanonicalButtonSpec
    ghost: CanonicalButtonSpec
  }
  fields: {
    input: CanonicalFieldSpec
    textarea: CanonicalFieldSpec
    select: CanonicalFieldSpec
  }
  badges: CanonicalBadgeSpec[]
  alerts: CanonicalAlertSpec[]
  topBar: CanonicalSurfaceSpec
  sectionBlock: CanonicalSurfaceSpec
  focusRing: string
  disabledOpacity: number
}

export interface PreviewDiagnostic {
  slot: string
  severity: "info" | "warning"
  message: string
}

export interface PreviewSemantics {
  colors: SemanticColorRoles
  typography: SemanticTypographyRoles
  surfaces: SemanticSurfaceRoles
  layout: SemanticLayoutRoles
  canonicalKit: CanonicalPreviewKit
  diagnostics: PreviewDiagnostic[]
}

export type ImportSuggestionConfidence = "high" | "medium" | "low"

export type ImportSuggestionAction =
  | {
      type: "set-color-role"
      index: number
      role: string
    }
  | {
      type: "set-font-role"
      index: number
      role: string
    }
  | {
      type: "set-component-role"
      index: number
      role: string
    }
  | {
      type: "set-meta-description"
      description: string
    }
  | {
      type: "set-meta-theme"
      theme: "light" | "dark"
    }
  | {
      type: "none"
    }

export interface ImportSuggestion {
  id: string
  category: "semantic-role" | "missing-field" | "format-risk" | "metadata-draft"
  title: string
  description: string
  rationale: string
  confidence: ImportSuggestionConfidence
  preview?: string
  action: ImportSuggestionAction
}

export interface ImportDiagnosticsReport {
  summary: {
    suggestions: number
    actionable: number
    warnings: number
  }
  suggestions: ImportSuggestion[]
  warnings: string[]
  metadataDraft: string
}

// Parse result from markdown parser
export interface ParseResult {
  tokens: DesignTokens
  rawSections: RawSections
  sectionSkeleton: DocumentSectionSkeleton[]
  previewSemantics: PreviewSemantics
}

export type ParseStatus = "idle" | "valid" | "invalid" | "degraded"

export type AiTaskStatus = "idle" | "streaming" | "done" | "error"

export interface AiTaskState {
  status: AiTaskStatus
  task?: "analyze" | "convert" | "repair" | "assistant" | "generate"
  model?: string
  error?: string
}

export type EditorView = "document" | "structured" | "preview"

export interface DocumentDiagnostic {
  kind: "parse-error" | "preview-degraded" | "structured-edit-skipped"
  message: string
}

export interface WorkspaceDocument {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  tokens: DesignTokens
  rawSections: RawSections
  initialTokens: DesignTokens
  initialRawSections: RawSections
  rawMarkdown: string
  initialRawMarkdown: string
  parsedDocument: ParseResult | null
  lastValidParsedDocument: ParseResult | null
  documentDiagnostics: DocumentDiagnostic[]
  importDiagnostics?: ImportDiagnosticsReport | null
  parseStatus: ParseStatus
  parseError: string | null
  tags?: string[]
  category?: string
  pinned?: boolean
  origin: DocumentOrigin
  lastOpenedAt?: number
  notes?: string
}

export interface UrlGenerationMetadata {
  sourceUrl: string
  sourceKind?: UrlSourceKind
  sourceDocumentUrl?: string
  sourceCacheHit?: boolean
  status: "ready" | "warning" | "blocked"
  attempts: 1 | 2
  issues: string[]
  validatedRevision: string
  cssEvidence?: string
  generatedAt: number
}

export type DocumentOrigin = (
  | { kind: "blank" }
  | { kind: "upload" }
  | { kind: "brand"; id: string }
  | { kind: "library"; id: string }
  | { kind: "duplicate"; id: string }
) & { generation?: UrlGenerationMetadata }

export interface ThemeMetadataChips {
  displayFont?: string
  bodyFont?: string
  accent?: string
  radius?: string
}

export interface LibraryEntry {
  id: string
  name: string
  description: string
  tags: string[]
  category?: string
  previewColors: string[]
  metadataChips: ThemeMetadataChips
  mdContent: string
  createdAt: number
  updatedAt: number
  favorited?: boolean
}

export interface PublishToLibraryInput {
  name: string
  description: string
  /** Omit to preserve the source Markdown URL during non-dialog saves. */
  projectUrl?: string
  tags: string[]
  category?: string
}

export type CreateDocumentSource =
  | "blank"
  | "upload"
  | "brand"
  | "library"
  | "duplicate"

export interface CreateDocumentOptions {
  source: CreateDocumentSource
  file?: File
  sourceId?: string
  name?: string
  content?: string
  generation?: UrlGenerationMetadata
}

export type BatchImportIssueKind =
  | "invalid-type"
  | "too-large"
  | "parse-error"
  | "quota"

export interface BatchImportIssue {
  filename: string
  reason: string
  kind: BatchImportIssueKind
}

export interface BatchImportResult {
  totalCount: number
  successCount: number
  createdIds: string[]
  failed: BatchImportIssue[]
  skipped: BatchImportIssue[]
}

export interface Brand {
  id: string
  folder: string
  name: string
  website: string
  description: string
  tags: string[]
  category: string
  previewColors: string[]
  files: string[]
  designMdUrl: string
  previewUrl?: string
  tokensUrl?: string
  variablesUrl?: string
  themeCssUrl?: string
  imageUrl?: string
  faviconUrl?: string
  videoUrl?: string
  isComplete: boolean
  missingFiles: string[]
  metadataChips: ThemeMetadataChips
  mdContent: string
}

// Temporary compatibility aliases while V4 UI migration is in progress.
export type UserTheme = LibraryEntry
export type SaveAsThemeInput = PublishToLibraryInput
export type ThemePreset = Brand

// Zustand store state interface
export interface DesignStore {
  // State
  workspaceName: string
  documents: WorkspaceDocument[]
  libraryEntries: LibraryEntry[]
  brandFavorites: string[]
  activeDocumentId: string | null
  tokens: DesignTokens | null
  rawSections: RawSections
  initialTokens: DesignTokens | null
  initialRawSections: RawSections
  rawMarkdown: string
  initialRawMarkdown: string
  parsedDocument: ParseResult | null
  lastValidParsedDocument: ParseResult | null
  documentDiagnostics: DocumentDiagnostic[]
  importDiagnostics: ImportDiagnosticsReport | null
  parseStatus: ParseStatus
  parseError: string | null
  activeView: EditorView
  hasHydrated: boolean
  isHydrating: boolean
  hydrationError: string | null
  brands: Brand[]
  aiTask: AiTaskState
  aiAssistInvitationDocumentId: string | null

  // Actions
  initializeWorkspace: () => Promise<void>
  replaceWorkspaceFromCloud: (snapshot: SourceWorkspaceSnapshot) => void
  replaceDocumentFromCloud: (
    documentId: string,
    remote: SourceWorkspaceSnapshot["documents"][number]
  ) => void
  splitDocumentConflict: (
    documentId: string,
    remote: SourceWorkspaceSnapshot["documents"][number]
  ) => string | null
  setAiTask: (patch: Partial<AiTaskState>) => void
  dismissAiAssistInvitation: () => void
  setImportDiagnostics: (report: ImportDiagnosticsReport | null) => void
  switchDocument: (documentId: string) => void
  renameDocument: (documentId: string, name: string) => void
  duplicateDocument: (documentId: string) => void
  deleteDocument: (documentId: string) => void
  updateRawMarkdown: (markdown: string) => void
  setActiveView: (view: EditorView) => void
  updateColor: (index: number, patch: Partial<ColorToken>) => void
  updateGradient: (index: number, patch: Partial<GradientToken>) => void
  updateFontFamily: (index: number, patch: Partial<FontFamilyToken>) => void
  updateTypeScale: (index: number, patch: Partial<TypeScaleToken>) => void
  updateSpacing: (index: number, patch: Partial<SpacingToken>) => void
  updateRadius: (index: number, patch: Partial<RadiusToken>) => void
  updateShadow: (index: number, patch: Partial<ShadowToken>) => void
  updateLayout: (patch: Partial<LayoutToken>) => void
  updateComponent: (index: number, patch: Partial<ComponentToken>) => void
  updateDosDonts: (kind: "dos" | "donts", items: string[]) => void
  updateImagery: (value: string) => void
  updateLayoutProse: (value: string) => void
  updateMeta: (patch: Partial<Meta>) => void
  applyImportSuggestion: (suggestionId: string) => void
  applyAllImportSuggestions: () => void
  resetAll: () => void
  resetTab: (tab: string) => void
  createDocument: (options: CreateDocumentOptions) => Promise<string | null>
  createDocumentsFromFiles: (files: File[]) => Promise<BatchImportResult>
  setDocumentTags: (documentId: string, tags: string[]) => void
  setDocumentCategory: (
    documentId: string,
    category: string | undefined
  ) => void
  setDocumentPinned: (documentId: string, pinned: boolean) => void
  publishDocumentToLibrary: (
    documentId: string,
    input: PublishToLibraryInput,
    options?: { mode?: "auto" | "new" }
  ) => string | null
  saveBrandToLibrary: (
    brandId: string,
    overrides?: Partial<PublishToLibraryInput>
  ) => Promise<string | null>
  renameLibraryEntry: (libraryId: string, name: string) => void
  updateLibraryEntry: (
    libraryId: string,
    patch: Partial<
      Pick<
        LibraryEntry,
        "description" | "tags" | "category" | "name" | "mdContent"
      >
    >
  ) => void
  deleteLibraryEntry: (libraryId: string) => void
  deleteLibraryEntries: (libraryIds: string[]) => void
  duplicateLibraryEntry: (libraryId: string) => string | null
  toggleLibraryEntryFavorite: (libraryId: string) => void
  toggleBrandFavorite: (brandId: string) => void
  // Taxonomy manager — operate across user-owned drafts + Library entries only.
  // Never mutate built-in Brand package metadata. Return affected counts for
  // feedback toasts.
  renameTaxonomyTag: (oldTag: string, newTag: string) => TaxonomyChangeResult
  mergeTaxonomyTag: (
    sourceTag: string,
    targetTag: string
  ) => TaxonomyChangeResult
  deleteTaxonomyTag: (tag: string) => TaxonomyChangeResult
  renameTaxonomyCategory: (
    oldCategory: string,
    newCategory: string
  ) => TaxonomyChangeResult
  mergeTaxonomyCategory: (
    sourceCategory: string,
    targetCategory: string
  ) => TaxonomyChangeResult
  clearTaxonomyCategory: (category: string) => TaxonomyChangeResult
}

export interface TaxonomyChangeResult {
  drafts: number
  library: number
}
