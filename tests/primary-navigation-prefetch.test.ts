import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("primary navigation prefetch", () => {
  it("prefetches the three fixed workspace destinations on desktop and mobile", () => {
    for (const relativePath of [
      "components/app-rail.tsx",
      "components/mobile-nav.tsx",
    ]) {
      const source = readFileSync(path.join(root, relativePath), "utf8")

      for (const href of ["/editor", "/library", "/brands"]) {
        expect(source).toMatch(
          new RegExp(`href: ["']${href}["'][\\s\\S]*?prefetch: true`)
        )
      }

      expect(source).toMatch(/href: ["']\/["'][\s\S]*?prefetch: false/)
      expect(source).toContain("prefetch={item.prefetch}")
    }
  })
})
