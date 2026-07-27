import type { UrlGenerationMetadata } from "@/lib/types/tokens"

export function isGenerationRevisionBlocked(
  generation: UrlGenerationMetadata | undefined,
  revision: string
) {
  return Boolean(
    generation?.status === "blocked" &&
    generation.validatedRevision === revision
  )
}
