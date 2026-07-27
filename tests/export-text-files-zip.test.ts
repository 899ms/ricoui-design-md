import { strFromU8, unzipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { exportTextFilesToZip } from "@/lib/export/export-zip"

describe("text file ZIP export", () => {
  it("preserves brand package filenames and content", async () => {
    const blob = exportTextFilesToZip({
      "DESIGN.md": "# Notion",
      "preview.html": "<!doctype html><title>Notion</title>",
    })
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()))

    expect(strFromU8(files["DESIGN.md"])).toBe("# Notion")
    expect(strFromU8(files["preview.html"])).toContain("<title>Notion</title>")
  })

  it("creates byte-identical ZIP output across separate runs", async () => {
    const first = exportTextFilesToZip({ "DESIGN.md": "# Stable\r\n" })
    await new Promise((resolve) => setTimeout(resolve, 10))
    const second = exportTextFilesToZip({ "DESIGN.md": "# Stable\r\n" })
    expect(new Uint8Array(await first.arrayBuffer())).toEqual(
      new Uint8Array(await second.arrayBuffer())
    )
  })
})
