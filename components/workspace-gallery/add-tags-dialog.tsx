"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddTagsDialogProps {
  open: boolean
  selectedCount: number
  onClose: () => void
  onSave: (tags: string[]) => void
}

export function AddTagsDialog({
  open,
  selectedCount,
  onClose,
  onSave,
}: AddTagsDialogProps) {
  if (!open) return null

  return (
    <AddTagsDialogBody
      key={selectedCount}
      selectedCount={selectedCount}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function AddTagsDialogBody({
  selectedCount,
  onClose,
  onSave,
}: {
  selectedCount: number
  onClose: () => void
  onSave: (tags: string[]) => void
}) {
  const t = useTranslations("Documents.addTags")
  const common = useTranslations("Common")
  const [tagsInput, setTagsInput] = useState("")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (tags.length === 0) return
    onSave(tags)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="relative mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border bg-background p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("title")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("selected", { count: selectedCount })}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t("tags")}
            </span>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder={t("placeholder")}
              autoFocus
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {common("cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={!tagsInput.trim()}>
              {t("apply")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
