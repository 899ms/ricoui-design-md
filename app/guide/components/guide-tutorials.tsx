"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { SectionShell, SegmentedTabs } from "./guide-primitives"

export type TutorialKey = "create" | "edit" | "library" | "ai"

type TutorialContent = Record<
  TutorialKey,
  {
    label: string
    title: string
    outcome: string
    steps: Array<{ title: string; body: string }>
  }
>

export function TutorialsSection() {
  const t = useTranslations("Guide")
  const tutorials = (["create", "edit", "library", "ai"] as const).reduce(
    (result, key) => {
      result[key] = {
        label: t(`tutorials.${key}.label`),
        title: t(`tutorials.${key}.title`),
        outcome: t(`tutorials.${key}.outcome`),
        steps: [1, 2, 3, 4].map((index) => ({
          title: t(`tutorials.${key}.s${index}t`),
          body: t(`tutorials.${key}.s${index}b`),
        })),
      }
      return result
    },
    {} as TutorialContent
  )
  const tabItems = (Object.keys(tutorials) as TutorialKey[]).map((key) => ({
    key,
    label: tutorials[key].label,
  }))
  const [tutorial, setTutorial] = useState<TutorialKey>("create")
  const content = tutorials[tutorial]

  return (
    <SectionShell
      id="tutorials"
      eyebrow={t("sections.tutorials.eyebrow")}
      title={t("sections.tutorials.title")}
      description={t("sections.tutorials.description")}
    >
      <SegmentedTabs
        items={tabItems}
        value={tutorial}
        onChange={setTutorial}
        label={t("tutorials.select")}
      />
      <div>
        <h3 className="text-lg font-semibold tracking-normal text-foreground">
          {content.title}
        </h3>
        <div className="mt-3 rounded-md border-l-2 border-primary/45 bg-muted/30 px-4 py-3">
          <p className="text-[13px] leading-6 text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {t("tutorials.outcomeLabel")}
            </span>{" "}
            {content.outcome}
          </p>
        </div>
        <ol className="mt-6 border-y border-border/60">
          {content.steps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-2 border-b border-border/60 py-5 last:border-b-0 sm:grid-cols-[2.5rem_1fr]"
            >
              <span className="font-mono text-[11px] text-primary">
                0{index + 1}
              </span>
              <div>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="mt-1.5 text-[14px] leading-7 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  )
}
