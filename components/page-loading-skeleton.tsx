import { cn } from "@/lib/utils"

export function PageLoadingSkeleton({
  variant = "gallery",
}: {
  variant?: "gallery" | "editor"
}) {
  if (variant === "editor") {
    return (
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[300px] shrink-0 border-r border-border/70 bg-background/80 p-4 lg:block">
          <div className="h-10 rounded-sm bg-muted" />
          <div className="mt-4 h-8 rounded-sm bg-muted/80" />
          <div className="mt-5 space-y-2">
            <div className="h-20 rounded-sm bg-muted/70" />
            <div className="h-20 rounded-sm bg-muted/70" />
            <div className="h-20 rounded-sm bg-muted/70" />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-14 border-b border-border/70 bg-background/90 px-5 py-3">
            <div className="h-8 max-w-xl rounded-sm bg-muted" />
          </div>
          <div className="grid min-h-0 flex-1 gap-5 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-md border border-border/70 bg-background/80" />
            <div className="rounded-md border border-border/70 bg-background/80" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(45,109,195,0.035),transparent_220px)]">
      <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-background/80 p-5 lg:block">
        <div className="h-5 w-28 rounded-sm bg-muted" />
        <div className="mt-5 h-9 rounded-sm bg-muted/80" />
        <SkeletonStack className="mt-6" />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border/70 bg-background/95 px-7 py-5">
          <div className="h-5 w-44 rounded-sm bg-muted" />
          <div className="mt-5 h-8 max-w-lg rounded-sm bg-muted" />
          <div className="mt-3 h-4 max-w-2xl rounded-sm bg-muted/80" />
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-52 rounded-md border border-border/70 bg-background/80" />
          <div className="h-52 rounded-md border border-border/70 bg-background/80" />
          <div className="h-52 rounded-md border border-border/70 bg-background/80" />
          <div className="h-52 rounded-md border border-border/70 bg-background/80" />
          <div className="h-52 rounded-md border border-border/70 bg-background/80" />
          <div className="h-52 rounded-md border border-border/70 bg-background/80" />
        </div>
      </main>
    </div>
  )
}

function SkeletonStack({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="h-8 rounded-sm bg-muted/70" />
      <div className="h-8 rounded-sm bg-muted/70" />
      <div className="h-8 rounded-sm bg-muted/70" />
      <div className="h-8 rounded-sm bg-muted/70" />
    </div>
  )
}
