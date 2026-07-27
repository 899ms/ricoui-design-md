const PROJECT_URL_LINE = /^\s*\*\*Project URL:\*\*\s*(.+?)\s*$/i
const MARKDOWN_LINK = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/i

export function normalizeProjectUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined
    }
    return parsed.toString()
  } catch {
    return undefined
  }
}

export function extractProjectUrl(markdown: string) {
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(PROJECT_URL_LINE)
    if (!match?.[1]) continue
    const value = match[1].trim()
    const markdownLink = value.match(MARKDOWN_LINK)
    return normalizeProjectUrl(markdownLink?.[2] ?? value)
  }
  return undefined
}

export function setProjectUrlInMarkdown(markdown: string, value: string) {
  const projectUrl = normalizeProjectUrl(value)
  const newline = markdown.includes("\r\n") ? "\r\n" : "\n"
  const lines = markdown.split(/\r?\n/)
  const existingIndex = lines.findIndex((line) => PROJECT_URL_LINE.test(line))

  if (existingIndex >= 0) {
    if (projectUrl) {
      lines[existingIndex] = `**Project URL:** [${projectUrl}](${projectUrl})`
    } else {
      lines.splice(existingIndex, 1)
      if (
        lines[existingIndex] === "" &&
        existingIndex > 0 &&
        lines[existingIndex - 1] === ""
      ) {
        lines.splice(existingIndex, 1)
      }
    }
    return lines.join(newline)
  }

  if (!projectUrl) return markdown

  const projectLine = `**Project URL:** [${projectUrl}](${projectUrl})`
  const themeIndex = lines.findIndex((line) => /^\s*\*\*Theme:\*\*/i.test(line))
  if (themeIndex >= 0) {
    const insertionIndex =
      lines[themeIndex + 1] === "" ? themeIndex + 2 : themeIndex + 1
    lines.splice(insertionIndex, 0, projectLine, "")
    return lines.join(newline)
  }

  const descriptionIndex = lines.findIndex((line) => /^\s*>\s+/.test(line))
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line))
  const anchorIndex = descriptionIndex >= 0 ? descriptionIndex : titleIndex
  const insertionIndex = anchorIndex >= 0 ? anchorIndex + 1 : 0
  lines.splice(insertionIndex, 0, "", projectLine, "")
  return lines.join(newline)
}

/**
 * Save dialogs always provide a string, including an empty one to remove the
 * URL. Programmatic saves omit it so their existing Markdown stays unchanged.
 */
export function applyLibraryProjectUrl(markdown: string, value?: string) {
  return typeof value === "string"
    ? setProjectUrlInMarkdown(markdown, value)
    : markdown
}
