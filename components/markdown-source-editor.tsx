"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { RefObject, UIEvent } from "react"
import { useShikiHighlightResult } from "@/hooks/use-shiki-highlight"
import { cn } from "@/lib/utils"

interface MarkdownSourceEditorProps {
  value: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  ariaLabel: string
  softWrap: boolean
  onChange: (value: string) => void
  onScroll: () => void
  onBlur: () => void
}

export function MarkdownSourceEditor({
  value,
  textareaRef,
  ariaLabel,
  softWrap,
  onChange,
  onScroll,
  onBlur,
}: MarkdownSourceEditorProps) {
  const highlighted = useShikiHighlightResult(value, "markdown")
  const highlightContentRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const showHighlight = highlighted.ready && !isComposing

  const syncHighlightScroll = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const content = highlightContentRef.current
      if (content) {
        content.style.transform = `translate3d(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px, 0)`
      }
      onScroll()
    },
    [onScroll]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      if (softWrap) textarea.scrollLeft = 0
      syncHighlightScroll(textarea)
    }
  }, [showHighlight, softWrap, syncHighlightScroll, textareaRef])

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    syncHighlightScroll(event.currentTarget)
  }

  return (
    <div className="code-editor-surface relative h-full min-h-[420px] overflow-hidden rounded-lg transition-shadow focus-within:border-primary/40 focus-within:shadow-[var(--shadow-lg),0_0_0_3px_var(--ring)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <div
          ref={highlightContentRef}
          data-soft-wrap={softWrap}
          className={cn(
            "shiki-rendered shiki-editor-layer min-h-full [scrollbar-gutter:stable] px-4 pt-10 pb-4 font-mono text-[13px] leading-6 transition-opacity duration-100 lg:px-5 lg:pb-5",
            softWrap ? "w-full min-w-0" : "min-w-max",
            showHighlight ? "opacity-100" : "opacity-0"
          )}
          dangerouslySetInnerHTML={{ __html: highlighted.html ?? "" }}
        />
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={handleScroll}
        onBlur={onBlur}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        aria-label={ariaLabel}
        data-md-editor="true"
        spellCheck={false}
        wrap={softWrap ? "soft" : "off"}
        className={cn(
          "absolute inset-0 z-[1] h-full w-full resize-none [scrollbar-gutter:stable] bg-transparent px-4 pt-10 pb-4 font-mono text-[13px] leading-6 caret-foreground ring-0 outline-none placeholder:text-muted-foreground lg:px-5 lg:pb-5",
          softWrap
            ? "overflow-x-hidden overflow-y-auto break-words whitespace-pre-wrap"
            : "overflow-auto whitespace-pre",
          showHighlight ? "text-transparent" : "text-foreground"
        )}
        style={{
          tabSize: 2,
          whiteSpace: softWrap ? "pre-wrap" : "pre",
          overflowWrap: softWrap ? "anywhere" : "normal",
          wordBreak: softWrap ? "break-word" : "normal",
        }}
      />
    </div>
  )
}
