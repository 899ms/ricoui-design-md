"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagChipInputProps {
  value: string[]
  onChange: (next: string[]) => void
  suggestions?: string[]
  placeholder?: string
  id?: string
}

/**
 * Token/chip tag input (V7-PRD §7.1). Add via Enter or comma; remove via the
 * chip X or Backspace on an empty input. Existing tags surface as suggestions
 * while typing, and new tags can be created freely.
 */
export function TagChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  id,
}: TagChipInputProps) {
  const t = useTranslations("Taxonomy")
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        !value.includes(suggestion) &&
        suggestion.toLowerCase().includes(draft.trim().toLowerCase())
    )
    .slice(0, 8)
  const showSuggestions =
    draft.trim().length > 0 && filteredSuggestions.length > 0

  const commit = (raw: string) => {
    const next = raw.trim()
    if (!next) return
    if (!value.includes(next)) onChange([...value, next])
    setDraft("")
  }

  const remove = (tag: string) => onChange(value.filter((item) => item !== tag))

  return (
    <div className="rounded-lg border border-border bg-background px-2 py-1.5 focus-within:border-primary/50">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={t("removeTag", { tag })}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault()
              commit(draft)
            } else if (
              event.key === "Backspace" &&
              draft === "" &&
              value.length > 0
            ) {
              remove(value[value.length - 1])
            }
          }}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={
            value.length === 0 ? (placeholder ?? t("tagPlaceholder")) : ""
          }
          className="min-w-[80px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {showSuggestions && (
        <div className="relative">
          <div className="absolute top-1 z-30 w-full rounded-md border border-border/70 bg-popover/95 py-1 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(suggestion)
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/70"
                )}
              >
                {suggestion}
                <span className="text-[10px] text-muted-foreground">
                  {t("existing")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
