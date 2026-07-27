import { strToU8, zipSync, type Zippable } from "fflate"
import type {
  DesignTokens,
  RawSections,
  WorkspaceDocument,
} from "@/lib/types/tokens"
import { exportToJson } from "./export-json"
import { exportToCss, exportToTailwindTheme } from "./export-css"
import { exportToMd } from "./export-md"

export const RELEASE_EXPORTER_VERSION = "1"
const FIXED_ZIP_TIME = new Date("1980-01-01T00:00:00.000Z")

export interface ReleaseArtifactFile {
  name: string
  mediaType: string
  bytes: Uint8Array
}

export interface ReleaseArtifactBundle {
  exporterVersion: string
  files: ReleaseArtifactFile[]
  zip: Uint8Array
  uncompressedBytes: number
}

export function slugifyExportName(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "design"
  )
}

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, "\n")
}

export function buildReleaseArtifactFiles(
  tokens: DesignTokens,
  rawSections: RawSections,
  rawMarkdown?: string
): ReleaseArtifactFile[] {
  const prefix = slugifyExportName(tokens.meta.name || "design")
  const textFiles: Array<[string, string, string]> = [
    [
      `${prefix}-DESIGN.md`,
      rawMarkdown || exportToMd(tokens, rawSections),
      "text/markdown; charset=utf-8",
    ],
    [`${prefix}-tokens.json`, exportToJson(tokens), "application/json"],
    [
      `${prefix}-raw-tokens.json`,
      JSON.stringify(tokens, null, 2),
      "application/json",
    ],
    [`${prefix}-variables.css`, exportToCss(tokens), "text/css; charset=utf-8"],
    [
      `${prefix}-theme.css`,
      exportToTailwindTheme(tokens),
      "text/css; charset=utf-8",
    ],
    [
      "README.md",
      [
        `# ${tokens.meta.name} design release`,
        "",
        tokens.meta.description,
        "",
        "This immutable release was generated from DESIGN.md.",
        "To change derived CSS or JSON, edit DESIGN.md and publish a new version.",
        "",
        "Created with [RICO DM](https://design.ricoui.com).",
        "",
      ].join("\n"),
      "text/markdown; charset=utf-8",
    ],
  ]
  return textFiles
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, content, mediaType]) => ({
      name,
      mediaType,
      bytes: strToU8(normalizeText(content)),
    }))
}

export function zipArtifactFiles(files: ReleaseArtifactFile[]): Uint8Array {
  const input: Zippable = {}
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    input[file.name] = [file.bytes, { mtime: FIXED_ZIP_TIME, level: 6 }]
  }
  return zipSync(input, { level: 6 })
}

export function buildReleaseArtifactBundle(
  tokens: DesignTokens,
  rawSections: RawSections,
  rawMarkdown?: string
): ReleaseArtifactBundle {
  const files = buildReleaseArtifactFiles(tokens, rawSections, rawMarkdown)
  return {
    exporterVersion: RELEASE_EXPORTER_VERSION,
    files,
    zip: zipArtifactFiles(files),
    uncompressedBytes: files.reduce((sum, file) => sum + file.bytes.length, 0),
  }
}

export function exportToZip(
  tokens: DesignTokens,
  rawSections: RawSections,
  rawMarkdown?: string
): Blob {
  const bundle = buildReleaseArtifactBundle(tokens, rawSections, rawMarkdown)
  return new Blob([new Uint8Array(bundle.zip)], { type: "application/zip" })
}

export function exportWorkspaceToZip(documents: WorkspaceDocument[]): Blob {
  const files: ReleaseArtifactFile[] = []
  const usedFolders = new Set<string>()
  documents.forEach((document, index) => {
    const base = slugifyExportName(
      document.name || document.tokens.meta.name || `document-${index + 1}`
    )
    let folder = base
    let suffix = 2
    while (usedFolders.has(folder)) folder = `${base}-${suffix++}`
    usedFolders.add(folder)
    for (const file of buildReleaseArtifactFiles(
      document.tokens,
      document.rawSections,
      document.rawMarkdown
    )) {
      files.push({ ...file, name: `${folder}/${file.name}` })
    }
  })
  files.push({
    name: "README.md",
    mediaType: "text/markdown; charset=utf-8",
    bytes: strToU8(`# Workspace export\n\nDocuments: ${documents.length}\n`),
  })
  return new Blob([new Uint8Array(zipArtifactFiles(files))], {
    type: "application/zip",
  })
}

export function exportTextFilesToZip(files: Record<string, string>): Blob {
  const artifacts = Object.entries(files).map(([name, content]) => ({
    name,
    mediaType: "text/plain; charset=utf-8",
    bytes: strToU8(normalizeText(content)),
  }))
  return new Blob([new Uint8Array(zipArtifactFiles(artifacts))], {
    type: "application/zip",
  })
}
