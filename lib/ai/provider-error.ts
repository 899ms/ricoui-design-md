import type { Locale } from "@/lib/i18n/config"

export interface NormalizedProviderError {
  message: string
  code?: string
}

const MAX_PROVIDER_ERROR_LENGTH = 500

function parseJsonCandidate(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(trimmed.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function extractProviderError(
  value: unknown,
  depth = 0
): NormalizedProviderError | null {
  if (depth > 4 || value == null) return null

  if (typeof value === "string") {
    const parsed = parseJsonCandidate(value)
    if (parsed != null) return extractProviderError(parsed, depth + 1)
    const message = value.trim()
    return message ? { message } : null
  }

  if (typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const ownCode =
    typeof record.code === "string" || typeof record.code === "number"
      ? String(record.code)
      : undefined

  const nested = extractProviderError(record.error, depth + 1)
  if (nested) return { ...nested, code: nested.code ?? ownCode }

  const message =
    typeof record.message === "string" ? record.message.trim() : ""
  return message ? { message, code: ownCode } : null
}

export function normalizeProviderError(
  value: unknown,
  fallback: string
): NormalizedProviderError {
  const normalized = extractProviderError(value)
  const message = (normalized?.message || fallback)
    .slice(0, MAX_PROVIDER_ERROR_LENGTH)
    .trim()
  return {
    message: message || fallback,
    ...(normalized?.code ? { code: normalized.code } : {}),
  }
}

export class AiProviderRequestError extends Error {
  readonly status: number
  readonly providerCode?: string

  constructor(message: string, status: number, providerCode?: string) {
    super(message)
    this.name = "AiProviderRequestError"
    this.status = status
    this.providerCode = providerCode
  }
}

export function isProviderBusyError(error: unknown) {
  const record =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : undefined
  const status =
    error instanceof AiProviderRequestError
      ? error.status
      : typeof record?.statusCode === "number"
        ? record.statusCode
        : typeof record?.status === "number"
          ? record.status
          : undefined
  const responseError = normalizeProviderError(
    record?.responseBody ?? (error instanceof Error ? error.message : error),
    ""
  )
  const providerCode =
    error instanceof AiProviderRequestError
      ? error.providerCode
      : responseError.code
  return providerCode === "1305" || status === 429 || status === 503
}

export function getAiUserFacingError(
  error: unknown,
  locale: Locale,
  fallback: string
) {
  if (isProviderBusyError(error)) {
    if (locale === "ja") {
      return "モデルサービスが混み合っており、現在は応答できません。API キーが無効という意味ではありません。時間をおいて再試行するか、モデルまたは標準のプロバイダーエンドポイントを変更してください。"
    }
    return locale === "en"
      ? "The model service is busy and cannot respond right now. This does not mean your API key is invalid. Retry later, switch models, or use the standard provider endpoint."
      : "模型服务繁忙，暂时无法响应；这不表示 API Key 无效。请稍后重试、切换模型，或改用标准 Provider 端点。"
  }

  const record =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : undefined
  const status =
    error instanceof AiProviderRequestError
      ? error.status
      : typeof record?.statusCode === "number"
        ? record.statusCode
        : typeof record?.status === "number"
          ? record.status
          : undefined
  if (status === 401 || status === 403) {
    if (locale === "ja") {
      return "認証に失敗しました。API キーと、このモデルまたはエンドポイントが現在のプランに含まれているかを確認してください。"
    }
    return locale === "en"
      ? "Authentication failed. Check the API key and whether this model or endpoint is included in your plan."
      : "鉴权失败。请检查 API Key，以及当前套餐是否有权使用该模型或端点。"
  }

  return getAiErrorMessage(error, fallback)
}

export function getAiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AiProviderRequestError) return error.message
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    const responseBody = record.responseBody
    if (typeof responseBody === "string") {
      return normalizeProviderError(responseBody, fallback).message
    }
  }
  return normalizeProviderError(
    error instanceof Error ? error.message : error,
    fallback
  ).message
}
