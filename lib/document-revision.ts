export function getDocumentRevision(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, "\n")
  let hash = 0x811c9dc5
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${normalized.length.toString(36)}-${(hash >>> 0).toString(36)}`
}
