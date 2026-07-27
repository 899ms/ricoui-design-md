import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  BookOpen,
  Code2,
  Globe2,
  Lightbulb,
} from "lucide-react"
import { GitHubMark } from "@/components/github-mark"

export default async function AboutPage() {
  const t = await getTranslations("About")
  const projectThoughts = [
    {
      icon: Globe2,
      title: t("focusWebTitle"),
      detail: t("focusWebDetail"),
    },
    {
      icon: Code2,
      title: t("focusCodeTitle"),
      detail: t("focusCodeDetail"),
    },
    {
      icon: Lightbulb,
      title: t("focusCreateTitle"),
      detail: t("focusCreateDetail"),
    },
  ]

  const links = [
    {
      href: "https://ricoui.com",
      icon: Globe2,
      label: t("blogLinkLabel"),
      detail: t("blogLinkDetail"),
    },
    {
      href: "https://x.com/ricouii",
      icon: AtSign,
      label: t("xLinkLabel"),
      detail: t("xLinkDetail"),
    },
    {
      href: "https://github.com/ricocc",
      icon: GitHubMark,
      label: t("githubLinkLabel"),
      detail: t("githubLinkDetail"),
    },
  ]

  return (
    <main className="work-surface min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <Link
          href="/"
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back")}
        </Link>

        <section className="mt-8 border-b border-border/60 pb-12 sm:mt-10 sm:pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow-label">{t("eyebrow")}</p>
                <span className="rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-primary uppercase">
                  {t("betaLabel")}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl leading-[1.06] font-semibold tracking-tight sm:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-[17px]">
                {t("intro")}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link
                  href="/editor"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-btn)] transition-colors hover:bg-primary/92 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {t("openWorkspace")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/guide"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/75 bg-card/70 px-3.5 text-sm font-medium shadow-[var(--shadow-sm)] transition-colors hover:border-primary/24 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {t("readGuide")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="border-l-2 border-primary/45 pl-5">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">
                {t("betaLabel")}
              </span>
              <p className="mt-4 text-lg font-semibold tracking-tight">
                {t("betaTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("betaDetail")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <p className="eyebrow-label">{t("focusEyebrow")}</p>
          <h2 className="mt-4 max-w-2xl text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            {t("focusTitle")}
          </h2>

          <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
            {projectThoughts.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="grid gap-3 py-5 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-t border-border/60 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
            <div>
              <p className="eyebrow-label">{t("openSourceEyebrow")}</p>
              <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                {t("openSourceTitle")}
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t("openSourceDetail")}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  href="https://github.com/ricocc/ricoui-design-md"
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-md border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/30 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
                >
                  <div className="flex items-center justify-between">
                    <GitHubMark className="size-4" />
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <p className="mt-5 text-sm font-semibold tracking-tight">
                    {t("repositoryTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("repositoryDetail")}
                  </p>
                </a>
                <Link
                  href="/guide#open-source"
                  className="group rounded-md border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/30 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
                >
                  <div className="flex items-center justify-between">
                    <BookOpen className="size-4 text-primary" />
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-5 text-sm font-semibold tracking-tight">
                    {t("guideTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("guideDetail")}
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 pt-12 sm:pt-16">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
            <div>
              <Image
                src="/rico.png"
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-md border border-border/70 bg-card shadow-[var(--shadow-sm)]"
              />
              <p className="mt-4 text-lg font-semibold tracking-tight">
                {t("profileLabel")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("profileDetail")}
              </p>
            </div>

            <div>
              <p className="eyebrow-label">{t("creatorEyebrow")}</p>
              <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                {t("creatorTitle")}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t("creatorIntro")}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-md border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/30 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted/70 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold tracking-tight">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-border/60 pt-5 pb-2 text-xs leading-5 text-muted-foreground sm:mt-16">
          {t("footer")}
        </footer>
      </div>
    </main>
  )
}
