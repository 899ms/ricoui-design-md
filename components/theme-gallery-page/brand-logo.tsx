"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  faviconUrl?: string
  name: string
  className?: string
}

export function BrandLogo({ faviconUrl, name, className }: BrandLogoProps) {
  const [failedFaviconUrl, setFailedFaviconUrl] = useState<string | null>(null)
  const canShowFavicon = !!faviconUrl && faviconUrl !== failedFaviconUrl

  return (
    <span
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md border border-border/70 bg-background shadow-xs",
        className
      )}
      aria-hidden
    >
      {canShowFavicon ? (
        <Image
          src={faviconUrl}
          alt=""
          width={22}
          height={22}
          sizes="22px"
          unoptimized
          onError={() => setFailedFaviconUrl(faviconUrl ?? null)}
          className="size-[22px] object-contain"
        />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">
          {name.trim().charAt(0).toLocaleUpperCase() || "?"}
        </span>
      )}
    </span>
  )
}
