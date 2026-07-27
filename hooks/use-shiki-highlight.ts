"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { HighlighterGeneric, BundledLanguage, BundledTheme } from "shiki"

export type ShikiLanguage = "markdown" | "json" | "css"

interface HighlightResult {
  html: string | null
  code: string
  lang: ShikiLanguage
  theme: BundledTheme
}

let highlighterPromise: Promise<
  HighlighterGeneric<BundledLanguage, BundledTheme>
> | null = null

function loadHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: ["markdown", "json", "css"],
      })
    )
  }
  return highlighterPromise
}

export function useShikiHighlightResult(code: string, lang: ShikiLanguage) {
  const [result, setResult] = useState<HighlightResult | null>(null)
  const { theme } = useTheme()
  const shikiTheme: BundledTheme =
    theme === "codex-dark" ? "github-dark" : "github-light"

  useEffect(() => {
    let cancelled = false
    void loadHighlighter().then((highlighter) => {
      if (cancelled) return
      try {
        const output = highlighter.codeToHtml(code, {
          lang,
          theme: shikiTheme,
        })
        setResult({ html: output, code, lang, theme: shikiTheme })
      } catch {
        setResult({ html: null, code, lang, theme: shikiTheme })
      }
    })
    return () => {
      cancelled = true
    }
  }, [code, lang, shikiTheme])

  const current =
    result?.code === code && result.lang === lang && result.theme === shikiTheme

  return {
    html: current ? result.html : null,
    ready: current && result.html !== null,
  }
}

export function useShikiHighlight(code: string, lang: ShikiLanguage) {
  return useShikiHighlightResult(code, lang).html
}
