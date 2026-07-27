import type { Locale } from "@/lib/i18n/config"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function mergeMessages(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries({ ...base, ...overrides }).map(([key, value]) => {
      const baseValue = base[key]
      return [
        key,
        isRecord(baseValue) && isRecord(value)
          ? mergeMessages(baseValue, value)
          : value,
      ]
    })
  )
}

const loaders = {
  "zh-CN": () =>
    import("@/messages/zh-CN.json").then((module) => module.default),
  en: () => import("@/messages/en.json").then((module) => module.default),
  ja: async () => {
    const [english, japanese] = await Promise.all([
      import("@/messages/en.json").then((module) => module.default),
      import("@/messages/ja.json").then((module) => module.default),
    ])
    return mergeMessages(english, japanese)
  },
} satisfies Record<Locale, () => Promise<Record<string, unknown>>>

export function getMessages(locale: Locale) {
  return loaders[locale]()
}

export function preloadMessages(locale: Locale) {
  return loaders[locale]()
}
