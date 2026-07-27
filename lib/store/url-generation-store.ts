"use client"

import { create } from "zustand"
import { streamAiConvert } from "@/lib/ai/ai-client"
import type { AiSettings } from "@/lib/ai/providers"
import {
  ensureSourceWebsite,
  getGeneratedDesignRepairDiagnostics,
  validateGeneratedDesign,
  type GeneratedDesignIssue,
  type GeneratedDesignQuality,
} from "@/lib/ai/validate-generated-design"
import type { Locale } from "@/lib/i18n/config"
import { useDesignStore } from "@/lib/store/design-store"
import { getDocumentRevision } from "@/lib/document-revision"
import {
  loadUrlSourcePackage,
  saveUrlSourcePackage,
} from "@/lib/storage/workspace-persistence"
import type {
  UrlSourceMetadata,
  UrlSourcePackage,
} from "@/lib/types/url-generation"

export type UrlGenerationPhase =
  | "fetching"
  | "generating"
  | "repairing"
  | "validating"
  | "saving"

export interface UrlGenerationJob {
  id: string
  url: string
  hostname: string
  status: "running" | "done" | "invalid" | "error" | "cancelled"
  phase: UrlGenerationPhase
  attempts: 1 | 2
  startedAt: number
  completedAt?: number
  generatedCharacters: number
  source?: UrlSourceMetadata
  sourceCacheHit?: boolean
  documentId?: string
  pendingMarkdown?: string
  quality?: GeneratedDesignQuality
  issues: GeneratedDesignIssue[]
  error?: string
  presentation?: "expanded" | "collapsed"
}

interface StartUrlGenerationInput {
  url: string
  settings: AiSettings
  locale: Locale
}

interface UrlGenerationStore {
  job: UrlGenerationJob | null
  start: (input: StartUrlGenerationInput) => Promise<void>
  cancel: () => void
  saveInvalidDraft: () => Promise<void>
  collapse: () => void
  expand: () => void
  dismiss: () => void
}

let activeRun: { jobId: string; controller: AbortController } | null = null

function throwIfAborted(signal: AbortSignal) {
  if (!signal.aborted) return
  throw (
    signal.reason ?? new DOMException("URL generation cancelled", "AbortError")
  )
}

function updateCurrentJob(
  set: (
    updater: (state: UrlGenerationStore) => Partial<UrlGenerationStore>
  ) => void,
  jobId: string,
  patch: Partial<UrlGenerationJob>
) {
  set((state) =>
    state.job?.id === jobId
      ? { job: { ...state.job, ...patch } }
      : { job: state.job }
  )
}

export const useUrlGenerationStore = create<UrlGenerationStore>((set, get) => ({
  job: null,

  start: async ({ url, settings, locale }) => {
    if (get().job?.status === "running") return

    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.replace(/^www\./, "")
    const jobId = `url-generation-${Date.now()}`
    const controller = new AbortController()
    activeRun = { jobId, controller }
    set({
      job: {
        id: jobId,
        url,
        hostname,
        status: "running",
        phase: "fetching",
        attempts: 1,
        startedAt: Date.now(),
        generatedCharacters: 0,
        issues: [],
        presentation: "expanded",
      },
    })

    try {
      let sourceCacheHit = false
      let page = await loadUrlSourcePackage(url).catch(() => null)
      throwIfAborted(controller.signal)
      if (page) sourceCacheHit = true

      if (!page) {
        const pageResponse = await fetch("/api/fetch-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        })
        const payload =
          (await pageResponse.json()) as Partial<UrlSourcePackage> & {
            error?: string
          }
        if (
          !pageResponse.ok ||
          (!payload.content &&
            !payload.cssEvidence &&
            !payload.publishedDesignMd)
        ) {
          throw new Error(
            payload.error || "Website source package could not be fetched"
          )
        }
        const fallbackSource: UrlSourceMetadata = {
          kind: "website",
          requestedUrl: url,
          pageUrl: payload.url ?? url,
          sourceUrl: payload.url ?? url,
        }
        page = {
          url: payload.url ?? url,
          content: payload.content ?? "",
          cssEvidence: payload.cssEvidence ?? "",
          publishedDesignMd: payload.publishedDesignMd,
          source: payload.source ?? fallbackSource,
          truncated: Boolean(payload.truncated),
        }
        void saveUrlSourcePackage(url, page).catch(() => undefined)
      }
      throwIfAborted(controller.signal)
      updateCurrentJob(set, jobId, {
        source: page.source,
        sourceCacheHit,
      })

      const collectMarkdown = async (
        task: "generate" | "generate-repair",
        previousOutput?: string,
        diagnostics?: string[]
      ) => {
        const stream = await streamAiConvert({
          task,
          input: page.content ?? "",
          url,
          cssEvidence: page.cssEvidence,
          source: page.source,
          publishedDesignMd: page.publishedDesignMd,
          previousOutput,
          diagnostics,
          settings,
          locale,
          signal: controller.signal,
        })
        let output = ""
        let lastReportedLength = 0
        for await (const chunk of stream.textStream) {
          output += chunk
          if (output.length - lastReportedLength >= 400) {
            lastReportedLength = output.length
            updateCurrentJob(set, jobId, {
              generatedCharacters: output.length,
            })
          }
        }
        if (!output.trim()) {
          throw new Error(
            locale === "en"
              ? "The model finished without returning visible text. Retry, switch models, or use the standard provider endpoint."
              : "模型已结束响应，但没有返回可见正文。请重试、切换模型，或改用标准 Provider 端点。"
          )
        }
        throwIfAborted(controller.signal)
        return { markdown: output, finishReason: await stream.finishReason }
      }

      updateCurrentJob(set, jobId, { phase: "generating" })
      let attempts: 1 | 2 = 1
      let generated = await collectMarkdown("generate")
      let attributedMarkdown = ensureSourceWebsite(generated.markdown, url)

      updateCurrentJob(set, jobId, {
        phase: "validating",
        generatedCharacters: attributedMarkdown.length,
      })
      let validation = validateGeneratedDesign(attributedMarkdown, {
        finishReason: generated.finishReason,
        cssEvidence: page.cssEvidence,
      })

      // Automatically repair every actionable machine finding. Evidence-only
      // notes are intentionally excluded: compact CSS is not a verbatim
      // allowlist and there is nothing concrete for the model to rewrite.
      const repairIssues = validation.issues.filter(
        (issue) => issue !== "unverified-values"
      )
      if (repairIssues.length > 0) {
        attempts = 2
        updateCurrentJob(set, jobId, {
          phase: "repairing",
          attempts,
          generatedCharacters: 0,
          issues: repairIssues,
        })
        const firstDraft = attributedMarkdown
        const firstValidation = validation
        try {
          generated = await collectMarkdown(
            "generate-repair",
            firstDraft,
            getGeneratedDesignRepairDiagnostics(firstDraft, firstValidation)
          )
          attributedMarkdown = ensureSourceWebsite(generated.markdown, url)
          validation = validateGeneratedDesign(attributedMarkdown, {
            finishReason: generated.finishReason,
            cssEvidence: page.cssEvidence,
          })
        } catch {
          throwIfAborted(controller.signal)
          // A failed correction request must not discard the usable first
          // response. Save that response as a blocked, repairable draft.
          attributedMarkdown = firstDraft
          validation = firstValidation
        }
        updateCurrentJob(set, jobId, {
          phase: "validating",
          generatedCharacters: attributedMarkdown.length,
        })
      }

      throwIfAborted(controller.signal)
      updateCurrentJob(set, jobId, { phase: "saving", attempts })
      const actionableIssues = validation.issues.filter(
        (issue) => issue !== "unverified-values"
      )
      const documentId = await useDesignStore.getState().createDocument({
        source: "blank",
        name: `${hostname} DESIGN.md`,
        content: attributedMarkdown,
        generation: {
          sourceUrl: url,
          sourceKind: page.source.kind,
          sourceDocumentUrl:
            page.source.kind === "website" ? undefined : page.source.sourceUrl,
          sourceCacheHit,
          status:
            validation.quality === "invalid"
              ? "blocked"
              : validation.quality === "review"
                ? "warning"
                : "ready",
          attempts,
          issues: actionableIssues,
          validatedRevision: getDocumentRevision(attributedMarkdown),
          cssEvidence: page.cssEvidence,
          generatedAt: Date.now(),
        },
      })
      if (!documentId) throw new Error("The generated draft could not be saved")

      updateCurrentJob(set, jobId, {
        status: "done",
        completedAt: Date.now(),
        documentId,
        quality: validation.quality,
        issues: actionableIssues,
        attempts,
      })
    } catch (cause) {
      if (controller.signal.aborted) {
        updateCurrentJob(set, jobId, {
          status: "cancelled",
          completedAt: Date.now(),
          error: undefined,
        })
        return
      }
      updateCurrentJob(set, jobId, {
        status: "error",
        completedAt: Date.now(),
        error:
          cause instanceof Error
            ? cause.message
            : "The website DESIGN.md could not be generated",
      })
    } finally {
      if (activeRun?.jobId === jobId) activeRun = null
    }
  },

  cancel: () => {
    const job = get().job
    if (
      job?.status !== "running" ||
      job.phase === "saving" ||
      activeRun?.jobId !== job.id
    ) {
      return
    }
    activeRun.controller.abort(
      new DOMException("URL generation cancelled", "AbortError")
    )
    updateCurrentJob(set, job.id, {
      status: "cancelled",
      completedAt: Date.now(),
      error: undefined,
    })
  },

  // Kept for persisted/in-flight jobs created by the earlier flow. New jobs
  // save blocked review drafts automatically after their final validation.
  saveInvalidDraft: async () => {
    const job = get().job
    if (job?.status !== "invalid" || !job.pendingMarkdown) return

    updateCurrentJob(set, job.id, {
      status: "running",
      phase: "saving",
      completedAt: undefined,
    })
    try {
      const documentId = await useDesignStore.getState().createDocument({
        source: "blank",
        name: `${job.hostname} DESIGN.md`,
        content: job.pendingMarkdown,
        generation: {
          sourceUrl: job.url,
          status: "blocked",
          attempts: job.attempts,
          issues: job.issues,
          validatedRevision: getDocumentRevision(job.pendingMarkdown),
          generatedAt: Date.now(),
        },
      })
      if (!documentId) throw new Error("The review draft could not be saved")
      updateCurrentJob(set, job.id, {
        status: "done",
        completedAt: Date.now(),
        documentId,
        pendingMarkdown: undefined,
      })
    } catch (cause) {
      updateCurrentJob(set, job.id, {
        status: "error",
        completedAt: Date.now(),
        error:
          cause instanceof Error
            ? cause.message
            : "The review draft could not be saved",
      })
    }
  },

  collapse: () => {
    const job = get().job
    if (!job || job.status === "running") return
    updateCurrentJob(set, job.id, { presentation: "collapsed" })
  },

  expand: () => {
    const job = get().job
    if (!job || job.status === "running") return
    updateCurrentJob(set, job.id, { presentation: "expanded" })
  },

  dismiss: () => {
    if (get().job?.status === "running") return
    set({ job: null })
  },
}))
