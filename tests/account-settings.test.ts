import { describe, expect, it } from "vitest"
import type { User } from "@supabase/supabase-js"
import {
  getAccountDisplayName,
  getAccountInitial,
  normalizeDisplayName,
  validateDisplayName,
} from "@/lib/account-profile"
import { buildAccountSourceBackupFiles } from "@/lib/export/account-source-backup"

function user(overrides: Partial<User> = {}) {
  return {
    id: "owner-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as User
}

describe("account settings", () => {
  it("resolves private display names with stable fallbacks", () => {
    expect(
      getAccountDisplayName(
        user({
          email: "rico@example.com",
          user_metadata: { display_name: "Rico", full_name: "Fallback" },
        })
      )
    ).toBe("Rico")
    expect(
      getAccountDisplayName(
        user({ email: "rico@example.com", user_metadata: {} })
      )
    ).toBe("rico")
    expect(getAccountInitial("设计师")).toBe("设")
  })

  it("normalizes and limits display names", () => {
    expect(normalizeDisplayName("  Rico\n  Design  ")).toBe("Rico Design")
    expect(validateDisplayName("").valid).toBe(false)
    expect(validateDisplayName("A".repeat(40)).valid).toBe(true)
    expect(validateDisplayName("A".repeat(41)).valid).toBe(false)
  })

  it("backs up original draft and library Markdown without AI settings", () => {
    const files = buildAccountSourceBackupFiles(
      [
        {
          id: "draft-1",
          name: "Unstructured draft",
          rawMarkdown: "plain non-standard markdown",
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      [
        {
          id: "library-1",
          name: "Saved source",
          mdContent: "# Saved source",
          createdAt: 3,
          updatedAt: 4,
        },
      ],
      "2026-07-27T00:00:00.000Z"
    )

    expect(files["drafts/unstructured-draft/DESIGN.md"]).toBe(
      "plain non-standard markdown"
    )
    expect(files["library/saved-source/DESIGN.md"]).toBe("# Saved source")
    expect(Object.values(files).join("\n")).not.toContain("apiKey")
    expect(files["manifest.json"]).toContain("2026-07-27T00:00:00.000Z")
  })
})
