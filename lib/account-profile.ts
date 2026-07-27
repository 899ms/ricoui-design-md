import type { User } from "@supabase/supabase-js"

const DISPLAY_NAME_MAX_LENGTH = 40

function metadataText(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeDisplayName(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function validateDisplayName(value: string) {
  const normalized = normalizeDisplayName(value)
  return {
    value: normalized,
    valid:
      normalized.length >= 1 && normalized.length <= DISPLAY_NAME_MAX_LENGTH,
    maxLength: DISPLAY_NAME_MAX_LENGTH,
  }
}

export function getAccountDisplayName(user: User | null) {
  if (!user) return ""
  return (
    metadataText(user, "display_name") ||
    metadataText(user, "full_name") ||
    metadataText(user, "name") ||
    user.email?.split("@")[0]?.trim() ||
    "Design user"
  )
}

export function getAccountInitial(displayName: string) {
  return Array.from(displayName.trim())[0]?.toUpperCase() || "D"
}

export function getAccountLoginProvider(user: User) {
  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : user.identities?.[0]?.provider
  return provider === "google" ? "google" : "email"
}
