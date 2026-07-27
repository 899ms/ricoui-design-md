"use client"

import { useState } from "react"
import Image from "next/image"
import { Image as ImageIcon, Play } from "lucide-react"
import { cn } from "@/lib/utils"

type BrandMediaVariant = "card" | "expanded"
type BrandMediaVideoMode = "image-click" | "video-first" | "autoplay"

interface BrandMediaProps {
  imageUrl?: string
  videoUrl?: string
  name: string
  variant?: BrandMediaVariant
  videoMode?: BrandMediaVideoMode
  className?: string
}

export function BrandMedia({
  imageUrl,
  videoUrl,
  name,
  variant = "card",
  videoMode,
  className,
}: BrandMediaProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null)
  const [videoActivated, setVideoActivated] = useState(false)

  const resolvedVideoMode =
    videoMode ?? (variant === "expanded" ? "video-first" : "image-click")
  const canShowImage = !!imageUrl && imageUrl !== failedImageUrl
  const canShowVideo = !!videoUrl && videoUrl !== failedVideoUrl

  const showAutoplayVideo = resolvedVideoMode === "autoplay" && canShowVideo
  const showVideoFirst = resolvedVideoMode === "video-first" && canShowVideo
  const showClickVideo =
    resolvedVideoMode === "image-click" &&
    canShowVideo &&
    (videoActivated || !canShowImage)
  const showImage =
    canShowImage && !showAutoplayVideo && !showVideoFirst && !showClickVideo
  const hasMedia =
    showAutoplayVideo || showVideoFirst || showClickVideo || showImage

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-muted",
        variant === "card" && "border-b border-border/60",
        className
      )}
    >
      {(showAutoplayVideo || showVideoFirst || showClickVideo) && (
        <video
          key={videoUrl}
          src={videoUrl}
          poster={imageUrl}
          controls={!showAutoplayVideo}
          autoPlay={showAutoplayVideo || videoActivated}
          muted={showAutoplayVideo}
          loop={showAutoplayVideo}
          playsInline
          preload="metadata"
          onError={() => setFailedVideoUrl(videoUrl ?? null)}
          className="h-full w-full bg-black object-cover"
          aria-label={`${name} preview video`}
        />
      )}

      {showImage && (
        <Image
          src={imageUrl}
          alt={`${name} cover image`}
          fill
          sizes={
            variant === "card"
              ? "(max-width: 768px) calc(100vw - 3.5rem), (max-width: 1400px) 50vw, 33vw"
              : "(max-width: 1024px) 100vw, 66vw"
          }
          onError={() => setFailedImageUrl(imageUrl ?? null)}
          className="object-cover object-top"
        />
      )}

      {showImage && canShowVideo && resolvedVideoMode === "image-click" && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setVideoActivated(true)
          }}
          className="absolute inset-0 grid place-items-center bg-black/0 text-white transition-colors hover:bg-black/10 focus-visible:bg-black/10 focus-visible:outline-none"
          aria-label={`Play ${name} preview video`}
          title="Play preview video"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/55 shadow-sm backdrop-blur-sm transition-transform hover:scale-105">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </button>
      )}

      {!hasMedia && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,rgba(45,109,195,0.06),rgba(15,23,42,0.02))] text-muted-foreground/60">
          <ImageIcon className="h-7 w-7" strokeWidth={1.25} />
          <span className="text-[11px] font-medium tracking-wide">
            No cover image
          </span>
        </div>
      )}
    </div>
  )
}
