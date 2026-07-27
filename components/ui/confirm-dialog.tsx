"use client"

import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  secondaryLabel?: string
  tone?: "default" | "destructive"
  onConfirm: () => void
  onSecondary?: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  secondaryLabel,
  tone = "default",
  onConfirm,
  onSecondary,
  onClose,
}: ConfirmDialogProps) {
  const t = useTranslations("Common")
  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-lg border bg-background p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel ?? t("cancel")}
          </Button>
          {secondaryLabel && onSecondary ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
