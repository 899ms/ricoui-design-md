"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Cloud, FileText, Library, Loader2 } from "lucide-react"
import { useCloudSync } from "@/components/cloud-sync-provider"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import {
  CLOUD_ACCOUNT_MARKDOWN_BYTES,
  CLOUD_DOCUMENT_LIMIT,
  CLOUD_LIBRARY_LIMIT,
  CLOUD_SOURCE_MARKDOWN_BYTES,
  getUtf8ByteLength,
} from "@/lib/sync/cloud-limits"
import { useDesignStore } from "@/lib/store/design-store"
import { toast } from "@/lib/store/toast"
import { getLocalImportUnavailableReason } from "@/lib/sync/workspace-transition"

export function LocalToCloudCopyDialog() {
  const t = useTranslations("LocalImportPrompt")
  const {
    localImportPromptOpen,
    localImportCatalog,
    importLocalSources,
    finishLocalImportPrompt,
  } = useCloudSync()
  const documents = useDesignStore((state) => state.documents)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [copying, setCopying] = useState(false)

  const cloudBytes = useMemo(
    () =>
      documents.reduce(
        (total, document) => total + getUtf8ByteLength(document.rawMarkdown),
        0
      ) +
      libraryEntries.reduce(
        (total, entry) => total + getUtf8ByteLength(entry.mdContent),
        0
      ),
    [documents, libraryEntries]
  )
  const selectedBytes = useMemo(() => {
    const selected = new Set(selectedKeys)
    return [
      ...localImportCatalog.documents.map((item) => ({
        ...item,
        key: `document:${item.id}`,
      })),
      ...localImportCatalog.libraryEntries.map((item) => ({
        ...item,
        key: `library_entry:${item.id}`,
      })),
    ].reduce(
      (total, item) => total + (selected.has(item.key) ? item.bytes : 0),
      0
    )
  }, [localImportCatalog, selectedKeys])
  const selectedDocumentCount = selectedKeys.filter((key) =>
    key.startsWith("document:")
  ).length
  const selectedLibraryCount = selectedKeys.filter((key) =>
    key.startsWith("library_entry:")
  ).length

  const toggle = (key: string) =>
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    )

  const finishPrompt = () => {
    setSelectedKeys([])
    finishLocalImportPrompt()
  }

  const copySelected = async () => {
    if (selectedKeys.length === 0 || copying) return
    setCopying(true)
    try {
      const result = await importLocalSources(selectedKeys)
      toast(
        t("result", { imported: result.imported, skipped: result.skipped }),
        result.skipped > 0 ? "warning" : "success"
      )
      finishPrompt()
    } catch {
      toast(t("failed"), "warning")
    } finally {
      setCopying(false)
    }
  }

  const renderItems = (
    kind: "document" | "library_entry",
    items: typeof localImportCatalog.documents
  ) => {
    const count = kind === "document" ? documents.length : libraryEntries.length
    const limit =
      kind === "document" ? CLOUD_DOCUMENT_LIMIT : CLOUD_LIBRARY_LIMIT
    return items.map((item) => {
      const key = `${kind}:${item.id}`
      const selected = selectedKeys.includes(key)
      const selectedKindCount =
        kind === "document" ? selectedDocumentCount : selectedLibraryCount
      const unavailableReason = getLocalImportUnavailableReason({
        itemBytes: item.bytes,
        currentCount: count,
        selectedCount: selectedKindCount,
        countLimit: limit,
        currentBytes: cloudBytes,
        selectedBytes,
        accountByteLimit: CLOUD_ACCOUNT_MARKDOWN_BYTES,
        sourceByteLimit: CLOUD_SOURCE_MARKDOWN_BYTES,
        selected,
      })
      const unavailable = unavailableReason
        ? t(
            unavailableReason === "source-too-large"
              ? "tooLarge"
              : unavailableReason === "count-limit"
                ? "countLimit"
                : "storageLimit"
          )
        : null
      return (
        <label
          key={key}
          className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/[0.035]"
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={Boolean(unavailable) || copying}
            onChange={() => toggle(key)}
            className="mt-0.5"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">
              {item.name}
            </span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              {(item.bytes / 1024).toFixed(1)} KiB
              {unavailable ? ` · ${unavailable}` : ""}
            </span>
          </span>
        </label>
      )
    })
  }

  return (
    <Dialog
      open={localImportPromptOpen}
      onOpenChange={() => undefined}
      hideCloseButton
      label={t("title")}
      className="max-w-xl"
    >
      <div className="p-5 sm:p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Cloud className="size-4.5" />
        </span>
        <h2 className="mt-4 text-base font-semibold">{t("title")}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("detail")}
        </p>

        <div className="mt-5 max-h-[42vh] space-y-4 overflow-y-auto pr-1">
          {localImportCatalog.documents.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <FileText className="size-3.5 text-muted-foreground" />
                {t("drafts", { count: localImportCatalog.documents.length })}
              </h3>
              <div className="grid gap-2">
                {renderItems("document", localImportCatalog.documents)}
              </div>
            </section>
          )}
          {localImportCatalog.libraryEntries.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <Library className="size-3.5 text-muted-foreground" />
                {t("library", {
                  count: localImportCatalog.libraryEntries.length,
                })}
              </h3>
              <div className="grid gap-2">
                {renderItems(
                  "library_entry",
                  localImportCatalog.libraryEntries
                )}
              </div>
            </section>
          )}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          {t("capacity", {
            selected: (selectedBytes / 1024).toFixed(1),
            remaining: (
              Math.max(0, CLOUD_ACCOUNT_MARKDOWN_BYTES - cloudBytes) / 1024
            ).toFixed(1),
          })}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={copying} onClick={finishPrompt}>
            {t("skip")}
          </Button>
          <Button
            disabled={selectedKeys.length === 0 || copying}
            onClick={() => void copySelected()}
          >
            {copying ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Cloud className="size-3.5" />
            )}
            {t("copy", { count: selectedKeys.length })}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
