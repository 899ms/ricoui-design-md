"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkspaceDocument } from "@/lib/types/tokens"

interface DocumentDetailsDialogProps {
  open: boolean
  document: WorkspaceDocument | null
  onClose: () => void
  onSave: (input: { tags: string[]; category?: string }) => void
}

export function DocumentDetailsDialog({
  open,
  document,
  onClose,
  onSave,
}: DocumentDetailsDialogProps) {
  if (!open || !document) return null

  return (
    <DocumentDetailsDialogBody
      key={document.id}
      document={document}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function DocumentDetailsDialogBody({
  document,
  onClose,
  onSave,
}: {
  document: WorkspaceDocument
  onClose: () => void
  onSave: (input: { tags: string[]; category?: string }) => void
}) {
  const t = useTranslations("Documents.details")
  const common = useTranslations("Common")
  const [tagsInput, setTagsInput] = useState(() =>
    (document.tags ?? []).join(", ")
  )
  const [category, setCategory] = useState(() => document.category ?? "")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSave({
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      category: category.trim() || undefined,
    })
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
              {document.name}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("tags")}>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder={t("tagsPlaceholder")}
              autoFocus
            />
          </Field>

          <Field label={t("category")}>
            <Input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder={t("optional")}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {common("cancel")}
            </Button>
            <Button type="submit" size="sm">
              {common("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
