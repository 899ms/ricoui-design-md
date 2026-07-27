"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagChipInput } from "@/components/taxonomy/tag-chip-input"
import { CategoryCombobox } from "@/components/taxonomy/category-combobox"
import { useTaxonomyTerms } from "@/components/taxonomy/use-taxonomy-terms"
import { extractProjectUrl } from "@/lib/library/project-url"
import type { UnifiedThemeEntry } from "./theme-gallery-page"

interface EditThemeDialogProps {
  open: boolean
  entry: UnifiedThemeEntry | null
  onClose: () => void
  onSave: (input: {
    name: string
    description: string
    projectUrl: string
    tags: string[]
    category?: string
  }) => void
  onDelete?: () => void
}

export function EditThemeDialog({
  open,
  entry,
  onClose,
  onSave,
  onDelete,
}: EditThemeDialogProps) {
  if (!open || !entry) return null

  return (
    <EditThemeDialogBody
      key={entry.id}
      entry={entry}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  )
}

function EditThemeDialogBody({
  entry,
  onClose,
  onSave,
  onDelete,
}: {
  entry: UnifiedThemeEntry
  onClose: () => void
  onSave: (input: {
    name: string
    description: string
    projectUrl: string
    tags: string[]
    category?: string
  }) => void
  onDelete?: () => void
}) {
  const t = useTranslations("ThemeDialogs")
  const common = useTranslations("Common")
  const [name, setName] = useState(entry.name)
  const [description, setDescription] = useState(entry.description)
  const [projectUrl, setProjectUrl] = useState(
    () => extractProjectUrl(entry.mdContent) ?? ""
  )
  const [tags, setTags] = useState<string[]>(entry.tags)
  const [category, setCategory] = useState(entry.category ?? "")
  const { tagNames, categoryNames } = useTaxonomyTerms()

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="relative mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border bg-background p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("editTitle")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("editDescription")}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("name")}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("themeNamePlaceholder")}
              autoFocus
            />
          </Field>

          <Field label={t("description")}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
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

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  {common("delete")}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {common("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={!name.trim()}>
                {t("saveChanges")}
              </Button>
            </div>
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
