"use client"

import { create } from "zustand"

export interface ToastMessage {
  id: number
  text: string
  tone: "info" | "success" | "warning"
}

interface ToastState {
  toast: ToastMessage | null
  show: (text: string, tone?: ToastMessage["tone"]) => void
  dismiss: () => void
}

let nextId = 1

/**
 * Minimal ephemeral toast store. Not persisted, never blocks core flows.
 * Mounted once via <Toaster/> in AppShell.
 */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (text, tone = "info") => {
    const id = nextId++
    set({ toast: { id, text, tone } })
  },
  dismiss: () => set({ toast: null }),
}))

export function toast(text: string, tone: ToastMessage["tone"] = "info") {
  useToastStore.getState().show(text, tone)
}
