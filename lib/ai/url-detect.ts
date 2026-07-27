const URL_PATTERN = /^(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:[/:?#].*)?$/i

export function isUrlLikeInput(value: string) {
  return URL_PATTERN.test(value.trim())
}

export function normalizeUrlInput(value: string) {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
