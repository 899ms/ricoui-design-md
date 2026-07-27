import { LANGUAGE_PROMPT_STORAGE_KEY } from "@/lib/i18n/config"

export const FIRST_VISIT_ONBOARDING_STORAGE_KEY = "design-md-onboarding-v1"

const COMPLETED_VALUE = "completed"

interface StorageReader {
  getItem: (key: string) => string | null
}

interface StorageWriter {
  setItem: (key: string, value: string) => void
}

export interface FirstVisitEligibilityInput {
  pathname: string
  accountReady: boolean
  workspaceReady: boolean
  signedIn: boolean
  documentCount: number
  libraryCount: number
  completed: boolean
}

export function isFirstVisitWelcomeForced(value: string | null) {
  return value === "1"
}

export function shouldShowFirstVisitWelcome(input: FirstVisitEligibilityInput) {
  return (
    input.pathname === "/" &&
    input.accountReady &&
    input.workspaceReady &&
    !input.signedIn &&
    input.documentCount === 0 &&
    input.libraryCount === 0 &&
    !input.completed
  )
}

function getBrowserStorage() {
  if (typeof window === "undefined") return null
  return window.localStorage
}

export function hasCompletedFirstVisitWelcome(
  storage: StorageReader | null = getBrowserStorage()
) {
  if (!storage) return false
  try {
    return (
      storage.getItem(FIRST_VISIT_ONBOARDING_STORAGE_KEY) === COMPLETED_VALUE
    )
  } catch {
    return false
  }
}

export function markFirstVisitWelcomeCompleted(
  storage: StorageWriter | null = getBrowserStorage()
) {
  if (!storage) return
  try {
    storage.setItem(FIRST_VISIT_ONBOARDING_STORAGE_KEY, COMPLETED_VALUE)
  } catch {
    // A blocked storage area should never prevent the user from continuing.
  }
}

export function markFirstVisitExperienceCompleted(
  storage: StorageWriter | null = getBrowserStorage()
) {
  if (!storage) return
  markFirstVisitWelcomeCompleted(storage)
  try {
    storage.setItem(LANGUAGE_PROMPT_STORAGE_KEY, "handled")
  } catch {
    // The welcome marker is still enough to avoid blocking normal use.
  }
}
