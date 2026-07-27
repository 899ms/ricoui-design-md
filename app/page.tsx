"use client"

import { useWorkspaceReady } from "@/hooks/use-workspace-ready"
import { WorkspaceDashboard } from "@/components/workspace-dashboard"

export default function Page() {
  const { ready } = useWorkspaceReady()

  if (!ready) {
    return <DashboardLoading />
  }

  return <WorkspaceDashboard />
}

function DashboardLoading() {
  return (
    <div className="work-surface min-h-0 flex-1 overflow-y-auto">
      <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="pt-8 pb-4 sm:pt-12 lg:pt-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="h-8 w-56 rounded-lg bg-muted" />
            <div className="mt-5 h-14 w-full max-w-2xl rounded-md bg-muted" />
            <div className="mt-4 h-5 w-full max-w-xl rounded-md bg-muted/80" />
            <div className="mt-8 h-24 w-full max-w-3xl rounded-2xl border border-border/70 bg-background/86 p-2 shadow-sm">
              <div className="h-11 rounded-lg bg-muted/70" />
              <div className="mt-3 flex justify-center gap-2">
                <div className="h-6 w-20 rounded-md bg-muted/60" />
                <div className="h-6 w-24 rounded-md bg-muted/60" />
                <div className="h-6 w-20 rounded-md bg-muted/60" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="h-7 w-48 rounded-md bg-muted" />
          <div className="mt-2 h-4 w-full max-w-md rounded-md bg-muted/70" />
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
            <div className="h-56 rounded-md border border-border/70 bg-background/85" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="h-56 rounded-md bg-muted/60" />
              <div className="h-56 rounded-md bg-muted/60" />
              <div className="h-56 rounded-md bg-muted/60" />
              <div className="h-56 rounded-md bg-muted/60" />
            </div>
          </div>
        </section>

        <section>
          <div className="h-7 w-44 rounded-md bg-muted" />
          <div className="mt-4 flex gap-2">
            <div className="h-8 w-20 rounded-md bg-muted/70" />
            <div className="h-8 w-24 rounded-md bg-muted/70" />
            <div className="h-8 w-24 rounded-md bg-muted/70" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-52 rounded-md bg-muted/60" />
            <div className="h-52 rounded-md bg-muted/60" />
            <div className="h-52 rounded-md bg-muted/60" />
          </div>
        </section>

        <section className="pb-6">
          <div className="h-7 w-40 rounded-md bg-muted" />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-72 rounded-md bg-muted/60" />
            <div className="h-72 rounded-md bg-muted/60" />
            <div className="h-72 rounded-md bg-muted/60" />
          </div>
        </section>
      </main>
    </div>
  )
}
