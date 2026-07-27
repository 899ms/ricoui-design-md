export function shouldOpenGlobalSearch(event: KeyboardEvent): boolean {
  if (event.isComposing || event.key.toLowerCase() !== "k") return false
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey)
    return false

  const target = event.target
  return !(
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}
