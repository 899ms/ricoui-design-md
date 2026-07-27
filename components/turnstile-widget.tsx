"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

export function TurnstileWidget({
  siteKey,
  onToken,
}: {
  siteKey: string
  onToken: (token: string | null) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let widgetId: string | null = null
    const render = () => {
      if (!container.current || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      })
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-rico-turnstile="true"]'
    )
    if (existing) {
      if (window.turnstile) render()
      else existing.addEventListener("load", render, { once: true })
    } else {
      const script = document.createElement("script")
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      script.dataset.ricoTurnstile = "true"
      script.addEventListener("load", render, { once: true })
      document.head.appendChild(script)
    }
    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
      onToken(null)
    }
  }, [onToken, siteKey])
  return <div ref={container} className="min-h-[65px]" />
}
