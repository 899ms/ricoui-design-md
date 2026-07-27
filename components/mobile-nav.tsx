"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type { LucideIcon } from "lucide-react"
import {
  FolderOpen,
  House,
  Library,
  Search,
  Settings2,
  SwatchBook,
} from "lucide-react"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { AccountStatusIcon } from "@/components/account-status-icon"
import { useAiSettingsDialog } from "@/components/ai-settings-dialog-provider"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  prefetch: boolean
  labelKey: "home" | "workspace" | "library" | "brands"
  icon: LucideIcon
  match: (pathname: string) => boolean
}

const NAV: NavItem[] = [
  {
    href: "/",
    prefetch: false,
    labelKey: "home",
    icon: House,
    match: (p) => p === "/",
  },
  {
    href: "/editor",
    prefetch: true,
    labelKey: "workspace",
    icon: FolderOpen,
    match: (p) =>
      p.startsWith("/workspace") ||
      p.startsWith("/editor") ||
      p.startsWith("/documents"),
  },
  {
    href: "/library",
    prefetch: true,
    labelKey: "library",
    icon: Library,
    match: (p) => p.startsWith("/library") || p.startsWith("/themes"),
  },
  {
    href: "/brands",
    prefetch: true,
    labelKey: "brands",
    icon: SwatchBook,
    match: (p) => p.startsWith("/brands"),
  },
]

export function MobileTopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const t = useTranslations("Navigation")
  const pathname = usePathname() ?? "/"
  const activeSearch = pathname.startsWith("/search")
  const { configured: cloudConfigured, openAccount, user } = useAccountDialog()
  const openSettings = useAiSettingsDialog()
  return (
    <header className="app-chrome flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3">
      <Link
        href="/"
        prefetch={false}
        className="flex items-center gap-2"
        aria-label={t("logoHome")}
      >
        <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-md border border-border/70 bg-card">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            priority
            className="size-full object-cover"
          />
        </span>
        <span className="text-sm font-bold">RICOUI</span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label={t("searchDocuments")}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground",
            activeSearch && "bg-muted/45 text-foreground"
          )}
        >
          <Search className="h-4 w-4" />
        </button>
        {cloudConfigured && (
          <button
            type="button"
            onClick={openAccount}
            aria-label={user ? t("personalSync") : t("signInToSync")}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground active:translate-y-px"
          >
            <AccountStatusIcon connected={!!user} />
          </button>
        )}
        <button
          type="button"
          onClick={() => openSettings("general")}
          aria-label={t("settings")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground active:translate-y-px"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

export function MobileBottomNav() {
  const t = useTranslations("Navigation")
  const pathname = usePathname() ?? "/"
  return (
    <nav
      aria-label={t("main")}
      className="app-chrome flex h-14 shrink-0 items-stretch border-t border-border/60"
    >
      {NAV.map((item) => {
        const Icon = item.icon
        const active = item.match(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={item.prefetch}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
