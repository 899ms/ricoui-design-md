"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Archive,
  Check,
  Copy,
  Download,
  FileCode,
  FileJson,
  FileText,
} from "lucide-react"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"
import type { DesignTokens } from "@/lib/types/tokens"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadText } from "@/lib/download"
import {
  useShikiHighlight,
  type ShikiLanguage,
} from "@/hooks/use-shiki-highlight"
import { cn } from "@/lib/utils"

export interface DesignFileSource {
  id: string
  label: string
  filename: string
  mime: string
  language: ShikiLanguage
  content: string
  icon: React.ReactNode
  disabled?: boolean
}

/**
 * Derive the canonical four files (DESIGN.md + tokens.json + variables.css +
 * theme.css) from the current raw markdown. The parsed token argument remains
 * for caller compatibility, but every derived file uses the same source
 * revision so last-valid fallback tokens can never leak into an export.
 */
export function buildDesignFileSources(input: {
  tokens: DesignTokens
  markdown: string
  prefix: string
}): DesignFileSource[] {
  const { markdown, prefix } = input
  const safePrefix = prefix || "design"
  const compilation = compileDesignArtifacts(markdown)
  const derived = compilation.ok ? compilation.artifacts : null
  return [
    {
      id: "md",
      label: "DESIGN.md",
      filename: `${safePrefix}-DESIGN.md`,
      mime: "text/markdown",
      language: "markdown",
      content: markdown,
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      id: "tokens",
      label: "Design Tokens",
      filename: `${safePrefix}-tokens.json`,
      mime: "application/json",
      language: "json",
      content: derived?.tokensJson ?? "",
      icon: <FileJson className="h-3.5 w-3.5" />,
      disabled: !derived,
    },
    {
      id: "css",
      label: "CSS Variables",
      filename: `${safePrefix}-variables.css`,
      mime: "text/css",
      language: "css",
      content: derived?.variablesCss ?? "",
      icon: <FileCode className="h-3.5 w-3.5" />,
      disabled: !derived,
    },
    {
      id: "tailwind",
      label: "Tailwind v4",
      filename: `${safePrefix}-theme.css`,
      mime: "text/css",
      language: "css",
      content: derived?.themeCss ?? "",
      icon: <FileCode className="h-3.5 w-3.5" />,
      disabled: !derived,
    },
  ]
}

/**
 * Presentational tabbed viewer for a set of design files. Shows one DESIGN.md
 * source alongside its derived artifacts, each with copy + download, plus an
 * optional "download all" package button. Self-manages the active tab and the
 * copied-flash state so callers only pass the file list.
 */
export function DesignFileTabs({
  fileSources,
  defaultFileId,
  onDownloadAll,
  onCopyError,
  className,
}: {
  fileSources: DesignFileSource[]
  defaultFileId?: string
  onDownloadAll?: () => void
  onCopyError?: () => void
  className?: string
}) {
  const common = useTranslations("Common")
  const [activeId, setActiveId] = useState(
    defaultFileId ?? fileSources[0]?.id ?? ""
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const selected = fileSources.find((file) => file.id === activeId)
  const derivedFilesUnavailable = fileSources.some(
    (file) => file.id !== "md" && file.disabled
  )
  const activeFile =
    selected && !selected.disabled
      ? selected
      : (fileSources.find((file) => !file.disabled) ?? fileSources[0])
  if (!activeFile) return null

  const handleCopy = async (file: DesignFileSource) => {
    if (file.disabled) return
    try {
      await navigator.clipboard.writeText(file.content)
      setCopiedId(file.id)
      window.setTimeout(() => setCopiedId(null), 1400)
    } catch {
      onCopyError?.()
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-background",
        className
      )}
    >
      <Tabs
        value={activeFile.id}
        onValueChange={setActiveId}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-border/60 px-3 pt-2">
          <TabsList
            variant="line"
            className="h-9 max-w-full justify-start gap-4 overflow-x-auto px-0"
          >
            {fileSources.map((file) => (
              <TabsTrigger
                key={file.id}
                value={file.id}
                disabled={file.disabled}
                className="flex-none px-1 text-[12.5px]"
              >
                {file.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground">
            {activeFile.icon}
            <span className="truncate font-mono">{activeFile.filename}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={activeFile.disabled}
              onClick={() => handleCopy(activeFile)}
            >
              {copiedId === activeFile.id ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedId === activeFile.id ? common("copied") : common("copy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={activeFile.disabled}
              onClick={() =>
                downloadText(
                  activeFile.content,
                  activeFile.filename,
                  activeFile.mime
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              {common("download")}
            </Button>
            {onDownloadAll && (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={derivedFilesUnavailable}
                onClick={onDownloadAll}
              >
                <Archive className="h-3.5 w-3.5" />
                {common("downloadAll")}
              </Button>
            )}
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

function CodeViewer({ file }: { file: DesignFileSource }) {
  const highlighted = useShikiHighlight(file.content, file.language)

  return (
    <div className="h-full min-h-0 overflow-auto bg-background">
      {highlighted ? (
        <div
          className={cn(
            "shiki-rendered min-w-max px-4 py-4 font-mono text-[12px] leading-[1.7]",
            file.disabled && "opacity-60"
          )}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre
          className={cn(
            "m-0 min-w-max px-4 py-4 font-mono text-[12px] leading-[1.7] whitespace-pre text-foreground/85",
            file.disabled && "opacity-60"
          )}
        >
          {file.content}
        </pre>
      )}
    </div>
  )
}
