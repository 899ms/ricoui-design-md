"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ChevronDown,
  Copy,
  FilePlus,
  Palette,
  Plus,
  SwatchBook,
  Upload,
} from "lucide-react"
import { ImportSummaryToast } from "@/components/import-summary-toast"
import { useDesignStore } from "@/lib/store/design-store"
import { Button } from "@/components/ui/button"
import type { BatchImportResult } from "@/lib/types/tokens"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { CLOUD_DOCUMENT_LIMIT } from "@/lib/sync/cloud-limits"

export function NewDocumentMenu({
  fullWidth = false,
  label,
}: {
  fullWidth?: boolean
  label?: string
}) {
  const t = useTranslations("NewDocument")
  const router = useRouter()
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const documentsCount = useDesignStore((state) => state.documents.length)
  const { user } = useAccountDialog()
  const cloudDraftsFull = !!user && documentsCount >= CLOUD_DOCUMENT_LIMIT
  const createDocument = useDesignStore((state) => state.createDocument)
  const createDocumentsFromFiles = useDesignStore(
    (state) => state.createDocumentsFromFiles
  )
  const [open, setOpen] = useState(false)
  const [importSummary, setImportSummary] = useState<BatchImportResult | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleNewBlank = async () => {
    setOpen(false)
    await createDocument({ source: "blank" })
  }

  const handleNewFromUpload = () => {
    setOpen(false)
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return

    const result = await createDocumentsFromFiles(files)
    const hasIssues = result.failed.length > 0 || result.skipped.length > 0
    if (result.totalCount === 1 && result.successCount === 1 && !hasIssues) {
      router.push("/editor")
      return
    }

    setImportSummary(result)
  }

  const handleNewDuplicate = async () => {
    setOpen(false)
    if (!activeDocumentId) return
    await createDocument({ source: "duplicate", sourceId: activeDocumentId })
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        multiple
        disabled={cloudDraftsFull}
        className="hidden"
        onChange={handleFileInputChange}
      />

      <Button
        variant="default"
        size="lg"
        className={fullWidth ? "w-full justify-between" : undefined}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      >
        <span className="flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" />
          {label ?? t("new")}
        </span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-xl border bg-background p-1 shadow-lg">
          <button
            disabled={cloudDraftsFull}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            onMouseDown={handleNewBlank}
          >
            <FilePlus className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium">{t("blank")}</p>
              {/* <p className="text-xs text-muted-foreground">从标准模板开始</p> */}
            </div>
          </button>
          <button
            disabled={cloudDraftsFull}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            onMouseDown={handleNewFromUpload}
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium">{t("upload")}</p>
              {/* <p className="text-xs text-muted-foreground">导入已有 DESIGN.md</p> */}
            </div>
          </button>
          <Link
            href="/library"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            onMouseDown={() => setOpen(false)}
          >
            <Palette className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium">{t("fromLibrary")}</p>
              {/* <p className="text-xs text-muted-foreground">使用已保存的设计库条目</p> */}
            </div>
          </Link>
          <Link
            href="/brands"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            onMouseDown={() => setOpen(false)}
          >
            <SwatchBook className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium">{t("fromBrand")}</p>
              {/* <p className="text-xs text-muted-foreground">使用只读品牌参考</p> */}
            </div>
          </Link>
          {activeDocumentId && (
            <>
              <div className="my-1 border-t" />
              <button
                disabled={cloudDraftsFull}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                onMouseDown={handleNewDuplicate}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">{t("duplicateCurrent")}</p>
                  {/* <p className="text-xs text-muted-foreground">拷贝正在编辑的草稿</p> */}
                </div>
              </button>
            </>
          )}
        </div>
      )}
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
