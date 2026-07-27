/** Shared browser download helpers, unified from five copies. */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadText(
  content: string,
  filename: string,
  mimeType = "text/plain;charset=utf-8"
) {
  downloadBlob(new Blob([content], { type: mimeType }), filename)
}
