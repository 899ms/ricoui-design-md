import { type ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Shared presentational building blocks for the guide reading surface.
 * Pure (no hooks) — rendered inside the client guide tree, so no
 * "use client" directive is needed here.
 */

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}) {
  const headingId = `${id}-title`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="guide-section border-t border-border/60 pt-10 first:border-t-0 first:pt-0 scroll-mt-[var(--guide-scroll-mt)]"
    >
      <p className="eyebrow-label">{eyebrow}</p>
      <h2
        id={headingId}
        className="mt-2 text-2xl font-semibold tracking-normal text-foreground sm:text-[27px]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-8 space-y-8">{children}</div>
    </section>
  )
}

export function CheckItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <li
      className={cn(
        "flex gap-3 text-[14px] leading-7 text-muted-foreground",
        className
      )}
    >
      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
      <span>{children}</span>
    </li>
  )
}

export function CodeBlock({
  caption,
  captionTag,
  code,
}: {
  caption?: string
  captionTag?: string
  code: string
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border/70 bg-neutral-950 text-zinc-200">
      {caption ? (
        <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="font-mono text-[11px] text-zinc-300">{caption}</span>
          {captionTag ? (
            <span className="text-[9px] tracking-wider text-zinc-500 uppercase">
              {captionTag}
            </span>
          ) : null}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-6">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<{ key: T; label: string }>
  value: T
  onChange: (key: T) => void
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="segmented-control inline-flex w-full gap-1 rounded-lg p-1 sm:w-auto"
    >
      {items.map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex-1 rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none",
              active
                ? "bg-background text-foreground shadow-[var(--shadow-sm)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
