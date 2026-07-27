"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Cloud,
  Code2,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  HelpCircle,
  Library,
  LockKeyhole,
  PanelLeft,
  Search,
  ShieldCheck,
  SwatchBook,
} from "lucide-react"
import { GitHubMark } from "@/components/github-mark"
import { cn } from "@/lib/utils"
import { CheckItem, CodeBlock, SectionShell } from "./guide-primitives"

export const GUIDE_SECTION_IDS = [
  "open-source",
  "overview",
  "tutorials",
  "features",
  "format",
  "privacy",
  "faq",
] as const

export type GuideSectionId = (typeof GUIDE_SECTION_IDS)[number]

const GUIDE_SECTION_TRANSLATION_KEYS: Record<
  GuideSectionId,
  "openSource" | Exclude<GuideSectionId, "open-source">
> = {
  "open-source": "openSource",
  overview: "overview",
  tutorials: "tutorials",
  features: "features",
  format: "format",
  privacy: "privacy",
  faq: "faq",
}

export function useGuideSections() {
  const t = useTranslations("Guide")
  return GUIDE_SECTION_IDS.map((id) => ({
    id,
    label: t(`sections.${GUIDE_SECTION_TRANSLATION_KEYS[id]}.label`),
    hint: t(`sections.${GUIDE_SECTION_TRANSLATION_KEYS[id]}.hint`),
  }))
}

const FORMAT_CODE = `# Product — Style Reference
> Brand voice and rationale

**Theme:** light

## Tokens — Colors
| Name | Value | Token | Role |

## Tokens — Typography
### Type Scale

## Tokens — Spacing & Shapes
### Spacing Scale
### Border Radius

## Components
## Do's and Don'ts
## Imagery
## Layout`

export function useGuideFaqs(): Array<[question: string, answer: string]> {
  const t = useTranslations("Guide.faqs")
  return [1, 2, 3, 4, 5, 6, 7, 8].map((index) => [
    t(`q${index}`),
    t(`a${index}`),
  ])
}

export function OpenSourceSection() {
  const t = useTranslations("Guide")
  return (
    <SectionShell
      id="open-source"
      eyebrow={t("sections.openSource.eyebrow")}
      title={t("sections.openSource.title")}
      description={t("sections.openSource.description")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="https://github.com/ricocc/ricoui-design-md"
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-border/70 bg-background p-5 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <GitHubMark className="size-4 text-foreground" />
            <ExternalLink className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="mt-6 text-sm font-semibold text-foreground">
            {t("openSourceInfo.repositoryTitle")}
          </p>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            {t("openSourceInfo.repositoryDetail")}
          </p>
          <span className="mt-4 block truncate font-mono text-[11px] text-primary">
            github.com/ricocc/ricoui-design-md
          </span>
        </a>
        <a
          href="https://github.com/ricocc/ricoui-design-md/tree/main/GUIDE"
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-border/70 bg-background p-5 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <BookOpen className="size-4 text-primary" />
            <ExternalLink className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="mt-6 text-sm font-semibold text-foreground">
            {t("openSourceInfo.guideTitle")}
          </p>
          <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
            {t("openSourceInfo.guideDetail")}
          </p>
          <span className="mt-4 block truncate font-mono text-[11px] text-primary">
            /GUIDE
          </span>
        </a>
      </div>
    </SectionShell>
  )
}

export function OverviewSection() {
  const t = useTranslations("Guide")
  const paths = [
    {
      id: "tutorials",
      title: t("overview.firstTitle"),
      detail: t("overview.firstDetail"),
      Icon: FileText,
    },
    {
      id: "features",
      title: t("overview.productTitle"),
      detail: t("overview.productDetail"),
      Icon: PanelLeft,
    },
    {
      id: "format",
      title: t("overview.formatTitle"),
      detail: t("overview.formatDetail"),
      Icon: Code2,
    },
    {
      id: "faq",
      title: t("overview.solveTitle"),
      detail: t("overview.solveDetail"),
      Icon: HelpCircle,
    },
  ] as const
  const workflow = [
    t("overview.step1"),
    t("overview.step2"),
    t("overview.step3"),
    t("overview.step4"),
  ]
  return (
    <SectionShell
      id="overview"
      eyebrow={t("sections.overview.eyebrow")}
      title={t("sections.overview.title")}
      description={t("sections.overview.description")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {paths.map(({ id, title, detail, Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="group flex flex-col rounded-lg border border-border/70 bg-background p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex items-center justify-between">
              <Icon className="size-4 text-primary" />
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-6 text-sm font-semibold text-foreground">
              {title}
            </p>
            <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
              {detail}
            </p>
          </a>
        ))}
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/25 p-5">
        <p className="text-xs font-semibold text-foreground">
          {t("overview.workflow")}
        </p>
        <ol className="mt-4 space-y-3">
          {workflow.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border/70 bg-background font-mono text-[10px] text-muted-foreground">
                {index + 1}
              </span>
              <span className="pt-0.5 text-[13px] leading-6 text-foreground/85">
                {item}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  )
}

export function FeaturesSection() {
  const t = useTranslations("Guide")
  const items = [
    {
      title: t("features.workspaceTitle"),
      description: t("features.workspaceDetail"),
      Icon: FolderOpen,
      href: "/editor",
    },
    {
      title: t("features.libraryTitle"),
      description: t("features.libraryDetail"),
      Icon: Library,
      href: "/library",
    },
    {
      title: t("features.brandsTitle"),
      description: t("features.brandsDetail"),
      Icon: SwatchBook,
      href: "/brands",
    },
    {
      title: t("features.searchTitle"),
      description: t("features.searchDetail"),
      Icon: Search,
      href: "/search",
    },
  ]
  return (
    <SectionShell
      id="features"
      eyebrow={t("sections.features.eyebrow")}
      title={t("sections.features.title")}
      description={t("sections.features.description")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ title, description, Icon, href }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col rounded-lg border border-border/70 bg-background p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <Icon className="size-4 text-primary" />
            <p className="mt-6 text-sm font-semibold text-foreground">
              {title}
            </p>
            <p className="mt-1.5 flex-1 text-[13px] leading-6 text-muted-foreground">
              {description}
            </p>
            {href === "/brands" ? (
              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                {t.rich("features.brandsAttribution", {
                  getdesign: (chunks) => (
                    <a
                      href="https://getdesign.md/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {chunks}
                    </a>
                  ),
                  awesome: (chunks) => (
                    <a
                      href="https://github.com/VoltAgent/awesome-design-md"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            ) : null}
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
              {t("features.open")}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </SectionShell>
  )
}

export function FormatSection() {
  const t = useTranslations("Guide")
  const notes = [
    t("format.note1"),
    t("format.note2"),
    t("format.note3"),
    t("format.note4"),
    t("format.note5"),
  ]
  return (
    <SectionShell
      id="format"
      eyebrow={t("sections.format.eyebrow")}
      title={t("sections.format.title")}
      description={t("sections.format.description")}
    >
      <CodeBlock
        caption="DESIGN.md"
        captionTag="reference"
        code={FORMAT_CODE}
      />
      <ul className="space-y-3">
        {notes.map((note) => (
          <CheckItem key={note}>{note}</CheckItem>
        ))}
      </ul>
    </SectionShell>
  )
}

export function PrivacySection() {
  const t = useTranslations("Guide")
  const groups = [
    {
      title: t("privacy.localTitle"),
      Icon: LockKeyhole,
      items: [t("privacy.local1"), t("privacy.local2"), t("privacy.local3")],
    },
    {
      title: t("privacy.cloudTitle"),
      Icon: Cloud,
      items: [t("privacy.cloud1"), t("privacy.cloud2"), t("privacy.cloud3")],
    },
    {
      title: t("privacy.aiTitle"),
      Icon: ShieldCheck,
      items: [t("privacy.ai1"), t("privacy.ai2"), t("privacy.ai3")],
    },
    {
      title: t("privacy.filesTitle"),
      Icon: Download,
      items: [t("privacy.files1"), t("privacy.files2"), t("privacy.files3")],
    },
  ] as const
  return (
    <SectionShell
      id="privacy"
      eyebrow={t("sections.privacy.eyebrow")}
      title={t("sections.privacy.title")}
      description={t("sections.privacy.description")}
    >
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {groups.map(({ title, Icon, items }) => (
          <div key={title}>
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">{title}</p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {items.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

export function FaqSection() {
  const t = useTranslations("Guide")
  const faqs = useGuideFaqs()
  const [open, setOpen] = useState<number>(0)
  return (
    <SectionShell
      id="faq"
      eyebrow={t("sections.faq.eyebrow")}
      title={t("sections.faq.title")}
      description={t("sections.faq.description")}
    >
      <div className="border-y border-border/60">
        {faqs.map(([question, answer], index) => {
          const isOpen = open === index
          return (
            <div
              key={question}
              className="border-b border-border/60 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 py-4 text-left"
              >
                <span className="flex-1 text-[14px] font-semibold text-foreground">
                  {question}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen ? (
                <p className="pr-6 pb-5 text-[14px] leading-7 text-muted-foreground">
                  {answer}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}
