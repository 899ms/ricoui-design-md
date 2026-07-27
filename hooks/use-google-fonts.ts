"use client"

import { useEffect } from "react"
import { useDesignStore } from "@/lib/store/design-store"

const SYSTEM_FONTS = [
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "arial",
  "helvetica",
  "georgia",
  "times new roman",
]

export function useGoogleFonts() {
  const typography = useDesignStore((s) => s.tokens?.typography)

  useEffect(() => {
    if (!typography || typography.fontFamilies.length === 0) return

    const existingLinks = document.querySelectorAll(
      'link[data-design-md-font="true"]'
    )
    existingLinks.forEach((link) => link.remove())

    const links: HTMLLinkElement[] = []

    for (const font of typography.fontFamilies) {
      // font.name / font.substitute usually hold a full CSS stack
      // ("Inter, system-ui, sans-serif") — request only the first family,
      // otherwise the substring check skips everything or the whole stack
      // gets encoded into one invalid family= param (PROJECT-REVIEW B8).
      const stack = font.substitute || font.name
      const primary =
        stack
          .split(",")[0]
          ?.trim()
          .replace(/^["']|["']$/g, "") ?? ""

      if (!primary) continue
      if (SYSTEM_FONTS.includes(primary.toLowerCase())) continue

      const weights =
        font.weights.length > 0 ? font.weights.join(";") : "400;700"
      const encoded = encodeURIComponent(primary)
      const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights}&display=swap`

      if (document.querySelector(`link[href="${href}"]`)) continue

      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = href
      link.dataset.designMdFont = "true"
      document.head.appendChild(link)
      links.push(link)
    }

    return () => {
      links.forEach((link) => link.remove())
    }
  }, [typography])
}
