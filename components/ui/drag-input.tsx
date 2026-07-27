"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { useTranslations } from "next-intl"

interface DragInputProps {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  className?: string
  suffix?: string
}

/**
 * Figma-style numeric input: click to type, or click+drag left/right to scrub value.
 * Displays the numeric part with the unit suffix.
 */
export function DragInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit = "",
  className = "",
  suffix,
}: DragInputProps) {
  const t = useTranslations("DragInput")
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const startXRef = useRef(0)
  const startValRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const accumulatedRef = useRef(0)

  // Parse numeric value from string (e.g. "16px" → 16, "1.5" → 1.5)
  const parseNum = useCallback((v: string): number => {
    const m = v.match(/-?[\d.]+/)
    return m ? parseFloat(m[0]) : 0
  }, [])

  // Build value string from number
  const formatVal = useCallback(
    (n: number): string => {
      const clamped = Math.max(min, Math.min(max, n))
      // Use integer if step >= 1
      const formatted =
        step >= 1 ? Math.round(clamped).toString() : clamped.toFixed(1)
      if (suffix) return `${formatted}${suffix}`
      if (unit) return `${formatted}${unit}`
      // Preserve original unit
      const origUnit = value.replace(/^-?[\d.]+/, "")
      return `${formatted}${origUnit}`
    },
    [min, max, step, unit, suffix, value]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return
      e.preventDefault()
      setIsDragging(true)
      startXRef.current = e.clientX
      startValRef.current = parseNum(value)
      accumulatedRef.current = 0
    },
    [isEditing, parseNum, value]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startXRef.current
      // Acceleration: slow for small moves, fast for large
      const speed = e.shiftKey ? step * 10 : step
      accumulatedRef.current = dx * speed * 0.5
      const newVal = startValRef.current + accumulatedRef.current
      const snapped = Math.round(newVal / step) * step
      onChange(formatVal(snapped))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, step, onChange, formatVal])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setEditValue(parseNum(value).toString())
    setTimeout(() => inputRef.current?.select(), 0)
  }, [parseNum, value])

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    const num = parseFloat(editValue)
    if (!isNaN(num)) {
      onChange(formatVal(num))
    }
  }, [editValue, onChange, formatVal])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitEdit()
      } else if (e.key === "Escape") {
        setIsEditing(false)
      } else if (!isEditing) {
        // Arrow key increment/decrement
        const current = parseNum(value)
        if (e.key === "ArrowUp") {
          e.preventDefault()
          onChange(formatVal(current + step * (e.shiftKey ? 10 : 1)))
        } else if (e.key === "ArrowDown") {
          e.preventDefault()
          onChange(formatVal(current - step * (e.shiftKey ? 10 : 1)))
        }
      }
    },
    [isEditing, commitEdit, parseNum, value, onChange, formatVal, step]
  )

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={handleKeyDown}
        className={`h-6 w-16 rounded border border-primary bg-background px-1.5 font-mono text-xs text-foreground outline-none ${className}`}
        autoFocus
      />
    )
  }

  return (
    <div
      className={`group relative inline-flex h-6 items-center rounded border border-transparent px-1.5 font-mono text-xs transition-colors ${
        isDragging
          ? "cursor-ew-resize border-primary/40 bg-primary/10"
          : "cursor-ew-resize hover:border-border hover:bg-muted/60"
      } ${className}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={t("hint")}
    >
      {/* Drag handle icon */}
      <span className="mr-1 inline-flex h-3 w-1.5 flex-col items-center justify-center gap-px opacity-0 transition-opacity group-hover:opacity-50">
        <span className="h-px w-1 rounded-full bg-foreground" />
        <span className="h-px w-1 rounded-full bg-foreground" />
        <span className="h-px w-1 rounded-full bg-foreground" />
      </span>
      <span className="text-foreground">{parseNum(value)}</span>
      {(suffix || unit || value.match(/[a-z%]+$/i)) && (
        <span className="ml-px text-muted-foreground">
          {suffix || unit || value.match(/[a-z%]+$/i)?.[0] || ""}
        </span>
      )}
    </div>
  )
}
