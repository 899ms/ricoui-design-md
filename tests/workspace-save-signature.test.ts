import { describe, expect, it } from "vitest"
import {
  buildWorkspaceContentSignature,
  buildWorkspaceSignature,
  canReuseCloudWorkspaceEnvelope,
  migrateWorkspaceSnapshot,
  type PersistedCloudWorkspaceEnvelopeV1,
  type PersistedWorkspaceSnapshot,
} from "@/lib/storage/workspace-persistence"

const snapshot: PersistedWorkspaceSnapshot = {
  version: 4,
  workspaceName: "Workspace",
  activeDomain: "workspace",
  activeDocumentId: "doc_1",
  activeView: "structured",
  documents: [
    {
      id: "doc_1",
      name: "Example",
      createdAt: 1,
      updatedAt: 2,
      lastOpenedAt: 3,
      rawMarkdown: "# Example",
      initialRawMarkdown: "# Example",
      origin: { kind: "blank" },
    },
  ],
  libraryEntries: [],
  brandFavorites: [],
}

describe("workspace save feedback signatures", () => {
  it("persists navigation changes without treating them as content saves", () => {
    const navigationChange: PersistedWorkspaceSnapshot = {
      ...snapshot,
      activeDocumentId: null,
      activeView: "preview",
      brandFavorites: ["brand_1"],
      documents: [
        {
          ...snapshot.documents[0],
          updatedAt: 100,
          lastOpenedAt: 101,
        },
      ],
    }

    expect(buildWorkspaceSignature(navigationChange)).not.toBe(
      buildWorkspaceSignature(snapshot)
    )
    expect(buildWorkspaceContentSignature(navigationChange)).toBe(
      buildWorkspaceContentSignature(snapshot)
    )
  })

  it("detects authored document and Library changes", () => {
    const documentChange: PersistedWorkspaceSnapshot = {
      ...snapshot,
      documents: [
        { ...snapshot.documents[0], rawMarkdown: "# Example\n\nChanged" },
      ],
    }
    const libraryChange: PersistedWorkspaceSnapshot = {
      ...snapshot,
      libraryEntries: [
        {
          id: "lib_1",
          name: "Library entry",
          description: "Description",
          tags: [],
          previewColors: [],
          metadataChips: {},
          mdContent: "# Library entry",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    }

    expect(buildWorkspaceContentSignature(documentChange)).not.toBe(
      buildWorkspaceContentSignature(snapshot)
    )
    expect(buildWorkspaceContentSignature(libraryChange)).not.toBe(
      buildWorkspaceContentSignature(snapshot)
    )
  })

  it("unwraps a versioned cloud envelope without changing its snapshot", () => {
    const envelope: PersistedCloudWorkspaceEnvelopeV1 = {
      kind: "cloud-workspace-envelope",
      envelopeVersion: 1,
      ownerId: "owner_1",
      workspaceId: "workspace_1",
      workspaceVersion: 12,
      snapshot,
      documentVersions: { doc_1: 3 },
      libraryVersions: {},
      preferencesVersion: 2,
      lastSyncedAt: 100,
    }

    expect(migrateWorkspaceSnapshot(envelope, new Set())).toEqual(snapshot)
    expect(
      canReuseCloudWorkspaceEnvelope(envelope, {
        id: "workspace_1",
        version: 12,
      })
    ).toBe(true)
    expect(
      canReuseCloudWorkspaceEnvelope(envelope, {
        id: "workspace_1",
        version: 13,
      })
    ).toBe(false)
  })
})
