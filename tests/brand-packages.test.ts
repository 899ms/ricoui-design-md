import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { parseDesignMd } from "@/lib/parser/parse-design-md"

interface RegistryEntry {
  id: string
  folder: string
  files: string[]
}

const root = path.resolve(import.meta.dirname, "..")
const registry = JSON.parse(
  readFileSync(path.join(root, "public", "brands", "registry.json"), "utf8")
) as RegistryEntry[]

describe("brand DESIGN.md packages", () => {
  for (const brand of registry) {
    it(`${brand.id} is readable by the site parser`, () => {
      const markdown = readFileSync(
        path.join(root, "public", "brands", brand.folder, "DESIGN.md"),
        "utf8"
      )
      const result = parseDesignMd(markdown)

      expect(result.tokens.meta.name).not.toBe("")
      expect(result.tokens.colors.length).toBeGreaterThan(0)
      expect(result.tokens.typography.typeScale.length).toBeGreaterThan(0)
      expect(result.tokens.spacing.length).toBeGreaterThan(0)
      expect(result.tokens.radius.length).toBeGreaterThan(0)
      expect(result.tokens.components.length).toBeGreaterThan(0)
      expect(result.rawSections.dosDonts.dos.length).toBeGreaterThan(0)
      expect(result.rawSections.dosDonts.donts.length).toBeGreaterThan(0)
    })
  }
})
