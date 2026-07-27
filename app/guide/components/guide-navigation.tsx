"use client"

import type { MouseEvent } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { type GuideSectionId, useGuideSections } from "./guide-sections"

/**
 * Smooth-scroll to a guide section, then sync the URL hash without pushing a
 * history entry. The section's scroll-margin-top (see .guide-layout /
 * SectionShell) offsets the sticky header so the heading lands cleanly.
 */
function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault()
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
  window.history.replaceState(null, "", `#${id}`)
}

/** Right-side "On this page" rail (lg+). Fumadocs-style heading outline. */
export function GuideOnThisPage({ activeId }: { activeId: GuideSectionId }) {
  const t = useTranslations("Guide")
  const sections = useGuideSections()
  return (
    <nav aria-label={t("onThisPage")} className="text-sm">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {t("onThisPage")}
      </p>
      <ul className="mt-3 space-y-0.5 border-l border-border/60">
        {sections.map((section) => {
          const active = section.id === activeId
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(event) => jumpToSection(event, section.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-[13px] leading-5 transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Collapsible in-page nav for small screens (< lg). */
export function GuideMobileNavigation({
  activeId,
}: {
  activeId: GuideSectionId
}) {
  const t = useTranslations("Guide")
  const sections = useGuideSections()
  const active = sections.find((section) => section.id === activeId)
  return (
    <details className="group rounded-lg border border-border/70 bg-background/60 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-foreground">
        <span>
          {t("onThisPage")}
          {active ? (
            <span className="text-muted-foreground"> · {active.label}</span>
          ) : null}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-2 gap-1.5 border-t border-border/60 p-3">
        {sections.map((section, index) => {
          const activeItem = section.id === activeId
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => jumpToSection(event, section.id)}
              aria-current={activeItem ? "location" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors",
                activeItem
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  activeItem ? "text-primary" : "text-muted-foreground/55"
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.label}
            </a>
          )
        })}
      </div>
    </details>
  )
}
