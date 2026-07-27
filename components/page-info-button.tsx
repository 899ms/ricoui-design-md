"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog } from "@/components/ui/dialog"

interface PageInfoButtonProps {
  /** Short label shown in the hover/focus tooltip. */
  label: string
  /** Dialog title. */
  title: string
  /** Longer guidance shown on click. */
  bullets: string[]
}

/**
 * Page-local info disclosure (V7-PRD §8.3 / §9.3): a short tooltip on
 * hover/focus, a compact dialog with the full guidance on click. Keyboard
 * accessible (focusable button + focus-trapped dialog).
 */
export function PageInfoButton({ label, title, bullets }: PageInfoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={label}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
            />
          }
        >
          <Info className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        label={title}
        className="max-w-md"
        hideCloseButton={false}
      >
        <div className="p-6 pr-12">
          <h2 className="text-base font-semibold">{title}</h2>
          <ul className="mt-3 space-y-2">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </Dialog>
    </>
  )
}
