import { describe, expect, it } from "vitest"
import {
  getGuideHashSectionId,
  GUIDE_DEFAULT_SECTION_ID,
} from "@/app/guide/components/guide-page"

describe("guide hydration state", () => {
  it("uses one deterministic active section for the server and first client render", () => {
    expect(GUIDE_DEFAULT_SECTION_ID).toBe("overview")
  })

  it("resolves a valid hash only after the page has hydrated", () => {
    expect(getGuideHashSectionId("#privacy")).toBe("privacy")
    expect(getGuideHashSectionId("faq")).toBe("faq")
    expect(getGuideHashSectionId("#not-a-section")).toBeNull()
  })
})
