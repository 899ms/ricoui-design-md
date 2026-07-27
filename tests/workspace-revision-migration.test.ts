import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("V15 workspace revision migration", () => {
  const sql = readFileSync(
    "supabase/migrations/0003_v15_workspace_revision.sql",
    "utf8"
  )

  it("reuses the parent workspace version for all synchronized child tables", () => {
    expect(sql).toContain("update public.workspaces")
    expect(sql).toContain("documents_bump_workspace_version")
    expect(sql).toContain("library_bump_workspace_version")
    expect(sql).toContain("preferences_bump_workspace_version")
    expect(sql).toContain("tombstones_bump_workspace_version")
    expect(sql).toContain("workspace_revision_ready")
    expect(sql).toContain(
      "grant execute on function public.workspace_revision_ready() to authenticated"
    )
  })

  it("tracks insert, update, and delete changes", () => {
    expect(sql.match(/after insert or update or delete/g)).toHaveLength(4)
  })
})
