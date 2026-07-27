import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  CLOUD_ACCOUNT_MARKDOWN_BYTES,
  CLOUD_DOCUMENT_LIMIT,
  CLOUD_LIBRARY_LIMIT,
  CLOUD_SOURCE_MARKDOWN_BYTES,
  getUtf8ByteLength,
} from "@/lib/sync/cloud-limits"

describe("V15 cloud limits", () => {
  it("uses the accepted 75 / 50 / 1MiB boundary", () => {
    expect(CLOUD_DOCUMENT_LIMIT).toBe(75)
    expect(CLOUD_LIBRARY_LIMIT).toBe(50)
    expect(CLOUD_SOURCE_MARKDOWN_BYTES).toBe(256000)
    expect(CLOUD_ACCOUNT_MARKDOWN_BYTES).toBe(1048576)
    expect(getUtf8ByteLength("设计")).toBe(6)
  })

  it("keeps the deployed SQL migration aligned with the product limits", () => {
    const sql = readFileSync(
      "supabase/migrations/0002_v15_workspace_separation_limits.sql",
      "utf8"
    )
    expect(sql).toContain("if v_docs > 75")
    expect(sql).toContain("if v_library > 50")
    expect(sql).toContain("if v_bytes > 1048576")
  })
})
