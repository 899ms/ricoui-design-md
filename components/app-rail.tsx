"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  FolderOpen,
  HelpCircle,
  House,
  Info,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  SwatchBook,
} from "lucide-react"
import { useAiSettingsDialog } from "@/components/ai-settings-dialog-provider"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { AccountStatusIcon } from "@/components/account-status-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { cn } from "@/lib/utils"

interface RailItem {
  href?: string
  prefetch?: boolean
  label: string
  shortLabel: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
  onSelect?: () => void
  activeBadge?: boolean
  shortcut?: string
}

const NAV_ITEMS = [
  {
    id: "home",
    href: "/",
    prefetch: false,
    labelKey: "home",
    shortLabelKey: "home",
    icon: House,
    match: (pathname: string) => pathname === "/",
  },
  {
    id: "workspace",
    href: "/editor",
    prefetch: true,
    labelKey: "workspace",
    shortLabelKey: "workspaceShort",
    icon: FolderOpen,
    match: (pathname: string) =>
      pathname.startsWith("/workspace") ||
      pathname.startsWith("/editor") ||
      pathname.startsWith("/documents"),
  },
  {
    id: "library",
    href: "/library",
    prefetch: true,
    labelKey: "library",
    shortLabelKey: "libraryShort",
    icon: Library,
    match: (pathname: string) =>
      pathname.startsWith("/library") || pathname.startsWith("/themes"),
  },
  {
    id: "brands",
    href: "/brands",
    prefetch: true,
    labelKey: "brands",
    shortLabelKey: "brands",
    icon: SwatchBook,
    match: (pathname: string) => pathname.startsWith("/brands"),
  },
]

export function AppRail({ onOpenSearch }: { onOpenSearch: () => void }) {
  const t = useTranslations("Navigation")
  const pathname = usePathname() ?? "/"
  const railExpanded = useUiPreferences((state) => state.railExpanded)
  const toggleRailExpanded = useUiPreferences(
    (state) => state.toggleRailExpanded
  )
  const openAiSettings = useAiSettingsDialog()
  const { configured: cloudConfigured, openAccount, user } = useAccountDialog()
  const activeSearch = pathname.startsWith("/search")

  const items: RailItem[] = [
    ...NAV_ITEMS.map((item) => ({
      ...item,
      label: t(item.labelKey),
      shortLabel: t(item.shortLabelKey),
    })),
    {
      label: t("search"),
      shortLabel: t("search"),
      icon: Search,
      onSelect: onOpenSearch,
      activeBadge: activeSearch,
      shortcut: "Ctrl K / ⌘ K",
    },
  ]

  return (
    <>
      <aside
        aria-label={t("main")}
        className={cn(
          "app-chrome relative flex h-svh shrink-0 flex-col border-r border-border/60 transition-[width] duration-200 ease-out",
          railExpanded ? "w-56" : "w-16"
        )}
      >
        <div
          className={cn(
            "flex h-12 shrink-0 items-center",
            railExpanded ? "gap-1 px-2" : "justify-center px-2"
          )}
        >
          {railExpanded ? (
            <>
              <Link
                href="/"
                prefetch={false}
                className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 text-foreground transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/30"
                aria-label={t("logoHome")}
              >
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md border border-border/70 bg-card shadow-[var(--shadow-sm)] transition-colors group-hover:border-primary/35">
                  <Image
                    src="/logo.png"
                    alt=""
                    width={32}
                    height={32}
                    priority
                    className="size-full object-cover"
                  />
                </span>
                <span className="flex min-w-0 items-center justify-start gap-1">
                  <span className="text-md inline-block truncate leading-4 font-semibold">
                    RICOUI
                  </span>
                  <span className="inline-block truncate rounded-full border-[0.5px] border-border/85 px-1.5 py-0.5 text-[10px] leading-3 text-muted-foreground">
                    Beta
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={toggleRailExpanded}
                aria-label={t("collapse")}
                className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted/55 hover:text-foreground"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleRailExpanded}
              aria-label={t("expand")}
              title={t("expand")}
              className="group relative grid size-10 place-items-center rounded-lg outline-none hover:bg-muted/55 focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span className="grid size-8 place-items-center overflow-hidden rounded-md border border-border/70 bg-card shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-0 group-focus-visible:opacity-0">
                <Image
                  src="/logo.png"
                  alt=""
                  width={32}
                  height={32}
                  priority
                  className="size-full object-cover"
                />
              </span>
              <PanelLeftOpen className="absolute size-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          )}
        </div>

        <div className="mx-2 h-px shrink-0 bg-border/60" />

        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3"
          aria-label={t("pages")}
        >
          {railExpanded && (
            <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">
              {t("navigation")}
            </div>
          )}
          {items.map((item) => (
            <RailNavItem
              key={item.href ?? item.label}
              item={item}
              active={item.match ? item.match(pathname) : !!item.activeBadge}
              expanded={railExpanded}
            />
          ))}
        </nav>

        <div className="shrink-0 px-2 pb-2">
          <div className="mb-2 h-px bg-border/60" />
          <div className="flex flex-col gap-1">
            <RailActionButton
              label={
                user
                  ? t("personalSync")
                  : cloudConfigured
                    ? t("signInSync")
                    : t("account")
              }
              detail={
                user
                  ? (user.email ?? t("cloudConnected"))
                  : cloudConfigured
                    ? t("signInDetail")
                    : t("localDetail")
              }
              icon={<AccountStatusIcon connected={!!user && cloudConfigured} />}
              expanded={railExpanded}
              onClick={openAccount}
            />
            <RailActionButton
              label={t("settings")}
              icon={<Settings2 className="size-4" />}
              expanded={railExpanded}
              onClick={() => openAiSettings("general")}
            />
            <RailActionButton
              label={t("guide")}
              icon={<HelpCircle className="size-4" />}
              expanded={railExpanded}
              href="/guide"
            />
            <RailActionButton
              label={t("about")}
              icon={<Info className="size-4" />}
              expanded={railExpanded}
              href="/about"
            />
          </div>
        </div>
      </aside>
    </>
  )
}

function RailNavItem({
  item,
  active,
  expanded,
}: {
  item: RailItem
  active: boolean
  expanded: boolean
}) {
  const Icon = item.icon
  const content = (
    <span
      className={cn(
        "relative flex h-10 w-full items-center rounded-md text-sm transition-colors outline-none",
        expanded
          ? "justify-start gap-2.5 px-2.5 text-left"
          : "justify-center px-0",
        active
          ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_18%,transparent)]"
          : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary",
            !expanded && "left-1"
          )}
        />
      )}
      <span className="grid size-4 shrink-0 place-items-center">
        <Icon className="size-4" />
      </span>
      {expanded && (
        <span className="min-w-0 flex-1 truncate text-left leading-none font-medium">
          {item.label}
        </span>
      )}
      {expanded && active && (
        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
      )}
      {expanded && item.shortcut && !active && (
        <kbd className="shrink-0 rounded border border-border/70 bg-background/70 px-1.5 py-0.5 font-mono text-[9px] font-normal text-muted-foreground">
          {item.shortcut}
        </kbd>
      )}
    </span>
  )

  const controlClassName =
    "block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"

  if (expanded) {
    return item.href ? (
      <Link
        href={item.href}
        prefetch={item.prefetch}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className={controlClassName}
      >
        {content}
      </Link>
    ) : (
      <button
        type="button"
        onClick={item.onSelect}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className={cn(controlClassName, "w-full")}
      >
        {content}
      </button>
    )
  }

  const trigger = item.href ? (
    <Link
      href={item.href}
      prefetch={item.prefetch}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={controlClassName}
    />
  ) : (
    <button
      type="button"
      onClick={item.onSelect}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(controlClassName, "w-full")}
    />
  )

  return (
    <Tooltip>
      <TooltipTrigger render={trigger}>{content}</TooltipTrigger>
      <TooltipContent side="right">
        <span className="font-medium">{item.label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

function RailActionButton({
  label,
  detail,
  icon,
  href,
  expanded,
  onClick,
}: {
  label: string
  detail?: string
  icon: ReactNode
  href?: string
  expanded: boolean
  onClick?: () => void
}) {
  const content = (
    <span
      className={cn(
        "flex min-h-10 w-full items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground active:translate-y-px",
        expanded
          ? "justify-start gap-2.5 px-2.5 text-left"
          : "justify-center px-0"
      )}
    >
      <span className="grid size-4 shrink-0 place-items-center">{icon}</span>
      {expanded && (
        <span className="min-w-0 flex-1 py-1 text-left">
          <span className="block truncate text-left leading-tight font-medium">
            {label}
          </span>
          {detail && (
            <span className="block truncate text-[10px] text-muted-foreground">
              {detail}
            </span>
          )}
        </span>
      )}
    </span>
  )

  if (expanded) {
    if (href) {
      return (
        <Link
          href={href}
          prefetch={false}
          aria-label={label}
          className="block w-full rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {content}
        </Link>
      )
    }
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="block w-full rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {content}
      </button>
    )
  }

  if (href) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              prefetch={false}
              aria-label={label}
              className="block w-full rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          }
        >
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="font-medium">{label}</span>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="block w-full rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        }
      >
        {content}
      </TooltipTrigger>
      <TooltipContent side="right">
        <span className="font-medium">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}
