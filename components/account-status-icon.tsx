import { CircleUserRound } from "lucide-react"
import { cn } from "@/lib/utils"

export function AccountStatusIcon({
  connected,
  className,
}: {
  connected: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative grid size-4 place-items-center", className)}
    >
      <CircleUserRound className="size-full" />
      <span
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-1.5 rounded-full ring-2 ring-background",
          connected ? "bg-emerald-500" : "bg-muted-foreground/45"
        )}
      />
    </span>
  )
}
