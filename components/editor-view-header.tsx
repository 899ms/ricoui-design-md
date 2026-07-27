"use client"

import { Eye, FileText, Layers3 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { EditorView } from "@/lib/types/tokens"
import { Button } from "@/components/ui/button"

function ViewButton({
  active,
  label,
  icon,
  onClick,
  disabled = false,
  title,
}: {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="xs"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="min-w-0"
    >
      {icon}
      {label}
    </Button>
  )
}

export function EditorViewHeader({
  activeView,
  onSetActiveView,
  sourceOnly = false,
}: {
  activeView: EditorView
  onSetActiveView: (view: EditorView) => void
  sourceOnly?: boolean
}) {
  const t = useTranslations("Editor.view")
  return (
    <div className="app-chrome border-b border-border/60 px-4 py-2 lg:px-6">
      <div className="segmented-control flex w-fit rounded-lg p-1">
        <ViewButton
          active={activeView === "document"}
          label={t("document")}
          icon={<FileText className="h-3.5 w-3.5" />}
          onClick={() => onSetActiveView("document")}
        />
        <ViewButton
          active={activeView === "structured"}
          label={t("structured")}
          icon={<Layers3 className="h-3.5 w-3.5" />}
          onClick={() => onSetActiveView("structured")}
          disabled={sourceOnly}
          title={sourceOnly ? t("sourceOnlyUnavailable") : undefined}
        />
        <ViewButton
          active={activeView === "preview"}
          label={t("preview")}
          icon={<Eye className="h-3.5 w-3.5" />}
          onClick={() => onSetActiveView("preview")}
          disabled={sourceOnly}
          title={sourceOnly ? t("sourceOnlyUnavailable") : undefined}
        />
      </div>
    </div>
  )
}
