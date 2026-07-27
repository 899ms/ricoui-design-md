import { describe, expect, it, vi } from "vitest"

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34" }]),
}))

function htmlResponse(body: string, contentType = "text/html; charset=utf-8") {
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType },
  })
}

async function postFetchUrl(url = "https://example.com") {
  const { POST } = await import("@/app/api/fetch-url/route")
  return POST(
    new Request("http://localhost/api/fetch-url", {
      method: "POST",
      body: JSON.stringify({ url }),
    })
  )
}

describe("fetch-url extraction limits", () => {
  it("accepts a script-heavy page whose raw HTML exceeds the old 512 KB limit", async () => {
    const scriptJunk = "self.__next_f.push();".repeat(60_000) // ~1.2 MB inline payload
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        htmlResponse(
          `<html><head><script>${scriptJunk}</script></head><body><h1>Vercel</h1><p>Develop. Preview. Ship.</p></body></html>`
        )
      )
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as { content: string }
    expect(json.content).toContain("Develop. Preview. Ship.")
    expect(json.content).not.toContain("__next_f")
  })

  it("truncates at the download cap without leaking an unclosed script block", async () => {
    const body = `<html><body><p>Design tokens everywhere</p><script>${"a".repeat(5 * 1024 * 1024)}`
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => htmlResponse(body))
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as {
      content: string
      truncated: boolean
    }
    expect(json.truncated).toBe(true)
    expect(json.content).toContain("Design tokens everywhere")
    expect(json.content).not.toContain("aaaa")
  })

  it("caps extracted text at 60k characters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        htmlResponse(
          `<html><body><p>${"word ".repeat(20_000)}</p></body></html>`
        )
      )
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as {
      content: string
      truncated: boolean
    }
    expect(json.content.length).toBe(60_000)
    expect(json.truncated).toBe(true)
  })

  it("rejects non-HTML content types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => htmlResponse("%PDF-1.4", "application/pdf"))
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(415)
  })

  it("rejects pages with no extractable text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        htmlResponse(
          "<html><head><script>var a = 1;</script></head><body></body></html>"
        )
      )
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(422)
  })
})

function cssResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/css" },
  })
}

function markdownResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" },
  })
}

// Route by URL so the page request and its linked stylesheet get different
// bodies from the same stubbed fetch.
function routeFetch(pageHtml: string, css: Record<string, string>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      const cssKey = Object.keys(css).find((key) => url.endsWith(key))
      if (cssKey) return cssResponse(css[cssKey])
      return htmlResponse(pageHtml)
    })
  )
}

describe("fetch-url CSS evidence", () => {
  it("distills inline style custom properties and theme-color", async () => {
    routeFetch(
      `<html><head>
        <meta name="theme-color" content="#0a0a0a">
        <style>:root{--color-green:#58CC02;--radius-lg:16px}</style>
      </head><body><p>Learn a language</p></body></html>`,
      {}
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as { cssEvidence: string }
    expect(json.cssEvidence).toContain("--color-green")
    expect(json.cssEvidence).toContain("#58CC02")
    expect(json.cssEvidence).toContain("--radius-lg")
    expect(json.cssEvidence).toContain("theme-color")
  })

  it("fetches linked stylesheets and extracts font + color signal", async () => {
    routeFetch(
      `<html><head>
        <link rel="stylesheet" href="/theme.css">
      </head><body><p>Ship faster</p></body></html>`,
      {
        "/theme.css":
          ":root{--geist-foreground:#000}body{font-family:Geist,sans-serif}",
      }
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as { cssEvidence: string }
    expect(json.cssEvidence).toContain("--geist-foreground")
    expect(json.cssEvidence).toContain("Geist")
  })

  it("succeeds on a text-less SPA shell when CSS evidence exists", async () => {
    routeFetch(
      `<html><head><link rel="stylesheet" href="/app.css"></head><body></body></html>`,
      { "/app.css": ":root{--brand-primary:#635bff}" }
    )
    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as {
      content: string
      cssEvidence: string
    }
    expect(json.content).toBe("")
    expect(json.cssEvidence).toContain("--brand-primary")
  })

  it("omits oversized declarations instead of exposing truncated CSS values", async () => {
    const oversizedShadow = Array.from(
      { length: 120 },
      (_, index) => `${index}px ${index}px 2px rgba(0,0,0,.1)`
    ).join(",")
    routeFetch(
      `<html><head><style>:root{--shadow-unsafe:${oversizedShadow};--color-safe:#111111}</style></head><body>Safe evidence</body></html>`,
      {}
    )

    const response = await postFetchUrl()
    const json = (await response.json()) as { cssEvidence: string }

    expect(json.cssEvidence).not.toContain("--shadow-unsafe")
    expect(json.cssEvidence).toContain("--color-safe")
    expect(json.cssEvidence).toContain("#111111")
  })

  it("filters framework internals before preserving brand signal", async () => {
    const frameworkNoise = Array.from(
      { length: 700 },
      (_, index) => `--tw-internal-${index}:${index}`
    ).join(";")
    const motionNoise = Array.from(
      { length: 240 },
      (_, index) => `--motion-duration-${index}:${index}ms`
    ).join(";")
    routeFetch(
      `<html><head><style>:root{${frameworkNoise};${motionNoise};--brand-accent:#635bff;--font-brand:Geist}</style></head><body>Brand signal</body></html>`,
      {}
    )

    const response = await postFetchUrl()
    const json = (await response.json()) as { cssEvidence: string }

    expect(json.cssEvidence).toContain("--brand-accent: #635bff")
    expect(json.cssEvidence).toContain("--font-brand: Geist")
    expect(json.cssEvidence).not.toContain("--tw-internal")
    expect(json.cssEvidence).toContain("# Custom properties")
  })
})

describe("fetch-url source discovery", () => {
  const publishedDesignMd = `---
name: Example
description: Example design system
colors:
  primary: "#111111"
typography:
  body:
    fontFamily: Inter
---

# Example Design System`

  it("accepts a directly entered DESIGN.md URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => markdownResponse(publishedDesignMd)))

    const response = await postFetchUrl("https://example.com/design.md")
    expect(response.status).toBe(200)
    const json = (await response.json()) as {
      publishedDesignMd: string
      source: { kind: string; sourceUrl: string }
    }

    expect(json.publishedDesignMd).toContain("name: Example")
    expect(json.source).toEqual(
      expect.objectContaining({
        kind: "direct-design-md",
        sourceUrl: "https://example.com/design.md",
      })
    )
  })

  it("discovers same-origin design.md and returns structured page metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const target =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        if (target.endsWith("/design.md")) {
          return markdownResponse(publishedDesignMd)
        }
        return htmlResponse(`<html lang="en"><head>
          <title>Example &amp; Co.</title>
          <meta name="description" content="A compact product platform">
          <meta name="theme-color" content="#fafafa">
          <meta property="og:image" content="/social.png">
          <style>:root{--brand-ink:#111111}</style>
        </head><body><h1>Build products</h1></body></html>`)
      })
    )

    const response = await postFetchUrl()
    expect(response.status).toBe(200)
    const json = (await response.json()) as {
      publishedDesignMd: string
      source: Record<string, string>
    }

    expect(json.publishedDesignMd).toContain("Example design system")
    expect(json.source).toEqual(
      expect.objectContaining({
        kind: "published-design-md",
        sourceUrl: "https://example.com/design.md",
        title: "Example & Co.",
        description: "A compact product platform",
        language: "en",
        themeColor: "#fafafa",
        visualUrl: "https://example.com/social.png",
      })
    )
  })
})
