"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  side?: "bottom" | "left" | "right"
  className?: string
}

export function Sheet({
  open,
  onClose,
  children,
  side = "right",
  className,
}: SheetProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet panel */}
      <div
        className={cn(
          "fixed z-50 bg-background shadow-xl transition-transform",
          side === "left" && "inset-y-0 left-0 w-[320px] border-r",
          side === "right" && "inset-y-0 right-0 w-[320px] border-l",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[80vh] rounded-t-lg border-t",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}
