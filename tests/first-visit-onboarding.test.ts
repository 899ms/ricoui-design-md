import { describe, expect, it } from "vitest"
import {
  FIRST_VISIT_ONBOARDING_STORAGE_KEY,
  hasCompletedFirstVisitWelcome,
  isFirstVisitWelcomeForced,
  markFirstVisitExperienceCompleted,
  markFirstVisitWelcomeCompleted,
  shouldShowFirstVisitWelcome,
} from "@/lib/onboarding/first-visit"
import { LANGUAGE_PROMPT_STORAGE_KEY } from "@/lib/i18n/config"

function eligibleInput() {
  return {
    pathname: "/",
    accountReady: true,
    workspaceReady: true,
    signedIn: false,
    documentCount: 0,
    libraryCount: 0,
    completed: false,
  }
}

describe("first-visit onboarding policy", () => {
  it("shows only for an anonymous first visit to an empty Home workspace", () => {
    expect(shouldShowFirstVisitWelcome(eligibleInput())).toBe(true)

    for (const patch of [
      { pathname: "/editor" },
      { accountReady: false },
      { workspaceReady: false },
      { signedIn: true },
      { documentCount: 1 },
      { libraryCount: 1 },
      { completed: true },
    ]) {
      expect(
        shouldShowFirstVisitWelcome({ ...eligibleInput(), ...patch })
      ).toBe(false)
    }
  })

  it("recognizes only the explicit welcome=1 testing override", () => {
    expect(isFirstVisitWelcomeForced("1")).toBe(true)
    expect(isFirstVisitWelcomeForced(null)).toBe(false)
    expect(isFirstVisitWelcomeForced("true")).toBe(false)
    expect(isFirstVisitWelcomeForced("0")).toBe(false)
  })

  it("persists completion under the versioned local key", () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    expect(hasCompletedFirstVisitWelcome(storage)).toBe(false)
    markFirstVisitWelcomeCompleted(storage)

    expect(values.get(FIRST_VISIT_ONBOARDING_STORAGE_KEY)).toBe("completed")
    expect(hasCompletedFirstVisitWelcome(storage)).toBe(true)
  })

  it("handles the language suggestion when the welcome guide completes", () => {
    const values = new Map<string, string>()
    const storage = {
      setItem: (key: string, value: string) => values.set(key, value),
    }

    markFirstVisitExperienceCompleted(storage)

    expect(values.get(FIRST_VISIT_ONBOARDING_STORAGE_KEY)).toBe("completed")
    expect(values.get(LANGUAGE_PROMPT_STORAGE_KEY)).toBe("handled")
  })

  it("degrades safely when browser storage is unavailable", () => {
    expect(hasCompletedFirstVisitWelcome(null)).toBe(false)
    expect(() => markFirstVisitWelcomeCompleted(null)).not.toThrow()
    expect(() =>
      markFirstVisitWelcomeCompleted({
        setItem: () => {
          throw new Error("Storage blocked")
        },
      })
    ).not.toThrow()
  })
})
