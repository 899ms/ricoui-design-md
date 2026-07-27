import type { LibraryEntry, WorkspaceDocument } from "@/lib/types/tokens"
import {
  exportTextFilesToZip,
  slugifyExportName,
} from "@/lib/export/export-zip"

type DraftSource = Pick<
  WorkspaceDocument,
  "id" | "name" | "rawMarkdown" | "createdAt" | "updatedAt"
>
type LibrarySource = Pick<
  LibraryEntry,
  "id" | "name" | "mdContent" | "createdAt" | "updatedAt"
>

function uniqueFolder(name: string, used: Set<string>) {
  const base = slugifyExportName(name)
  let folder = base
  let suffix = 2
  while (used.has(folder)) folder = `${base}-${suffix++}`
  used.add(folder)
  return folder
}

export function buildAccountSourceBackupFiles(
  documents: DraftSource[],
  libraryEntries: LibrarySource[],
  exportedAt = new Date().toISOString()
) {
  const files: Record<string, string> = {}
  const draftFolders = new Set<string>()
  const libraryFolders = new Set<string>()
  const sources: Array<Record<string, string | number>> = []

  for (const document of documents) {
    const folder = uniqueFolder(document.name, draftFolders)
    files[`drafts/${folder}/DESIGN.md`] = document.rawMarkdown
    sources.push({
      kind: "draft",
      id: document.id,
      name: document.name,
      path: `drafts/${folder}/DESIGN.md`,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })
  }
  for (const entry of libraryEntries) {
    const folder = uniqueFolder(entry.name, libraryFolders)
    files[`library/${folder}/DESIGN.md`] = entry.mdContent
    sources.push({
      kind: "library",
      id: entry.id,
      name: entry.name,
      path: `library/${folder}/DESIGN.md`,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })
  }

  files["manifest.json"] = `${JSON.stringify(
    { version: 1, exportedAt, sources },
    null,
    2
  )}\n`
  files["README.md"] =
    "# RICOUI DESIGN source backup\n\nThis archive contains original Markdown only. AI provider settings and API keys are not included.\n"
  return files
}

export function exportAccountSourceBackup(
  documents: DraftSource[],
  libraryEntries: LibrarySource[]
) {
  return exportTextFilesToZip(
    buildAccountSourceBackupFiles(documents, libraryEntries)
  )
}
