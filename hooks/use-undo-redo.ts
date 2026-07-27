"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"
import { useDesignStore } from "@/lib/store/design-store"

const MAX_HISTORY = 50
// Store updates that land within this window collapse into one undo step, so
// a typing burst or a color-scrub drag doesn't evict the whole history
// (PROJECT-REVIEW B7).
const COALESCE_WINDOW_MS = 500

class UndoRedoStack {
  private past: string[] = []
  private future: string[] = []
  private lastPushAt = 0
  private listeners = new Set<() => void>()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  /** Record the state that was live *before* the current change. */
  push(previous: string) {
    const now = Date.now()
    const coalesce =
      now - this.lastPushAt < COALESCE_WINDOW_MS && this.past.length > 0
    this.lastPushAt = now
    this.future = []

    if (coalesce || this.past[this.past.length - 1] === previous) {
      this.notify()
      return
    }

    this.past.push(previous)
    if (this.past.length > MAX_HISTORY) {
      this.past.shift()
    }
    this.notify()
  }

  undo(current: string): string | null {
    if (this.past.length === 0) return null
    this.future.push(current)
    const previous = this.past.pop() as string
    this.lastPushAt = 0
    this.notify()
    return previous
  }

  redo(current: string): string | null {
    if (this.future.length === 0) return null
    this.past.push(current)
    const next = this.future.pop() as string
    this.lastPushAt = 0
    this.notify()
    return next
  }

  get canUndo() {
    return this.past.length > 0
  }

  get canRedo() {
    return this.future.length > 0
  }

  reset() {
    this.past = []
    this.future = []
    this.lastPushAt = 0
    this.notify()
  }
}

const undoRedoStacks = new Map<string, UndoRedoStack>()

function getUndoRedoStack(documentId: string) {
  let stack = undoRedoStacks.get(documentId)
  if (!stack) {
    stack = new UndoRedoStack()
    undoRedoStacks.set(documentId, stack)
  }
  return stack
}

/**
 * Form fields keep their native undo; only the markdown source editor
 * (marked with data-md-editor) and non-editable focus targets route Cmd/Ctrl+Z
 * to the document history (PROJECT-REVIEW B6).
 */
function shouldBypassDocumentUndo(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.dataset.mdEditor) return false
  return target.isContentEditable || target.matches("input, textarea, select")
}

export function useUndoRedo() {
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)
  const previousSnapshotRef = useRef<{
    documentId: string | null
    markdown: string
  }>({
    documentId: null,
    markdown: "",
  })
  const isHistoryNavigationRef = useRef(false)
  const [, forceRender] = useReducer((value: number) => value + 1, 0)

  useEffect(() => {
    if (!activeDocumentId) return
    return getUndoRedoStack(activeDocumentId).subscribe(forceRender)
  }, [activeDocumentId, forceRender])

  // Drop history stacks for documents that no longer exist.
  useEffect(() => {
    const ids = new Set(
      useDesignStore.getState().documents.map((document) => document.id)
    )
    for (const key of [...undoRedoStacks.keys()]) {
      if (!ids.has(key)) undoRedoStacks.delete(key)
    }
  }, [activeDocumentId])

  useEffect(() => {
    if (!activeDocumentId) {
      previousSnapshotRef.current = { documentId: null, markdown: "" }
      return
    }

    const previous = previousSnapshotRef.current
    if (
      previous.documentId === activeDocumentId &&
      rawMarkdown !== previous.markdown
    ) {
      if (isHistoryNavigationRef.current) {
        isHistoryNavigationRef.current = false
      } else {
        getUndoRedoStack(activeDocumentId).push(previous.markdown)
      }
    }

    previousSnapshotRef.current = {
      documentId: activeDocumentId,
      markdown: rawMarkdown,
    }
  }, [activeDocumentId, rawMarkdown])

  const undo = useCallback(() => {
    if (!activeDocumentId) return
    const state = useDesignStore.getState()
    const snapshot = getUndoRedoStack(activeDocumentId).undo(state.rawMarkdown)
    if (snapshot !== null) {
      isHistoryNavigationRef.current = true
      state.updateRawMarkdown(snapshot)
    }
  }, [activeDocumentId])

  const redo = useCallback(() => {
    if (!activeDocumentId) return
    const state = useDesignStore.getState()
    const snapshot = getUndoRedoStack(activeDocumentId).redo(state.rawMarkdown)
    if (snapshot !== null) {
      isHistoryNavigationRef.current = true
      state.updateRawMarkdown(snapshot)
    }
  }, [activeDocumentId])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey
      if (!isMod) return
      if (event.key !== "z" && event.key !== "y") return
      if (shouldBypassDocumentUndo(event.target)) return

      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      if ((event.key === "z" && event.shiftKey) || event.key === "y") {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [redo, undo])

  const activeStack = activeDocumentId
    ? getUndoRedoStack(activeDocumentId)
    : null

  return {
    undo,
    redo,
    canUndo: activeStack?.canUndo ?? false,
    canRedo: activeStack?.canRedo ?? false,
  }
}
