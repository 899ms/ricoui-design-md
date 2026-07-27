import { describe, expect, it } from "vitest"
import {
  getLocalImportUnavailableReason,
  localImportDecisionKey,
  parseWorkspaceBootstrapHint,
  shouldHideWorkspace,
  shouldPromptForLocalImport,
  type LocalImportCatalog,
} from "@/lib/sync/workspace-transition"

const localCatalog: LocalImportCatalog = {
  documents: [{ id: "doc_a", name: "A", bytes: 100 }],
  libraryEntries: [{ id: "lib_b", name: "B", bytes: 200 }],
}

describe("local and cloud workspace transitions", () => {
  it("hides local content as soon as a signed-in owner is not active", () => {
    expect(
      shouldHideWorkspace({
        authReady: true,
        hasBootstrapHint: true,
        userId: "owner_1",
        activeCloudOwnerId: null,
        phase: "local",
      })
    ).toBe(true)
    expect(
      shouldHideWorkspace({
        authReady: true,
        hasBootstrapHint: true,
        userId: "owner_1",
        activeCloudOwnerId: "owner_1",
        phase: "cloud",
      })
    ).toBe(false)
  })

  it("keeps the workspace hidden during entry, errors, and sign-out", () => {
    for (const phase of [
      "entering-cloud",
      "cloud-error",
      "leaving-cloud",
    ] as const) {
      expect(
        shouldHideWorkspace({
          authReady: true,
          hasBootstrapHint: true,
          userId: "owner_1",
          activeCloudOwnerId: null,
          phase,
        })
      ).toBe(true)
    }
  })

  it("shows local content only after the cloud owner is cleared", () => {
    expect(
      shouldHideWorkspace({
        authReady: true,
        hasBootstrapHint: true,
        userId: null,
        activeCloudOwnerId: "owner_1",
        phase: "leaving-cloud",
      })
    ).toBe(true)
    expect(
      shouldHideWorkspace({
        authReady: true,
        hasBootstrapHint: true,
        userId: null,
        activeCloudOwnerId: null,
        phase: "local",
      })
    ).toBe(false)
  })

  it("prompts once per account and device only when local sources exist", () => {
    expect(shouldPromptForLocalImport(localCatalog, null)).toBe(true)
    expect(shouldPromptForLocalImport(localCatalog, "decided")).toBe(false)
    expect(
      shouldPromptForLocalImport({ documents: [], libraryEntries: [] }, null)
    ).toBe(false)
    expect(localImportDecisionKey("owner_1")).toContain("owner_1")
    expect(localImportDecisionKey("owner_1")).not.toBe(
      localImportDecisionKey("owner_2")
    )
  })

  it("uses a valid bootstrap hint while authentication is resolving", () => {
    expect(
      shouldHideWorkspace({
        authReady: false,
        hasBootstrapHint: false,
        userId: null,
        activeCloudOwnerId: null,
        phase: "local",
      })
    ).toBe(true)
    expect(
      shouldHideWorkspace({
        authReady: false,
        hasBootstrapHint: true,
        userId: null,
        activeCloudOwnerId: null,
        phase: "local",
      })
    ).toBe(false)
  })

  it("parses only versioned local and owner-scoped cloud hints", () => {
    expect(
      parseWorkspaceBootstrapHint('{"version":1,"scope":"local"}')
    ).toEqual({ version: 1, scope: "local" })
    expect(
      parseWorkspaceBootstrapHint(
        '{"version":1,"scope":"cloud","ownerId":"owner_1"}'
      )
    ).toEqual({ version: 1, scope: "cloud", ownerId: "owner_1" })
    expect(parseWorkspaceBootstrapHint("not-json")).toBeNull()
    expect(
      parseWorkspaceBootstrapHint('{"version":1,"scope":"cloud"}')
    ).toBeNull()
  })

  it("prevents selecting sources that exceed cloud limits", () => {
    const input = {
      itemBytes: 100,
      currentCount: 0,
      selectedCount: 0,
      countLimit: 2,
      currentBytes: 0,
      selectedBytes: 0,
      accountByteLimit: 1000,
      sourceByteLimit: 500,
      selected: false,
    }
    expect(getLocalImportUnavailableReason(input)).toBeNull()
    expect(getLocalImportUnavailableReason({ ...input, itemBytes: 501 })).toBe(
      "source-too-large"
    )
    expect(
      getLocalImportUnavailableReason({
        ...input,
        currentCount: 1,
        selectedCount: 1,
      })
    ).toBe("count-limit")
    expect(
      getLocalImportUnavailableReason({
        ...input,
        currentBytes: 850,
        selectedBytes: 100,
      })
    ).toBe("storage-limit")
  })
})
