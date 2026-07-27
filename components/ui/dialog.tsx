"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  overlayClassName?: string
  /** Hides the default close (X) button. */
  hideCloseButton?: boolean
  /** Accessible label announced when no visible Title is rendered. */
  label?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Lightweight accessible dialog built on the same portal pattern as
 * ConfirmDialog/Sheet. Adds Escape-to-close, Tab focus trapping, focus
 * return to the opener, and scroll lock — no new dependency.
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  overlayClassName,
  hideCloseButton,
  label,
}: DialogProps) {
  const t = useTranslations("Common")
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  // Hold the latest onOpenChange in a ref so the keydown effect can depend on
  // [open] alone. Otherwise an unstable inline onOpenChange (e.g. AccountDialog
  // passes `(next) => !next && onClose()`) makes the effect re-run on every
  // parent render, re-focusing the first focusable element and stealing focus
  // from an input on each keystroke.
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    if (!open || typeof document === "undefined") return
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    const getFocusable = () =>
      container
        ? (Array.from(
            container.querySelectorAll<HTMLElement>(FOCUSABLE)
          ) as HTMLElement[])
        : []

    const initial = getFocusable()[0]
    const target = initial ?? container
    target?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onOpenChangeRef.current(false)
        return
      }
      if (event.key === "Tab") {
        const items = getFocusable()
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [open])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm",
        overlayClassName
      )}
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "relative mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border bg-background shadow-xl outline-none",
          className
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("close")}
            className="absolute top-3.5 right-3.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
