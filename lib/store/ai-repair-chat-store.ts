"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { AssistantIntent } from "@/lib/ai/document-repair-chat"
import type { DocumentEvaluation } from "@/lib/document-evaluation"

const MAX_THREADS = 8
const MAX_MESSAGES = 24

export interface AiRepairMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: number
  outcome?: "reply" | "no-change"
}

export interface AiRepairProposal {
  intent?: AssistantIntent
  scope?: string
  summary: string
  markdown: string
  baseRevision: string
  createdAt: number
  quality?: "ready" | "warning" | "blocked"
  issues?: string[]
  beforeEvaluation?: DocumentEvaluation
  afterEvaluation?: DocumentEvaluation
  goalMet?: boolean
}

export interface AiRepairThread {
  messages: AiRepairMessage[]
  proposal?: AiRepairProposal
  updatedAt: number
}

interface AiRepairChatState {
  threads: Record<string, AiRepairThread>
  hydrated: boolean
  appendMessage: (documentId: string, message: AiRepairMessage) => void
  setProposal: (
    documentId: string,
    proposal: AiRepairProposal | undefined
  ) => void
  clearThread: (documentId: string) => void
  setHydrated: (hydrated: boolean) => void
}

function limitThreads(threads: Record<string, AiRepairThread>) {
  return Object.fromEntries(
    Object.entries(threads)
      .sort(([, left], [, right]) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_THREADS)
  )
}

export function createAiRepairMessage(
  role: AiRepairMessage["role"],
  content: string,
  outcome: AiRepairMessage["outcome"] = "reply"
): AiRepairMessage {
  return {
    id: `repair_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content: content.trim(),
    createdAt: Date.now(),
    outcome,
  }
}

export const useAiRepairChatStore = create<AiRepairChatState>()(
  persist(
    (set) => ({
      threads: {},
      hydrated: false,
      appendMessage: (documentId, message) =>
        set((state) => {
          const current = state.threads[documentId]
          const updatedAt = Date.now()
          return {
            threads: limitThreads({
              ...state.threads,
              [documentId]: {
                messages: [...(current?.messages ?? []), message].slice(
                  -MAX_MESSAGES
                ),
                proposal: current?.proposal,
                updatedAt,
              },
            }),
          }
        }),
      setProposal: (documentId, proposal) =>
        set((state) => {
          const current = state.threads[documentId]
          return {
            threads: limitThreads({
              ...state.threads,
              [documentId]: {
                messages: current?.messages ?? [],
                ...(proposal ? { proposal } : {}),
                updatedAt: Date.now(),
              },
            }),
          }
        }),
      clearThread: (documentId) =>
        set((state) => {
          const threads = { ...state.threads }
          delete threads[documentId]
          return { threads }
        }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "design-md-ai-repair-chat-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ threads: limitThreads(state.threads) }),
      skipHydration: true,
    }
  )
)
