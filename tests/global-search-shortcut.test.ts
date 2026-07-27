import { describe, expect, it, vi } from "vitest"

vi.stubGlobal("HTMLInputElement", class HTMLInputElement {})
vi.stubGlobal("HTMLTextAreaElement", class HTMLTextAreaElement {})
vi.stubGlobal("HTMLSelectElement", class HTMLSelectElement {})
vi.stubGlobal(
  "HTMLElement",
  class HTMLElement {
    isContentEditable = false
  }
)

import { shouldOpenGlobalSearch } from "@/lib/search/global-search-shortcut"

function keyboardEvent(overrides: Partial<KeyboardEvent> = {}) {
  return {
    key: "k",
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    target: null,
    ...overrides,
  } as KeyboardEvent
}

describe("global search shortcut", () => {
  it("accepts Ctrl+K and Cmd+K", () => {
    expect(shouldOpenGlobalSearch(keyboardEvent())).toBe(true)
    expect(
      shouldOpenGlobalSearch(keyboardEvent({ ctrlKey: false, metaKey: true }))
    ).toBe(true)
  })

  it("rejects modified, unrelated, and composing events", () => {
    expect(shouldOpenGlobalSearch(keyboardEvent({ shiftKey: true }))).toBe(
      false
    )
    expect(shouldOpenGlobalSearch(keyboardEvent({ altKey: true }))).toBe(false)
    expect(shouldOpenGlobalSearch(keyboardEvent({ key: "p" }))).toBe(false)
    expect(shouldOpenGlobalSearch(keyboardEvent({ isComposing: true }))).toBe(
      false
    )
  })

  it("does not intercept text entry controls", () => {
    expect(
      shouldOpenGlobalSearch(keyboardEvent({ target: new HTMLInputElement() }))
    ).toBe(false)
    expect(
      shouldOpenGlobalSearch(
        keyboardEvent({ target: new HTMLTextAreaElement() })
      )
    ).toBe(false)
    const editable = new HTMLElement()
    Object.defineProperty(editable, "isContentEditable", { value: true })
    expect(shouldOpenGlobalSearch(keyboardEvent({ target: editable }))).toBe(
      false
    )
  })
})
