"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { GitMerge, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CategoryCombobox } from "./category-combobox"
import { useTaxonomyTerms } from "./use-taxonomy-terms"
import { useDesignStore } from "@/lib/store/design-store"
import { cn } from "@/lib/utils"

interface TaxonomyManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Tab = "tags" | "categories"
type ActionKind = "rename" | "merge" | "delete"

interface StatusMessage {
  message: string
  tone: "info" | "success"
}

export function TaxonomyManagerDialog({
  open,
  onOpenChange,
}: TaxonomyManagerDialogProps) {
  const t = useTranslations("Taxonomy")
  const [tab, setTab] = useState<Tab>("tags")
  const [status, setStatus] = useState<StatusMessage | null>(null)

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 3500)
    return () => clearTimeout(timer)
  }, [status])

  const report = (
    result: { drafts: number; library: number },
    verb: string
  ) => {
    if (result.drafts === 0 && result.library === 0) {
      setStatus({ message: t("noUpdates"), tone: "info" })
      return
    }
    const parts: string[] = []
    if (result.drafts > 0) parts.push(t("draftCount", { count: result.drafts }))
    if (result.library > 0)
      parts.push(t("libraryCount", { count: result.library }))
    setStatus({
      message: t("reportSuccess", { verb, resources: parts.join(" · ") }),
      tone: "success",
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("dialogLabel")}
      className="max-w-xl"
    >
      <div className="p-6 pr-12">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("description")}</p>

        <div className="mt-4 flex gap-1 rounded-md border border-border/60 bg-muted/40 p-0.5 text-xs">
          <TabButton active={tab === "tags"} onClick={() => setTab("tags")}>
            {t("tags")}
          </TabButton>
          <TabButton
            active={tab === "categories"}
            onClick={() => setTab("categories")}
          >
            {t("categories")}
          </TabButton>
        </div>

        {status && (
          <p
            role="status"
            className={cn(
              "mt-3 rounded-md px-3 py-2 text-xs",
              status.tone === "success"
                ? "bg-green-500/10 text-green-700"
                : "bg-muted/60 text-muted-foreground"
            )}
          >
            {status.message}
          </p>
        )}

        <div className="mt-3 max-h-[48vh] overflow-y-auto pr-1">
          {tab === "tags" ? (
            <TagsPanel onStatus={report} />
          ) : (
            <CategoriesPanel onStatus={report} />
          )}
        </div>
      </div>
    </Dialog>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded px-3 py-1.5 font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function CountBadge({ drafts, library }: { drafts: number; library: number }) {
  const t = useTranslations("Taxonomy")
  return (
    <span className="shrink-0 text-[10px] text-muted-foreground">
      {drafts > 0 && <span>{t("draftBadge", { count: drafts })}</span>}
      {drafts > 0 && library > 0 && <span> · </span>}
      {library > 0 && <span>{t("libraryBadge", { count: library })}</span>}
      {drafts === 0 && library === 0 && <span>{t("unused")}</span>}
    </span>
  )
}

type PendingAction = {
  kind: ActionKind
  value: string
}

function usePendingAction() {
  return useState<PendingAction | null>(null)
}

function TagsPanel({
  onStatus,
}: {
  onStatus: (result: { drafts: number; library: number }, verb: string) => void
}) {
  const t = useTranslations("Taxonomy")
  const { tags, tagNames } = useTaxonomyTerms()
  const renameTaxonomyTag = useDesignStore((s) => s.renameTaxonomyTag)
  const mergeTaxonomyTag = useDesignStore((s) => s.mergeTaxonomyTag)
  const deleteTaxonomyTag = useDesignStore((s) => s.deleteTaxonomyTag)
  const [pending, setPending] = usePendingAction()
  const [renameDraft, setRenameDraft] = useState("")
  const [mergeTarget, setMergeTarget] = useState("")

  const otherTags = useMemo(
    () => (value: string) => tagNames.filter((name) => name !== value),
    [tagNames]
  )

  const begin = (kind: ActionKind, value: string) => {
    setPending({ kind, value })
    setRenameDraft(value)
    setMergeTarget("")
  }

  const apply = () => {
    if (!pending) return
    const { kind, value } = pending
    setPending(null)
    if (kind === "rename") {
      const next = renameDraft.trim()
      if (next && next !== value)
        onStatus(renameTaxonomyTag(value, next), t("renamed"))
    } else if (kind === "merge") {
      const target = mergeTarget.trim()
      if (target && target !== value)
        onStatus(mergeTaxonomyTag(value, target), t("merged"))
    } else {
      onStatus(deleteTaxonomyTag(value), t("deleted"))
    }
  }

  if (tags.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        {t("emptyTags")}
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-1">
        {tags.map((term) => (
          <li
            key={term.value}
            className="flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm">
              {term.value}
            </span>
            <CountBadge drafts={term.drafts} library={term.library} />
            <div className="flex items-center gap-1">
              <ActionButton
                label={t("rename")}
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => begin("rename", term.value)}
              />
              <ActionButton
                label={t("merge")}
                icon={<GitMerge className="h-3.5 w-3.5" />}
                onClick={() => begin("merge", term.value)}
              />
              <ActionButton
                label={t("delete")}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                tone="danger"
                onClick={() => begin("delete", term.value)}
              />
            </div>
          </li>
        ))}
      </ul>

      <ActionConfirm
        pending={pending}
        noun={t("tag")}
        deleteVerb={t("delete")}
        onClose={() => setPending(null)}
        canConfirm={
          pending?.kind === "rename"
            ? renameDraft.trim().length > 0 &&
              renameDraft.trim() !== pending.value
            : pending?.kind === "merge"
              ? mergeTarget.trim().length > 0 &&
                mergeTarget.trim() !== pending.value
              : true
        }
        body={
          pending?.kind === "rename" ? (
            <FieldInput value={renameDraft} onChange={setRenameDraft} />
          ) : pending?.kind === "merge" ? (
            <CategoryCombobox
              value={mergeTarget}
              onChange={setMergeTarget}
              suggestions={pending ? otherTags(pending.value) : []}
              placeholder={t("mergeInto")}
            />
          ) : null
        }
        onConfirm={apply}
      />
    </>
  )
}

function CategoriesPanel({
  onStatus,
}: {
  onStatus: (result: { drafts: number; library: number }, verb: string) => void
}) {
  const t = useTranslations("Taxonomy")
  const { categories, categoryNames } = useTaxonomyTerms()
  const renameTaxonomyCategory = useDesignStore((s) => s.renameTaxonomyCategory)
  const mergeTaxonomyCategory = useDesignStore((s) => s.mergeTaxonomyCategory)
  const clearTaxonomyCategory = useDesignStore((s) => s.clearTaxonomyCategory)
  const [pending, setPending] = usePendingAction()
  const [renameDraft, setRenameDraft] = useState("")
  const [mergeTarget, setMergeTarget] = useState("")

  const otherCats = useMemo(
    () => (value: string) => categoryNames.filter((name) => name !== value),
    [categoryNames]
  )

  const begin = (kind: ActionKind, value: string) => {
    setPending({ kind, value })
    setRenameDraft(value)
    setMergeTarget("")
  }

  const apply = () => {
    if (!pending) return
    const { kind, value } = pending
    setPending(null)
    if (kind === "rename") {
      const next = renameDraft.trim()
      if (next && next !== value)
        onStatus(renameTaxonomyCategory(value, next), t("renamed"))
    } else if (kind === "merge") {
      const target = mergeTarget.trim()
      if (target && target !== value)
        onStatus(mergeTaxonomyCategory(value, target), t("merged"))
    } else {
      onStatus(clearTaxonomyCategory(value), t("cleared"))
    }
  }

  if (categories.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        {t("emptyCategories")}
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-1">
        {categories.map((term) => (
          <li
            key={term.value}
            className="flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm">
              {term.value}
            </span>
            <CountBadge drafts={term.drafts} library={term.library} />
            <div className="flex items-center gap-1">
              <ActionButton
                label={t("rename")}
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => begin("rename", term.value)}
              />
              <ActionButton
                label={t("merge")}
                icon={<GitMerge className="h-3.5 w-3.5" />}
                onClick={() => begin("merge", term.value)}
              />
              <ActionButton
                label={t("clear")}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                tone="danger"
                onClick={() => begin("delete", term.value)}
              />
            </div>
          </li>
        ))}
      </ul>

      <ActionConfirm
        pending={pending}
        noun={t("category")}
        deleteVerb={t("clear")}
        onClose={() => setPending(null)}
        canConfirm={
          pending?.kind === "rename"
            ? renameDraft.trim().length > 0 &&
              renameDraft.trim() !== pending.value
            : pending?.kind === "merge"
              ? mergeTarget.trim().length > 0 &&
                mergeTarget.trim() !== pending.value
              : true
        }
        body={
          pending?.kind === "rename" ? (
            <FieldInput value={renameDraft} onChange={setRenameDraft} />
          ) : pending?.kind === "merge" ? (
            <CategoryCombobox
              value={mergeTarget}
              onChange={setMergeTarget}
              suggestions={pending ? otherCats(pending.value) : []}
              placeholder={t("mergeInto")}
            />
          ) : null
        }
        onConfirm={apply}
      />
    </>
  )
}

function ActionConfirm({
  pending,
  noun,
  deleteVerb,
  body,
  canConfirm,
  onClose,
  onConfirm,
}: {
  pending: PendingAction | null
  noun: string
  deleteVerb: string
  body: React.ReactNode
  canConfirm: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const t = useTranslations("Taxonomy")
  const common = useTranslations("Common")
  if (!pending) return null
  const title =
    pending.kind === "rename"
      ? t("renameTitle", { noun })
      : pending.kind === "merge"
        ? t("mergeTitle", { noun })
        : t("deleteTitle", { verb: deleteVerb, noun })
  const description =
    pending.kind === "delete"
      ? t("deleteImpact", { value: pending.value })
      : undefined

  // Delete/clear uses the simple confirm dialog (no input needed).
  if (pending.kind === "delete") {
    return (
      <ConfirmDialog
        open
        title={title}
        description={description}
        confirmLabel={deleteVerb}
        tone="destructive"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )
  }

  // Rename/merge need an input, so use the richer Dialog with an explicit
  // confirm step.
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} label={title}>
      <div className="p-6 pr-12">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {pending.kind === "merge"
            ? t("mergeImpact", { value: pending.value })
            : t("renameImpact", { value: pending.value })}
        </p>
        <div className="mt-3">{body}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {common("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {pending.kind === "merge" ? t("merge") : common("save")}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function FieldInput({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
    />
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  tone = "neutral",
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  tone?: "neutral" | "danger"
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={
        tone === "danger"
          ? "text-destructive hover:text-destructive"
          : undefined
      }
    >
      {icon}
    </Button>
  )
}
