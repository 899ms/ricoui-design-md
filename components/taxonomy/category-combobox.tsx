"use client"

import { Autocomplete } from "@base-ui/react/autocomplete"
import { useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"

interface CategoryComboboxProps {
  value: string
  onChange: (next: string) => void
  suggestions?: string[]
  placeholder?: string
  id?: string
}

/**
 * Category combobox (V7-PRD §7.1): pick an existing category or type to
 * create a new one. Free-text remains valid — selecting a suggestion just
 * fills the field.
 */
export function CategoryCombobox({
  value,
  onChange,
  suggestions = [],
  placeholder,
  id,
}: CategoryComboboxProps) {
  const t = useTranslations("Taxonomy")

  const filtered = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(value.trim().toLowerCase()) &&
      suggestion !== value
  )

  return (
    <Autocomplete.Root
      items={filtered}
      mode="none"
      value={value}
      onValueChange={onChange}
      openOnInputClick
    >
      <div className="relative">
        <Autocomplete.Input
          id={id}
          placeholder={placeholder ?? t("categoryPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
      {filtered.length > 0 && (
        <Autocomplete.Portal>
          <Autocomplete.Positioner
            align="start"
            sideOffset={4}
            positionMethod="fixed"
            className="z-[150] w-[var(--anchor-width)]"
          >
            <Autocomplete.Popup className="max-h-[min(14rem,var(--available-height))] overflow-y-auto rounded-md border border-border/70 bg-popover/95 py-1 shadow-[var(--shadow-lg)] backdrop-blur-xl">
              <Autocomplete.List>
                {(suggestion: string) => (
                  <Autocomplete.Item
                    key={suggestion}
                    value={suggestion}
                    className="flex w-full cursor-default items-center px-3 py-1.5 text-left text-sm transition-colors outline-none hover:bg-muted/70 data-[highlighted]:bg-muted/70"
                  >
                    <span className="truncate">{suggestion}</span>
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      )}
    </Autocomplete.Root>
  )
}
