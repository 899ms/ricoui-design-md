"use client"

import type { FormEvent, ReactNode } from "react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { useTranslations } from "next-intl"
import { PencilLine, RotateCcw, Palette, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HomeHeroCopyValue {
  eyebrow: string
  title: string
  description: string
}

const STORAGE_KEY = "design-md-editor.home-hero-copy.v1"
const STORAGE_EVENT = "design-md-editor:home-hero-copy-change"

export function HomeHeroCopy() {
  const t = useTranslations("HomeHero")
  const defaultCopy = useMemo<HomeHeroCopyValue>(
    () => ({
      eyebrow: t("eyebrow"),
      title: t("title"),
      description: t("description"),
    }),
    [t]
  )
  const copy = useStoredHomeHeroCopy(defaultCopy)
  const [editing, setEditing] = useState(false)

  const handleSave = (nextCopy: HomeHeroCopyValue) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCopy))
    window.dispatchEvent(new Event(STORAGE_EVENT))
    setEditing(false)
  }

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/75 px-3 py-1.5 text-xs text-muted-foreground shadow-[var(--shadow-sm)] backdrop-blur">
          <span className="grid h-5 w-5 place-items-center rounded-sm bg-primary/10 text-primary">
            <Palette className="h-3.5 w-3.5" />
          </span>
          {copy.eyebrow}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
          aria-label={t("edit")}
          title={t("edit")}
        >
          <PencilLine className="h-3 w-3" />
        </Button>
      </div>

      <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        {copy.description}
      </p>

      <HomeHeroCopyDialog
        open={editing}
        value={copy}
        defaultValue={defaultCopy}
        onClose={() => setEditing(false)}
        onSave={handleSave}
      />
    </>
  )
}

function HomeHeroCopyDialog({
  open,
  value,
  defaultValue,
  onClose,
  onSave,
}: {
  open: boolean
  value: HomeHeroCopyValue
  defaultValue: HomeHeroCopyValue
  onClose: () => void
  onSave: (value: HomeHeroCopyValue) => void
}) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <HomeHeroCopyDialogBody
      key={`${value.eyebrow}\n${value.title}\n${value.description}`}
      value={value}
      defaultValue={defaultValue}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function HomeHeroCopyDialogBody({
  value,
  defaultValue,
  onClose,
  onSave,
}: {
  value: HomeHeroCopyValue
  defaultValue: HomeHeroCopyValue
  onClose: () => void
  onSave: (value: HomeHeroCopyValue) => void
}) {
  const t = useTranslations("HomeHero")
  const common = useTranslations("Common")
  const [draft, setDraft] = useState(value)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave({
      eyebrow: sanitizeCopy(draft.eyebrow, defaultValue.eyebrow),
      title: sanitizeCopy(draft.title, defaultValue.title),
      description: sanitizeCopy(draft.description, defaultValue.description),
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-hero-copy-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/55 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border/70 bg-background p-5 text-left shadow-[0_30px_90px_-35px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="home-hero-copy-title" className="text-base font-semibold">
              {t("edit")}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("editDetail")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("closeEdit")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CopyField label={t("eyebrowField")}>
            <Input
              autoFocus
              value={draft.eyebrow}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  eyebrow: event.target.value,
                }))
              }
              placeholder={defaultValue.eyebrow}
            />
          </CopyField>

          <CopyField label={t("titleField")}>
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder={defaultValue.title}
            />
          </CopyField>

          <CopyField label={t("descriptionField")}>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder={defaultValue.description}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 transition-colors outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </CopyField>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDraft(defaultValue)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("reset")}
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {common("cancel")}
              </Button>
              <Button type="submit" size="sm">
                {common("save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function useStoredHomeHeroCopy(defaultValue: HomeHeroCopyValue) {
  const defaultSnapshot = useMemo(
    () => JSON.stringify(defaultValue),
    [defaultValue]
  )
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return defaultSnapshot
    return window.localStorage.getItem(STORAGE_KEY) ?? defaultSnapshot
  }, [defaultSnapshot])
  const getServerSnapshot = useCallback(
    () => defaultSnapshot,
    [defaultSnapshot]
  )
  const snapshot = useSyncExternalStore(
    subscribeToCopyChanges,
    getSnapshot,
    getServerSnapshot
  )

  return useMemo(
    () => parseCopySnapshot(snapshot, defaultValue),
    [defaultValue, snapshot]
  )
}

function subscribeToCopyChanges(callback: () => void) {
  if (typeof window === "undefined") return () => undefined

  window.addEventListener("storage", callback)
  window.addEventListener(STORAGE_EVENT, callback)

  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(STORAGE_EVENT, callback)
  }
}

function parseCopySnapshot(
  snapshot: string,
  defaultValue: HomeHeroCopyValue
): HomeHeroCopyValue {
  try {
    const parsed = JSON.parse(snapshot) as Partial<HomeHeroCopyValue>
    return {
      eyebrow: sanitizeCopy(parsed.eyebrow, defaultValue.eyebrow),
      title: sanitizeCopy(parsed.title, defaultValue.title),
      description: sanitizeCopy(parsed.description, defaultValue.description),
    }
  } catch {
    return defaultValue
  }
}

function CopyField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function sanitizeCopy(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}
