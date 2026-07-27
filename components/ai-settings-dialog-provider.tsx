"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { AI_MASTER_ENABLED } from "@/lib/ai/feature-flag"
import {
  AiSettingsDialog,
  type SettingsSection,
} from "@/components/ai-settings-dialog"

const SettingsDialogContext = createContext<
  ((section?: SettingsSection) => void) | null
>(null)

export function AiSettingsDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<SettingsSection>("general")
  const openSettings = useCallback((next: SettingsSection = "general") => {
    if (next !== "ai" || AI_MASTER_ENABLED) {
      setSection(next)
      setOpen(true)
    }
  }, [])
  return (
    <SettingsDialogContext.Provider value={openSettings}>
      {children}
      <AiSettingsDialog
        open={open}
        section={section}
        onSectionChange={setSection}
        onClose={() => setOpen(false)}
      />
    </SettingsDialogContext.Provider>
  )
}

export function useAiSettingsDialog() {
  const openSettings = useContext(SettingsDialogContext)
  if (!openSettings)
    throw new Error(
      "useAiSettingsDialog must be used within AiSettingsDialogProvider"
    )
  return openSettings
}
