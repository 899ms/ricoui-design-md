"use client"

import type { CSSProperties } from "react"
import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { useGoogleFonts } from "@/hooks/use-google-fonts"
import { buildDocumentCssVars } from "@/lib/preview/build-css-vars"
import {
  ThemePreviewDocument,
  buildHeroCopy,
  normalizePreviewSemantics,
} from "@/components/theme-gallery-page/theme-preview-renderer"

export function PreviewPanel() {
  const parsedDocument = useDesignStore((state) => state.parsedDocument)
  const lastValidParsedDocument = useDesignStore(
    (state) => state.lastValidParsedDocument
  )
  const parseStatus = useDesignStore((state) => state.parseStatus)
  const parseError = useDesignStore((state) => state.parseError)
  const documentDiagnostics = useDesignStore(
    (state) => state.documentDiagnostics
  )
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)

  useGoogleFonts()

  const documentModel = parsedDocument ?? lastValidParsedDocument

  const normalizedSemantics = useMemo(
    () =>
      documentModel
        ? normalizePreviewSemantics(documentModel.previewSemantics)
        : null,
    [documentModel]
  )

  const cssVars = useMemo<CSSProperties | null>(() => {
    if (!documentModel || !normalizedSemantics) return null
    const base = buildDocumentCssVars({
      tokens: documentModel.tokens,
      previewSemantics: normalizedSemantics,
    })
    return base as CSSProperties
  }, [documentModel, normalizedSemantics])

  const hero = useMemo(() => {
    if (!documentModel) return null
    return buildHeroCopy({
      name: documentModel.tokens.meta.name,
      description: documentModel.tokens.meta.description,
      mdContent: rawMarkdown,
    })
  }, [documentModel, rawMarkdown])

  if (!documentModel || !normalizedSemantics || !cssVars || !hero) return null

  const showDiagnostic = parseStatus === "degraded" || parseStatus === "invalid"

  return (
    <div className="editor-canvas flex-1 overflow-y-auto px-5 py-8 lg:px-6 lg:py-9">
      <div className="mx-auto max-w-240">
        {showDiagnostic && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                {documentDiagnostics.map((diagnostic) => (
                  <p key={`${diagnostic.kind}-${diagnostic.message}`}>
                    {diagnostic.message}
                  </p>
                ))}
                {parseError && documentDiagnostics.length === 0 && (
                  <p>{parseError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <ThemePreviewDocument
          tokens={documentModel.tokens}
          rawSections={documentModel.rawSections}
          parsedName={documentModel.tokens.meta.name}
          previewSemantics={normalizedSemantics}
          cssVars={cssVars}
          hero={hero}
        />
      </div>
    </div>
  )
}
