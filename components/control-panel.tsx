"use client"

import { useCallback, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useDesignStore } from "@/lib/store/design-store"
import { getStructuredEditorVisibility } from "@/lib/structured-editor-visibility"
import { HexColorPicker } from "react-colorful"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { DragInput } from "@/components/ui/drag-input"
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Layers3,
  RotateCcw,
} from "lucide-react"

function WorkflowSection({
  step,
  title,
  description,
  children,
}: {
  step: string
  title: string
  description: string
  children: React.ReactNode
}) {
  const t = useTranslations("Control")
  return (
    <section className="panel-surface p-4 lg:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0 text-[10px]"
            >
              {t("step", { step })}
            </Badge>
            <span className="tracking-[0.16em] text-muted-foreground uppercase">
              {t("structured")}
            </span>
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function PanelHeading({
  title,
  count,
  caption,
  onReset,
}: {
  title: string
  count?: number
  caption?: string
  onReset?: () => void
}) {
  const t = useTranslations("Control")
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {count !== undefined && (
            <Badge
              variant="secondary"
              className="h-5 rounded-full px-2 text-[10px]"
            >
              {count}
            </Badge>
          )}
        </div>
        {caption && (
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {caption}
          </p>
        )}
      </div>

      {onReset && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-xs" onClick={onReset}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            }
          ></TooltipTrigger>
          <TooltipContent>{t("resetSection", { title })}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function TokenCard({
  name,
  token,
  preview,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
}: {
  name: string
  token?: string
  preview?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (nextOpen: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <div className="group/card rounded-lg border border-border/70 bg-card/90 shadow-[var(--shadow-sm)] transition-colors">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setOpen(!isOpen)
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
      >
        {preview}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={name}>
            {name}
          </p>
          {token && (
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {token}
            </p>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="space-y-3 border-t border-border/70 px-4 pt-3 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

function PropRow({
  label,
  children,
  className = "",
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function ColorSwatchButton({
  color,
  onClick,
  size = 6,
}: {
  color: string
  onClick?: () => void
  size?: number
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-md border border-black/10 transition-transform hover:scale-110"
      style={{
        backgroundColor: color,
        width: `${size * 0.25}rem`,
        height: `${size * 0.25}rem`,
      }}
      title={color}
    />
  )
}

function CopyButton({ text }: { text: string }) {
  const t = useTranslations("Control")
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={handleCopy}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        }
      ></TooltipTrigger>
      <TooltipContent>{copied ? t("copied") : t("copyValue")}</TooltipContent>
    </Tooltip>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  hint?: string
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm leading-6 text-foreground transition-shadow outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_var(--ring)]"
      />
    </label>
  )
}

function toLineSeparated(items: string[]) {
  return items.join("\n")
}

function fromLineSeparated(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

type ParsedShadowValue = {
  inset: boolean
  x: string
  y: string
  blur: string
  spread: string
  color: string
}

function splitTopLevel(value: string, separator: string) {
  const parts: string[] = []
  let depth = 0
  let current = ""

  for (const character of value) {
    if (character === "(") depth += 1
    if (character === ")" && depth > 0) depth -= 1

    if (character === separator && depth === 0) {
      parts.push(current.trim())
      current = ""
      continue
    }

    current += character
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}

function isShadowLengthToken(value: string) {
  return /^-?(?:\d+|\d*\.\d+)(?:[a-z%]+)?$/i.test(value.trim())
}

function tokenizeShadowSegment(value: string) {
  const tokens: string[] = []
  let depth = 0
  let current = ""

  for (const character of value) {
    if (character === "(") depth += 1
    if (character === ")" && depth > 0) depth -= 1

    if (/\s/.test(character) && depth === 0) {
      if (current.trim()) {
        tokens.push(current.trim())
        current = ""
      }
      continue
    }

    current += character
  }

  if (current.trim()) {
    tokens.push(current.trim())
  }

  return tokens
}

function parseShadowValue(value: string): ParsedShadowValue | null {
  const layers = splitTopLevel(value, ",")
  if (layers.length !== 1) return null

  const tokens = tokenizeShadowSegment(layers[0])
  if (tokens.length < 2) return null

  let inset = false
  const normalizedTokens = tokens.filter((token) => {
    if (token.toLowerCase() === "inset") {
      inset = true
      return false
    }
    return true
  })

  let color = ""
  const lastToken = normalizedTokens.at(-1)
  if (lastToken && !isShadowLengthToken(lastToken)) {
    color = lastToken
    normalizedTokens.pop()
  }

  if (normalizedTokens.length < 2 || normalizedTokens.length > 4) {
    return null
  }

  const [x, y, blur = "0px", spread = "0px"] = normalizedTokens

  return {
    inset,
    x,
    y,
    blur,
    spread,
    color,
  }
}

function serializeShadowValue(shadow: ParsedShadowValue) {
  const parts = [shadow.x || "0px", shadow.y || "0px"]

  if (shadow.blur || shadow.spread || shadow.color) {
    parts.push(shadow.blur || "0px")
  }

  if (shadow.spread || shadow.color) {
    parts.push(shadow.spread || "0px")
  }

  if (shadow.color) {
    parts.push(shadow.color)
  }

  if (shadow.inset) {
    parts.unshift("inset")
  }

  return parts.join(" ")
}

function updateParsedShadowValue(
  value: string,
  patch: Partial<ParsedShadowValue>
) {
  const parsed = parseShadowValue(value)
  if (!parsed) return value
  return serializeShadowValue({ ...parsed, ...patch })
}

function resolveFontPreviewFamily(
  fonts: Array<{
    name: string
    token: string
    substitute: string
    role: string
    weights: number[]
  }>,
  typeRole: string
) {
  const normalizedRole = typeRole.toLowerCase()
  const roleMatcher =
    normalizedRole.includes("display") || normalizedRole.includes("heading")
      ? /(display|heading|title|hero)/i
      : /(body|text|copy|label|caption)/i

  return (
    fonts.find((font) => roleMatcher.test(font.role)) ??
    fonts.find((font) => font.substitute || font.name) ??
    null
  )
}

function StatusBanner() {
  const t = useTranslations("Control")
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t("paused")}</p>
      </div>
    </div>
  )
}

export function ControlPanel() {
  const t = useTranslations("Control")
  const tokens = useDesignStore((state) => state.tokens)
  const rawSections = useDesignStore((state) => state.rawSections)
  const parsedDocument = useDesignStore((state) => state.parsedDocument)
  const lastValidParsedDocument = useDesignStore(
    (state) => state.lastValidParsedDocument
  )
  const resetAll = useDesignStore((state) => state.resetAll)
  const parseStatus = useDesignStore((state) => state.parseStatus)
  const structuredEditingAvailable = parseStatus === "valid"

  const documentModel = parsedDocument ?? lastValidParsedDocument
  const visibility = useMemo(
    () =>
      tokens
        ? getStructuredEditorVisibility({
            tokens,
            rawSections,
            sectionSkeleton: documentModel?.sectionSkeleton ?? [],
          })
        : null,
    [documentModel, rawSections, tokens]
  )

  const workflowSummary = useMemo(() => {
    if (!tokens) return []

    return [
      {
        label: t("modeled"),
        value:
          documentModel?.sectionSkeleton.filter((section) => section.modeled)
            .length ?? 0,
      },
      {
        label: t("colorTokens"),
        value: tokens.colors.length + tokens.gradients.length,
      },
      {
        label: t("components"),
        value: tokens.components.length,
      },
      {
        label: t("guidelines"),
        value:
          rawSections.dosDonts.dos.length +
          rawSections.dosDonts.donts.length +
          (rawSections.imagery ? 1 : 0) +
          (rawSections.layout ? 1 : 0),
      },
    ].filter((item) => item.value > 0)
  }, [documentModel, rawSections, t, tokens])

  const unmodeledCount =
    documentModel?.sectionSkeleton.filter((section) => !section.modeled)
      .length ?? 0

  if (!tokens || !visibility) return null

  const workflowSections = [
    {
      key: "brand",
      title: t("brandTitle"),
      description: t("brandDetail"),
      content: (
        <>
          {visibility.brandIdentity && <BrandIdentityEditor />}
          {(visibility.colors || visibility.gradients) && (
            <div
              className={`grid gap-5 ${
                visibility.colors && visibility.gradients
                  ? "xl:grid-cols-[1.15fr_0.85fr]"
                  : ""
              }`}
            >
              {visibility.colors && <ColorsEditor />}
              {visibility.gradients && <GradientsEditor />}
            </div>
          )}
        </>
      ),
    },
    {
      key: "typography",
      title: t("typeTitle"),
      description: t("typeDetail"),
      content: (
        <TypographyEditor
          showFontFamilies={visibility.fontFamilies}
          showTypeScale={visibility.typeScale}
        />
      ),
    },
    {
      key: "surfaces",
      title: t("surfaceTitle"),
      description: t("surfaceDetail"),
      content: (
        <SurfacesEditor
          showRadius={visibility.radius}
          showShadows={visibility.shadows}
          showDensity={visibility.density}
        />
      ),
    },
    {
      key: "layout",
      title: t("layoutTitle"),
      description: t("layoutDetail"),
      content: (
        <LayoutAndSpacingEditor
          showSpacing={visibility.spacing}
          showLayoutTokens={visibility.layoutTokens}
          showLayoutProse={visibility.layoutProse}
        />
      ),
    },
    {
      key: "components",
      title: t("componentTitle"),
      description: t("componentDetail"),
      content: <ComponentsEditor />,
    },
    {
      key: "guidelines",
      title: t("guideTitle"),
      description: t("guideDetail"),
      content: (
        <GuidelinesEditor
          showDosDonts={visibility.dosDonts}
          showImagery={visibility.imagery}
          showPreviewDos={visibility.previewDos}
          showPreviewDonts={visibility.previewDonts}
          showPreviewImagery={visibility.previewImagery}
        />
      ),
    },
  ].filter((section) =>
    visibility.workflows.includes(
      section.key as (typeof visibility.workflows)[number]
    )
  )

  return (
    <div className="editor-canvas flex h-full flex-1 flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="mx-auto w-full max-w-6xl space-y-4 p-4 lg:px-6 lg:py-4">
            <div className="flex justify-end">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="sm" onClick={resetAll}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t("resetAll")}
                    </Button>
                  }
                ></TooltipTrigger>
                <TooltipContent>{t("resetAllTitle")}</TooltipContent>
              </Tooltip>
            </div>

            {!structuredEditingAvailable && <StatusBanner />}

            <div
              className={`space-y-4 ${
                structuredEditingAvailable
                  ? ""
                  : "pointer-events-none opacity-60"
              }`}
            >
              {workflowSections.map((section, index) => (
                <WorkflowSection
                  key={section.key}
                  step={String(index + 1).padStart(2, "0")}
                  title={section.title}
                  description={section.description}
                >
                  {section.content}
                </WorkflowSection>
              ))}
            </div>
          </div>
        </ScrollArea>

        <aside className="editor-sidebar hidden w-72 shrink-0 border-l border-border lg:flex lg:flex-col">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{t("summary")}</h3>
              {unmodeledCount > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {t("sourceOnlyCount", { count: unmodeledCount })}
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 p-4">
              <div className="space-y-2">
                {workflowSummary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-md border border-border/50 bg-background/60 px-3 py-2 text-sm shadow-[var(--shadow-sm)]"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                {t("modeledOnly")}
              </div>

              {unmodeledCount > 0 && (
                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  {t("sourceOnlyDetail", { count: unmodeledCount })}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}

function BrandIdentityEditor() {
  const t = useTranslations("Control")
  const meta = useDesignStore((state) => state.tokens?.meta)
  const updateMeta = useDesignStore((state) => state.updateMeta)
  const resetTab = useDesignStore((state) => state.resetTab)

  if (!meta) return null

  return (
    <div className="rounded-lg bg-muted/70 p-4">
      <PanelHeading
        title={t("identityTitle")}
        caption={t("identityCaption")}
        onReset={() => resetTab("meta")}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {t("name")}
            </span>
            <Input
              value={meta.name}
              onChange={(event) => updateMeta({ name: event.target.value })}
              className="h-10 rounded-xl"
            />
          </label>

          <TextAreaField
            label={t("description")}
            value={meta.description}
            onChange={(value) => updateMeta({ description: value })}
            rows={8}
            placeholder={t("descriptionPlaceholder")}
          />
        </div>

        <div className="rounded-lg bg-background p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {t("theme")}
          </p>
          <div className="mt-3 flex gap-2">
            {(["light", "dark"] as const).map((theme) => (
              <Button
                key={theme}
                variant={meta.theme === theme ? "secondary" : "outline"}
                size="sm"
                onClick={() => updateMeta({ theme })}
                className="flex-1 capitalize"
              >
                {theme === "light" ? t("light") : t("dark")}
              </Button>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-4">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {t("sourcePreview")}
            </p>
            <div className="mt-3 space-y-2">
              <p className="font-semibold">{meta.name || t("untitled")}</p>
              {meta.description && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {meta.description}
                </p>
              )}
              <Badge variant="outline" className="capitalize">
                {meta.theme === "light" ? t("lightTheme") : t("darkTheme")}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorsEditor() {
  const t = useTranslations("Control")
  const colors = useDesignStore((state) => state.tokens?.colors ?? [])
  const updateColor = useDesignStore((state) => state.updateColor)
  const resetTab = useDesignStore((state) => state.resetTab)
  const [editingColor, setEditingColor] = useState<number | null>(null)

  return (
    <div className="space-y-3 rounded-lg bg-muted/70 p-4">
      <PanelHeading
        title={t("colorsTitle")}
        count={colors.length}
        caption={t("colorsCaption")}
        onReset={() => resetTab("colors")}
      />

      {colors.length > 0 ? (
        colors.map((color, index) => (
          <TokenCard
            key={`${color.token}-${index}`}
            name={color.name}
            token={color.token}
            preview={
              <ColorSwatchButton
                color={color.value}
                size={8}
                onClick={() =>
                  setEditingColor(editingColor === index ? null : index)
                }
              />
            }
            open={editingColor === index}
            onOpenChange={(nextOpen) =>
              setEditingColor(nextOpen ? index : null)
            }
          >
            {editingColor === index && (
              <div className="overflow-hidden rounded-lg border">
                <HexColorPicker
                  color={color.value}
                  onChange={(value) => updateColor(index, { value })}
                  style={{ width: "100%", height: 160 }}
                />
              </div>
            )}

            <PropRow label={t("value")}>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded border border-black/10"
                  style={{ backgroundColor: color.value }}
                />
                <Input
                  value={color.value}
                  onChange={(event) =>
                    updateColor(index, { value: event.target.value })
                  }
                  className="h-7 w-24 rounded-lg font-mono text-[11px]"
                />
                <CopyButton text={color.value} />
              </div>
            </PropRow>

            <PropRow label={t("name")}>
              <Input
                value={color.name}
                onChange={(event) =>
                  updateColor(index, { name: event.target.value })
                }
                className="h-7 rounded-lg text-[11px]"
              />
            </PropRow>

            <PropRow label={t("role")}>
              <Input
                value={color.role}
                onChange={(event) =>
                  updateColor(index, { role: event.target.value })
                }
                className="h-7 rounded-lg text-[11px]"
                placeholder={t("rolePlaceholder")}
              />
            </PropRow>
          </TokenCard>
        ))
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("noColors")}
        </p>
      )}
    </div>
  )
}

function GradientsEditor() {
  const t = useTranslations("Control")
  const gradients = useDesignStore((state) => state.tokens?.gradients ?? [])
  const updateGradient = useDesignStore((state) => state.updateGradient)
  const resetTab = useDesignStore((state) => state.resetTab)

  return (
    <div className="space-y-3 rounded-lg bg-muted/70 p-4">
      <PanelHeading
        title={t("gradientsTitle")}
        count={gradients.length}
        caption={t("gradientsCaption")}
        onReset={() => resetTab("colors")}
      />

      {gradients.length > 0 ? (
        gradients.map((gradient, index) => (
          <TokenCard
            key={`${gradient.token}-${index}`}
            name={gradient.name}
            token={gradient.token}
            preview={
              <div
                className="h-7 w-7 shrink-0 rounded-xl border border-black/10"
                style={{ background: gradient.value }}
              />
            }
          >
            <div
              className="h-10 w-full rounded-xl"
              style={{ background: gradient.value }}
            />

            <PropRow label={t("value")}>
              <Input
                value={gradient.value}
                onChange={(event) =>
                  updateGradient(index, { value: event.target.value })
                }
                className="h-7 font-mono text-[11px]"
              />
            </PropRow>

            <PropRow label={t("role")}>
              <Input
                value={gradient.role}
                onChange={(event) =>
                  updateGradient(index, { role: event.target.value })
                }
                className="h-7 text-[11px]"
              />
            </PropRow>
          </TokenCard>
        ))
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("noGradients")}
        </p>
      )}
    </div>
  )
}

function TypographyEditor({
  showFontFamilies,
  showTypeScale,
}: {
  showFontFamilies: boolean
  showTypeScale: boolean
}) {
  const t = useTranslations("Control")
  const typography = useDesignStore((state) => state.tokens?.typography)
  const updateFontFamily = useDesignStore((state) => state.updateFontFamily)
  const updateTypeScale = useDesignStore((state) => state.updateTypeScale)
  const resetTab = useDesignStore((state) => state.resetTab)
  const [previewText, setPreviewText] = useState(t("previewCopyDefault"))
  const [selectedWeights, setSelectedWeights] = useState<
    Record<number, number>
  >({})

  if (!typography) return null

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-muted/70 p-4">
        <PanelHeading
          title={t("previewCopyTitle")}
          caption={t("previewCopyCaption")}
        />
        <div className="mt-4">
          <Input
            value={previewText}
            onChange={(event) => setPreviewText(event.target.value)}
            className="h-10 rounded-xl"
            placeholder={t("previewCopyPlaceholder")}
          />
        </div>
      </div>

      <div
        className={`grid gap-5 ${
          showFontFamilies && showTypeScale
            ? "xl:grid-cols-[0.95fr_1.05fr]"
            : ""
        }`}
      >
        <div
          className={`min-w-0 space-y-3 rounded-lg bg-muted/70 p-4 ${
            showFontFamilies ? "" : "hidden"
          }`}
        >
          <PanelHeading
            title={t("fontTitle")}
            count={typography.fontFamilies.length}
            caption={t("fontCaption")}
            onReset={() => resetTab("typography")}
          />

          {typography.fontFamilies.length > 0 ? (
            typography.fontFamilies.map((font, index) => {
              const selectedWeight =
                selectedWeights[index] ?? font.weights[0] ?? 400

              return (
                <TokenCard
                  key={`${font.token}-${index}`}
                  name={font.name}
                  token={font.token}
                  preview={
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border text-xs font-bold">
                      Aa
                    </div>
                  }
                >
                  <PropRow label={t("fallback")}>
                    <Input
                      value={font.substitute}
                      onChange={(event) =>
                        updateFontFamily(index, {
                          substitute: event.target.value,
                        })
                      }
                      className="h-7 font-mono text-[11px]"
                    />
                  </PropRow>

                  <PropRow label={t("weights")}>
                    <Input
                      value={font.weights.join(", ")}
                      onChange={(event) => {
                        const weights = event.target.value
                          .split(",")
                          .map((weight) => Number.parseInt(weight.trim(), 10))
                          .filter((weight) => !Number.isNaN(weight))
                        updateFontFamily(index, { weights })
                        setSelectedWeights((current) => {
                          const next = { ...current }
                          if (weights.length === 0) {
                            delete next[index]
                          } else if (
                            !weights.includes(current[index] ?? weights[0])
                          ) {
                            next[index] = weights[0]
                          }
                          return next
                        })
                      }}
                      className="h-7 font-mono text-[11px]"
                    />
                  </PropRow>

                  <PropRow label={t("role")}>
                    <Input
                      value={font.role}
                      onChange={(event) =>
                        updateFontFamily(index, { role: event.target.value })
                      }
                      className="h-7 text-[11px]"
                    />
                  </PropRow>

                  {font.weights.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {t("previewWeight")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {font.weights.map((weight) => (
                          <Button
                            key={`${font.token}-${weight}`}
                            variant={
                              selectedWeight === weight
                                ? "secondary"
                                : "outline"
                            }
                            size="xs"
                            onClick={() =>
                              setSelectedWeights((current) => ({
                                ...current,
                                [index]: weight,
                              }))
                            }
                          >
                            {weight}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="rounded-lg bg-muted/50 p-3"
                    style={{
                      fontFamily: font.substitute || font.name,
                      fontWeight: selectedWeight,
                    }}
                  >
                    <p className="text-lg">{previewText}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {font.role || t("unlabeledRole")} ·{" "}
                      {t("weightValue", { weight: selectedWeight })}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      ABCDEFGHIJKLMNOPQRSTUVWXYZ
                    </p>
                    <p className="text-xs text-muted-foreground">
                      abcdefghijklmnopqrstuvwxyz 0123456789
                    </p>
                  </div>
                </TokenCard>
              )
            })
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noFonts")}
            </p>
          )}
        </div>

        <div
          className={`min-w-0 space-y-3 rounded-lg bg-muted/70 p-4 ${
            showTypeScale ? "" : "hidden"
          }`}
        >
          <PanelHeading
            title={t("typeScaleTitle")}
            count={typography.typeScale.length}
            caption={t("typeScaleCaption")}
            onReset={() => resetTab("typography")}
          />

          {typography.typeScale.length > 0 ? (
            typography.typeScale.map((style, index) => {
              const previewFont = resolveFontPreviewFamily(
                typography.fontFamilies,
                style.role
              )
              const previewFontIndex = previewFont
                ? typography.fontFamilies.findIndex(
                    (font) => font.token === previewFont.token
                  )
                : -1
              const previewWeight =
                previewFontIndex >= 0
                  ? (selectedWeights[previewFontIndex] ??
                    previewFont?.weights[0] ??
                    400)
                  : 400

              return (
                <TokenCard
                  key={`${style.token}-${index}`}
                  name={style.role}
                  token={style.token}
                  preview={
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  }
                >
                  <PropRow label={t("fontSize")}>
                    <DragInput
                      value={style.size}
                      onChange={(value) =>
                        updateTypeScale(index, { size: value })
                      }
                      min={6}
                      max={200}
                      step={1}
                    />
                  </PropRow>

                  <PropRow label={t("lineHeight")}>
                    <DragInput
                      value={style.lineHeight}
                      onChange={(value) =>
                        updateTypeScale(index, { lineHeight: value })
                      }
                      min={0.5}
                      max={4}
                      step={0.1}
                    />
                  </PropRow>

                  <PropRow label={t("letterSpacing")}>
                    <DragInput
                      value={style.letterSpacing || "0px"}
                      onChange={(value) =>
                        updateTypeScale(index, { letterSpacing: value })
                      }
                      min={-5}
                      max={20}
                      step={0.1}
                    />
                  </PropRow>

                  <div
                    className="rounded-lg bg-muted/50 p-3"
                    style={{
                      fontFamily: previewFont?.substitute || previewFont?.name,
                      fontWeight: previewWeight,
                      fontSize: style.size,
                      lineHeight: style.lineHeight,
                      letterSpacing: style.letterSpacing,
                    }}
                  >
                    <p className="text-foreground">{previewText}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {previewFont?.name || t("systemPreview")} ·{" "}
                      {t("weightValue", { weight: previewWeight })}
                    </p>
                  </div>
                </TokenCard>
              )
            })
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noTypeScale")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SurfacesEditor({
  showRadius,
  showShadows,
  showDensity,
}: {
  showRadius: boolean
  showShadows: boolean
  showDensity: boolean
}) {
  const t = useTranslations("Control")
  const radius = useDesignStore((state) => state.tokens?.radius ?? [])
  const shadows = useDesignStore((state) => state.tokens?.shadows ?? [])
  const density = useDesignStore((state) => state.rawSections.density)
  const updateRadius = useDesignStore((state) => state.updateRadius)
  const updateShadow = useDesignStore((state) => state.updateShadow)
  const resetTab = useDesignStore((state) => state.resetTab)
  const visiblePanelCount =
    Number(showRadius) + Number(showShadows) + Number(showDensity)

  return (
    <div
      className={`grid gap-5 ${visiblePanelCount > 1 ? "xl:grid-cols-2" : ""}`}
    >
      <div
        className={`space-y-3 rounded-lg bg-muted/70 p-4 ${
          showRadius ? "" : "hidden"
        }`}
      >
        <PanelHeading
          title={t("radiiTitle")}
          count={radius.length}
          caption={t("radiiCaption")}
          onReset={() => resetTab("radius")}
        />

        {radius.length > 0 ? (
          radius.map((radiusToken, index) => (
            <TokenCard
              key={`${radiusToken.token}-${index}`}
              name={radiusToken.name}
              token={radiusToken.token}
              preview={
                <div
                  className="h-7 w-7 shrink-0 border-2 border-primary"
                  style={{ borderRadius: radiusToken.value }}
                />
              }
            >
              <PropRow label={t("value")}>
                <DragInput
                  value={radiusToken.value}
                  onChange={(value) => updateRadius(index, { value })}
                  min={0}
                  max={999}
                  step={2}
                />
                <CopyButton text={radiusToken.value} />
              </PropRow>

              <div className="flex items-center justify-center">
                <div
                  className="h-16 w-16 border-2 border-primary/40 bg-primary/10 transition-all"
                  style={{ borderRadius: radiusToken.value }}
                />
              </div>
            </TokenCard>
          ))
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noRadii")}
          </p>
        )}
      </div>

      <div
        className={`space-y-3 rounded-lg bg-muted/70 p-4 ${
          showShadows ? "" : "hidden"
        }`}
      >
        <PanelHeading
          title={t("shadowsTitle")}
          count={shadows.length}
          caption={t("shadowsCaption")}
          onReset={() => resetTab("shadows")}
        />

        {shadows.length > 0 ? (
          shadows.map((shadow, index) => {
            const parsedShadow = parseShadowValue(shadow.value)

            return (
              <TokenCard
                key={`${shadow.token}-${index}`}
                name={shadow.name}
                token={shadow.token}
                preview={
                  <div
                    className="h-7 w-7 shrink-0 rounded-xl bg-card"
                    style={{ boxShadow: shadow.value }}
                  />
                }
              >
                <PropRow label={t("value")}>
                  <Input
                    value={shadow.value}
                    onChange={(event) =>
                      updateShadow(index, { value: event.target.value })
                    }
                    className="h-7 font-mono text-[11px]"
                  />
                  <CopyButton text={shadow.value} />
                </PropRow>

                {parsedShadow ? (
                  <>
                    <PropRow label={t("mode")}>
                      <div className="flex items-center rounded-full border bg-muted/30 p-1">
                        <Button
                          variant={!parsedShadow.inset ? "secondary" : "ghost"}
                          size="xs"
                          onClick={() =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                inset: false,
                              }),
                            })
                          }
                        >
                          {t("outerShadow")}
                        </Button>
                        <Button
                          variant={parsedShadow.inset ? "secondary" : "ghost"}
                          size="xs"
                          onClick={() =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                inset: true,
                              }),
                            })
                          }
                        >
                          {t("innerShadow")}
                        </Button>
                      </div>
                    </PropRow>

                    <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {t("xOffset")}
                        </p>
                        <DragInput
                          value={parsedShadow.x}
                          onChange={(value) =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                x: value,
                              }),
                            })
                          }
                          min={-200}
                          max={200}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {t("yOffset")}
                        </p>
                        <DragInput
                          value={parsedShadow.y}
                          onChange={(value) =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                y: value,
                              }),
                            })
                          }
                          min={-200}
                          max={200}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {t("blur")}
                        </p>
                        <DragInput
                          value={parsedShadow.blur}
                          onChange={(value) =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                blur: value,
                              }),
                            })
                          }
                          min={0}
                          max={400}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {t("spread")}
                        </p>
                        <DragInput
                          value={parsedShadow.spread}
                          onChange={(value) =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                spread: value,
                              }),
                            })
                          }
                          min={-200}
                          max={200}
                          step={1}
                        />
                      </div>
                    </div>

                    <PropRow label={t("colorsTitle")} className="items-start">
                      <div className="flex w-full items-center gap-2">
                        {parsedShadow.color ? (
                          <div
                            className="h-4 w-4 shrink-0 rounded border border-black/10"
                            style={{ backgroundColor: parsedShadow.color }}
                          />
                        ) : (
                          <div className="h-4 w-4 shrink-0 rounded border border-dashed border-border" />
                        )}
                        <Input
                          value={parsedShadow.color}
                          onChange={(event) =>
                            updateShadow(index, {
                              value: updateParsedShadowValue(shadow.value, {
                                color: event.target.value,
                              }),
                            })
                          }
                          placeholder="rgba(15, 23, 42, 0.16)"
                          className="h-7 font-mono text-[11px]"
                        />
                      </div>
                    </PropRow>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed px-3 py-3 text-xs leading-5 text-muted-foreground">
                    {t("complexShadow")}
                  </div>
                )}

                <div className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-3">
                  <div
                    className="rounded-lg bg-background p-3"
                    style={{ boxShadow: shadow.value }}
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {t("card")}
                    </p>
                  </div>
                  <div
                    className="rounded-full bg-background px-4 py-3"
                    style={{ boxShadow: shadow.value }}
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {t("label")}
                    </p>
                  </div>
                  <div
                    className="rounded-xl bg-background p-3"
                    style={{ boxShadow: shadow.value }}
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {t("panel")}
                    </p>
                  </div>
                </div>
              </TokenCard>
            )
          })
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noShadows")}
          </p>
        )}
      </div>

      {showDensity && density && (
        <div className="rounded-lg bg-muted/70 p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {t("density")}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {density}
          </p>
        </div>
      )}
    </div>
  )
}

function LayoutAndSpacingEditor({
  showSpacing,
  showLayoutTokens,
  showLayoutProse,
}: {
  showSpacing: boolean
  showLayoutTokens: boolean
  showLayoutProse: boolean
}) {
  const t = useTranslations("Control")
  const spacing = useDesignStore((state) => state.tokens?.spacing ?? [])
  const layout = useDesignStore((state) => state.tokens?.layout)
  const layoutProse = useDesignStore((state) => state.rawSections.layout)
  const updateSpacing = useDesignStore((state) => state.updateSpacing)
  const updateLayout = useDesignStore((state) => state.updateLayout)
  const updateLayoutProse = useDesignStore((state) => state.updateLayoutProse)
  const resetTab = useDesignStore((state) => state.resetTab)
  const visiblePanelCount =
    Number(showSpacing) + Number(showLayoutTokens) + Number(showLayoutProse)

  if (!layout) return null

  const layoutFields: {
    key: keyof typeof layout
    label: string
    max: number
    step: number
  }[] = [
    { key: "sectionGap", label: t("sectionGap"), max: 200, step: 4 },
    { key: "cardPadding", label: t("cardPadding"), max: 100, step: 4 },
    { key: "elementGap", label: t("elementGap"), max: 100, step: 2 },
    {
      key: "maxContentWidth",
      label: t("maxContentWidth"),
      max: 2000,
      step: 16,
    },
  ]

  return (
    <div
      className={`grid gap-5 ${visiblePanelCount > 1 ? "xl:grid-cols-2" : ""}`}
    >
      <div
        className={`space-y-3 rounded-lg bg-muted/70 p-4 ${
          showSpacing ? "" : "hidden"
        }`}
      >
        <PanelHeading
          title={t("spacingTitle")}
          count={spacing.length}
          caption={t("spacingCaption")}
          onReset={() => resetTab("spacing")}
        />

        {spacing.length > 0 ? (
          spacing.map((space, index) => (
            <TokenCard
              key={`${space.token}-${index}`}
              name={space.name}
              token={space.token}
              preview={
                <div className="flex h-7 shrink-0 items-end">
                  <div
                    className="rounded-sm bg-primary/30"
                    style={{
                      width: Math.min(28, parsePx(space.value)),
                      height: Math.min(28, parsePx(space.value)),
                    }}
                  />
                </div>
              }
            >
              <PropRow label={t("value")}>
                <DragInput
                  value={space.value}
                  onChange={(value) => updateSpacing(index, { value })}
                  min={0}
                  max={500}
                  step={4}
                />
                <CopyButton text={space.value} />
              </PropRow>

              <div className="flex items-center gap-2">
                <div
                  className="h-3 rounded bg-primary/20"
                  style={{ width: `${Math.min(100, parsePx(space.value))}%` }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {space.value}
                </span>
              </div>
            </TokenCard>
          ))
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noSpacing")}
          </p>
        )}
      </div>

      <div
        className={`space-y-3 rounded-lg border border-border bg-muted/20 p-4 ${
          showLayoutProse ? "" : "hidden"
        }`}
      >
        <PanelHeading
          title={t("layoutNotesTitle")}
          caption={t("layoutNotesCaption")}
          onReset={() => resetTab("layout-prose")}
        />

        <TextAreaField
          label={t("narrative")}
          value={layoutProse}
          onChange={updateLayoutProse}
          rows={6}
          placeholder={t("layoutPlaceholder")}
          hint={t("layoutHint")}
        />
      </div>

      <div
        className={`space-y-3 rounded-lg bg-muted/70 p-4 ${
          showLayoutTokens ? "" : "hidden"
        }`}
      >
        <PanelHeading
          title={t("layoutTokenTitle")}
          caption={t("layoutTokenCaption")}
          onReset={() => resetTab("layout")}
        />

        <div className="space-y-3 rounded-lg bg-background p-4">
          {layoutFields.map((field) => (
            <PropRow key={field.key} label={field.label}>
              <DragInput
                value={layout[field.key]}
                onChange={(value) => updateLayout({ [field.key]: value })}
                min={0}
                max={field.max}
                step={field.step}
              />
            </PropRow>
          ))}
        </div>

        <div className="rounded-lg bg-background p-4">
          <p className="mb-2 text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            {t("preview")}
          </p>
          <div
            className="mx-auto space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3"
            style={{ maxWidth: layout.maxContentWidth }}
          >
            <div
              className="rounded-xl bg-primary/10 p-2 text-center text-[10px]"
              style={{ padding: layout.cardPadding }}
            >
              {t("section")}
            </div>
            <div className="flex" style={{ gap: layout.elementGap }}>
              <div className="flex-1 rounded-xl bg-muted p-2 text-center text-[10px]">
                A
              </div>
              <div className="flex-1 rounded-xl bg-muted p-2 text-center text-[10px]">
                B
              </div>
            </div>
            <div style={{ height: layout.sectionGap }} />
            <div
              className="rounded-xl bg-primary/10 p-2 text-center text-[10px]"
              style={{ padding: layout.cardPadding }}
            >
              {t("section")}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComponentsEditor() {
  const t = useTranslations("Control")
  const components = useDesignStore((state) => state.tokens?.components ?? [])
  const updateComponent = useDesignStore((state) => state.updateComponent)
  const resetTab = useDesignStore((state) => state.resetTab)

  return (
    <div className="space-y-3 rounded-lg bg-muted/70 p-4">
      <PanelHeading
        title={t("componentsTitle")}
        count={components.length}
        caption={t("componentsCaption")}
        onReset={() => resetTab("components")}
      />

      {components.length > 0 ? (
        components.map((component, index) => (
          <TokenCard
            key={`${component.name}-${index}`}
            name={
              component.name || t("componentFallback", { count: index + 1 })
            }
            preview={
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border text-[11px] font-semibold">
                {index + 1}
              </div>
            }
            defaultOpen={index === 0}
          >
            <label className="block space-y-2">
              <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t("title")}
              </span>
              <Input
                value={component.name}
                onChange={(event) =>
                  updateComponent(index, { name: event.target.value })
                }
                className="h-10 rounded-xl"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t("role")}
              </span>
              <Input
                value={component.role}
                onChange={(event) =>
                  updateComponent(index, { role: event.target.value })
                }
                className="h-10 rounded-xl"
                placeholder={t("componentRolePlaceholder")}
              />
            </label>

            <TextAreaField
              label={t("description")}
              value={component.description}
              onChange={(value) =>
                updateComponent(index, { description: value })
              }
              rows={5}
              placeholder={t("componentDescriptionPlaceholder")}
              hint={t("componentHint")}
            />
          </TokenCard>
        ))
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("noComponents")}
        </p>
      )}
    </div>
  )
}

function GuidelinesEditor({
  showDosDonts,
  showImagery,
  showPreviewDos,
  showPreviewDonts,
  showPreviewImagery,
}: {
  showDosDonts: boolean
  showImagery: boolean
  showPreviewDos: boolean
  showPreviewDonts: boolean
  showPreviewImagery: boolean
}) {
  const t = useTranslations("Control")
  const dos = useDesignStore((state) => state.rawSections.dosDonts.dos)
  const donts = useDesignStore((state) => state.rawSections.dosDonts.donts)
  const imagery = useDesignStore((state) => state.rawSections.imagery)
  const updateDosDonts = useDesignStore((state) => state.updateDosDonts)
  const updateImagery = useDesignStore((state) => state.updateImagery)
  const resetTab = useDesignStore((state) => state.resetTab)
  const showPreview = showPreviewDos || showPreviewDonts || showPreviewImagery

  return (
    <div
      className={`grid gap-5 ${showPreview ? "xl:grid-cols-[1fr_1fr]" : ""}`}
    >
      <div className="space-y-5">
        <div
          className={`space-y-3 rounded-lg bg-muted/70 p-4 ${
            showDosDonts ? "" : "hidden"
          }`}
        >
          <PanelHeading
            title={t("dosTitle")}
            count={dos.length + donts.length}
            caption={t("dosCaption")}
            onReset={() => resetTab("dos-donts")}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <TextAreaField
              label={t("do")}
              value={toLineSeparated(dos)}
              onChange={(value) =>
                updateDosDonts("dos", fromLineSeparated(value))
              }
              rows={8}
              placeholder={t("doPlaceholder")}
              hint={t("onePerLine")}
            />

            <TextAreaField
              label={t("dont")}
              value={toLineSeparated(donts)}
              onChange={(value) =>
                updateDosDonts("donts", fromLineSeparated(value))
              }
              rows={8}
              placeholder={t("dontPlaceholder")}
              hint={t("onePerLine")}
            />
          </div>
        </div>

        <div
          className={`space-y-3 rounded-lg bg-muted/70 p-4 ${
            showImagery ? "" : "hidden"
          }`}
        >
          <PanelHeading
            title={t("imageryTitle")}
            caption={t("imageryCaption")}
            onReset={() => resetTab("imagery")}
          />

          <TextAreaField
            label={t("imageryDirection")}
            value={imagery}
            onChange={updateImagery}
            rows={8}
            placeholder={t("imageryPlaceholder")}
            hint={t("imageryHint")}
          />
        </div>
      </div>

      <div
        className={`rounded-lg bg-muted/70 p-4 ${showPreview ? "" : "hidden"}`}
      >
        <PanelHeading
          title={t("guidePreviewTitle")}
          caption={t("guidePreviewCaption")}
        />

        <div className="mt-4 space-y-4">
          <div
            className={`rounded-lg bg-background p-4 ${
              showPreviewDos ? "" : "hidden"
            }`}
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
              {t("do")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {dos.map((item, index) => (
                <li key={`do-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`rounded-lg bg-background p-4 ${
              showPreviewDonts ? "" : "hidden"
            }`}
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-rose-700 uppercase">
              {t("dont")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {donts.map((item, index) => (
                <li key={`dont-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`rounded-lg bg-background p-4 ${
              showPreviewImagery ? "" : "hidden"
            }`}
          >
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {t("imageryReview")}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {imagery}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function parsePx(value: string): number {
  const match = value.match(/^-?([\d.]+)\s*(px|rem|em)?/)
  if (!match) return 0
  const number = Number.parseFloat(match[1])
  const unit = match[2] || "px"
  if (unit === "rem" || unit === "em") return number * 16
  return number
}
