"use client"

import { useEffect } from "react"
import { AI_MASTER_ENABLED } from "@/lib/ai/feature-flag"
import { useAiSettingsStore } from "@/lib/store/ai-settings-store"

export function useAiFeatureEnabled() {
  const aiEnabled = useAiSettingsStore((state) => state.aiEnabled)
  const hydrated = useAiSettingsStore((state) => state.hydrated)
  const hydrate = useAiSettingsStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    AI_MASTER_ENABLED &&
    aiEnabled &&
    (hydrated || typeof window === "undefined")
  )
}
