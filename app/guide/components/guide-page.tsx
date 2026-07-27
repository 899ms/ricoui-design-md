"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GitHubMark } from "@/components/github-mark"
import { GuideMobileNavigation, GuideOnThisPage } from "./guide-navigation"
import {
  FaqSection,
  FeaturesSection,
  FormatSection,
  GUIDE_SECTION_IDS,
  type GuideSectionId,
  OpenSourceSection,
  OverviewSection,
  PrivacySection,
  useGuideFaqs,
  useGuideSections,
} from "./guide-sections"
import { TutorialsSection } from "./guide-tutorials"

const SECTION_IDS = [...GUIDE_SECTION_IDS]
const VALID_IDS = new Set<string>(SECTION_IDS)
export const GUIDE_DEFAULT_SECTION_ID: GuideSectionId = "overview"

function isGuideSectionId(value: string): value is GuideSectionId {
  return VALID_IDS.has(value)
}

export function getGuideHashSectionId(hash: string) {
  const value = hash.replace(/^#/, "")
  return isGuideSectionId(value) ? value : null
}

export function GuidePage() {
  const t = useTranslations("Guide")
  const router = useRouter()
  const scrollRef = useRef<HTMLElement | null>(null)
  // Keep the first client render identical to SSR. Reading location.hash in a
  // state initializer makes a deep-linked client render differ from the
  // server's deterministic "overview" render and breaks hydration.
  const [activeId, setActiveId] = useState<GuideSectionId>(
    GUIDE_DEFAULT_SECTION_ID
  )

  // Restore a valid deep link only after hydration, then let scroll-spy own
  // the active state for subsequent scrolling.
  useEffect(() => {
    const hash = getGuideHashSectionId(window.location.hash)
    if (!hash) return
    const frame = window.requestAnimationFrame(() => {
      setActiveId(hash)
      document.getElementById(hash)?.scrollIntoView({ block: "start" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  // Scroll-spy: highlight whichever section sits in the top band, and keep
  // the URL hash in sync (replaceState, so no back-button noise).
  useEffect(() => {
    const root = scrollRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const sections = SECTION_IDS.map((id) =>
      root.querySelector(`#${id}`)
    ).filter((element): element is Element => element !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )[0]
        if (visible && isGuideSectionId(visible.target.id)) {
          setActiveId(visible.target.id)
          window.history.replaceState(null, "", `#${visible.target.id}`)
        }
      },
      { root, rootMargin: "-88px 0px -62% 0px", threshold: [0, 1] }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <main
      ref={scrollRef}
      className="guide-layout flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth bg-background"
    >
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--guide-header-h)] w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
            aria-label={t("back")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-semibold">{t("title")}</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              · RICOUI
            </span>
          </div>
          <a
            href="https://github.com/ricocc/ricoui-design-md"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            aria-label={t("openSourceRepository")}
            title={t("openSourceRepository")}
          >
            <GitHubMark className="size-4" />
            <span className="hidden sm:inline">{t("openSource")}</span>
          </a>
          <Button size="sm" render={<Link href="/editor" />}>
            {t("openWorkspace")} <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-[minmax(0,1fr)_var(--guide-toc-w)]">
          <article className="min-w-0 py-10 sm:py-14">
            <div className="max-w-[var(--guide-page-w)]">
              <GuideHero />

              <div className="mt-7 lg:hidden">
                <GuideMobileNavigation activeId={activeId} />
              </div>

              <div className="mt-12 space-y-12 lg:mt-16 lg:space-y-16">
                <OpenSourceSection />
                <OverviewSection />
                <TutorialsSection />
                <FeaturesSection />
                <FormatSection />
                <PrivacySection />
                <FaqSection />
              </div>

              <GuidePager activeId={activeId} />
              <GuideFooter />
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[var(--guide-header-h)] max-h-[calc(100svh-var(--guide-header-h))] overflow-y-auto py-10">
              <GuideOnThisPage activeId={activeId} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function GuideHero() {
  const t = useTranslations("Guide")
  const sections = useGuideSections()
  const faqs = useGuideFaqs()
  return (
    <header className="border-b border-border/60 pb-9">
      <p className="eyebrow-label">{t("eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-8 text-foreground/75 sm:text-base sm:leading-8">
        {t("intro")}
      </p>
      <div className="mt-6 flex gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
        <span className="mt-0.5 h-fit shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-primary uppercase">
          {t("betaLabel")}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("betaTitle")}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
            {t("betaDetail")}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
        <span>{t("chapterCount", { count: sections.length })}</span>
        <span className="text-border">·</span>
        <span>{t("faqCount", { count: faqs.length })}</span>
        <span className="text-border">·</span>
        <span>{t("shortcuts")}</span>
      </div>
    </header>
  )
}

function GuidePager({ activeId }: { activeId: GuideSectionId }) {
  const t = useTranslations("Guide")
  const sections = useGuideSections()
  const index = SECTION_IDS.indexOf(activeId)
  const prev = index > 0 ? sections[index - 1] : null
  const next = index < sections.length - 1 ? sections[index + 1] : null

  return (
    <nav
      aria-label={t("pagerLabel")}
      className="mt-14 grid gap-3 border-t border-border/60 pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <a
          href={`#${prev.id}`}
          className="group rounded-lg border border-border/70 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <span className="text-[11px] text-muted-foreground">
            {t("previous")}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ArrowLeft className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
            {prev.label}
          </span>
        </a>
      ) : (
        <span className="hidden sm:block" aria-hidden="true" />
      )}
      {next ? (
        <a
          href={`#${next.id}`}
          className="group rounded-lg border border-border/70 bg-background p-4 text-right transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <span className="block text-[11px] text-muted-foreground">
            {t("next")}
          </span>
          <span className="mt-1 flex items-center justify-end gap-1.5 text-sm font-semibold text-foreground">
            {next.label}
            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
      ) : (
        <Link
          href="/editor"
          className="group flex flex-col rounded-lg border border-primary/40 bg-primary/5 p-4 text-right transition-colors hover:bg-primary/10"
        >
          <span className="block text-[11px] text-muted-foreground">
            {t("ready")}
          </span>
          <span className="mt-1 flex items-center justify-end gap-1.5 text-sm font-semibold text-primary">
            {t("openWorkspace")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
    </nav>
  )
}

function GuideFooter() {
  const t = useTranslations("Guide")
  return (
    <footer className="mt-10 pb-4">
      <p className="text-[12px] leading-6 text-muted-foreground">
        {t("footer")}
      </p>
    </footer>
  )
}
