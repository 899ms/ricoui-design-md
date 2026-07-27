"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { useToastStore, type ToastMessage } from "@/lib/store/toast"

const ICON: Record<ToastMessage["tone"], React.ReactNode> = {
  info: <Info className="h-4 w-4 text-foreground/70" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
}

export function Toaster() {
  const t = useTranslations("Common")
  const toast = useToastStore((state) => state.toast)
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismiss, 3200)
    return () => clearTimeout(timer)
  }, [toast, dismiss])

  if (typeof document === "undefined" || !toast) return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[120] flex w-[min(92vw,360px)] -translate-x-1/2 items-start gap-2.5 rounded-lg border bg-popover/95 px-4 py-3 text-[13px] shadow-lg backdrop-blur-sm"
    >
      {ICON[toast.tone]}
      <span className="flex-1 leading-relaxed">{toast.text}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("closeToast")}
        className="text-current/60 transition-colors hover:text-current"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body
  )
}
