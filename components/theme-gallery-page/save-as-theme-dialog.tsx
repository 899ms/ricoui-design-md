"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { AlertTriangle, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagChipInput } from "@/components/taxonomy/tag-chip-input"
import { CategoryCombobox } from "@/components/taxonomy/category-combobox"
import { TaxonomyManagerDialog } from "@/components/taxonomy/taxonomy-manager-dialog"
import { useTaxonomyTerms } from "@/components/taxonomy/use-taxonomy-terms"
import type { SaveAsThemeInput, WorkspaceDocument } from "@/lib/types/tokens"
import { getMarkdownDocumentCapability } from "@/lib/document-capability"
import { extractProjectUrl } from "@/lib/library/project-url"

interface SaveAsThemeDialogProps {
  open: boolean
  onClose: () => void
  document: WorkspaceDocument | null
  title?: string
  descriptionText?: string
  submitLabel?: string
  onSave: (input: SaveAsThemeInput) => void
}

export function SaveAsThemeDialog({
  open,
  onClose,
  document,
  title,
  descriptionText,
  submitLabel,
  onSave,
}: SaveAsThemeDialogProps) {
  const t = useTranslations("ThemeDialogs")
  const common = useTranslations("Common")
  if (!open || !document) return null
  return createPortal(
    <SaveAsThemeDialogBody
      key={document.id}
      document={document}
      onClose={onClose}
      title={title ?? t("saveTitle")}
      descriptionText={descriptionText ?? t("saveDescription")}
      submitLabel={submitLabel ?? common("save")}
      onSave={onSave}
    />,
    globalThis.document.body
  )
}

interface DialogBodyProps {
  document: WorkspaceDocument
  onClose: () => void
  title: string
  descriptionText: string
  submitLabel: string
  onSave: (input: SaveAsThemeInput) => void
}

function SaveAsThemeDialogBody({
  document,
  onClose,
  title,
  descriptionText,
  submitLabel,
  onSave,
}: DialogBodyProps) {
  const t = useTranslations("ThemeDialogs")
  const common = useTranslations("Common")
  const [name, setName] = useState(() => document.name)
  const [description, setDescription] = useState(
    () => document.tokens.meta.description || ""
  )
  const [projectUrl, setProjectUrl] = useState(
    () => extractProjectUrl(document.rawMarkdown) ?? ""
  )
  const [tags, setTags] = useState<string[]>(() => document.tags ?? [])
  const [category, setCategory] = useState(() => document.category ?? "")
  const [taxonomyOpen, setTaxonomyOpen] = useState(false)
  const { tagNames, categoryNames } = useTaxonomyTerms()
  const capability = getMarkdownDocumentCapability(document.rawMarkdown)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave({
      name: trimmedName,
      description: description.trim(),
      projectUrl: projectUrl.trim(),
      tags,
      category: category.trim() || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="relative mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border bg-background p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {descriptionText}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {capability.level !== "full" && (
            <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
              <div className="flex items-start gap-2">
                {capability.level === "markdown-only" ? (
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                )}
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {t(
                      capability.level === "markdown-only"
                        ? "markdownOnlyTitle"
                        : "partialTitle"
                    )}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {t(
                      capability.level === "markdown-only"
                        ? "markdownOnlyDetail"
                        : "partialDetail"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Field label={t("name")}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("libraryNamePlaceholder")}
              autoFocus
            />
          </Field>

          <Field label={t("description")}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>

          <Field label={t("projectUrlOptional")}>
            <Input
              type="url"
              inputMode="url"
              value={projectUrl}
              onChange={(event) => setProjectUrl(event.target.value)}
              placeholder={t("projectUrlPlaceholder")}
              autoComplete="url"
            />
          </Field>

          <Field label={t("tags")}>
            <TagChipInput
              value={tags}
              onChange={setTags}
              suggestions={tagNames}
            />
          </Field>

          <Field label={t("categoryOptional")}>
            <CategoryCombobox
              value={category}
              onChange={setCategory}
              suggestions={categoryNames}
            />
          </Field>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTaxonomyOpen(true)}
              className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {t("manageTaxonomy")}
            </button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {common("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={!name.trim()}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <TaxonomyManagerDialog
        open={taxonomyOpen}
        onOpenChange={setTaxonomyOpen}
      />
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
