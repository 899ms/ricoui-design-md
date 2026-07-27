"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useDesignStore } from "@/lib/store/design-store"
import { ImportSummaryToast } from "@/components/import-summary-toast"
import { Upload, FilePlus, ArrowRight, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BatchImportResult } from "@/lib/types/tokens"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { CLOUD_DOCUMENT_LIMIT } from "@/lib/sync/cloud-limits"

interface UploadZoneProps {
  compact?: boolean
}

export function UploadZone({ compact = false }: UploadZoneProps) {
  const t = useTranslations("UploadZone")
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [importSummary, setImportSummary] = useState<BatchImportResult | null>(
    null
  )
  const { user } = useAccountDialog()
  const documentsCount = useDesignStore((state) => state.documents.length)
  const cloudDraftsFull = !!user && documentsCount >= CLOUD_DOCUMENT_LIMIT
  const createDocumentsFromFiles = useDesignStore(
    (state) => state.createDocumentsFromFiles
  )
  const createDocument = useDesignStore((state) => state.createDocument)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const result = await createDocumentsFromFiles(files)
      const hasIssues = result.failed.length > 0 || result.skipped.length > 0
      if (
        !(result.totalCount === 1 && result.successCount === 1 && !hasIssues)
      ) {
        setImportSummary(result)
      }
    },
    [createDocumentsFromFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      void handleFiles(Array.from(e.dataTransfer.files ?? []))
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    if (cloudDraftsFull) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".md"
    input.multiple = true
    input.onchange = (e) => {
      void handleFiles(Array.from((e.target as HTMLInputElement).files ?? []))
    }
    input.click()
  }, [cloudDraftsFull, handleFiles])

  const handleNewBlank = useCallback(async () => {
    await createDocument({ source: "blank" })
  }, [createDocument])

  return (
    <div
      className={`work-surface flex items-center justify-center p-6 ${compact ? "h-full" : "min-h-svh"}`}
    >
      <div className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick()
          }}
          className={`panel-surface flex w-full flex-col items-center gap-4 rounded-lg border border-dashed p-12 transition-all ${cloudDraftsFull ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <div className="rounded-lg border border-border/70 bg-muted/80 p-4 shadow-[var(--shadow-sm)]">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {isDragging ? t("dropActive") : t("dropIdle")}
            </p>
            <p className="text-sm text-muted-foreground">{t("limits")}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{t("startBlank")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              size="sm"
              disabled={cloudDraftsFull}
              onClick={handleNewBlank}
            >
              <FilePlus className="h-4 w-4" />
              {t("blankTemplate")}
              <ArrowRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/library" />}
            >
              <Palette className="h-4 w-4" />
              {t("browseLibrary")}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <ImportSummaryToast
        result={importSummary}
        onDismiss={() => setImportSummary(null)}
        onOpenLatest={() => {
          const latestId = importSummary?.createdIds.at(-1)
          if (!latestId) return
          setImportSummary(null)
          router.push("/editor")
        }}
      />
    </div>
  )
}
