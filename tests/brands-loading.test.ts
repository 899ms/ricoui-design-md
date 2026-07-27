import { afterEach, describe, expect, it, vi } from "vitest"

const registryEntry = {
  id: "example",
  folder: "example",
  name: "Example",
  website: "https://example.com/",
  description: "Example brand",
  tags: ["Light UI"],
  category: "Examples",
  previewColors: ["#123456"],
  files: ["DESIGN.md", "tokens.json", "variables.css", "theme.css"],
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe("brand source loading", () => {
  it("loads only registry metadata for the brand listing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([registryEntry]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    const { fetchBrands } = await import("@/lib/brands")
    const brands = await fetchBrands()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/brands/registry.json")
    expect(brands).toHaveLength(1)
    expect(brands[0].mdContent).toBe("")
    expect(brands[0].metadataChips.accent).toBe("#123456")
  })

  it("loads and caches one DESIGN.md only when requested", async () => {
    const markdown = "# Example\n\n**Theme:** light"
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([registryEntry]), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(markdown, { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { fetchBrandMarkdown, fetchBrands } = await import("@/lib/brands")
    const [brand] = await fetchBrands()

    await expect(fetchBrandMarkdown(brand)).resolves.toBe(markdown)
    await expect(fetchBrandMarkdown(brand)).resolves.toBe(markdown)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith("/brands/example/DESIGN.md")
  })
})
