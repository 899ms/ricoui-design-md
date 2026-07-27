"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileJson,
  FileText,
  Pencil,
} from "lucide-react"
import { BrandMedia } from "@/components/theme-gallery-page/brand-media"
import { BrandLogo } from "@/components/theme-gallery-page/brand-logo"
import {
  ThemePreviewDocument,
  buildHeroCopy,
  useThemePreviewData,
} from "@/components/theme-gallery-page/theme-preview-renderer"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchBrandMarkdown } from "@/lib/brands"
import { exportToTailwindTheme } from "@/lib/export/export-css"
import { exportTextFilesToZip } from "@/lib/export/export-zip"
import { useDesignStore } from "@/lib/store/design-store"
import type { Brand } from "@/lib/types/tokens"
import { downloadBlob, downloadText as downloadTextFile } from "@/lib/download"
import {
  useShikiHighlight,
  type ShikiLanguage,
} from "@/hooks/use-shiki-highlight"
import { useWorkspaceReady } from "@/hooks/use-workspace-ready"

type MobileTab = "preview" | "files"
type FileTab = "md" | "tailwind" | "css" | "tokens"

interface PackagedSources {
  brandId: string | null
  markdown: string | null
  tokens: string | null
  variables: string | null
  themeCss: string | null
  previewHtml: string | null
}

interface BrandFileSource {
  id: FileTab
  label: string
  filename: string
  mime: string
  language: ShikiLanguage
  content: string
  icon: React.ReactNode
}

function downloadText(filename: string, content: string, mime: string) {
  downloadTextFile(content, filename, mime)
}

function brandToEntry(brand: Brand) {
  return {
    id: brand.id,
    origin: "brand" as const,
    name: brand.name,
    description: brand.description,
    tags: brand.tags,
    category: brand.category,
    previewColors: brand.previewColors,
    metadataChips: brand.metadataChips,
    mdContent: brand.mdContent,
    folder: brand.folder,
    files: brand.files,
    designMdUrl: brand.designMdUrl,
    previewUrl: brand.previewUrl,
    tokensUrl: brand.tokensUrl,
    variablesUrl: brand.variablesUrl,
    themeCssUrl: brand.themeCssUrl,
    imageUrl: brand.imageUrl,
    faviconUrl: brand.faviconUrl,
    videoUrl: brand.videoUrl,
    isComplete: brand.isComplete,
    missingFiles: brand.missingFiles,
  }
}

async function fetchText(url?: string) {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

export default function BrandDetailPage() {
  const t = useTranslations("Details")
  const brandT = useTranslations("Details.brand")
  const common = useTranslations("Common")
  const params = useParams<{ brandId: string }>()
  const router = useRouter()
  const { ready } = useWorkspaceReady()
  const brands = useDesignStore((state) => state.brands)
  const createDocument = useDesignStore((state) => state.createDocument)
  const saveBrandToLibrary = useDesignStore((state) => state.saveBrandToLibrary)

  const [mobileTab, setMobileTab] = useState<MobileTab>("preview")
  const [fileTab, setFileTab] = useState<FileTab>("md")
  const [copiedFile, setCopiedFile] = useState<FileTab | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [packagedSources, setPackagedSources] = useState<PackagedSources>({
    brandId: null,
    markdown: null,
    tokens: null,
    variables: null,
    themeCss: null,
    previewHtml: null,
  })

  const brand = useMemo(
    () => brands.find((entry) => entry.id === params.brandId) ?? null,
    [brands, params.brandId]
  )

  const brandIndex = useMemo(
    () => brands.findIndex((entry) => entry.id === params.brandId),
    [brands, params.brandId]
  )

  const previousBrand =
    brandIndex >= 0 && brands.length > 1
      ? brands[(brandIndex - 1 + brands.length) % brands.length]
      : null
  const nextBrand =
    brandIndex >= 0 && brands.length > 1
      ? brands[(brandIndex + 1) % brands.length]
      : null

  const currentPackagedSources =
    packagedSources.brandId === brand?.id ? packagedSources : null

  const entry = useMemo(() => {
    if (!brand) return null
    const mdContent = brand.mdContent || currentPackagedSources?.markdown
    return mdContent ? brandToEntry({ ...brand, mdContent }) : null
  }, [brand, currentPackagedSources])
  const {
    parsed,
    previewSemantics,
    cssVars,
    mdSource,
    jsonSource,
    cssSource,
    prefix,
  } = useThemePreviewData(entry, { loadFonts: true })

  useEffect(() => {
    if (!brand) return
    let cancelled = false
    void Promise.all([
      fetchBrandMarkdown(brand),
      fetchText(brand.tokensUrl),
      fetchText(brand.variablesUrl),
      fetchText(brand.themeCssUrl),
      fetchText(brand.previewUrl),
    ]).then(([markdown, tokens, variables, themeCss, previewHtml]) => {
      if (cancelled) return
      setPackagedSources({
        brandId: brand.id,
        markdown,
        tokens,
        variables,
        themeCss,
        previewHtml,
      })
    })
    return () => {
      cancelled = true
    }
  }, [brand])

  const fileSources = useMemo<BrandFileSource[]>(() => {
    const tailwindSource =
      currentPackagedSources?.themeCss ??
      (parsed ? exportToTailwindTheme(parsed.tokens) : "")

    const sources: BrandFileSource[] = [
      {
        id: "md",
        label: "DESIGN.md",
        filename: `${prefix}-DESIGN.md`,
        mime: "text/markdown",
        language: "markdown",
        content: mdSource,
        icon: <FileText className="h-3.5 w-3.5" />,
      },
      {
        id: "tailwind",
        label: "Tailwind v4",
        filename: currentPackagedSources?.themeCss
          ? `${prefix}-theme.css`
          : `${prefix}-tailwind-theme.css`,
        mime: "text/css",
        language: "css",
        content: tailwindSource,
        icon: <FileCode className="h-3.5 w-3.5" />,
      },
      {
        id: "css",
        label: "CSS Variables",
        filename: `${prefix}-variables.css`,
        mime: "text/css",
        language: "css",
        content: currentPackagedSources?.variables ?? cssSource,
        icon: <FileCode className="h-3.5 w-3.5" />,
      },
      {
        id: "tokens",
        label: "Design Tokens",
        filename: `${prefix}-tokens.json`,
        mime: "application/json",
        language: "json",
        content: currentPackagedSources?.tokens ?? jsonSource,
        icon: <FileJson className="h-3.5 w-3.5" />,
      },
    ]
    return sources
  }, [currentPackagedSources, cssSource, jsonSource, mdSource, parsed, prefix])

  const activeFile =
    fileSources.find((source) => source.id === fileTab) ?? fileSources[0]

  const packageFiles = useMemo<Record<string, string>>(() => {
    if (!brand || !currentPackagedSources) return {}
    const files: Record<string, string> = {
      "DESIGN.md": brand.mdContent,
      "tokens.json": currentPackagedSources.tokens ?? jsonSource,
      "variables.css": currentPackagedSources.variables ?? cssSource,
      "theme.css":
        currentPackagedSources.themeCss ??
        (parsed ? exportToTailwindTheme(parsed.tokens) : ""),
    }
    if (currentPackagedSources.previewHtml) {
      files["preview.html"] = currentPackagedSources.previewHtml
    }
    return files
  }, [brand, currentPackagedSources, cssSource, jsonSource, parsed])

  const goToBrand = useCallback(
    (brandId: string) => {
      router.push(`/brands/${encodeURIComponent(brandId)}`)
    },
    [router]
  )

  const handleUse = useCallback(async () => {
    if (!brand) return
    const id = await createDocument({ source: "brand", sourceId: brand.id })
    if (id) router.push("/editor")
  }, [brand, createDocument, router])

  const handleSaveToLibrary = useCallback(async () => {
    if (!brand) return
    const id = await saveBrandToLibrary(brand.id)
    if (id) setToast(brandT("saved", { name: brand.name }))
  }, [brand, saveBrandToLibrary, brandT])

  const handleDownloadPackage = useCallback(() => {
    if (!brand || Object.keys(packageFiles).length === 0) return
    downloadBlob(
      exportTextFilesToZip(packageFiles),
      `${brand.folder}-brand-package.zip`
    )
  }, [brand, packageFiles])

  const handleCopyFile = useCallback(
    async (file: BrandFileSource) => {
      try {
        await navigator.clipboard.writeText(file.content)
        setCopiedFile(file.id)
        window.setTimeout(() => setCopiedFile(null), 1400)
      } catch {
        setToast(t("copyFailed"))
      }
    },
    [t]
  )

  if (!ready) {
    return <PageLoadingSkeleton />
  }

  if (!brand) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center bg-muted/15 px-6 text-center">
        <div>
          <p className="text-base font-medium">{brandT("unavailable")}</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {brandT("unavailableDetail")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/brands")}
          >
            <ArrowLeft className="h-4 w-4" />
            {brandT("back")}
          </Button>
        </div>
      </div>
    )
  }

  if (!entry && !currentPackagedSources) {
    return <PageLoadingSkeleton />
  }

  if (!entry || !parsed || !previewSemantics || !cssVars) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center bg-muted/15 px-6 text-center">
        <div>
          <p className="text-base font-medium">{brandT("unavailable")}</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {brandT("unavailableDetail")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/brands")}
          >
            <ArrowLeft className="h-4 w-4" />
            {brandT("back")}
          </Button>
        </div>
      </div>
    )
  }

  const packageComplete = !!entry.isComplete

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/15">
      <div className="shrink-0 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => router.push("/brands")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {brandT("library")}
            </Button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!previousBrand}
              onClick={() => previousBrand && goToBrand(previousBrand.id)}
              aria-label={brandT("previous")}
              title={brandT("previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!nextBrand}
              onClick={() => nextBrand && goToBrand(nextBrand.id)}
              aria-label={brandT("next")}
              title={brandT("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <select
              value={brand.id}
              onChange={(event) => goToBrand(event.target.value)}
              className="h-8 max-w-[180px] rounded-md border border-border bg-background px-2 text-sm font-medium transition-colors outline-none hover:bg-muted/35 focus:border-ring focus:ring-3 focus:ring-ring/30 sm:max-w-[240px]"
              aria-label={brandT("switch")}
            >
              {brands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {brand.previewUrl && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={brand.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink data-icon="inline-start" />
                {brandT("openHtmlPreview")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleUse}
            >
              <Pencil className="h-3.5 w-3.5" />
              {brandT("useTemplate")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleSaveToLibrary}
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              {brandT("saveLibrary")}
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPackage}
              disabled={Object.keys(packageFiles).length === 0}
            >
              <Download data-icon="inline-start" />
              {common("downloadAll")}
            </Button>
          </div>
        </div>
      </div>

      {!packageComplete && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-6 py-2.5 text-[12px] text-amber-800">
          {brandT("missing", {
            files: entry.missingFiles?.join(", ") || brandT("unknownFile"),
          })}
        </div>
      )}

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <PreviewSurface
          entry={entry}
          parsed={parsed}
          previewSemantics={previewSemantics}
          cssVars={cssVars}
        />
        <FilesSurface
          fileSources={fileSources}
          activeFile={activeFile}
          onFileTabChange={setFileTab}
          copiedFile={copiedFile}
          onCopyFile={handleCopyFile}
        />
      </div>

      <Tabs
        value={mobileTab}
        onValueChange={(value) => setMobileTab(value as MobileTab)}
        className="flex min-h-0 flex-1 flex-col gap-0 lg:hidden"
      >
        <div className="shrink-0 border-b border-border/60 bg-background px-4 pt-2">
          <TabsList variant="line" className="h-9 gap-3 px-0">
            <TabsTrigger value="preview" className="px-1 text-[12.5px]">
              {t("preview")}
            </TabsTrigger>
            <TabsTrigger value="files" className="px-1 text-[12.5px]">
              {t("files")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="min-h-0 flex-1 bg-muted/15">
          <PreviewSurface
            entry={entry}
            parsed={parsed}
            previewSemantics={previewSemantics}
            cssVars={cssVars}
          />
        </TabsContent>
        <TabsContent value="files" className="min-h-0 flex-1 bg-background">
          <FilesSurface
            fileSources={fileSources}
            activeFile={activeFile}
            onFileTabChange={setFileTab}
            copiedFile={copiedFile}
            onCopyFile={handleCopyFile}
          />
        </TabsContent>
      </Tabs>

      {toast && (
        <div
          className="fixed right-5 bottom-5 z-50 max-w-sm rounded-lg border border-border bg-popover px-4 py-3 text-[13px] shadow-lg"
          role="status"
        >
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
            <span className="flex-1 leading-relaxed">{toast}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setToast(null)}
              aria-label={common("closeNotice")}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewSurface({
  entry,
  parsed,
  previewSemantics,
  cssVars,
}: {
  entry: ReturnType<typeof brandToEntry>
  parsed: NonNullable<ReturnType<typeof useThemePreviewData>["parsed"]>
  previewSemantics: NonNullable<
    ReturnType<typeof useThemePreviewData>["previewSemantics"]
  >
  cssVars: NonNullable<ReturnType<typeof useThemePreviewData>["cssVars"]>
}) {
  return (
    <ScrollArea className="h-full min-h-0 bg-muted/15">
      <div className="p-4 lg:p-6">
        <ThemePreviewDocument
          tokens={parsed.tokens}
          rawSections={parsed.rawSections}
          parsedName={entry.name}
          previewSemantics={previewSemantics}
          cssVars={cssVars}
          hero={{
            ...buildHeroCopy({
              name: entry.name,
              description: entry.description,
              mdContent: entry.mdContent,
              brandId: entry.id,
            }),
            metadata: [entry.category, ...entry.tags.slice(0, 3)].filter(
              Boolean
            ),
          }}
          heroLogo={
            <BrandLogo
              faviconUrl={entry.faviconUrl}
              name={entry.name}
              className="size-11 rounded-lg"
            />
          }
          heroMedia={
            <BrandMedia
              imageUrl={entry.imageUrl}
              videoUrl={entry.videoUrl}
              name={entry.name}
              variant="expanded"
              className="overflow-hidden rounded-md border border-border/60 shadow-sm"
            />
          }
          className="px-6 py-9 sm:px-8 lg:px-10 lg:py-10"
        />
      </div>
    </ScrollArea>
  )
}

function FilesSurface({
  fileSources,
  activeFile,
  onFileTabChange,
  copiedFile,
  onCopyFile,
}: {
  fileSources: BrandFileSource[]
  activeFile: BrandFileSource
  onFileTabChange: (value: FileTab) => void
  copiedFile: FileTab | null
  onCopyFile: (file: BrandFileSource) => void
}) {
  const common = useTranslations("Common")
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border/60 bg-background">
      <Tabs
        value={activeFile.id}
        onValueChange={(value) => onFileTabChange(value as FileTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-border/60 px-4 pt-2">
          <TabsList
            variant="line"
            className="h-9 max-w-full justify-start gap-4 overflow-x-auto px-0"
          >
            {fileSources.map((file) => (
              <TabsTrigger
                key={file.id}
                value={file.id}
                className="flex-none px-1 text-[12.5px]"
              >
                {file.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground">
            {activeFile.icon}
            <span className="truncate font-mono">{activeFile.filename}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => onCopyFile(activeFile)}
            >
              {copiedFile === activeFile.id ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedFile === activeFile.id ? common("copied") : common("copy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() =>
                downloadText(
                  activeFile.filename,
                  activeFile.content,
                  activeFile.mime
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              {common("download")}
            </Button>
          </div>
        </div>
        {fileSources.map((file) => (
          <TabsContent
            key={file.id}
            value={file.id}
            className="min-h-0 flex-1 bg-muted/10"
          >
            <CodeViewer file={file} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CodeViewer({ file }: { file: BrandFileSource }) {
  const highlighted = useShikiHighlight(file.content, file.language)

  return (
    <div className="h-full min-h-0 overflow-auto bg-background">
      {highlighted ? (
        <div
          className="shiki-rendered min-w-max px-4 py-4 font-mono text-[12px] leading-[1.7]"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="m-0 min-w-max px-4 py-4 font-mono text-[12px] leading-[1.7] whitespace-pre text-foreground/85">
          {file.content}
        </pre>
      )}
    </div>
  )
}
