"use client"

import { useEffect, useRef } from "react"
import { useDesignStore } from "@/lib/store/design-store"
import { buildDocumentCssVars } from "@/lib/preview/build-css-vars"

/**
 * Hook that injects CSS custom properties from the active parsed document onto a target element.
 * When parsing is degraded, it keeps using the last valid parsed document model.
 */
export function useCssVariables<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const documentModel = useDesignStore(
    (state) => state.parsedDocument ?? state.lastValidParsedDocument
  )

  useEffect(() => {
    if (!ref.current || !documentModel) return

    const vars = buildDocumentCssVars(documentModel)
    const element = ref.current

    for (const [key, value] of Object.entries(vars)) {
      element.style.setProperty(key, value)
    }

    return () => {
      for (const key of Object.keys(vars)) {
        element.style.removeProperty(key)
      }
    }
  }, [documentModel])

  return ref
}
